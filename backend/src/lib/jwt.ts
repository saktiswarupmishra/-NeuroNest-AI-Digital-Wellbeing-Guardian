import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'neuronest-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'neuronest-refresh';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

export function signToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY } as jwt.SignOptions);
}

export function signRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
}
