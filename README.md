<p align="center">
  <h1 align="center">🧠 NeuroNest – AI Digital Wellbeing Guardian</h1>
  <p align="center">
    <strong>A secure, AI-powered cross-platform mobile application that monitors children's digital wellbeing, detects addiction patterns and cyberbullying, and empowers parents with real-time insights and actionable controls.</strong>
  </p>
  <p align="center">
    <em>Developed by <strong>Sakti Swarup Mishra</strong></em>
  </p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#project-structure">Project Structure</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#api-reference">API Reference</a> •
    <a href="#demo-accounts">Demo Accounts</a> •
    <a href="#license">License</a>
  </p>
</p>

---

## 📌 Overview

**NeuroNest** is an intelligent digital wellbeing guardian designed to help parents protect their children in the digital age. By leveraging machine-learning models for **addiction risk scoring** and **cyberbullying detection**, NeuroNest provides a proactive layer of protection — not just monitoring, but understanding and alerting.

### 🎯 Problem Statement

Children are spending increasing amounts of time on digital devices, leading to potential addiction, exposure to cyberbullying, and deteriorating mental health. Parents need a comprehensive, intelligent tool to monitor, understand, and manage their children's digital habits — without being intrusive.

### 💡 Solution

NeuroNest combines real-time screen time monitoring, AI-driven behavioral analysis, gamification, and focus mode controls into a single, privacy-first mobile application that keeps parents informed and children safe.

---

## ✨ Features

### 🔐 Authentication & Security
- **Secure Registration & Login** — Email/password authentication with JWT tokens
- **OTP Verification** — Email-based one-time password verification for account security
- **Secure Token Storage** — Expo SecureStore for encrypted local credential management

### 👶 Child Management
- **Multi-Child Profiles** — Add and manage multiple children under a single parent account
- **Per-Child Settings** — Individual screen-time limits, focus schedules, and monitoring preferences
- **Detailed Child View** — Comprehensive overview of each child's digital activity

### 📊 Screen Time Monitoring
- **Real-Time Tracking** — Log and visualize app usage across categories
- **Daily & Weekly Reports** — Aggregated usage summaries with trend analysis
- **Category Breakdown** — Usage segmented by Social Media, Gaming, Education, Entertainment, etc.
- **Limit Enforcement** — Set daily screen-time caps per child

### 🤖 AI-Powered Intelligence
- **Addiction Risk Scoring** — ML model analyzes usage patterns (frequency, duration, late-night use, category diversity) to compute a 0–100 risk score with severity classification (Low / Moderate / High / Critical)
- **Cyberbullying Detection** — NLP-powered text analysis that classifies messages as safe or harmful, providing confidence scores and keyword extraction
- **Behavioral Insights** — AI-generated risk factors and personalized recommendations

### 🎯 Focus Mode
- **Scheduled Focus Sessions** — Create timed focus periods that block distracting apps
- **Custom App Blocking** — Select which app categories to restrict during focus time
- **Session History** — Track completed focus sessions and build healthy habits

### 🏆 Gamification System
- **Points & Rewards** — Children earn points for healthy digital habits
- **Achievement Badges** — Unlock badges for milestones (e.g., "Screen-Free Saturday", "Focus Champion")
- **Leaderboards** — Friendly competition to encourage positive behavior
- **Reward Redemption** — Parents can set up redeemable rewards for accumulated points

### 📈 Parent Dashboard
- **At-a-Glance Overview** — Summary cards showing total screen time, risk levels, and active alerts
- **Multi-Child Switcher** — Quickly switch between children's profiles
- **Trend Visualization** — Charts and graphs showing usage patterns over time

---

## 🏗️ Architecture

NeuroNest follows a **3-tier microservice architecture** designed for scalability and separation of concerns:

```
┌──────────────────────────────────────────────────────────────┐
│                      📱 Mobile App                           │
│              React Native (Expo) + TypeScript                │
│               Redux Toolkit  •  React Navigation             │
└──────────────────────┬───────────────────────────────────────┘
                       │ REST API (Axios)
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    🖥️ Backend API                             │
│             Node.js  •  Hono  •  Prisma ORM v5               │
│           JWT Auth  •  Zod Validation  •  Nodemailer         │
└──────────┬───────────────────────────────────┬───────────────┘
           │ Prisma Client                     │ HTTP (httpx)
           ▼                                   ▼
┌─────────────────────┐          ┌─────────────────────────────┐
│    🗄️ MySQL DB       │          │      🧬 AI Service           │
│   + Redis Cache      │          │   Python FastAPI + NumPy     │
│                      │          │   Addiction Scorer            │
│                      │          │   Cyberbullying Detector      │
└─────────────────────┘          └─────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer           | Technology                                                                 |
|-----------------|---------------------------------------------------------------------------|
| **Mobile App**  | React Native (Expo SDK 55), TypeScript, Redux Toolkit, React Navigation 7 |
| **Backend API** | Node.js, Hono v4, Prisma ORM v5, Zod, JWT, Nodemailer, PDFKit           |
| **AI Service**  | Python, FastAPI, NumPy, Pydantic, Uvicorn                                |
| **Database**    | MySQL (primary), Redis (caching)                                         |
| **Dev Tools**   | TSX (hot-reload), TypeScript 5, Prisma Studio, Expo DevTools             |

---

## 📁 Project Structure

```
NeuroNest – AI Digital Wellbeing Guardian/
├── 📱 mobile/                        # React Native (Expo) Mobile App
│   ├── App.tsx                       # App entry point
│   ├── app.json                      # Expo configuration
│   ├── index.ts                      # Entry file
│   └── src/
│       ├── api/                      # Axios API client
│       │   └── client.ts
│       ├── navigation/               # React Navigation setup
│       │   ├── AppNavigator.tsx       # Root navigator
│       │   ├── AuthNavigator.tsx      # Auth flow navigator
│       │   └── MainNavigator.tsx      # Main tab navigator
│       ├── screens/
│       │   ├── auth/                  # Authentication screens
│       │   │   ├── LoginScreen.tsx
│       │   │   ├── RegisterScreen.tsx
│       │   │   └── OTPScreen.tsx
│       │   ├── parent/               # Parent dashboard screens
│       │   │   ├── DashboardScreen.tsx
│       │   │   ├── ChildDetailScreen.tsx
│       │   │   ├── FocusModeScreen.tsx
│       │   │   └── SettingsScreen.tsx
│       │   └── child/                # Child-facing screens
│       ├── store/                    # Redux Toolkit store
│       │   ├── index.ts
│       │   └── slices/               # Redux slices (auth, children, etc.)
│       └── theme/                    # App theming constants
│
├── 🖥️ backend/                       # Node.js + Hono Backend API
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema definition
│   │   ├── seed.ts                  # Demo data seeder
│   │   └── migrations/              # Database migrations
│   └── src/
│       ├── index.ts                  # Server entry point
│       ├── lib/                      # Utility libraries (JWT, Prisma client)
│       ├── middleware/               # Auth middleware
│       └── routes/                   # API route handlers
│           ├── auth.ts               # Registration, login, OTP
│           ├── child.ts              # Child CRUD operations
│           ├── screen-time.ts        # Screen time logging & reports
│           ├── addiction.ts          # Addiction risk scoring
│           ├── focus-mode.ts         # Focus session management
│           ├── gamification.ts       # Points, badges, rewards
│           └── dashboard.ts          # Dashboard aggregation
│
├── 🧬 ai-service/                    # Python FastAPI AI Microservice
│   ├── main.py                       # FastAPI app entry point
│   ├── requirements.txt              # Python dependencies
│   ├── models/
│   │   ├── addiction_scorer.py       # ML addiction risk scoring model
│   │   └── cyberbullying_detector.py # NLP cyberbullying detection model
│   └── routes/
│       └── scoring.py                # AI scoring API endpoints
│
└── README.md                         # This file
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

| Tool           | Version  | Purpose                     |
|----------------|----------|-----------------------------|
| **Node.js**    | ≥ 18.x   | Backend & Mobile tooling    |
| **npm**        | ≥ 9.x    | Package management          |
| **Python**     | ≥ 3.9    | AI Service                  |
| **MySQL**      | ≥ 8.0    | Primary database            |
| **Expo CLI**   | Latest   | Mobile development          |

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/neuronest.git
cd "NeuroNest – AI Digital Wellbeing Guardian"
```

### 2️⃣ Set Up the Backend

```bash
cd backend
npm install

# Configure environment variables
# Create a .env file with:
#   DATABASE_URL="mysql://user:password@localhost:3306/neuronest"
#   JWT_SECRET="your-jwt-secret"
#   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (for email OTP)

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed demo data
npm run seed

# Start development server (hot-reload enabled)
npm run dev
```

The backend API will be running at `http://localhost:3000`.

### 3️⃣ Set Up the AI Service

```bash
cd ai-service

# Create a virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the AI service
python -m uvicorn main:app --port 8000 --reload
```

The AI service will be running at `http://localhost:8000`.

### 4️⃣ Set Up the Mobile App

```bash
cd mobile
npm install

# Start Expo development server
npx expo start
```

Scan the QR code with **Expo Go** (Android/iOS) or press `a` for Android emulator / `i` for iOS simulator.

---

## 📡 API Reference

### Authentication

| Method | Endpoint                | Description                |
|--------|------------------------|----------------------------|
| POST   | `/api/auth/register`   | Register a new parent      |
| POST   | `/api/auth/login`      | Login with email/password  |
| POST   | `/api/auth/verify-otp` | Verify OTP code            |

### Child Management

| Method | Endpoint              | Description                   |
|--------|-----------------------|-------------------------------|
| GET    | `/api/children`       | List all children             |
| POST   | `/api/children`       | Add a new child               |
| GET    | `/api/children/:id`   | Get child details             |

### Screen Time

| Method | Endpoint                       | Description                     |
|--------|-------------------------------|---------------------------------|
| POST   | `/api/screen-time/log`        | Log screen time entry           |
| GET    | `/api/screen-time/:childId`   | Get screen time report          |

### Addiction Risk

| Method | Endpoint                         | Description                      |
|--------|----------------------------------|----------------------------------|
| GET    | `/api/addiction/:childId/score`  | Get AI addiction risk score      |
| GET    | `/api/addiction/:childId/history`| Historical risk scores           |

### Focus Mode

| Method | Endpoint                        | Description                     |
|--------|--------------------------------|---------------------------------|
| POST   | `/api/focus-mode/sessions`     | Create a focus session          |
| GET    | `/api/focus-mode/:childId`     | Get focus session history       |

### Gamification

| Method | Endpoint                            | Description                   |
|--------|-------------------------------------|-------------------------------|
| GET    | `/api/gamification/:childId/points` | Get child's points balance    |
| GET    | `/api/gamification/badges`          | List available badges         |
| POST   | `/api/gamification/redeem`          | Redeem rewards                |

### Dashboard

| Method | Endpoint               | Description                          |
|--------|------------------------|--------------------------------------|
| GET    | `/api/dashboard`       | Aggregated parent dashboard data     |

### AI Service

| Method | Endpoint                 | Description                        |
|--------|--------------------------|------------------------------------|
| POST   | `/api/score/addiction`   | Compute addiction risk score       |
| POST   | `/api/score/cyberbully`  | Detect cyberbullying in text       |

---

## 🧪 Demo Accounts

Use these pre-seeded accounts to explore the application:

| Role   | Email                  | Password     |
|--------|------------------------|-------------|
| Parent | parent@demo.com        | Demo@1234   |
| Admin  | admin@neuronest.com    | Admin@1234  |

> **Note:** Run `npm run seed` in the `backend/` directory to populate demo data before using these accounts.

---

## 🔧 Available Scripts

### Backend (`/backend`)

| Script          | Command                     | Description                        |
|-----------------|----------------------------|------------------------------------|
| `dev`           | `npm run dev`              | Start dev server with hot-reload   |
| `build`         | `npm run build`            | Compile TypeScript to JavaScript   |
| `start`         | `npm start`                | Start production server            |
| `seed`          | `npm run seed`             | Seed database with demo data       |
| `db:migrate`    | `npm run db:migrate`       | Run Prisma migrations              |
| `db:generate`   | `npm run db:generate`      | Regenerate Prisma client           |
| `db:studio`     | `npm run db:studio`        | Open Prisma Studio GUI             |

### Mobile (`/mobile`)

| Script    | Command              | Description                    |
|-----------|---------------------|-------------------------------|
| `start`   | `npm start`         | Start Expo development server  |
| `android` | `npm run android`   | Launch on Android emulator     |
| `ios`     | `npm run ios`       | Launch on iOS simulator        |
| `web`     | `npm run web`       | Launch in web browser          |

---

## 🔒 Environment Variables

### Backend (`.env`)

```env
DATABASE_URL="mysql://user:password@localhost:3306/neuronest"
JWT_SECRET="your-super-secret-jwt-key"
AI_SERVICE_URL="http://localhost:8000"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

NeuroNest is designed as a supplementary tool for digital wellbeing monitoring. It should not replace active parenting, professional counseling, or direct communication with children about online safety. The AI models provide probabilistic assessments and should be interpreted as guidance, not definitive diagnoses.

---

<p align="center">

  **Copyright © 2025 Sakti Swarup Mishra. All rights reserved.**

  Built with ❤️ for safer digital childhoods.

  [⬆ Back to Top](#-neuronest--ai-digital-wellbeing-guardian)

</p>
