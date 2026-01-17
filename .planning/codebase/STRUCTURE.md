# Directory Structure

**Last Updated:** 2026-01-17

## Overview

Scira follows the Next.js 15 App Router structure with clear separation between application code (`app/`), reusable components (`components/`), core business logic (`lib/`), and configuration files at the root.

## Root Directory

```
scira/
├── .planning/                    # GSD workflow planning documents
├── ai_changelog/                 # Change history documentation
├── ai_docs/                      # Technical documentation
├── ai_issues/                    # Bug tracking and issues
├── ai_research/                  # Research notes
├── ai_specs/                     # Feature specifications
├── app/                          # Next.js App Router (pages + API)
├── components/                   # React components
├── contexts/                     # React Context providers
├── drizzle/                      # Database migrations
├── env/                          # Environment variable validation
├── hooks/                        # Custom React hooks
├── lib/                          # Core business logic
├── public/                       # Static assets
├── ai/                           # AI model configurations
├── .env.local                    # Local environment variables
├── .env.production               # Production environment
├── .eslintrc.json                # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── CLAUDE.md                     # Development guidelines
├── drizzle.config.ts             # Drizzle ORM configuration
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── README.md                     # Project documentation
└── tsconfig.json                 # TypeScript configuration
```

## App Directory (`/app`)

Next.js 15 App Router with route groups and API routes.

```
app/
├── (auth)/                       # Auth route group
│   ├── sign-in/page.tsx          # Sign-in page
│   └── sign-up/page.tsx          # Sign-up page
├── (search)/                     # Search route group
│   └── page.tsx                  # Main search page
├── api/                          # API routes
│   ├── auth/                     # Authentication endpoints
│   │   └── [...all]/route.ts    # Better Auth catch-all
│   ├── search/                   # Search endpoints
│   │   ├── route.ts              # Main search endpoint
│   │   └── [id]/stream/route.ts # Stream resumption
│   ├── lookout/route.ts          # Alert monitoring
│   ├── raycast/route.ts          # Raycast integration
│   ├── transcribe/route.ts       # Audio transcription
│   ├── upload/route.ts           # File upload
│   └── xql/route.ts              # Query language
├── connectors/                   # Connector management
│   └── page.tsx                  # Connectors page
├── lookout/                      # Alert monitoring
│   └── page.tsx                  # Lookout page
├── search/[id]/                  # Individual chat page
│   └── page.tsx                  # Chat detail page
├── settings/                     # User settings
│   └── page.tsx                  # Settings page
├── xql/                          # Query language
│   └── page.tsx                  # XQL page
├── actions.ts                    # Server actions (2,661 lines)
├── layout.tsx                    # Root layout
├── manifest.ts                   # PWA manifest
└── providers.tsx                 # Context providers
```

**Key Characteristics:**
- Route groups `(auth)` and `(search)` for organization without URL segments
- API routes follow REST conventions
- Server actions centralized in `actions.ts`

## Components Directory (`/components`)

React components organized by type and feature (47 main files + 49 UI components).

```
components/
├── ui/                           # Shadcn/UI base components (49 files)
│   ├── accordion.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── form-component.tsx        # Model switcher (3,490 lines)
│   ├── input.tsx
│   ├── select.tsx
│   └── ...
├── core/                         # Custom core components
│   └── animated-beam.tsx         # Animations
├── dialogs/                      # Modal dialogs
│   ├── chat-settings-dialog.tsx
│   └── upgrade-dialog.tsx
├── emails/                       # Email templates
│   └── lookout-completion.tsx
├── message-parts/                # Message rendering
│   └── index.tsx                 # Tool output rendering (2,343 lines)
├── logos/                        # Brand logos
├── share/                        # Share functionality
├── auth-card.tsx                 # Authentication forms
├── chat-interface.tsx            # Main chat UI
├── crypto-charts.tsx             # Crypto visualization
├── extreme-search.tsx            # Research tool UI (2,408 lines)
├── flight-tracker.tsx            # Flight tracking
├── install-prompt.tsx            # PWA install
├── interactive-stock-chart.tsx   # Stock charts (2,420 lines)
├── markdown.tsx                  # Markdown renderer
└── ... (27 more feature components)
```

**Size Concerns:**
- Several large components (2,000+ lines) that could be split
- `ui/form-component.tsx` is particularly complex (3,490 lines)

## Library Directory (`/lib`)

Core business logic organized by domain (21 main files + subdirectories).

```
lib/
├── tools/                        # AI tools (27 files)
│   ├── academic-search.ts        # Semantic Scholar
│   ├── code-context.ts           # Code context tool
│   ├── code-interpreter.ts       # Python sandbox
│   ├── connectors-search.ts      # Connector search (16KB)
│   ├── crypto-tools.ts           # Crypto data
│   ├── currency-converter.ts     # Currency conversion
│   ├── datetime.ts               # Date/time utilities
│   ├── extreme-search.ts         # Research tool (29KB)
│   ├── flight-tracker.ts         # Flight tracking
│   ├── greeting.ts               # Greeting tool
│   ├── index.ts                  # Tool exports
│   ├── map-tools.ts              # Google Maps integration
│   ├── mcp-search.ts             # MCP search
│   ├── movie-tv-search.ts        # TMDB integration
│   ├── reddit-search.ts          # Reddit search
│   ├── retrieve.ts               # Web page retrieval
│   ├── stock-chart.ts            # Stock charts (39KB)
│   ├── supermemory.ts            # Memory system
│   ├── text-translate.ts         # Translation
│   ├── trending-movies.ts        # Trending movies
│   ├── trending-tv.ts            # Trending TV
│   ├── weather.ts                # Weather data
│   ├── web-search.ts             # Web search (Exa, Tavily, Firecrawl)
│   ├── x-search.ts               # X/Twitter search
│   └── youtube-search.ts         # YouTube search
├── db/                           # Database layer (6 files)
│   ├── chat-queries.ts           # Chat-specific queries (8KB)
│   ├── index.ts                  # DB client export
│   ├── queries.ts                # DB operations (28KB, 600+ lines)
│   └── schema.ts                 # Drizzle schema (10KB)
├── auth.ts                       # Better Auth setup (476 lines)
├── auth-client.ts                # Client-side auth
├── auth-utils.ts                 # Auth utilities
├── connectors.tsx                # Connector configs
├── constants.ts                  # Constants
├── discount.ts                   # Discount logic
├── email.ts                      # Email service (Resend)
├── errors.ts                     # Custom error classes
├── memory-actions.ts             # Memory operations
├── parser.ts                     # Response parsing
├── performance-cache.ts          # Redis caching
├── rate-limit.ts                 # Rate limiting
├── subscription.ts               # Subscription logic (modified for self-hosting)
├── types.ts                      # TypeScript types
├── user-data.ts                  # User data fetching
├── user-data-server.ts           # Server-side user data
└── utils.ts                      # Utility functions
```

**Key Characteristics:**
- Tools organized by feature/domain
- Database layer fully isolated in `db/`
- Auth spread across 3 files (setup, client, utilities)

## Hooks Directory (`/hooks`)

Custom React hooks (13 files).

```
hooks/
├── use-cached-user-data.tsx      # User data caching (modified for self-hosting)
├── use-chat-prefetch.ts          # Chat prefetching
├── use-github-stars.ts           # GitHub stars
├── use-local-storage.tsx         # Local storage
├── use-location.ts               # Geolocation
├── use-lookout-form.ts           # Lookout form management
├── use-lookouts.ts               # Alert monitoring
├── use-mobile.ts                 # Mobile detection
├── use-optimized-scroll.ts       # Scroll optimization
├── use-sse.ts                    # Server-sent events
├── use-user-data.ts              # User data fetching
└── ... (2 more hooks)
```

## Contexts Directory (`/contexts`)

React Context providers (2 files).

```
contexts/
├── language-context.tsx          # Language/i18n state
└── user-context.tsx              # User state management
```

## Environment Directory (`/env`)

Type-safe environment variable validation (2 files).

```
env/
├── client.ts                     # Client-side env validation
└── server.ts                     # Server-side env validation (65 env vars)
```

## AI Directory (`/ai`)

AI model provider configurations (1 file).

```
ai/
└── providers.ts                  # 100+ model configurations (1,165 lines)
```

## Documentation Directories

```
ai_changelog/                     # Change history
├── CHANGELOG_MAIN.md
├── CHANGELOG_PHASE1.md
└── ...

ai_docs/                          # Technical documentation
├── AI_PROVIDER_CHANGES.md
├── MCP_SEARCH_INTEGRATION.md
├── SUPERMEMORY_GRACEFUL_DEGRADATION.md
└── ...

ai_issues/                        # Bug tracking
ai_research/                      # Research notes
ai_specs/                         # Feature specifications
```

## Database Migrations (`/drizzle`)

```
drizzle/
└── migrations/                   # SQL migration files
    └── [timestamp]_[name].sql
```

## Public Assets (`/public`)

```
public/
├── .well-known/                  # Web manifest files
└── [static assets]
```

## Configuration Files (Root)

- `.env.local` - Local environment variables
- `.env.production` - Production environment (Vercel OIDC token)
- `.eslintrc.json` - ESLint config (Next.js core-web-vitals)
- `.prettierrc` - Prettier config (120 char width, single quotes)
- `CLAUDE.md` - Development guidelines for self-hosting
- `drizzle.config.ts` - Drizzle ORM configuration
- `next.config.ts` - Next.js config (port 8931, security headers, standalone build)
- `package.json` - Dependencies and scripts (pnpm 10.18.3)
- `tsconfig.json` - TypeScript config (strict mode, path aliases)

## Key Observations

### Large Files
Several files exceed 2,000 lines and could benefit from splitting:
- `components/ui/form-component.tsx` - 3,490 lines
- `app/actions.ts` - 2,661 lines
- `components/interactive-stock-chart.tsx` - 2,420 lines
- `components/extreme-search.tsx` - 2,408 lines
- `components/message-parts/index.tsx` - 2,343 lines

### Self-Hosting Modifications
Files modified for self-hosting (documented in `CLAUDE.md`):
- `lib/auth.ts` - Payment plugins commented out
- `lib/subscription.ts` - All functions return Pro status
- `hooks/use-cached-user-data.tsx` - Hardcoded Pro user
- `app/api/search/route.ts` - Hardcoded Pro status
- `env/server.ts` - Optional env vars with 'placeholder' defaults

### Tool Organization
The `lib/tools/` directory is well-organized by feature domain with 27 tools covering search, finance, entertainment, maps, code execution, and utilities.
