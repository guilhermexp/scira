# Architecture

**Last Updated:** 2026-01-17

## Overview

Scira is a **Next.js 15 App Router monolithic architecture** with clear separation between server-side operations, client-side UI, and core business logic. The application is designed for self-hosting with graceful degradation for optional services.

## Architecture Pattern

- **Framework:** Next.js 15 (App Router) - Full-stack framework
- **Deployment:** Standalone output, self-hosted capable
- **Type Safety:** TypeScript with strict mode enabled
- **State Management:** React Context + TanStack Query
- **UI Framework:** React 19 with Shadcn/UI components

## Conceptual Layers

### 1. Presentation Layer (`/components`, `/app`)

React components using Shadcn/UI and Lucide icons.

**Key Components:**

- `chat-interface.tsx` - Main chat UI
- `extreme-search.tsx`, `crypto-charts.tsx`, `flight-tracker.tsx` - Feature-specific components
- `message-parts/` - Message rendering components (2,343 lines)
- `dialogs/` - Modal dialogs
- `ui/` - Base UI components (49 Shadcn components)

**Size Concerns:**

- `ui/form-component.tsx` - 3,490 lines (model switcher)
- `message-parts/index.tsx` - 2,343 lines (tool rendering)
- `interactive-stock-chart.tsx` - 2,420 lines (chart visualization)

### 2. API Layer (`/app/api`)

Route handlers for server-to-client communication.

**Key Routes:**

- `app/api/search/route.ts` - Main chat/search endpoint with streaming
- `app/api/search/[id]/stream/route.ts` - Stream resumption
- `app/api/auth/[...all]/route.ts` - Better Auth integration
- `app/api/upload/route.ts` - File upload handling
- `app/api/transcribe/route.ts` - Audio transcription
- `app/api/lookout/route.ts` - Alert monitoring
- `app/api/xql/route.ts` - Query language endpoint

### 3. Server Actions Layer (`/app/actions.ts`)

'use server' marked async functions for client-to-server mutations (2,661 lines).

**Categories:**

- **Auth:** `getCurrentUser()`, `getLightweightUser()`
- **Chat CRUD:** `getChatsByUserId()`, `deleteChatById()`, `updateChatVisibilityById()`
- **Messages:** `deleteMessagesByChatIdAfterTimestamp()`
- **Custom Instructions:** Create, update, delete
- **Lookout Management:** Create, update, delete, check status
- **Memory/Connectors:** Sync, list, delete connections
- **Geolocation:** `getUserCountryCode()`

### 4. Business Logic Layer (`/lib`)

Core utilities and services.

**Structure:**

- **Authentication:** `lib/auth.ts` (476 lines), `lib/auth-utils.ts`, `lib/auth-client.ts`
- **Database:** `lib/db/schema.ts`, `lib/db/queries.ts` (600+ lines), `lib/db/chat-queries.ts`
- **Tools/Integrations:** `lib/tools/` (25 tool files)
- **Subscription/Payments:** `lib/subscription.ts` (DodoPayments, Polar - disabled in self-hosted)
- **User Data:** `lib/user-data.ts`, `lib/user-data-server.ts`
- **Utilities:** `lib/utils.ts`, `lib/constants.ts`, `lib/errors.ts`, `lib/parser.ts`
- **Performance:** `lib/performance-cache.ts` (Upstash Redis caching - optional)
- **Rate Limiting:** `lib/rate-limit.ts`
- **Email:** `lib/email.ts` (Resend integration)
- **Connectors:** `lib/connectors.tsx` (Google Drive, Notion, OneDrive via Supermemory)

### 5. AI/Model Layer (`/ai/providers.ts`)

Multi-provider AI model configuration using Vercel AI SDK.

**Supported Providers:**

- xAI (Grok models: 4, 4-fast, 3, 3-mini, Code)
- OpenAI (GPT-5 family, O3, O4-mini, etc.)
- Google (Gemini 2.5 Flash/Pro via gateway)
- Anthropic (Claude models)
- Groq (Qwen, Llama, Mistral variants)
- Mistral, Cohere, HuggingFace
- Custom OpenAI-compatible (Novita, Anannas, Baseten)

**Configuration:** 100+ model configurations with reasoning support

### 6. Tool System (`/lib/tools/`)

Vercel AI SDK `tool()` pattern with 25 tools exported.

**Tool Categories:**

- **Search:** webSearchTool, xSearchTool, academicSearchTool, redditSearchTool, youtubeSearchTool, extremeSearchTool, mcpSearchTool
- **Finance:** stockChartTool, currencyConverterTool, coinDataTool, coinOhlcTool
- **Entertainment:** movieTvSearchTool, trendingMoviesTool, trendingTvTool
- **Utilities:** weatherTool, datetimeTool, textTranslateTool, greetingTool
- **Maps & Travel:** findPlaceOnMapTool, nearbyPlacesSearchTool, flightTrackerTool
- **Code & Memory:** codeInterpreterTool, codeContextTool, createMemoryTools, createConnectorsSearchTool
- **Retrieve:** retrieveTool (webpage content extraction)

### 7. Data Layer (`/lib/db`)

PostgreSQL via Neon + Drizzle ORM.

**Schema Tables:**

- user, session, account, verification
- chat, message, stream
- extremeSearchUsage, messageUsage
- customInstructions, payment, lookout, subscription

**Query Functions:** 90+ database operations in `queries.ts`

**Connection:** Direct Neon connection (no Upstash pooling in dev)

### 8. Authentication Layer

- **Provider:** Better Auth (GitHub, Google, Twitter OAuth)
- **Magic Link:** Email-based authentication
- **Session:** Token-based with Redis cache
- **Subscription Integration:** Polar, DodoPayments (both disabled in self-hosted fork)

## Data Flow & Request Lifecycle

### Chat Request Flow

1. User types query → `ChatInterface` component (client)
2. Submits via form → Server Action or `useChat` hook from Vercel AI SDK
3. Request → `POST /api/search` (Route Handler)
4. Authentication check via Better Auth session
5. Rate limit check via `unauthenticatedRateLimit()` or user-based limits
6. Tool selection & execution (auto-routing based on user query)
7. AI model inference via Vercel AI SDK's `streamText()`
8. Streaming response via `createUIMessageStream()` with `JsonToSseTransformStream`
9. Messages saved to DB via `saveMessages()` after completion
10. Client receives streamed chunks and renders in real-time

### Tool Execution Pattern

1. User query analyzed by AI
2. Tool matched from available tools object
3. Tool executed with validated Zod parameters
4. Results processed and returned to AI
5. AI synthesizes final response with citations

### Authentication Flow

1. User clicks OAuth provider button → Better Auth endpoint
2. OAuth callback → Account linked/created in DB
3. Session token issued and stored in HttpOnly cookie
4. Subsequent requests include session cookie
5. `getUser()` / `getLightweightUser()` retrieve user from DB or cache

## Key Design Patterns

### 1. Tool System Pattern

```typescript
export const webSearchTool = tool({
  description: '...',
  parameters: z.object({
    /* Zod schema */
  }),
  execute: async ({ param1, param2 }) => {
    /* implementation */
  },
});
```

### 2. Server Actions Pattern

```typescript
'use server';
export async function getCurrentUser() {
  return await getComprehensiveUserData();
}
```

### 3. Graceful Degradation Pattern

Optional API keys default to 'placeholder', features check if enabled before execution:

```typescript
const SM_KEY = process.env.SUPERMEMORY_API_KEY;
const SM_ENABLED = !!SM_KEY && SM_KEY !== 'placeholder';
```

### 4. Caching Pattern

- Performance cache: `lib/performance-cache.ts` (Upstash Redis with fallback)
- Query caching: Drizzle ORM's `.$withCache()` method
- React Query: Managed in `app/providers.tsx` with 30-second stale time

### 5. Streaming Pattern (Vercel AI SDK)

- Uses `streamText()` for model streaming
- `createUIMessageStream()` for tool results
- `JsonToSseTransformStream` for transport
- Resumable streams via `createResumableStreamContext()`

### 6. Database Query Pattern

```typescript
export async function getUser(email: string): Promise<User[]> {
  return await db.select().from(user).where(eq(user.email, email)).limit(1).$withCache();
}
```

## Module Boundaries

### Authentication Boundary

- `lib/auth.ts` → Better Auth initialization
- `lib/auth-utils.ts` → Server-side auth utilities
- `lib/auth-client.ts` → Client-side auth helpers
- `app/api/auth/[...all]/route.ts` → Auth endpoint handling
- Isolated from tools and search logic

### Search/Tool Boundary

- `app/api/search/route.ts` → Main orchestrator
- `lib/tools/` → Individual tool implementations
- `ai/providers.ts` → Model configuration
- Tools are composed at request time

### Database Boundary

- `lib/db/schema.ts` → Schema definitions only
- `lib/db/queries.ts` → All database operations
- `lib/db/index.ts` → Neon connection
- Centralized access pattern prevents direct DB calls elsewhere

### Caching Boundary

- `lib/performance-cache.ts` → Upstash Redis wrapper with fallback
- Used by queries for result caching
- Optional dependency (graceful degradation)

### UI Component Boundary

- `/components` → Pure UI, no business logic
- `/app` → Page layouts and route logic
- Clear separation prevents tightly coupled components

## Entry Points

### Application Entry Points

- `app/layout.tsx` - Root layout with providers (Metadata, Fonts, Theme)
- `app/providers.tsx` - Context providers (QueryClient, Theme, UserContext, DataStream)
- `app/(search)/page.tsx` - Main search page with `ChatInterface`
- `app/(auth)/sign-in/page.tsx`, `app/(auth)/sign-up/page.tsx` - Auth pages
- `app/settings/page.tsx` - User settings
- `next.config.ts` - Next.js configuration (port 8931, security headers)
- `package.json` - Entry script: `npm run dev` (port 8931)

### API Entry Points

- `app/api/search/route.ts` - Main streaming chat/search endpoint
- `app/api/auth/[...all]/route.ts` - Better Auth routes
- `app/api/upload/route.ts` - File uploads

### Server Actions Entry Point

- `app/actions.ts` - All server-side mutations

## Self-Hosting Modifications

As per `CLAUDE.md`, this fork has been modified for self-hosting:

- **Subscription checks bypassed** in: `lib/subscription.ts`, `lib/auth.ts`
- **Payment integrations disabled:** Polar, DodoPayments plugins commented out
- **Rate limits unlimited** for authenticated users
- **Environment variables** default to 'placeholder' for optional features
- **Database:** Direct Neon connection (no Upstash caching in free tier)

## Performance Optimizations

- Dynamic imports for heavy components
- React.memo for expensive renders
- Streaming responses (no full response buffering)
- Request-level caching with Upstash
- Resumable streams for interrupted connections
- Query result caching with Drizzle

## Security Considerations

- TypeScript strict mode for type safety
- Zod validation for all inputs
- Better Auth for session management
- HttpOnly cookies for session tokens
- Rate limiting on unauthenticated requests
- Environment variable validation with T3 Stack pattern
