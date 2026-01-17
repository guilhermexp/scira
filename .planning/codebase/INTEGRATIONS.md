# External Integrations

**Last Updated:** 2026-01-17

## Overview

Scira integrates with 60+ external services across authentication, AI models, search, media, finance, maps, and infrastructure. Most services are optional and default to 'placeholder' for graceful degradation in self-hosted deployments.

## Authentication Providers

### OAuth Providers

#### GitHub OAuth
- **Purpose:** User authentication via GitHub
- **Configuration:**
  - `GITHUB_CLIENT_ID` - OAuth app client ID
  - `GITHUB_CLIENT_SECRET` - OAuth app client secret
- **Implementation:** `lib/auth.ts`
- **Status:** ✅ Required for authentication

#### Google OAuth
- **Purpose:** User authentication via Google
- **Configuration:**
  - `GOOGLE_CLIENT_ID` - OAuth client ID
  - `GOOGLE_CLIENT_SECRET` - OAuth client secret
- **Implementation:** `lib/auth.ts`
- **Status:** ⚠️ Optional (can use GitHub instead)

#### Twitter/X OAuth
- **Purpose:** User authentication via Twitter/X
- **Configuration:**
  - `TWITTER_CLIENT_ID` - OAuth client ID
  - `TWITTER_CLIENT_SECRET` - OAuth client secret
- **Implementation:** `lib/auth.ts`
- **Status:** ⚠️ Optional

#### Microsoft OAuth
- **Purpose:** User authentication via Microsoft
- **Configuration:**
  - `MICROSOFT_CLIENT_ID` - OAuth client ID
  - `MICROSOFT_CLIENT_SECRET` - OAuth client secret
- **Implementation:** `lib/auth.ts`
- **Status:** ⚠️ Optional

### Better Auth
- **Purpose:** Modern authentication framework
- **Version:** 1.4.10
- **Configuration:**
  - `BETTER_AUTH_SECRET` - Session secret (generated with `openssl rand -hex 32`)
  - `BETTER_AUTH_URL` - Application URL (e.g., `http://localhost:8931`)
- **Features:**
  - OAuth providers
  - Magic link email authentication
  - Session management with Redis cache
  - User account linking
- **Implementation:** `lib/auth.ts` (476 lines)
- **Status:** ✅ Required

## Database & Storage

### Neon PostgreSQL
- **Purpose:** Serverless PostgreSQL database
- **Configuration:**
  - `DATABASE_URL` - Connection string
- **Features:**
  - Direct HTTP connection via `@neondatabase/serverless`
  - Read replicas support (optional)
  - Drizzle ORM integration
- **Implementation:** `lib/db/index.ts`
- **Status:** ✅ Required

### Upstash Redis
- **Purpose:** Serverless Redis for caching
- **Configuration:**
  - `UPSTASH_REDIS_REST_URL` - Redis REST URL
  - `UPSTASH_REDIS_REST_TOKEN` - Authentication token
  - `REDIS_URL` - Standard Redis connection (alternative)
- **Features:**
  - Performance caching
  - Session caching
  - Query result caching
- **Implementation:** `lib/performance-cache.ts`
- **Status:** ⚠️ Optional (with fallback)

### Vercel Blob Storage
- **Purpose:** File storage
- **Configuration:**
  - `BLOB_READ_WRITE_TOKEN` - Access token
- **Implementation:** File upload endpoints
- **Status:** ⚠️ Optional

## AI Model Providers

### xAI (Grok)
- **Purpose:** Grok AI models (4, 4-fast, 3, 3-mini, 2 Vision)
- **Configuration:**
  - `XAI_API_KEY` - API key
- **Endpoints:**
  - US East: `https://us-east-1.api.x.ai/v1`
  - EU West: `https://eu-west-1.api.x.ai/v1`
- **Models:** 8 variants in `ai/providers.ts`
- **Implementation:** `ai/providers.ts` (lines 44-52, 195-288)
- **Status:** ⚠️ Optional (one AI provider required)

### OpenAI
- **Purpose:** GPT-5, GPT-4, O3, O4-mini, Codex models
- **Configuration:**
  - `OPENAI_API_KEY` - API key
- **Models:** 15+ variants including GPT-5.1, GPT-5.2, O3, O4-mini
- **Implementation:** `ai/providers.ts` (lines 82-98, 473-740)
- **Status:** ⚠️ Optional (one AI provider required)

### Google (Gemini)
- **Purpose:** Gemini 2.5 Pro/Flash models
- **Configuration:**
  - `GOOGLE_GENERATIVE_AI_API_KEY` - API key
- **Models:** Gemini 2.5 Flash, Gemini 2.5 Pro, Flash Lite
- **Implementation:** `ai/providers.ts` (lines 158-162, 1020-1082)
- **Status:** ⚠️ Optional

### Anthropic (Claude)
- **Purpose:** Claude AI models
- **Configuration:**
  - `ANTHROPIC_API_KEY` - API key
- **Models:** Claude Sonnet 4.5, Claude Haiku
- **Implementation:** `ai/providers.ts` (lines 154, 163, 1084-1097)
- **Status:** ⚠️ Optional

### Groq
- **Purpose:** Fast inference for Qwen, Llama, Mistral models
- **Configuration:**
  - `GROQ_API_KEY` - API key
- **Models:** Qwen, Llama, Kimi K2, and more
- **Implementation:** `ai/providers.ts` (lines 6, 67, 75, 100-101, 153)
- **Status:** ⚠️ Optional

### Other AI Providers
- **Cohere:** Command A models (`COHERE_API_KEY`)
- **Mistral:** Medium, Magistral variants (`MISTRAL_API_KEY`)
- **HuggingFace:** Various models (`HF_TOKEN`)
- **Novita AI:** Inference provider (`NOVITA_API_KEY`)
- **Anannas API:** DeepSeek models (`ANANNAS_API_KEY`)
- **Baseten:** Inference provider (`BASETEN_API_KEY`)

## Search & Web Crawling

### Exa AI
- **Purpose:** Semantic web search
- **Configuration:**
  - `EXA_API_KEY` - API key
- **Features:**
  - Semantic search
  - Content retrieval
  - Domain filtering
- **Implementation:** `lib/tools/web-search.ts`
- **Status:** ⚠️ Optional

### Tavily
- **Purpose:** General web search
- **Configuration:**
  - `TAVILY_API_KEY` - API key
- **Features:**
  - Web search
  - News search
  - Image search
- **Implementation:** `lib/tools/web-search.ts`
- **Status:** ⚠️ Optional (recommended for web search)

### Firecrawl
- **Purpose:** Web scraping and crawling
- **Configuration:**
  - `FIRECRAWL_API_KEY` - API key
- **Features:**
  - Web scraping
  - Content extraction
  - Sitemap crawling
- **Implementation:** `lib/tools/web-search.ts`
- **Status:** ⚠️ Optional

### Parallel Web API
- **Purpose:** Web search
- **Configuration:**
  - `PARALLEL_API_KEY` - API key
- **Implementation:** `lib/tools/web-search.ts`
- **Status:** ⚠️ Optional

## Social Media & Content

### X/Twitter Search
- **Purpose:** Search Twitter/X posts
- **Implementation:** `lib/tools/x-search.ts`
- **Features:**
  - Handles both x.com and twitter.com domains
  - Tweet content extraction
- **Status:** ⚠️ Optional

### Reddit Search
- **Purpose:** Search Reddit posts and comments
- **Implementation:** `lib/tools/reddit-search.ts`
- **Status:** ⚠️ Optional

### YouTube Search
- **Purpose:** Search YouTube videos
- **Configuration:**
  - `YT_ENDPOINT` - YouTube API endpoint
- **Implementation:** `lib/tools/youtube-search.ts`
- **Status:** ⚠️ Optional

### Semantic Scholar
- **Purpose:** Academic research paper search
- **Implementation:** `lib/tools/academic-search.ts`
- **Status:** ⚠️ Optional

## Memory & Knowledge Base

### Supermemory
- **Purpose:** Optional memory system for context persistence
- **Configuration:**
  - `SUPERMEMORY_API_KEY` - API key
- **Features:**
  - Document storage and retrieval
  - Connector integrations (Google Drive, Notion, OneDrive)
  - Semantic search across stored documents
- **Connectors:**
  - Google Drive (3,000 doc limit)
  - Notion (2,000 doc limit)
  - OneDrive (Coming Soon)
- **Implementation:**
  - `lib/tools/supermemory.ts`
  - `lib/tools/connectors-search.ts`
  - `lib/connectors.tsx`
- **Graceful Degradation:**
  ```typescript
  const SM_KEY = process.env.SUPERMEMORY_API_KEY;
  const SM_ENABLED = !!SM_KEY && SM_KEY !== 'placeholder';
  ```
- **Status:** ⚠️ Optional (disabled by default)

### Smithery API
- **Purpose:** MCP (Model Context Protocol) support
- **Configuration:**
  - `SMITHERY_API_KEY` - API key
- **Implementation:** `lib/tools/mcp-search.ts`
- **Status:** ⚠️ Optional

## Media & Entertainment

### TMDB (The Movie Database)
- **Purpose:** Movie and TV show data
- **Configuration:**
  - `TMDB_API_KEY` - API key
- **Features:**
  - Movie search
  - TV show search
  - Trending content
- **Implementation:**
  - `lib/tools/movie-tv-search.ts`
  - `lib/tools/trending-movies.ts`
  - `lib/tools/trending-tv.ts`
- **Status:** ⚠️ Optional

### ElevenLabs
- **Purpose:** Text-to-speech
- **Configuration:**
  - `ELEVENLABS_API_KEY` - API key
- **Status:** ⚠️ Optional

## Maps & Location

### Google Maps API
- **Purpose:** Mapping, geocoding, place search
- **Configuration:**
  - `GOOGLE_MAPS_API_KEY` - Server-side API key
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Client-side API key
- **Features:**
  - Geocoding (address ↔ coordinates)
  - Place search
  - Nearby places
- **Implementation:** `lib/tools/map-tools.ts`
- **Status:** ⚠️ Optional

### Mapbox
- **Purpose:** Map visualization
- **Configuration:**
  - `MAPBOX_ACCESS_TOKEN` - Server-side token
  - `NEXT_PUBLIC_MAPBOX_TOKEN` - Client-side token
- **Status:** ⚠️ Optional

### TripAdvisor API
- **Purpose:** Travel and location data
- **Configuration:**
  - `TRIPADVISOR_API_KEY` - API key
- **Status:** ⚠️ Optional

## Weather & Aviation

### OpenWeather API
- **Purpose:** Weather data and forecasts
- **Configuration:**
  - `OPENWEATHER_API_KEY` - API key
- **Implementation:** `lib/tools/weather.ts`
- **Status:** ⚠️ Optional

### Amadeus API
- **Purpose:** Flight tracking and aviation data
- **Configuration:**
  - `AMADEUS_API_KEY` - API key
  - `AMADEUS_API_SECRET` - API secret
- **Implementation:** `lib/tools/flight-tracker.ts`
- **Status:** ⚠️ Optional

### Aviation Stack API
- **Purpose:** Aviation data
- **Configuration:**
  - `AVIATION_STACK_API_KEY` - API key
- **Status:** ⚠️ Optional

## Finance & Cryptocurrency

### CoinGecko API
- **Purpose:** Cryptocurrency data and charts
- **Configuration:**
  - `COINGECKO_API_KEY` - API key
- **Features:**
  - Coin price data
  - OHLC charts
  - Contract-based lookup
- **Implementation:** `lib/tools/crypto-tools.ts`
- **Status:** ⚠️ Optional

### yfinance
- **Purpose:** Stock market data
- **Features:**
  - Stock price charts
  - Company financials
  - Earnings data
- **Implementation:** `lib/tools/stock-chart.ts` (39KB, complex)
- **Status:** ⚠️ Optional (integrated without API key)

## Code Execution

### Daytona SDK
- **Purpose:** Python code execution sandbox
- **Configuration:**
  - `DAYTONA_API_KEY` - API key
  - `SNAPSHOT_NAME` - Snapshot identifier (in `lib/constants.ts`)
- **Features:**
  - Execute Python code safely
  - Generate charts and visualizations
  - Return stdout, stderr, and artifacts
- **Target:** US region
- **Implementation:** `lib/tools/code-interpreter.ts`
- **Status:** ⚠️ Optional

## Email & Communication

### Resend
- **Purpose:** Transactional email delivery
- **Configuration:**
  - `RESEND_API_KEY` - API key
- **Features:**
  - Magic link authentication emails
  - Password reset emails
  - Lookout completion notifications
- **Email Templates:** `components/emails/`
- **Implementation:** `lib/email.ts`
- **Graceful Degradation:**
  ```typescript
  const canSendEmails = !!process.env.RESEND_API_KEY
    && process.env.RESEND_API_KEY !== 'placeholder';
  ```
- **Status:** ⚠️ Optional (required for magic link auth)

## Payment Processing (Disabled in Self-Hosted)

### Polar
- **Purpose:** Payment processing (DISABLED)
- **Configuration:**
  - `POLAR_ACCESS_TOKEN` - Access token
  - `POLAR_WEBHOOK_SECRET` - Webhook secret
- **Implementation:** `lib/auth.ts` (lines 155-177, commented out)
- **Status:** ❌ Disabled for self-hosting

### DodoPayments
- **Purpose:** Payment processing for Indian users (DISABLED)
- **Configuration:**
  - `DODO_PAYMENTS_API_KEY` - API key
  - `DODO_PAYMENTS_WEBHOOK_SECRET` - Webhook secret
  - `DODO_SUBSCRIPTION_DURATION_MONTHS` - Subscription duration
- **Implementation:** `lib/auth.ts` (lines 178-293, commented out)
- **Status:** ❌ Disabled for self-hosting

## Deployment & Infrastructure

### Vercel
- **Purpose:** Primary deployment platform
- **Services:**
  - Vercel Analytics (auto-integrated)
  - Vercel Speed Insights
  - Vercel Edge Config
  - Vercel Functions
  - Vercel Blob Storage
- **Configuration:** `next.config.ts`
- **Status:** ⚠️ Optional (self-hosted capable)

### Docker
- **Purpose:** Container deployment
- **Configuration:** `Dockerfile`
- **Status:** ⚠️ Optional (self-hosted alternative)

### Upstash QStash
- **Purpose:** Serverless task queuing
- **Configuration:**
  - `QSTASH_TOKEN` - Authentication token
- **Features:**
  - Scheduled tasks
  - Background jobs
  - Cron jobs
- **Implementation:** Task scheduling in `app/actions.ts`
- **Status:** ⚠️ Optional

## Analytics & Monitoring

### PostHog
- **Purpose:** Product analytics
- **Configuration:**
  - `NEXT_PUBLIC_POSTHOG_KEY` - API key
  - `NEXT_PUBLIC_POSTHOG_HOST` - Host URL
- **Status:** ⚠️ Optional

### Vercel Analytics
- **Purpose:** Auto-integrated web analytics
- **Status:** ⚠️ Optional (auto-enabled on Vercel)

## Integration Status Summary

| Category | Total | Required | Optional | Disabled |
|----------|-------|----------|----------|----------|
| **Authentication** | 5 | 1 | 4 | 0 |
| **Database/Storage** | 3 | 1 | 2 | 0 |
| **AI Models** | 10 | 1* | 9 | 0 |
| **Search** | 4 | 0 | 4 | 0 |
| **Social/Content** | 4 | 0 | 4 | 0 |
| **Memory** | 2 | 0 | 2 | 0 |
| **Media** | 2 | 0 | 2 | 0 |
| **Maps/Location** | 3 | 0 | 3 | 0 |
| **Weather/Aviation** | 3 | 0 | 3 | 0 |
| **Finance/Crypto** | 2 | 0 | 2 | 0 |
| **Code Execution** | 1 | 0 | 1 | 0 |
| **Email** | 1 | 0 | 1 | 0 |
| **Payments** | 2 | 0 | 0 | 2 |
| **Infrastructure** | 3 | 0 | 3 | 0 |
| **Analytics** | 2 | 0 | 2 | 0 |
| **TOTAL** | **47** | **3** | **42** | **2** |

*At least one AI provider required

## Required vs Optional Services

### Minimum Required for Basic Functionality

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
BETTER_AUTH_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# At least one AI provider (choose one or more)
XAI_API_KEY=...          # OR
OPENAI_API_KEY=...       # OR
ANTHROPIC_API_KEY=...    # OR
GROQ_API_KEY=...         # etc.
```

### Recommended for Full Features

```env
# Required (above) +

# Web Search
TAVILY_API_KEY=...       # Recommended for web search

# Email (if using magic link auth)
RESEND_API_KEY=...
```

### All Other Services

Default to `'placeholder'` and gracefully degrade when not configured.
