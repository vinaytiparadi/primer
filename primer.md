# Primer — Simplified Project Specification

## Overview

Primer is a mobile-responsive web application designed as a specialized, highly intuitive notepad for managing AI prompts. The platform serves as a centralized hub where users can store prompts within specific categories or as standalone entries. A core feature is prompt versioning, allowing users to save and toggle between different variations of the same prompt tailored for specific AI models (Claude, Gemini, ChatGPT, or any other service). Built with a focus on a frictionless user experience, the app features robust search and filtering, making it effortless to find, copy, edit, and add new prompts on the fly.

---

## Simplified Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14+ (App Router), React 18, TypeScript | Full-stack in one codebase |
| Styling | Tailwind CSS 3 | Rapid UI development |
| Backend Runtime | Node.js 20+ | Same language front and back |
| API Layer | Next.js Route Handlers (REST) | No separate server needed |
| Database | PostgreSQL 16 | Reliable, free-tier available, built-in full-text search |
| ORM | Prisma | Type-safe queries, easy migrations, great DX |
| Authentication | NextAuth.js v5 (Auth.js) | Drop-in auth with multiple providers |
| Search | PostgreSQL Full-Text Search (tsvector + pg_trgm) | No extra service needed |
| Deployment | Vercel (app) + Neon (database) | Generous free tiers for hobby projects |

**What was removed** (can be added later when scaling):
- ~~Redis caching~~ → Next.js built-in caching + `unstable_cache` is sufficient at hobby scale
- ~~Cloudflare R2 storage~~ → Export as direct file download from API, no object storage needed
- ~~BullMQ background jobs~~ → All operations happen synchronously in API routes
- ~~Meilisearch~~ → PostgreSQL full-text search handles hobby-scale volumes easily

---

## Frontend Architecture

### Pages & Routing

```
app/
├── (auth)/
│   ├── login/page.tsx              # Login (email/password + OAuth buttons)
│   ├── register/page.tsx           # Sign up
│   └── layout.tsx                  # Centered card layout for auth pages
├── (dashboard)/
│   ├── layout.tsx                  # Sidebar + top bar shell
│   ├── page.tsx                    # Dashboard home — recent prompts, quick stats
│   ├── prompts/
│   │   ├── page.tsx                # All prompts (list/grid with search & filters)
│   │   ├── [id]/page.tsx           # Single prompt — version viewer/editor
│   │   └── new/page.tsx            # Create new prompt
│   ├── categories/
│   │   ├── page.tsx                # All categories
│   │   └── [slug]/page.tsx         # Prompts within a category
│   ├── collections/
│   │   ├── page.tsx                # User-curated collections
│   │   └── [id]/page.tsx           # Collection detail
│   └── settings/page.tsx           # Profile, preferences, import/export
├── api/                            # Route Handlers (backend)
│   ├── auth/[...nextauth]/route.ts
│   ├── prompts/
│   ├── categories/
│   ├── collections/
│   ├── tags/
│   └── search/
└── globals.css
```

### Key Frontend Features

- **Prompt Editor**: Textarea with syntax highlighting for template variables (`{{context}}`, `{{tone}}`), character/token count estimation
- **Version Tabs**: Tabbed interface to switch between prompt versions per AI model, with diff view
- **Quick Copy**: One-click copy-to-clipboard with toast feedback
- **Command Palette**: `Cmd+K` / `Ctrl+K` for instant fuzzy search across everything
- **Responsive Layout**: Collapsible sidebar on mobile, bottom navigation bar

---

## Backend Architecture

### 1. Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Auth Models (managed by NextAuth) ───────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?                          // null for OAuth-only users
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts    Account[]
  sessions    Session[]
  prompts     Prompt[]
  categories  Category[]
  collections Collection[]
  tags        Tag[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ─── App Models ──────────────────────────────────────────

model Category {
  id          String   @id @default(cuid())
  name        String
  slug        String
  description String?
  color       String?                            // hex color for UI badge
  icon        String?                            // lucide icon name
  sortOrder   Int      @default(0)
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  prompts Prompt[]

  @@unique([userId, slug])
  @@map("categories")
}

model Prompt {
  id          String   @id @default(cuid())
  title       String
  description String?
  isFavorite  Boolean  @default(false)
  isPinned    Boolean  @default(false)
  usageCount  Int      @default(0)
  userId      String
  categoryId  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  category    Category?               @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  versions    PromptVersion[]
  tags        TagsOnPrompts[]
  collections CollectionsOnPrompts[]

  @@index([userId, updatedAt(sort: Desc)])
  @@map("prompts")
}

model PromptVersion {
  id            String   @id @default(cuid())
  promptId      String
  versionLabel  String                           // "v1", "v2.1"
  modelTarget   String                           // "claude", "gpt-4", "gemini", "universal"
  content       String   @db.Text
  systemPrompt  String?  @db.Text               // optional system prompt
  variables     Json?                            // [{ name: "tone", default: "formal" }]
  notes         String?                          // changelog note
  tokenEstimate Int?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  prompt Prompt @relation(fields: [promptId], references: [id], onDelete: Cascade)

  @@index([promptId, modelTarget])
  @@map("prompt_versions")
}

model Tag {
  id     String @id @default(cuid())
  name   String
  userId String

  user    User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  prompts TagsOnPrompts[]

  @@unique([userId, name])
  @@map("tags")
}

model TagsOnPrompts {
  promptId String
  tagId    String

  prompt Prompt @relation(fields: [promptId], references: [id], onDelete: Cascade)
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([promptId, tagId])
  @@map("tags_on_prompts")
}

model Collection {
  id          String   @id @default(cuid())
  name        String
  description String?
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user    User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  prompts CollectionsOnPrompts[]

  @@map("collections")
}

model CollectionsOnPrompts {
  collectionId String
  promptId     String
  sortOrder    Int    @default(0)

  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  prompt     Prompt     @relation(fields: [promptId], references: [id], onDelete: Cascade)

  @@id([collectionId, promptId])
  @@map("collections_on_prompts")
}
```

### 2. API Routes

All routes live under `app/api/` as Next.js Route Handlers. Every route (except auth) checks the session first.

#### Prompts

```
GET    /api/prompts                      → List prompts (paginated, filterable)
POST   /api/prompts                      → Create prompt (with initial version)
GET    /api/prompts/[id]                 → Get prompt + all versions
PATCH  /api/prompts/[id]                 → Update metadata (title, favorite, category)
DELETE /api/prompts/[id]                 → Delete prompt

POST   /api/prompts/[id]/versions        → Add new version
PATCH  /api/prompts/[id]/versions/[vid]  → Edit version
DELETE /api/prompts/[id]/versions/[vid]  → Delete version
POST   /api/prompts/[id]/copy            → Duplicate prompt
```

#### Categories

```
GET    /api/categories                   → List categories with prompt counts
POST   /api/categories                   → Create category
PATCH  /api/categories/[id]              → Update category
DELETE /api/categories/[id]              → Delete (prompts become uncategorized)
```

#### Collections

```
GET    /api/collections                  → List collections
POST   /api/collections                  → Create collection
PATCH  /api/collections/[id]             → Update collection
DELETE /api/collections/[id]             → Delete collection
POST   /api/collections/[id]/prompts     → Add prompt to collection
DELETE /api/collections/[id]/prompts/[pid] → Remove from collection
```

#### Tags

```
GET    /api/tags                         → List all user tags with counts
POST   /api/tags                         → Create tag
DELETE /api/tags/[id]                    → Delete tag
GET    /api/tags/autocomplete?q=         → Autocomplete
```

#### Search

```
GET    /api/search?q=...&category=...&model=...&tags=...&sort=...
→ Full-text search across titles, descriptions, content
→ Filters: category, model target, tags, favorites, date range
→ Sort: relevance, newest, most-used, alphabetical
```

#### Import/Export

```
GET    /api/export?format=json|csv       → Download all prompts as file
POST   /api/import                       → Upload and import prompts from JSON/CSV
```

### 3. Example Route Handler

```typescript
// app/api/prompts/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const categoryId = searchParams.get("category");
  const favorite = searchParams.get("favorite");

  const where = {
    userId: session.user.id,
    ...(categoryId && { categoryId }),
    ...(favorite === "true" && { isFavorite: true }),
  };

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      include: {
        category: true,
        versions: { orderBy: { createdAt: "desc" } },
        tags: { include: { tag: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.prompt.count({ where }),
  ]);

  return NextResponse.json({ prompts, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const prompt = await prisma.prompt.create({
    data: {
      title: body.title,
      description: body.description,
      categoryId: body.categoryId,
      userId: session.user.id,
      versions: {
        create: {
          versionLabel: "v1",
          modelTarget: body.modelTarget ?? "universal",
          content: body.content,
          systemPrompt: body.systemPrompt,
        },
      },
      ...(body.tags?.length && {
        tags: {
          create: body.tags.map((tagId: string) => ({ tagId })),
        },
      }),
    },
    include: { versions: true, tags: { include: { tag: true } }, category: true },
  });

  return NextResponse.json(prompt, { status: 201 });
}
```

### 4. Search Implementation

PostgreSQL full-text search — no extra services needed.

#### Migration (run once after Prisma migrate)

```sql
-- prisma/migrations/add_search/migration.sql
-- Enable trigram extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add generated tsvector column for full-text search
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

-- GIN index for fast full-text lookups
CREATE INDEX IF NOT EXISTS idx_prompts_search ON prompts USING GIN(search_vector);

-- Trigram index for fuzzy/typo-tolerant matching
CREATE INDEX IF NOT EXISTS idx_prompts_title_trgm ON prompts USING GIN(title gin_trgm_ops);
```

#### Search API Route

```typescript
// app/api/search/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const categoryId = req.nextUrl.searchParams.get("category");
  const modelTarget = req.nextUrl.searchParams.get("model");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20");
  const offset = parseInt(req.nextUrl.searchParams.get("offset") ?? "0");

  if (!q.trim()) {
    return NextResponse.json({ results: [], total: 0 });
  }

  // Convert "hello world" → "hello & world" for tsquery
  const tsQuery = q.trim().split(/\s+/).join(" & ");

  const results = await prisma.$queryRaw`
    SELECT
      p.id, p.title, p.description, p."isFavorite", p."usageCount",
      p."categoryId", p."createdAt", p."updatedAt",
      ts_rank(p.search_vector, to_tsquery('english', ${tsQuery})) AS relevance,
      similarity(p.title, ${q}) AS title_similarity
    FROM prompts p
    WHERE p."userId" = ${session.user.id}
      AND (
        p.search_vector @@ to_tsquery('english', ${tsQuery})
        OR similarity(p.title, ${q}) > 0.3
      )
      ${categoryId ? prisma.$queryRaw`AND p."categoryId" = ${categoryId}` : prisma.$queryRaw``}
      ${modelTarget ? prisma.$queryRaw`AND EXISTS (
        SELECT 1 FROM prompt_versions pv
        WHERE pv."promptId" = p.id AND pv."modelTarget" = ${modelTarget}
      )` : prisma.$queryRaw``}
    ORDER BY relevance DESC, title_similarity DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return NextResponse.json({ results });
}
```

### 5. Authentication

Using Auth.js v5 with credentials + Google OAuth + GitHub OAuth.

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        return isValid ? user : null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
});
```

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

```typescript
// app/api/auth/register/route.ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  // Hash password and create user
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
```

```typescript
// middleware.ts
export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Protect everything except auth pages, API auth routes, and static files
    "/((?!login|register|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

---

## Environment Variables

```env
# Database (get from Neon dashboard)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/primer?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# GitHub OAuth (from GitHub Developer Settings)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

---

## Step-by-Step Setup Guides

### Guide 1: Setting Up PostgreSQL with Neon (Free Tier)

Neon gives you a free serverless PostgreSQL database — no Docker, no local install needed.

```
STEP 1 — Create account
  → Go to https://neon.tech and sign up (GitHub login works)

STEP 2 — Create a project
  → Click "New Project"
  → Name: "primer"
  → Region: pick closest to you
  → PostgreSQL version: 16
  → Click "Create Project"

STEP 3 — Get your connection string
  → After creation, you'll see a connection string like:
    postgresql://username:password@ep-cool-name-123.us-east-2.aws.neon.tech/neondb?sslmode=require
  → Copy this — it goes into DATABASE_URL in your .env.local

STEP 4 — (Optional) Install pgAdmin or use Neon's SQL Editor
  → Neon has a built-in SQL editor in the dashboard
  → You can run raw queries there to inspect data
  → Alternatively, install pgAdmin (free GUI) and connect using the same URL

That's it. No Docker, no local PostgreSQL install. Neon handles everything.
```

### Guide 2: Setting Up Prisma

```
STEP 1 — Install Prisma
  npm install prisma --save-dev
  npm install @prisma/client

STEP 2 — Initialize Prisma
  npx prisma init
  → This creates:
    prisma/schema.prisma  (your database schema)
    .env                  (where DATABASE_URL goes)

STEP 3 — Add your schema
  → Copy the Prisma schema from Section 1 above into prisma/schema.prisma
  → Make sure DATABASE_URL is set in .env.local (not .env, Next.js reads .env.local)

STEP 4 — Create the database tables
  npx prisma migrate dev --name init
  → This reads your schema, generates SQL, and runs it against your database
  → It also generates the Prisma Client (TypeScript types for your tables)
  → You'll see the migration file in prisma/migrations/

STEP 5 — Add the full-text search migration
  → Create a file: prisma/migrations/add_search/migration.sql
  → Paste the SQL from Section 4 (Search Implementation) above
  → Run: npx prisma migrate dev --name add_search

STEP 6 — Create the Prisma client singleton
  → Create lib/prisma.ts:

    import { PrismaClient } from "@prisma/client";

    const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

    export const prisma = globalForPrisma.prisma ?? new PrismaClient();

    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

  → This prevents creating too many connections in development (Next.js hot reloads)

STEP 7 — (Optional) Seed your database with test data
  → Create prisma/seed.ts with fake prompts, categories, etc.
  → Add to package.json: "prisma": { "seed": "tsx prisma/seed.ts" }
  → Run: npx prisma db seed

COMMON COMMANDS YOU'LL USE:
  npx prisma migrate dev --name <name>    # Create + run a migration
  npx prisma generate                     # Regenerate client after schema changes
  npx prisma studio                       # Open visual database browser (localhost:5555)
  npx prisma db push                      # Push schema without migration (prototyping only)
  npx prisma migrate reset                # Nuke DB and re-run all migrations
```

### Guide 3: Setting Up Auth.js (NextAuth v5)

```
STEP 1 — Install packages
  npm install next-auth@beta @auth/prisma-adapter bcryptjs
  npm install -D @types/bcryptjs

STEP 2 — Create the auth configuration
  → Create lib/auth.ts — use the code from Section 5 above
  → Create app/api/auth/[...nextauth]/route.ts — use the code from Section 5
  → Create middleware.ts in the project root — use the code from Section 5

STEP 3 — Generate NEXTAUTH_SECRET
  → In terminal: openssl rand -base64 32
  → Copy the output into .env.local as NEXTAUTH_SECRET

STEP 4 — Set up Google OAuth (optional but recommended)
  a) Go to https://console.cloud.google.com
  b) Create a new project (or select existing)
  c) Go to "APIs & Services" → "Credentials"
  d) Click "Create Credentials" → "OAuth client ID"
  e) Application type: "Web application"
  f) Add authorized redirect URIs:
     - http://localhost:3000/api/auth/callback/google   (development)
     - https://your-domain.com/api/auth/callback/google (production)
  g) Copy Client ID and Client Secret into .env.local

STEP 5 — Set up GitHub OAuth (optional)
  a) Go to https://github.com/settings/developers
  b) Click "New OAuth App"
  c) Homepage URL: http://localhost:3000
  d) Authorization callback URL: http://localhost:3000/api/auth/callback/github
  e) Copy Client ID and Client Secret into .env.local

STEP 6 — Create the registration endpoint
  → Create app/api/auth/register/route.ts — use the code from Section 5

STEP 7 — Extend the session types (TypeScript)
  → Create types/next-auth.d.ts:

    import { DefaultSession } from "next-auth";

    declare module "next-auth" {
      interface Session {
        user: {
          id: string;
        } & DefaultSession["user"];
      }
    }

STEP 8 — Use auth in your pages
  → Server Components:
    import { auth } from "@/lib/auth";
    const session = await auth();
    // session?.user?.id, session?.user?.email, etc.

  → Client Components:
    import { useSession } from "next-auth/react";
    const { data: session, status } = useSession();

  → Wrap your app in SessionProvider:
    // app/(dashboard)/layout.tsx
    import { SessionProvider } from "next-auth/react";

    export default function Layout({ children }) {
      return <SessionProvider>{children}</SessionProvider>;
    }

HOW AUTH FLOW WORKS:
  1. User hits /login → sees email/password form + Google/GitHub buttons
  2. Credentials login → POST to /api/auth/callback/credentials → bcrypt compare → JWT issued
  3. OAuth login → redirect to Google/GitHub → callback to /api/auth/callback/[provider] → JWT issued
  4. JWT stored as httpOnly cookie → sent with every request
  5. middleware.ts checks JWT on every page load → redirects to /login if missing
  6. API routes call auth() to get session → reject if no session
```

### Guide 4: Setting Up PostgreSQL Full-Text Search

```
HOW IT WORKS — CONCEPTS:

  tsvector = A column that stores a "searchable" version of your text.
             "The quick brown fox" → 'brown':3 'fox':4 'quick':2
             Words are normalized (lowered, stemmed) and positions are tracked.

  tsquery  = A search expression.
             "quick fox" → 'quick' & 'fox'
             The & means AND — both words must appear.

  ts_rank  = Scoring function. Returns a number (0-1) indicating how well
             a row matches the query. Used for ORDER BY.

  setweight = Assigns priority: 'A' (highest) > 'B' > 'C' > 'D'
              We give title weight 'A' and description weight 'B'
              so title matches rank higher.

  pg_trgm  = Extension for fuzzy matching. Splits text into trigrams:
             "hello" → {hel, ell, llo}
             similarity("hello", "helo") → 0.6 (high = similar)
             Catches typos that tsvector would miss.

HOW SEARCH WORKS IN PRIMER:

  1. When you create/update a prompt, PostgreSQL automatically updates the
     search_vector column (it's a GENERATED ALWAYS column — zero code needed).

  2. When a user searches, the API:
     a) Converts their query to tsquery format: "my prompt" → "my & prompt"
     b) Runs full-text search: WHERE search_vector @@ to_tsquery(...)
     c) Also runs fuzzy match: OR similarity(title, query) > 0.3
     d) Ranks results by ts_rank + similarity
     e) Returns sorted results

  3. The GIN index makes both operations fast even with thousands of prompts.

WHAT YOU NEED TO DO:

  1. Run the SQL migration from Section 4 (just two CREATE INDEX statements
     and one ALTER TABLE — takes 2 seconds)
  2. Use the search API route from Section 4 as-is
  3. That's it. No external search service, no syncing, no configuration.

LIMITATIONS (fine for hobby scale):
  - English stemming only by default (can add more languages)
  - No typo correction beyond trigram similarity
  - Search across version content requires a JOIN (slightly slower, still fast)
  - If you ever need instant-as-you-type search across 100k+ prompts,
    that's when you'd add Meilisearch
```

---

## Project Initialization

```bash
# Create the project
npx create-next-app@latest primer --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

cd primer

# Install dependencies
npm install prisma --save-dev
npm install @prisma/client
npm install next-auth@beta @auth/prisma-adapter
npm install bcryptjs
npm install -D @types/bcryptjs

# Initialize Prisma
npx prisma init

# Set up your .env.local with DATABASE_URL, NEXTAUTH_SECRET, etc.
# Copy the schema into prisma/schema.prisma
# Then:
npx prisma migrate dev --name init
npx prisma generate

# Start development
npm run dev
```

---

## File Structure (Final)

```
primer/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── prompts/...
│   │   ├── categories/...
│   │   ├── collections/...
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts
│   │   │   └── register/route.ts
│   │   ├── prompts/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── versions/route.ts
│   │   ├── categories/route.ts
│   │   ├── collections/route.ts
│   │   ├── tags/route.ts
│   │   ├── search/route.ts
│   │   └── export/route.ts
│   ├── globals.css
│   └── layout.tsx
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   └── utils.ts
├── components/
│   ├── ui/                          # Reusable UI components
│   ├── prompt-editor.tsx
│   ├── version-tabs.tsx
│   ├── command-palette.tsx
│   ├── sidebar.tsx
│   └── search-bar.tsx
├── types/
│   └── next-auth.d.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── middleware.ts
├── .env.local
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Future Additions (When You're Ready)

| Feature | What to Add | Effort |
|---------|------------|--------|
| Redis caching | Upstash Redis, cache hot queries | ~2 hours |
| File exports to cloud | Cloudflare R2 bucket | ~1 hour |
| Background jobs | BullMQ + Redis worker | ~3 hours |
| Prompt playground | API key storage + AI SDK calls | ~4 hours |
| Browser extension | Chrome extension + API endpoint | ~6 hours |
| Sharing/public links | Public prompt pages + OG meta | ~3 hours |