import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const dashboard = new Hono();
dashboard.use('*', authMiddleware);

// GET /parent/dashboard
dashboard.get('/', requireRole('PARENT', 'ADMIN'), async (c) => {
    try {
        const user = c.get('user');

        const children = await prisma.child.findMany({
            where: { parentId: user.userId },
            include: {
                gamification: true,
                addictionScores: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        // Get recent alerts
        const alerts = await prisma.alert.findMany({
            where: { userId: user.userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        const unreadAlerts = alerts.filter(a => !a.isRead).length;

        // Get today's screen time for each child
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const childrenData = await Promise.all(
            children.map(async (child) => {
                const todayUsage = await prisma.screenTimeLog.aggregate({
                    where: { childId: child.id, date: { gte: today } },
                    _sum: { durationMinutes: true },
                });

                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);

                const weeklyUsage = await prisma.screenTimeLog.aggregate({
                    where: { childId: child.id, date: { gte: weekAgo } },
                    _sum: { durationMinutes: true },
                });

                // Addiction score trend (last 7)
                const scoreTrend = await prisma.addictionScore.findMany({
                    where: { childId: child.id },
                    orderBy: { createdAt: 'desc' },
                    take: 7,
                    select: { score: true, riskLevel: true, createdAt: true },
                });

                const latestScore = child.addictionScores[0];

                return {
                    id: child.id,
                    name: child.name,
                    age: child.age,
                    avatar: child.avatar,
                    dailyLimitMin: child.dailyLimitMin,
                    todayMinutes: todayUsage._sum.durationMinutes || 0,
                    weeklyMinutes: weeklyUsage._sum.durationMinutes || 0,
                    addictionScore: latestScore ? {
                        score: latestScore.score,
                        riskLevel: latestScore.riskLevel,
                        explanation: latestScore.explanation,
                    } : null,
                    scoreTrend: scoreTrend.reverse(),
                    gamification: child.gamification ? {
                        points: child.gamification.points,
                        streak: child.gamification.streak,
                        level: child.gamification.level,
                        badges: typeof child.gamification.badges === 'string'
                            ? JSON.parse(child.gamification.badges) : child.gamification.badges,
                    } : null,
                };
            })
        );

        return c.json({
            success: true,
            data: {
                parent: {
                    id: user.userId,
                    email: user.email,
                },
                children: childrenData,
                alerts: alerts.slice(0, 10),
                unreadAlerts,
                summary: {
                    totalChildren: children.length,
                    highRiskCount: childrenData.filter(
                        c => c.addictionScore?.riskLevel === 'HIGH' || c.addictionScore?.riskLevel === 'CRITICAL'
                    ).length,
                    averageScreenTime: childrenData.length > 0
                        ? Math.round(childrenData.reduce((sum, c) => sum + c.todayMinutes, 0) / childrenData.length)
                        : 0,
                },
            },
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return c.json({ error: 'Failed to load dashboard' }, 500);
    }
});

// PUT /parent/alert/:id/read
dashboard.put('/alert/:id/read', async (c) => {
    try {
        const id = c.req.param('id');
        await prisma.alert.update({ where: { id }, data: { isRead: true } });
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to mark alert' }, 500);
    }
});

// PUT /parent/alerts/read-all
dashboard.put('/alerts/read-all', async (c) => {
    try {
        const user = c.get('user');
        await prisma.alert.updateMany({
            where: { userId: user.userId, isRead: false },
            data: { isRead: true },
        });
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to mark alerts' }, 500);
    }
});

export default dashboard;
