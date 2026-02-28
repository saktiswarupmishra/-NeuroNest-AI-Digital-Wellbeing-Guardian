import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding NeuroNest database...\n');

    // Clean existing data
    await prisma.alert.deleteMany();
    await prisma.cyberbullyingReport.deleteMany();
    await prisma.addictionScore.deleteMany();
    await prisma.screenTimeLog.deleteMany();
    await prisma.focusSession.deleteMany();
    await prisma.gamificationProfile.deleteMany();
    await prisma.child.deleteMany();
    await prisma.user.deleteMany();

    // ─── Demo Parent Account ───
    const parentPassword = await bcrypt.hash('Demo@1234', 12);
    const parent = await prisma.user.create({
        data: {
            email: 'parent@demo.com',
            password: parentPassword,
            name: 'Sarah Johnson',
            phone: '+1234567890',
            role: 'PARENT',
            isVerified: true,
            avatar: '👩‍💼',
        },
    });
    console.log('✅ Parent account: parent@demo.com / Demo@1234');

    // ─── Demo Admin Account ───
    const adminPassword = await bcrypt.hash('Admin@1234', 12);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@neuronest.com',
            password: adminPassword,
            name: 'System Admin',
            role: 'ADMIN',
            isVerified: true,
            avatar: '🛡️',
        },
    });
    console.log('✅ Admin account: admin@neuronest.com / Admin@1234');

    // ─── Demo Second Parent ───
    const parent2Password = await bcrypt.hash('Demo@1234', 12);
    const parent2 = await prisma.user.create({
        data: {
            email: 'mike@demo.com',
            password: parent2Password,
            name: 'Mike Williams',
            phone: '+1987654321',
            role: 'PARENT',
            isVerified: true,
            avatar: '👨‍💼',
        },
    });
    console.log('✅ Parent account: mike@demo.com / Demo@1234');

    // ─── Children for Sarah ───
    const emma = await prisma.child.create({
        data: {
            parentId: parent.id,
            name: 'Emma Johnson',
            age: 12,
            avatar: '👧',
            dailyLimitMin: 120,
        },
    });

    const jake = await prisma.child.create({
        data: {
            parentId: parent.id,
            name: 'Jake Johnson',
            age: 8,
            avatar: '👦',
            dailyLimitMin: 90,
        },
    });

    // ─── Child for Mike ───
    const lily = await prisma.child.create({
        data: {
            parentId: parent2.id,
            name: 'Lily Williams',
            age: 14,
            avatar: '👱‍♀️',
            dailyLimitMin: 150,
        },
    });

    console.log(`\n✅ Children: Emma (12), Jake (8), Lily (14)`);

    // ─── Gamification Profiles ───
    await prisma.gamificationProfile.create({
        data: {
            childId: emma.id,
            points: 450,
            streak: 5,
            longestStreak: 12,
            level: 3,
            badges: JSON.stringify(['first_day', 'streak_3', 'streak_7']),
            lastActiveDate: new Date(),
        },
    });

    await prisma.gamificationProfile.create({
        data: {
            childId: jake.id,
            points: 120,
            streak: 2,
            longestStreak: 4,
            level: 1,
            badges: JSON.stringify(['first_day']),
            lastActiveDate: new Date(),
        },
    });

    await prisma.gamificationProfile.create({
        data: {
            childId: lily.id,
            points: 780,
            streak: 0,
            longestStreak: 15,
            level: 4,
            badges: JSON.stringify(['first_day', 'streak_3', 'streak_7', 'score_drop_10']),
            lastActiveDate: new Date(),
        },
    });

    console.log('✅ Gamification profiles created');

    // ─── Screen Time Logs (last 7 days) ───
    const apps = [
        { name: 'Instagram', category: 'social_media' },
        { name: 'TikTok', category: 'social_media' },
        { name: 'YouTube', category: 'social_media' },
        { name: 'Snapchat', category: 'social_media' },
        { name: 'Chrome', category: 'browser' },
        { name: 'Khan Academy', category: 'education' },
        { name: 'Duolingo', category: 'education' },
        { name: 'Minecraft', category: 'gaming' },
        { name: 'Roblox', category: 'gaming' },
        { name: 'WhatsApp', category: 'messaging' },
        { name: 'Netflix', category: 'entertainment' },
    ];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() - dayOffset);
        date.setHours(0, 0, 0, 0);

        // Emma's usage pattern (moderate-high)
        const emmaApps = [
            { app: apps[0], minutes: 25 + Math.floor(Math.random() * 20), hour: 16 },
            { app: apps[2], minutes: 30 + Math.floor(Math.random() * 25), hour: 17 },
            { app: apps[5], minutes: 20 + Math.floor(Math.random() * 15), hour: 15 },
            { app: apps[7], minutes: 15 + Math.floor(Math.random() * 20), hour: 18 },
            { app: apps[1], minutes: 10 + Math.floor(Math.random() * 30), hour: 20 },
            { app: apps[9], minutes: 10 + Math.floor(Math.random() * 10), hour: 19 },
        ];

        // Jake's usage pattern (low-moderate)
        const jakeApps = [
            { app: apps[7], minutes: 20 + Math.floor(Math.random() * 15), hour: 16 },
            { app: apps[2], minutes: 15 + Math.floor(Math.random() * 10), hour: 17 },
            { app: apps[6], minutes: 10 + Math.floor(Math.random() * 10), hour: 15 },
            { app: apps[8], minutes: 15 + Math.floor(Math.random() * 10), hour: 18 },
        ];

        // Lily's usage pattern (high - some night usage)
        const lilyApps = [
            { app: apps[0], minutes: 40 + Math.floor(Math.random() * 20), hour: 16 },
            { app: apps[1], minutes: 45 + Math.floor(Math.random() * 30), hour: 17 },
            { app: apps[2], minutes: 20 + Math.floor(Math.random() * 15), hour: 20 },
            { app: apps[3], minutes: 15 + Math.floor(Math.random() * 15), hour: 21 },
            { app: apps[10], minutes: 30 + Math.floor(Math.random() * 20), hour: 22 },
            { app: apps[1], minutes: 10 + Math.floor(Math.random() * 15), hour: 23 }, // Night usage
        ];

        for (const entry of emmaApps) {
            await prisma.screenTimeLog.create({
                data: {
                    childId: emma.id,
                    appName: entry.app.name,
                    category: entry.app.category,
                    durationMinutes: entry.minutes,
                    date,
                    hour: entry.hour,
                },
            });
        }

        for (const entry of jakeApps) {
            await prisma.screenTimeLog.create({
                data: {
                    childId: jake.id,
                    appName: entry.app.name,
                    category: entry.app.category,
                    durationMinutes: entry.minutes,
                    date,
                    hour: entry.hour,
                },
            });
        }

        for (const entry of lilyApps) {
            await prisma.screenTimeLog.create({
                data: {
                    childId: lily.id,
                    appName: entry.app.name,
                    category: entry.app.category,
                    durationMinutes: entry.minutes,
                    date,
                    hour: entry.hour,
                },
            });
        }
    }

    console.log('✅ Screen time logs created (7 days × 3 children)');

    // ─── Addiction Scores (last 7 days) ───
    const riskProgression: { score: number; risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' }[] = [
        { score: 42, risk: 'MODERATE' },
        { score: 45, risk: 'MODERATE' },
        { score: 38, risk: 'MODERATE' },
        { score: 35, risk: 'MODERATE' },
        { score: 33, risk: 'MODERATE' },
        { score: 30, risk: 'MODERATE' },
        { score: 28, risk: 'MODERATE' },
    ];

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));

        await prisma.addictionScore.create({
            data: {
                childId: emma.id,
                score: riskProgression[i].score,
                riskLevel: riskProgression[i].risk,
                explanation: `Emma's digital wellbeing score is ${riskProgression[i].score}/100 (${riskProgression[i].risk}). Social media usage is the primary contributor.`,
                factors: JSON.stringify({
                    screenTime: 55,
                    nightUsage: 10,
                    socialMediaRatio: 45,
                    appSwitching: 30,
                    sentimentVolatility: 20,
                    rewardDependency: 35,
                }),
                createdAt: date,
            },
        });
    }

    // Jake - Low risk
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const score = 15 + Math.floor(Math.random() * 8);

        await prisma.addictionScore.create({
            data: {
                childId: jake.id,
                score,
                riskLevel: 'LOW',
                explanation: `Jake's digital wellbeing is healthy with a score of ${score}/100. Good balance between gaming and education apps.`,
                factors: JSON.stringify({
                    screenTime: 30,
                    nightUsage: 0,
                    socialMediaRatio: 15,
                    appSwitching: 15,
                    sentimentVolatility: 10,
                    rewardDependency: 20,
                }),
                createdAt: date,
            },
        });
    }

    // Lily - High risk
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const score = 62 + Math.floor(Math.random() * 15);

        await prisma.addictionScore.create({
            data: {
                childId: lily.id,
                score,
                riskLevel: score >= 75 ? 'CRITICAL' : 'HIGH',
                explanation: `Lily's score of ${score}/100 indicates ${score >= 75 ? 'CRITICAL' : 'HIGH'} risk. Significant night usage and high social media dependency detected.`,
                factors: JSON.stringify({
                    screenTime: 75,
                    nightUsage: 55,
                    socialMediaRatio: 70,
                    appSwitching: 45,
                    sentimentVolatility: 40,
                    rewardDependency: 60,
                }),
                createdAt: date,
            },
        });
    }

    console.log('✅ Addiction scores created (7 days × 3 children)');

    // ─── Focus Sessions ───
    await prisma.focusSession.create({
        data: {
            childId: emma.id,
            name: 'Homework Time',
            schedule: JSON.stringify({ days: [1, 2, 3, 4, 5], startHour: 15, startMinute: 0, endHour: 17, endMinute: 0 }),
            blockedApps: JSON.stringify(['Instagram', 'TikTok', 'YouTube', 'Snapchat', 'Roblox']),
            isActive: true,
        },
    });

    await prisma.focusSession.create({
        data: {
            childId: lily.id,
            name: 'Study Session',
            schedule: JSON.stringify({ days: [1, 2, 3, 4, 5], startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 }),
            blockedApps: JSON.stringify(['Instagram', 'TikTok', 'Snapchat', 'Netflix']),
            isActive: true,
        },
    });

    await prisma.focusSession.create({
        data: {
            childId: lily.id,
            name: 'Bedtime',
            schedule: JSON.stringify({ days: [0, 1, 2, 3, 4, 5, 6], startHour: 22, startMinute: 0, endHour: 7, endMinute: 0 }),
            blockedApps: JSON.stringify(['Instagram', 'TikTok', 'YouTube', 'Snapchat', 'Netflix', 'Roblox', 'Minecraft']),
            isActive: true,
        },
    });

    console.log('✅ Focus sessions created');

    // ─── Alerts ───
    await prisma.alert.createMany({
        data: [
            {
                userId: parent.id,
                childId: emma.id,
                type: 'SCREEN_TIME_LIMIT',
                severity: 'WARNING',
                title: 'Screen Time Limit Exceeded',
                message: 'Emma has used 145 minutes today, exceeding the 120-minute daily limit.',
            },
            {
                userId: parent.id,
                childId: emma.id,
                type: 'ADDICTION_RISK',
                severity: 'INFO',
                title: 'Addiction Score Improving',
                message: `Emma's addiction score has decreased from 42 to 28 over the past week. Great progress!`,
            },
            {
                userId: parent2.id,
                childId: lily.id,
                type: 'ADDICTION_RISK',
                severity: 'CRITICAL',
                title: 'CRITICAL Addiction Risk Detected',
                message: `Lily's addiction score is 72/100. Significant night usage and high social media dependency detected. Immediate intervention recommended.`,
            },
            {
                userId: parent2.id,
                childId: lily.id,
                type: 'CYBERBULLYING',
                severity: 'DANGER',
                title: 'Potential Cyberbullying Detected',
                message: 'Negative sentiment patterns detected in recent online interactions. Review recommended.',
            },
            {
                userId: parent2.id,
                childId: lily.id,
                type: 'SCREEN_TIME_LIMIT',
                severity: 'WARNING',
                title: 'Night Usage Alert',
                message: 'Lily was active on TikTok at 11:30 PM, outside of permitted hours.',
            },
        ],
    });

    console.log('✅ Alerts created');

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('─────────────────────────────────');
    console.log('DEMO ACCOUNTS:');
    console.log('  Parent:  parent@demo.com / Demo@1234');
    console.log('  Parent:  mike@demo.com / Demo@1234');
    console.log('  Admin:   admin@neuronest.com / Admin@1234');
    console.log('─────────────────────────────────\n');
}

seed()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
