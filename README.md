# TakeUBackward 🎓

> Your Complete Placement Pipeline — AI-powered resume scoring, LinkedIn optimization, project rewriting, and mock interviews.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth v5 (Auth.js) — Credentials provider
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS + CSS Variables
- **AI (future)**: Groq API
- **Voice (future)**: ElevenLabs

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← Sidebar + top bar
│   │   └── dashboard/
│   │       ├── page.tsx            ← Dashboard home
│   │       ├── resume-report/      ← Phase 2
│   │       ├── linkedin-profile/   ← Phase 3
│   │       ├── project-rewrite/    ← Phase 4
│   │       ├── mock-interview/     ← Phase 5
│   │       └── billing/            ← Phase 6
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── register/route.ts
│   ├── layout.tsx
│   ├── page.tsx                    ← Landing page
│   └── globals.css
├── components/
│   └── Providers.tsx               ← SessionProvider
├── lib/
│   ├── auth.ts                     ← NextAuth config
│   ├── prisma.ts                   ← Prisma client singleton
│   └── utils.ts                    ← cn() helper
└── middleware.ts                   ← Route protection
```

---

## Getting Started

### 1. Clone & install

```bash
git clone <https://github.com/vishal-tiwari9/Take-U-Backward.git>
cd talentos
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/talentos"

# Generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-here"
AUTH_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to DB
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Landing page + Dashboard + Auth | ✅ Done |
| 2 | Resume Scoring (Groq) | 🔜 Next |
| 3 | LinkedIn Optimization (Groq) | 📋 Planned |
| 4 | Project Rewriter (Groq) | 📋 Planned |
| 5 | Mock Interview (Groq + ElevenLabs) | 📋 Planned |
| 6 | Billing (Stripe) | 📋 Planned |

---

## Design System

| Token | Value |
|-------|-------|
| `--bg-primary` | `#0d1117` |
| `--bg-secondary` | `#161b22` |
| `--bg-card` | `#1c2333` |
| `--teal` | `#2dd4bf` |
| `--border` | `#2a3441` |
| Font (headings) | Sora |
| Font (body) | DM Sans |
"# Take-U-Backward" 
