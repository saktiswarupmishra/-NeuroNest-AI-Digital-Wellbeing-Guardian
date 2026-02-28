import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const addiction = new Hono();
addiction.use('*', authMiddleware);

// Risk scoring weights
const WEIGHTS = {
    screenTime: 0.25,
    nightUsage: 0.15,
    socialMediaRatio: 0.20,
    appSwitching: 0.10,
    sentimentVolatility: 0.15,
    rewardDependency: 0.15,
};

function classifyRisk(score: number): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
    if (score <= 25) return 'LOW';
    if (score <= 50) return 'MODERATE';
    if (score <= 75) return 'HIGH';
    return 'CRITICAL';
}

function generateExplanation(factors: Record<string, number>, score: number, riskLevel: string): string {
    const concerns: string[] = [];

    if (factors.screenTime > 60) concerns.push(`High daily screen time (${Math.round(factors.screenTime)}% above healthy threshold)`);
    if (factors.nightUsage > 40) concerns.push('Significant late-night device usage detected');
    if (factors.socialMediaRatio > 50) concerns.push(`Social media dominates ${Math.round(factors.socialMediaRatio)}% of total usage`);
    if (factors.appSwitching > 40) concerns.push('Frequent app switching suggests restlessness');
    if (factors.sentimentVolatility > 50) concerns.push('Emotional volatility detected in usage patterns');
    if (factors.rewardDependency > 50) concerns.push('Behavior suggests reward-driven usage patterns');

    if (concerns.length === 0) {
        return `Overall digital wellbeing is healthy with a ${riskLevel.toLowerCase()} risk score of ${Math.round(score)}/100.`;
    }

    return `Risk level: ${riskLevel} (${Math.round(score)}/100). Key concerns: ${concerns.join('. ')}. Recommendation: ${riskLevel === 'CRITICAL' ? 'Immediate intervention recommended.' :
            riskLevel === 'HIGH' ? 'Parent should discuss digital habits with child.' :
                riskLevel === 'MODERATE' ? 'Monitor trends over the next week.' :
                    'Continue current approach.'
        }`;
}

// POST /addiction-score/calculate/:childId
addiction.post('/calculate/:childId', async (c) => {
    try {
        const childId = c.req.param('childId');

        // Gather data from last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const logs = await prisma.screenTimeLog.findMany({
            where: { childId, date: { gte: weekAgo } },
        });

        if (logs.length === 0) {
            return c.json({
                success: true,
                data: {
                    score: 0,
                    riskLevel: 'LOW',
                    explanation: 'No usage data available for analysis.',
                    factors: {},
                },
            });
        }

        // Calculate factors
        const totalMinutes = logs.reduce((sum, l) => sum + l.durationMinutes, 0);
        const avgDaily = totalMinutes / 7;
        const screenTimeFactor = Math.min(100, (avgDaily / 180) * 100); // 180min = healthy max

        // Night usage (22:00 - 06:00)
        const nightLogs = logs.filter(l => l.hour >= 22 || l.hour < 6);
        const nightMinutes = nightLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
        const nightUsageFactor = Math.min(100, (nightMinutes / totalMinutes) * 200);

        // Social media ratio
        const socialApps = logs.filter(l => l.category === 'social_media');
        const socialMinutes = socialApps.reduce((sum, l) => sum + l.durationMinutes, 0);
        const socialMediaRatio = totalMinutes > 0 ? (socialMinutes / totalMinutes) * 100 : 0;

        // App switching (unique apps per day)
        const uniqueAppsPerDay: Record<string, Set<string>> = {};
        for (const log of logs) {
            const day = log.date.toISOString().split('T')[0];
            if (!uniqueAppsPerDay[day]) uniqueAppsPerDay[day] = new Set();
            uniqueAppsPerDay[day].add(log.appName);
        }
        const avgAppsPerDay = Object.values(uniqueAppsPerDay).reduce((sum, s) => sum + s.size, 0) / Math.max(Object.keys(uniqueAppsPerDay).length, 1);
        const appSwitchingFactor = Math.min(100, (avgAppsPerDay / 10) * 100);

        // Sentiment & reward (simulated for now — will come from AI service)
        const sentimentVolatility = Math.min(100, Math.random() * 40 + (screenTimeFactor > 60 ? 30 : 0));
        const rewardDependency = Math.min(100, (socialMediaRatio * 0.6) + (screenTimeFactor * 0.2));

        const factors = {
            screenTime: screenTimeFactor,
            nightUsage: nightUsageFactor,
            socialMediaRatio,
            appSwitching: appSwitchingFactor,
            sentimentVolatility,
            rewardDependency,
        };

        // Weighted score
        const score = Math.min(100, Math.max(0,
            factors.screenTime * WEIGHTS.screenTime +
            factors.nightUsage * WEIGHTS.nightUsage +
            factors.socialMediaRatio * WEIGHTS.socialMediaRatio +
            factors.appSwitching * WEIGHTS.appSwitching +
            factors.sentimentVolatility * WEIGHTS.sentimentVolatility +
            factors.rewardDependency * WEIGHTS.rewardDependency
        ));

        const riskLevel = classifyRisk(score);
        const explanation = generateExplanation(factors, score, riskLevel);

        // Save score
        const savedScore = await prisma.addictionScore.create({
            data: {
                childId,
                score,
                riskLevel,
                explanation,
                factors: JSON.stringify(factors),
            },
        });

        // Create alert for high risk
        if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
            const child = await prisma.child.findUnique({ where: { id: childId } });
            if (child) {
                await prisma.alert.create({
                    data: {
                        childId,
                        userId: child.parentId,
                        type: 'ADDICTION_RISK',
                        severity: riskLevel === 'CRITICAL' ? 'CRITICAL' : 'DANGER',
                        title: `${riskLevel} Addiction Risk Detected`,
                        message: explanation,
                    },
                });
            }
        }

        return c.json({ success: true, data: savedScore });
    } catch (error) {
        console.error('Addiction scoring error:', error);
        return c.json({ error: 'Failed to calculate addiction score' }, 500);
    }
});

// GET /addiction-score/:childId
addiction.get('/:childId', async (c) => {
    try {
        const childId = c.req.param('childId');
        const limit = parseInt(c.req.query('limit') || '7');

        const scores = await prisma.addictionScore.findMany({
            where: { childId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return c.json({ success: true, data: scores });
    } catch (error) {
        console.error('Get addiction score error:', error);
        return c.json({ error: 'Failed to get addiction scores' }, 500);
    }
});

export default addiction;
