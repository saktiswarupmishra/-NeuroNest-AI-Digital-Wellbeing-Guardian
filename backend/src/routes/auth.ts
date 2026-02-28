import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { signToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';

const auth = new Hono();

// Validation schemas
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    phone: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// POST /auth/register
auth.post('/register', async (c) => {
    try {
        const body = await c.req.json();
        const data = registerSchema.parse(body);

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            return c.json({ error: 'Email already registered' }, 409);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                role: 'PARENT',
                otpCode,
                otpExpiry,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        // In production, send OTP via SMS/email
        console.log(`🔐 OTP for ${data.email}: ${otpCode}`);

        const token = signToken({ userId: user.id, email: user.email, role: user.role });
        const refreshToken = signRefreshToken({ userId: user.id, email: user.email, role: user.role });

        return c.json({
            success: true,
            message: 'Registration successful. OTP sent.',
            data: { user, token, refreshToken, otp: process.env.NODE_ENV === 'development' ? otpCode : undefined },
        }, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Registration error:', error);
        return c.json({ error: 'Registration failed' }, 500);
    }
});

// POST /auth/login
auth.post('/login', async (c) => {
    try {
        const body = await c.req.json();
        const data = loginSchema.parse(body);

        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (!user || !user.isActive) {
            return c.json({ error: 'Invalid credentials' }, 401);
        }

        const validPassword = await bcrypt.compare(data.password, user.password);
        if (!validPassword) {
            return c.json({ error: 'Invalid credentials' }, 401);
        }

        const token = signToken({ userId: user.id, email: user.email, role: user.role });
        const refreshToken = signRefreshToken({ userId: user.id, email: user.email, role: user.role });

        return c.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    avatar: user.avatar,
                    isVerified: user.isVerified,
                },
                token,
                refreshToken,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Login error:', error);
        return c.json({ error: 'Login failed' }, 500);
    }
});

// POST /auth/otp/verify
auth.post('/otp/verify', async (c) => {
    try {
        const { email, otp } = await c.req.json();

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }

        if (user.otpCode !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
            return c.json({ error: 'Invalid or expired OTP' }, 400);
        }

        await prisma.user.update({
            where: { email },
            data: { isVerified: true, otpCode: null, otpExpiry: null },
        });

        return c.json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
        console.error('OTP verification error:', error);
        return c.json({ error: 'Verification failed' }, 500);
    }
});

// POST /auth/otp/resend
auth.post('/otp/resend', async (c) => {
    try {
        const { email } = await c.req.json();

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.user.update({
            where: { email },
            data: { otpCode, otpExpiry },
        });

        console.log(`🔐 New OTP for ${email}: ${otpCode}`);

        return c.json({
            success: true,
            message: 'OTP resent',
            data: process.env.NODE_ENV === 'development' ? { otp: otpCode } : undefined,
        });
    } catch (error) {
        console.error('OTP resend error:', error);
        return c.json({ error: 'Failed to resend OTP' }, 500);
    }
});

// POST /auth/refresh
auth.post('/refresh', async (c) => {
    try {
        const { refreshToken } = await c.req.json();
        const payload = verifyRefreshToken(refreshToken);

        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user || !user.isActive) {
            return c.json({ error: 'Invalid token' }, 401);
        }

        const newToken = signToken({ userId: user.id, email: user.email, role: user.role });
        const newRefresh = signRefreshToken({ userId: user.id, email: user.email, role: user.role });

        return c.json({ success: true, data: { token: newToken, refreshToken: newRefresh } });
    } catch (error) {
        return c.json({ error: 'Token refresh failed' }, 401);
    }
});

export default auth;
