import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const gamification = new Hono();
gamification.use('*', authMiddleware);

const BADGE_DEFINITIONS = [
    { id: 'first_day', name: '🌟 First Day Hero', description: 'Completed first day under screen time limit', threshold: 1 },
    { id: 'streak_3', name: '🔥 3-Day Streak', description: '3 consecutive days under limit', threshold: 3 },
    { id: 'streak_7', name: '⚡ Weekly Warrior', description: '7-day streak', threshold: 7 },
    { id: 'streak_30', name: '🏆 Monthly Champion', description: '30-day streak', threshold: 30 },
    { id: 'score_drop_10', name: '📉 Risk Reducer', description: 'Addiction score dropped by 10%', threshold: 10 },
    { id: 'score_drop_25', name: '🛡️ Digital Guardian', description: 'Addiction score dropped by 25%', threshold: 25 },
    { id: 'focus_complete', name: '🎯 Focus Master', description: 'Completed 10 focus sessions', threshold: 10 },
    { id: 'level_5', name: '🚀 Rising Star', description: 'Reached level 5', threshold: 5 },
    { id: 'level_10', name: '💎 Diamond Mind', description: 'Reached level 10', threshold: 10 },
    { id: 'points_1000', name: '🏅 Points Prodigy', description: 'Earned 1000+ points', threshold: 1000 },
];

// GET /gamification/:childId
gamification.get('/:childId', async (c) => {
    try {
        const childId = c.req.param('childId');

        let profile = await prisma.gamificationProfile.findUnique({
            where: { childId },
        });

        if (!profile) {
            profile = await prisma.gamificationProfile.create({
                data: { childId, points: 0, streak: 0, level: 1, badges: JSON.stringify([]) },
            });
        }

        const pointsToNextLevel = profile.level * 200;
        const currentLevelProgress = profile.points % (profile.level * 200);

        return c.json({
            success: true,
            data: {
                ...profile,
                badges: typeof profile.badges === 'string' ? JSON.parse(profile.badges) : profile.badges,
                pointsToNextLevel,
                currentLevelProgress,
                progressPercent: Math.round((currentLevelProgress / pointsToNextLevel) * 100),
                availableBadges: BADGE_DEFINITIONS,
            },
        });
    } catch (error) {
        console.error('Get gamification profile error:', error);
        return c.json({ error: 'Failed to get gamification profile' }, 500);
    }
});

// POST /gamification/reward
gamification.post('/reward', async (c) => {
    try {
        const { childId, points, reason } = await c.req.json();

        const profile = await prisma.gamificationProfile.findUnique({ where: { childId } });
        if (!profile) {
            return c.json({ error: 'Gamification profile not found' }, 404);
        }

        const newPoints = profile.points + points;
        const newLevel = Math.floor(newPoints / 200) + 1;
        const leveledUp = newLevel > profile.level;

        const currentBadges: string[] = typeof profile.badges === 'string'
            ? JSON.parse(profile.badges) : (profile.badges as string[]);

        // Check for new badges
        const newBadges: string[] = [];
        if (newPoints >= 1000 && !currentBadges.includes('points_1000')) {
            newBadges.push('points_1000');
        }
        if (newLevel >= 5 && !currentBadges.includes('level_5')) {
            newBadges.push('level_5');
        }
        if (newLevel >= 10 && !currentBadges.includes('level_10')) {
            newBadges.push('level_10');
        }

        const allBadges = [...currentBadges, ...newBadges];

        const updated = await prisma.gamificationProfile.update({
            where: { childId },
            data: {
                points: newPoints,
                level: newLevel,
                badges: JSON.stringify(allBadges),
            },
        });

        return c.json({
            success: true,
            data: {
                ...updated,
                badges: allBadges,
                pointsAwarded: points,
                reason,
                leveledUp,
                newBadges: newBadges.map(id => BADGE_DEFINITIONS.find(b => b.id === id)),
            },
        });
    } catch (error) {
        console.error('Reward error:', error);
        return c.json({ error: 'Failed to reward points' }, 500);
    }
});

// POST /gamification/streak/:childId
gamification.post('/streak/:childId', async (c) => {
    try {
        const childId = c.req.param('childId');

        const profile = await prisma.gamificationProfile.findUnique({ where: { childId } });
        if (!profile) {
            return c.json({ error: 'Profile not found' }, 404);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if under limit today
        const totalToday = await prisma.screenTimeLog.aggregate({
            where: { childId, date: { gte: today } },
            _sum: { durationMinutes: true },
        });

        const child = await prisma.child.findUnique({ where: { id: childId } });
        if (!child) return c.json({ error: 'Child not found' }, 404);

        const minutesToday = totalToday._sum.durationMinutes || 0;
        const underLimit = minutesToday <= child.dailyLimitMin;

        let newStreak = profile.streak;
        let streakBroken = false;
        const currentBadges: string[] = typeof profile.badges === 'string'
            ? JSON.parse(profile.badges) : (profile.badges as string[]);
        const newBadges: string[] = [];

        if (underLimit) {
            newStreak += 1;

            // Check streak badges
            if (newStreak >= 1 && !currentBadges.includes('first_day')) newBadges.push('first_day');
            if (newStreak >= 3 && !currentBadges.includes('streak_3')) newBadges.push('streak_3');
            if (newStreak >= 7 && !currentBadges.includes('streak_7')) newBadges.push('streak_7');
            if (newStreak >= 30 && !currentBadges.includes('streak_30')) newBadges.push('streak_30');
        } else {
            streakBroken = newStreak > 0;
            newStreak = 0;
        }

        const allBadges = [...currentBadges, ...newBadges];
        const bonusPoints = underLimit ? 50 + (newStreak * 5) : 0;

        const updated = await prisma.gamificationProfile.update({
            where: { childId },
            data: {
                streak: newStreak,
                longestStreak: Math.max(profile.longestStreak, newStreak),
                points: profile.points + bonusPoints,
                badges: JSON.stringify(allBadges),
                lastActiveDate: new Date(),
            },
        });

        return c.json({
            success: true,
            data: {
                ...updated,
                badges: allBadges,
                underLimit,
                streakBroken,
                bonusPoints,
                newBadges: newBadges.map(id => BADGE_DEFINITIONS.find(b => b.id === id)),
            },
        });
    } catch (error) {
        console.error('Streak update error:', error);
        return c.json({ error: 'Failed to update streak' }, 500);
    }
});

export default gamification;
