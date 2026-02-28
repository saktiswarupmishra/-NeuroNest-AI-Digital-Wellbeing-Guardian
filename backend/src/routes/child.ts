import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const child = new Hono();
child.use('*', authMiddleware);

const childSchema = z.object({
    name: z.string().min(2),
    age: z.number().int().min(3).max(17),
    avatar: z.string().optional(),
    deviceId: z.string().optional(),
    dailyLimitMin: z.number().int().min(15).max(1440).optional(),
});

// POST /child/create
child.post('/create', requireRole('PARENT', 'ADMIN'), async (c) => {
    try {
        const body = await c.req.json();
        const data = childSchema.parse(body);
        const user = c.get('user');

        const childRecord = await prisma.child.create({
            data: {
                parentId: user.userId,
                name: data.name,
                age: data.age,
                avatar: data.avatar,
                deviceId: data.deviceId,
                dailyLimitMin: data.dailyLimitMin || 120,
            },
        });

        // Create gamification profile
        await prisma.gamificationProfile.create({
            data: {
                childId: childRecord.id,
                points: 0,
                streak: 0,
                level: 1,
                badges: JSON.stringify([]),
            },
        });

        return c.json({ success: true, data: childRecord }, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Create child error:', error);
        return c.json({ error: 'Failed to create child profile' }, 500);
    }
});

// GET /child/list
child.get('/list', requireRole('PARENT', 'ADMIN'), async (c) => {
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
            orderBy: { createdAt: 'desc' },
        });

        return c.json({ success: true, data: children });
    } catch (error) {
        console.error('List children error:', error);
        return c.json({ error: 'Failed to list children' }, 500);
    }
});

// GET /child/:id
child.get('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const user = c.get('user');

        const childRecord = await prisma.child.findFirst({
            where: { id, parentId: user.userId },
            include: {
                gamification: true,
                addictionScores: {
                    orderBy: { createdAt: 'desc' },
                    take: 7,
                },
                screenTimeLogs: {
                    orderBy: { date: 'desc' },
                    take: 50,
                },
                alerts: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!childRecord) {
            return c.json({ error: 'Child not found' }, 404);
        }

        return c.json({ success: true, data: childRecord });
    } catch (error) {
        console.error('Get child error:', error);
        return c.json({ error: 'Failed to get child' }, 500);
    }
});

// PUT /child/:id
child.put('/:id', requireRole('PARENT', 'ADMIN'), async (c) => {
    try {
        const id = c.req.param('id');
        const user = c.get('user');
        const body = await c.req.json();

        const existing = await prisma.child.findFirst({ where: { id, parentId: user.userId } });
        if (!existing) {
            return c.json({ error: 'Child not found' }, 404);
        }

        const updated = await prisma.child.update({
            where: { id },
            data: body,
        });

        return c.json({ success: true, data: updated });
    } catch (error) {
        console.error('Update child error:', error);
        return c.json({ error: 'Failed to update child' }, 500);
    }
});

export default child;
