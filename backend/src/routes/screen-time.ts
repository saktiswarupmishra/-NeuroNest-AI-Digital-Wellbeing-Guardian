import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const screenTime = new Hono();
screenTime.use('*', authMiddleware);

const logSchema = z.object({
    childId: z.string().uuid(),
    appName: z.string(),
    category: z.string().optional(),
    durationMinutes: z.number().int().min(1),
    date: z.string(),
    hour: z.number().int().min(0).max(23).optional(),
});

// POST /screen-time/log
screenTime.post('/log', async (c) => {
    try {
        const body = await c.req.json();
        const data = logSchema.parse(body);

        const log = await prisma.screenTimeLog.create({
            data: {
                childId: data.childId,
                appName: data.appName,
                category: data.category || 'other',
                durationMinutes: data.durationMinutes,
                date: new Date(data.date),
                hour: data.hour || new Date().getHours(),
            },
        });

        // Check if daily limit exceeded
        const child = await prisma.child.findUnique({ where: { id: data.childId } });
        if (child) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const totalToday = await prisma.screenTimeLog.aggregate({
                where: { childId: data.childId, date: { gte: today } },
                _sum: { durationMinutes: true },
            });

            const totalMinutes = totalToday._sum.durationMinutes || 0;

            if (totalMinutes > child.dailyLimitMin) {
                // Create alert
                await prisma.alert.create({
                    data: {
                        childId: data.childId,
                        userId: child.parentId,
                        type: 'SCREEN_TIME_LIMIT',
                        severity: 'WARNING',
                        title: 'Screen Time Limit Exceeded',
                        message: `${child.name} has used ${totalMinutes} minutes today, exceeding the ${child.dailyLimitMin}-minute limit.`,
                        metadata: JSON.stringify({ totalMinutes, limit: child.dailyLimitMin }),
                    },
                });
            }
        }

        return c.json({ success: true, data: log }, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Log screen time error:', error);
        return c.json({ error: 'Failed to log screen time' }, 500);
    }
});

// GET /screen-time/daily/:childId
screenTime.get('/daily/:childId', async (c) => {
    try {
        const childId = c.req.param('childId');
        const dateParam = c.req.query('date');
        const date = dateParam ? new Date(dateParam) : new Date();
        date.setHours(0, 0, 0, 0);

        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const logs = await prisma.screenTimeLog.findMany({
            where: {
                childId,
                date: { gte: date, lt: nextDay },
            },
            orderBy: { hour: 'asc' },
        });

        // Aggregate by category
        const byCategory: Record<string, number> = {};
        const byHour: Record<number, number> = {};
        let totalMinutes = 0;

        for (const log of logs) {
            byCategory[log.category] = (byCategory[log.category] || 0) + log.durationMinutes;
            byHour[log.hour] = (byHour[log.hour] || 0) + log.durationMinutes;
            totalMinutes += log.durationMinutes;
        }

        // Top apps
        const byApp: Record<string, number> = {};
        for (const log of logs) {
            byApp[log.appName] = (byApp[log.appName] || 0) + log.durationMinutes;
        }
        const topApps = Object.entries(byApp)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([name, minutes]) => ({ name, minutes }));

        return c.json({
            success: true,
            data: {
                date: date.toISOString().split('T')[0],
                totalMinutes,
                byCategory,
                byHour,
                topApps,
                logs,
            },
        });
    } catch (error) {
        console.error('Daily screen time error:', error);
        return c.json({ error: 'Failed to get daily screen time' }, 500);
    }
});

// GET /screen-time/weekly/:childId
screenTime.get('/weekly/:childId', async (c) => {
    try {
        const childId = c.req.param('childId');
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);

        const logs = await prisma.screenTimeLog.findMany({
            where: {
                childId,
                date: { gte: weekAgo },
            },
            orderBy: { date: 'asc' },
        });

        // Aggregate by day
        const byDay: Record<string, number> = {};
        const byCategory: Record<string, number> = {};
        let totalMinutes = 0;

        for (const log of logs) {
            const dayKey = log.date.toISOString().split('T')[0];
            byDay[dayKey] = (byDay[dayKey] || 0) + log.durationMinutes;
            byCategory[log.category] = (byCategory[log.category] || 0) + log.durationMinutes;
            totalMinutes += log.durationMinutes;
        }

        return c.json({
            success: true,
            data: {
                totalMinutes,
                averageDaily: Math.round(totalMinutes / 7),
                byDay,
                byCategory,
            },
        });
    } catch (error) {
        console.error('Weekly screen time error:', error);
        return c.json({ error: 'Failed to get weekly screen time' }, 500);
    }
});

export default screenTime;
