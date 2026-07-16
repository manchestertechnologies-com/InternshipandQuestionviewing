# Manchester Technologies Internship & Question Viewing Platform

A comprehensive, production-ready, full-stack platform built for Manchester Technologies to manage internships, log tasks, submit and review questions with image cropping support, compute rankings, and offer secure read-only access to a question bank.

## 🚀 Technology Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS (v4), Lucide Icons
- **Backend**: Next.js API Routes, NextAuth.js
- **Database & ORM**: PostgreSQL (Neon Serverless), Prisma 7 with `pg` driver adapter
- **Deliverables Parsing**: SheetJS (`xlsx`) for consolidated student matching
- **Visual Cropper**: `react-image-crop` for high-quality mathematical and diagrammatic bounding-box crops
- **SMTP Engine**: `nodemailer` for OTP verification and transactional notifications

---

## 🔑 Portals & Capabilities

### 1. Admin Portal (`/admin`)
- **Interactive Dashboard**: Consolidated charts for question statuses and branch distributions, top performing list, and recent deliverables.
- **Intern Manager**: Uploads and syncs consolidated groups from `Manchester_Technologies_Consolidated_Groupwise_Final_Updated.xlsx`. Automatically prevents duplicate records and hashes default passwords (`123456`).
- **Mentor Manager**: Displays seeded mentors, target groups, and assigned interns.
- **Viewer Creator**: Creates and manages Viewer accounts.
- **Universal Catalog**: Browse all questions, update difficulty, toggle status, and inspect cropped images.

### 2. Mentor Portal (`/mentor`)
- **Intern Evaluator**: Evaluates and rates interns (1–10 scale). Scores trigger automatic recalculations of global ranks and points.
- **Daily Tasks Assignor**: Uploads PDF/DOCX worksheets and assigns task requirements to specific domains or entire groups.
- **Question Reviewer**: Detailed inspect dialog showing math options and crop diagrams. Supports one-click Approve (points auto-credited), Correction Requested, or Reject.
- **Weekly Deliverables**: View and download zip files or report documents submitted by interns.
- **Announcements**: Target messages to specific domains (AIML, Data Science, Full Stack).
- **Direct Chat**: Interactive messaging pane with group interns.

### 3. Intern Portal (`/intern`)
- **Leaderboard**: Real-time standings showing global ranks.
- **Daily Worksheets Split Screen**: Left panel renders the worksheet attachment (zoom/scroll for PDF). Right panel provides the question draft form and visual cropping tools.
- **Image Cropper Studio**: Bounding crop boxes to isolate diagram zones or equations, saving them as local static files.
- **Task Completion Tracker**: Countdown timers alerting interns on approaching deadlines.
- **Weekly Report Uploader**: Upload weekly project documentation files.
- **Chat Panel**: Communicate directly with the assigned Mentor.

### 4. Viewer Portal (`/viewer`)
- **Secure Repository**: Browse and search approved questions.
- **Data Protection**:
  - Selection, copy, and cut events are strictly disabled.
  - Right-click context menus are blocked.
  - Dynamic opacity watermark displaying the logged-in Viewer's email address covers the entire screen, preventing screenshot leakage.

---

## 🛠️ Setup & Local Development

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/manchestertechnologies-com/InternshipandQuestionviewing.git
cd InternshipandQuestionviewing
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database connection string
DATABASE_URL="postgresql://neondb_owner:npg_ia9hZ5NsEXRo@ep-mute-math-azbd69yj-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# NextAuth secrets
NEXTAUTH_SECRET="your_nextauth_jwt_secret_token"
NEXTAUTH_URL="http://localhost:3000"

# SMTP config for OTP reset
SMTP_USER="manchesterTechnologiesss@gmail.com"
SMTP_PASS="upnp fpna meed hhdy"
```

### 3. Database Initialization & Seeding
```bash
# Push schema changes to Neon Postgres
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed admin and mentor credentials
node prisma/seed.js
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 🔐 Credentials & Group Assignments

### Seeded Portals (Out-of-the-Box)

- **Admin**:
  - Email: `manchestertechnologiess@gmail.com`
  - Password: `Bery0218`

- **Group 1 Mentor (Pallavi)**:
  - Email: `pallavids359@gmail.com`
  - Password: `Mentor2026`

- **Group 2 Mentor (Prateeksha)**:
  - Email: `dgprateeksha01@gmail.com`
  - Password: `Mentor2026`

- **Group 3 Mentor (Ramya)**:
  - Email: `r23616901@gmail.com`
  - Password: `Mentor2026`

- **Intern Default Password**: `123456`
