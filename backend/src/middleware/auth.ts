import type { Context, Next } from 'hono';
import { verifyToken, type JWTPayload } from '../lib/jwt.js';

// Extend Hono context with user data
declare module 'hono' {
    interface ContextVariableMap {
        user: JWTPayload;
    }
}

export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized: No token provided' }, 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = verifyToken(token);
        c.set('user', payload);
        await next();
    } catch (error) {
        return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
    }
}

export function requireRole(...roles: string[]) {
    return async (c: Context, next: Next) => {
        const user = c.get('user');

        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        if (!roles.includes(user.role)) {
            return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
        }

        await next();
    };
}
