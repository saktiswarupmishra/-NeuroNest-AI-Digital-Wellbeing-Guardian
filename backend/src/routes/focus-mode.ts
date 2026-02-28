import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const focusMode = new Hono();
focusMode.use('*', authMiddleware);

const focusSchema = z.object({
    childId: z.string().uuid(),
    name: z.string().optional(),
    schedule: z.object({
        days: z.array(z.number().min(0).max(6)),
        startHour: z.number().min(0).max(23),
        startMinute: z.number().min(0).max(59),
        endHour: z.number().min(0).max(23),
        endMinute: z.number().min(0).max(59),
    }),
    blockedApps: z.array(z.string()),
});

// POST /focus-mode/set
focusMode.post('/set', requireRole('PARENT', 'ADMIN'), async (c) => {
    try {
        const body = await c.req.json();
        const data = focusSchema.parse(body);

        const session = await prisma.focusSession.create({
            data: {
                childId: data.childId,
                name: data.name || 'Study Time',
                schedule: JSON.stringify(data.schedule),
                blockedApps: JSON.stringify(data.blockedApps),
                isActive: true,
            },
        });

        return c.json({ success: true, data: session }, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Set focus mode error:', error);
        return c.json({ error: 'Failed to set focus mode' }, 500);
    }
});

// GET /focus-mode/:childId
focusMode.get('/:childId', async (c) => {
    try {
        const childId = c.req.param('childId');

        const sessions = await prisma.focusSession.findMany({
            where: { childId, isActive: true },
            orderBy: { createdAt: 'desc' },
        });

        return c.json({ success: true, data: sessions });
    } catch (error) {
        console.error('Get focus sessions error:', error);
        return c.json({ error: 'Failed to get focus sessions' }, 500);
    }
});

// PUT /focus-mode/:id/toggle
focusMode.put('/:id/toggle', requireRole('PARENT', 'ADMIN'), async (c) => {
    try {
        const id = c.req.param('id');

        const session = await prisma.focusSession.findUnique({ where: { id } });
        if (!session) {
            return c.json({ error: 'Focus session not found' }, 404);
        }

        const updated = await prisma.focusSession.update({
            where: { id },
            data: { isActive: !session.isActive },
        });

        return c.json({ success: true, data: updated });
    } catch (error) {
        console.error('Toggle focus mode error:', error);
        return c.json({ error: 'Failed to toggle focus mode' }, 500);
    }
});

// DELETE /focus-mode/:id
focusMode.delete('/:id', requireRole('PARENT', 'ADMIN'), async (c) => {
    try {
        const id = c.req.param('id');
        await prisma.focusSession.delete({ where: { id } });
        return c.json({ success: true, message: 'Focus session deleted' });
    } catch (error) {
        console.error('Delete focus mode error:', error);
        return c.json({ error: 'Failed to delete focus session' }, 500);
    }
});

export default focusMode;
