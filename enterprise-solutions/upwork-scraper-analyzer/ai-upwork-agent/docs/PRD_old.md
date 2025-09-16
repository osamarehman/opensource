# Upwork AI Agent - Next.js 15 Project Setup Guide

## 🚀 Project Overview

A comprehensive Next.js 15 application for Upwork AI-powered job optimization, proposal automation, and contract winning strategies. Built with modern tech stack focusing on performance, type safety, and minimal codebase while maintaining enterprise-grade architecture.

## 🛠️ Recommended Tech Stack

### Core Framework
- **Next.js 15** - App Router with React Server Components
- **TypeScript** - Full type safety across frontend and backend
- **React 19** - Latest React features with concurrent rendering

### Database & ORM
- **PostgreSQL** - Your existing `postgres.mughal.pro` instance
- **Drizzle ORM** - Type-safe, lightweight ORM with excellent performance
- **Drizzle Kit** - Database migrations and schema management

### Authentication
- **Clerk** - Enterprise-grade auth with built-in UI components
  - Multi-session management
  - Organization support
  - Seamless Next.js App Router integration
  - Better for rapid development and enterprise features

### Styling & UI
- **Tailwind CSS 4** - Latest version with improved performance
- **shadcn/ui** - Copy-paste component library with Radix UI primitives
- **Lucide Icons** - Consistent, customizable icons
- **Class Variance Authority (CVA)** - Component variant management

### State Management & Data Fetching
- **Zustand** - Lightweight, performant state management
- **TanStack Query (React Query)** - Server state management and caching
- **SWR** - Alternative for simple data fetching scenarios

### Forms & Validation
- **React Hook Form** - Performant forms with minimal re-renders
- **Zod** - Type-safe schema validation
- **Hookform Resolvers** - Seamless integration between the two

### Development & Build Tools
- **Turbopack** - Next.js 15's stable dev server (76.7% faster startup)
- **ESLint 9** - Latest linting with improved performance
- **Prettier** - Code formatting
- **TypeScript 5.6+** - Latest TypeScript features

### Monitoring & Analytics
- **Vercel Analytics** - Built-in performance monitoring
- **PostHog** - Product analytics and feature flags
- **Sentry** - Error tracking and performance monitoring

## 📁 Project Structure

```
upwork-ai-agent/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (dashboard)/              # Protected dashboard routes
│   │   │   ├── jobs/
│   │   │   ├── proposals/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   ├── api/                      # API routes
│   │   │   ├── upwork/
│   │   │   │   ├── jobs/
│   │   │   │   ├── proposals/
│   │   │   │   └── client-research/
│   │   │   ├── ai/
│   │   │   │   ├── generate-proposal/
│   │   │   │   ├── analyze-job/
│   │   │   │   └── voice-analysis/
│   │   │   └── webhooks/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── forms/                    # Form components
│   │   ├── layout/                   # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── footer.tsx
│   │   ├── dashboard/                # Dashboard-specific components
│   │   │   ├── job-card.tsx
│   │   │   ├── proposal-editor.tsx
│   │   │   └── analytics-chart.tsx
│   │   └── providers/                # Context providers
│   ├── lib/                          # Utility libraries
│   │   ├── db/                       # Database configuration
│   │   │   ├── index.ts
│   │   │   ├── schema.ts
│   │   │   └── migrations/
│   │   ├── auth/                     # Authentication utilities
│   │   ├── ai/                       # AI service integrations
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   └── prompt-templates.ts
│   │   ├── upwork/                   # Upwork API integration
│   │   │   ├── client.ts
│   │   │   ├── types.ts
│   │   │   └── queries.ts
│   │   ├── utils.ts                  # General utilities
│   │   ├── constants.ts              # App constants
│   │   └── validations.ts            # Zod schemas
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-upwork-jobs.ts
│   │   ├── use-proposal-generator.ts
│   │   └── use-analytics.ts
│   ├── store/                        # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── jobs-store.ts
│   │   └── ui-store.ts
│   └── types/                        # TypeScript type definitions
│       ├── upwork.ts
│       ├── ai.ts
│       └── database.ts
├── public/                           # Static assets
├── drizzle/                          # Database migrations
├── .env.local                        # Environment variables
├── .env.example                      # Environment template
├── components.json                   # shadcn/ui configuration
├── drizzle.config.ts                 # Drizzle configuration
├── middleware.ts                     # Next.js middleware
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies and scripts
```

## 🔧 Environment Setup

### 1. Initialize Project

```bash
# Create Next.js 15 project with TypeScript and App Router
npx create-next-app@latest upwork-ai-agent --typescript --tailwind --app --use-pnpm

cd upwork-ai-agent
```

### 2. Install Core Dependencies

```bash
# Database & ORM
pnpm add drizzle-orm drizzle-kit postgres
pnpm add -D @types/pg

# Authentication
pnpm add @clerk/nextjs

# UI & Styling
pnpm add @radix-ui/react-slot @radix-ui/react-toast @radix-ui/react-dialog
pnpm add class-variance-authority clsx tailwind-merge lucide-react

# State Management & Data Fetching
pnpm add zustand @tanstack/react-query @tanstack/react-query-devtools

# Forms & Validation
pnpm add react-hook-form @hookform/resolvers zod

# AI Integration
pnpm add openai @anthropic-ai/sdk

# HTTP Client & Utilities
pnpm add axios swr date-fns

# Development Tools
pnpm add -D @types/node eslint-config-next prettier
```

### 3. Environment Variables

Create `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://username:password@postgres.mughal.pro:5432/upwork_ai_agent"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Upwork API
UPWORK_API_KEY=your_upwork_api_key
UPWORK_API_SECRET=your_upwork_api_secret

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🗄️ Database Schema (Drizzle)

### Setup Drizzle Configuration

`drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

### Database Schema

`src/lib/db/schema.ts`:

```typescript
import { pgTable, text, timestamp, boolean, jsonb, integer, decimal } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Users table (extends Clerk user data)
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email').unique().notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  upworkProfile: jsonb('upwork_profile'),
  preferences: jsonb('preferences'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Job listings from Upwork
export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  upworkId: text('upwork_id').unique().notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  skills: jsonb('skills'),
  budget: jsonb('budget'),
  clientInfo: jsonb('client_info'),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Generated proposals
export const proposals = pgTable('proposals', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id).notNull(),
  jobId: text('job_id').references(() => jobs.id).notNull(),
  content: text('content').notNull(),
  bidAmount: decimal('bid_amount'),
  aiGenerated: boolean('ai_generated').default(true),
  status: text('status').notNull(), // 'draft', 'sent', 'accepted', 'rejected'
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Analytics and performance tracking
export const analytics = pgTable('analytics', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id).notNull(),
  eventType: text('event_type').notNull(),
  eventData: jsonb('event_data'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
```

## 🎨 UI Configuration

### shadcn/ui Setup

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Add essential components
npx shadcn@latest add button card input label textarea select
npx shadcn@latest add dropdown-menu dialog toast form
npx shadcn@latest add table badge separator
```

### Tailwind Configuration

`tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        // ... rest of shadcn colors
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        mono: ['var(--font-geist-mono)'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

## 🔐 Authentication Setup (Clerk)

### Middleware Configuration

`middleware.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/upwork(.*)',
  '/api/ai(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### Root Layout

`src/app/layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className="min-h-screen bg-background font-sans antialiased">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

## 🔄 State Management (Zustand)

### Jobs Store

`src/store/jobs-store.ts`:

```typescript
import { create } from 'zustand';
import { Job, JobFilter } from '@/types/upwork';

interface JobsState {
  jobs: Job[];
  filters: JobFilter;
  loading: boolean;
  error: string | null;
  
  // Actions
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateFilters: (filters: Partial<JobFilter>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useJobsStore = create<JobsState>((set) => ({
  jobs: [],
  filters: {},
  loading: false,
  error: null,
  
  setJobs: (jobs) => set({ jobs }),
  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
  updateFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
```

## 🚀 Best Practices & Guidelines

### 1. Component Organization
- Use Server Components by default, Client Components only when needed
- Co-locate related components and their tests
- Use compound component patterns for complex UI

### 2. Type Safety
- Define strict TypeScript interfaces for all data structures
- Use Zod for runtime validation and type inference
- Leverage Drizzle's type safety for database operations

### 3. Performance Optimization
- Implement proper caching strategies with TanStack Query
- Use Next.js Image component for optimized images
- Leverage Turbopack for faster development builds

### 4. Error Handling
- Implement consistent error boundaries
- Use proper HTTP status codes in API routes
- Provide meaningful error messages to users

### 5. Security
- Validate all inputs server-side with Zod
- Use Clerk's built-in CSRF protection
- Sanitize user-generated content

## 📦 Package Scripts

`package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:push": "drizzle-kit push",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

## 🚀 Development Workflow

### 1. Initial Setup
```bash
# Clone and install
git clone <repo>
cd upwork-ai-agent
pnpm install

# Setup environment
cp .env.example .env.local
# Fill in your environment variables

# Setup database
pnpm db:generate
pnpm db:migrate
```

### 2. Development Commands
```bash
# Start development server with Turbopack
pnpm dev

# Database operations
pnpm db:studio       # Open Drizzle Studio
pnpm db:generate     # Generate migrations
pnpm db:migrate      # Run migrations

# Code quality
pnpm lint           # ESLint
pnpm type-check     # TypeScript check
pnpm format         # Prettier formatting
```

### 3. Production Deployment
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 📊 Monitoring & Analytics

### Performance Monitoring
- Vercel Analytics for Core Web Vitals
- PostHog for product analytics
- TanStack Query DevTools for debugging

### Error Tracking
- Sentry for error monitoring
- Structured logging with Winston
- Database query monitoring with Drizzle

## 🔮 Future Enhancements

1. **AI Features**
   - Voice pattern analysis for proposals
   - Client scoring algorithms
   - Market trend predictions

2. **Advanced Analytics**
   - Success rate tracking
   - Earnings forecasting
   - Competitive analysis

3. **Automation**
   - Automated proposal sending
   - Job alert notifications
   - Client research automation

This architecture provides a solid foundation for your Upwork AI agent while maintaining clean code, type safety, and optimal performance. The modular structure allows for easy feature additions and scaling as your application grows.