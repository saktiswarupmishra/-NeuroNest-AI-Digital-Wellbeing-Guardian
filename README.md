# 🧠 NeuroNest – AI Digital Wellbeing Guardian

A secure, AI-powered cross-platform mobile app that monitors children's digital wellbeing, detects addiction patterns and cyberbullying, and empowers parents with real-time insights.

## Architecture

| Layer | Technology |
|-------|-----------|
| **Mobile** | React Native (Expo) + TypeScript + Redux Toolkit |
| **Backend** | Node.js + Hono + Prisma ORM v5 |
| **AI Service** | Python FastAPI + Transformers |
| **Database** | MySQL + Redis |

## Quick Start

```bash
# Backend
cd backend && npm install && npx prisma migrate dev && npm run dev

# AI Service
cd ai-service && pip install -r requirements.txt && uvicorn main:app --port 8000

# Mobile
cd mobile && npm install && npx expo start
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Parent | parent@demo.com | Demo@1234 |
| Admin | admin@neuronest.com | Admin@1234 |
