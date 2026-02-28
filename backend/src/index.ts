import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import auth from './routes/auth.js';
import child from './routes/child.js';
import screenTime from './routes/screen-time.js';
import addiction from './routes/addiction.js';
import focusMode from './routes/focus-mode.js';
import dashboard from './routes/dashboard.js';
import gamification from './routes/gamification.js';

const app = new Hono();

// Middleware
app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));
app.use('*', logger());

// Health check
app.get('/', (c) => c.json({
    name: 'NeuroNest API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
}));

app.get('/health', (c) => c.json({ status: 'ok' }));

// Mount routes
app.route('/auth', auth);
app.route('/child', child);
app.route('/screen-time', screenTime);
app.route('/addiction-score', addiction);
app.route('/focus-mode', focusMode);
app.route('/parent/dashboard', dashboard);
app.route('/gamification', gamification);

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json({ error: 'Internal server error' }, 500);
});

const port = parseInt(process.env.PORT || '3001');

console.log(`\n🧠 NeuroNest API Server`);
console.log(`📡 Running on http://localhost:${port}`);
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}\n`);

serve({ fetch: app.fetch, port });
