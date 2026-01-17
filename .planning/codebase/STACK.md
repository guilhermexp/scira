# Technology Stack

**Last Updated:** 2026-01-17

## Core Technologies

### Languages
- **TypeScript 5.9.3** - Primary language with strict mode enabled
- **JavaScript** - React/JSX components
- **Python** - Code interpreter support via Daytona sandbox
- **SQL** - PostgreSQL via Drizzle ORM

### Runtime & Package Management
- **Node.js** - Runtime environment
- **pnpm 10.18.3** - Package manager (pinned version)
- **Target:** ES2022+

## Frontend Stack

### Framework & UI
- **Next.js 16.0.2** - Full-stack React framework with App Router
- **React 19.2.0** - UI library with server components
- **Tailwind CSS 4.1.17** - Utility-first CSS framework
- **Shadcn/UI** - Component library built on Radix UI primitives

### UI Components & Libraries
- **Radix UI** - Headless UI components (46+ packages)
- **Lucide React 0.553.0** - Icon library
- **Framer Motion 12.23.24** - Animation library
- **React Hook Form 7.66.0** - Form management
- **Zod 4.1.12** - Schema validation

### Charting & Visualization
- **ECharts 5.6.0** - Interactive charts
- **Recharts 2.15.4** - React charting library

## Backend Stack

### Database & ORM
- **Neon PostgreSQL** - Serverless PostgreSQL
- **Drizzle ORM 0.44.7** - Type-safe ORM
- **Direct Neon connection** - No connection pooling in dev

### Authentication
- **Better Auth 1.4.10** - Modern authentication library
- **OAuth Providers:**
  - GitHub OAuth
  - Google OAuth
  - Twitter/X OAuth
  - Microsoft OAuth
- **Magic Link** - Email-based authentication

### Caching & Performance
- **Upstash Redis** - Serverless Redis for caching (optional)
- **Redis** - Standard Redis support (optional)
- **TanStack Query** - Client-side data caching

## AI & ML Integration

### AI SDK
- **Vercel AI SDK 6.0.5** - Core AI framework
- **AI SDK Providers (all v3.x):**
  - @ai-sdk/openai ^3.0.2
  - @ai-sdk/google ^3.0.2
  - @ai-sdk/anthropic ^3.0.2
  - @ai-sdk/xai ^3.0.3
  - @ai-sdk/groq ^3.0.2
  - @ai-sdk/mistral ^3.0.2
  - @ai-sdk/cohere ^3.0.2
  - @ai-sdk/openai-compatible ^2.0.2
  - @ai-sdk/gateway ^3.0.4
  - @ai-sdk/react ^3.0.5

### AI Model Providers
- **xAI** - Grok 4, Grok 3, Grok 2 Vision
- **OpenAI** - GPT-5 family, O3, O4-mini, Codex
- **Google** - Gemini 2.5 Pro/Flash
- **Anthropic** - Claude 4 Sonnet, Haiku
- **Groq** - Qwen, Llama, Kimi K2
- **Cohere** - Command A
- **Mistral** - Medium, Magistral variants
- **HuggingFace** - Various models
- **Novita AI** - Inference provider
- **Anannas API** - DeepSeek models
- **Baseten** - Inference provider

## External Services & APIs

### Search & Web Crawling
- **Exa AI** - Semantic web search
- **Tavily** - General web search
- **Firecrawl** - Web scraping
- **Parallel Web API** - Web search

### Social Media & Content
- **X/Twitter Search** - Social media search
- **Reddit Search** - Reddit content search
- **YouTube Search** - Video search
- **Semantic Scholar** - Academic research

### Memory & Knowledge
- **Supermemory SDK** - Optional memory system
- **Smithery API** - MCP support

### Media & Entertainment
- **TMDB API** - Movie/TV data
- **ElevenLabs** - Text-to-speech

### Location & Maps
- **Google Maps API** - Mapping and geocoding
- **Mapbox** - Map visualization
- **TripAdvisor API** - Travel data

### Weather & Aviation
- **OpenWeather API** - Weather data
- **Amadeus API** - Flight tracking
- **Aviation Stack API** - Aviation data

### Finance & Crypto
- **CoinGecko API** - Cryptocurrency data
- **yfinance** - Stock market data

### Code Execution
- **Daytona SDK** - Python sandbox execution

### Email & Communication
- **Resend** - Email delivery service

### Storage
- **Vercel Blob Storage** - File storage

## Development Tools

### Code Quality
- **ESLint 9.39.1** - Linting
- **Prettier 3.6.2** - Code formatting
- **Knip** - Dead code detection
- **TypeScript strict mode** - Type safety

### Build & Deployment
- **Vercel** - Primary deployment platform
- **Docker** - Container support
- **Standalone build** - Self-hosted capable

### Analytics & Monitoring
- **PostHog** - Product analytics
- **Vercel Analytics** - Auto-integrated
- **Upstash QStash** - Task queuing
- **Upstash Ratelimit** - Rate limiting

## Payment Processing (Disabled in Self-Hosted)

- **Polar** - Payment processor (commented out)
- **DodoPayments** - Payment processor (commented out)

## Configuration

### Environment Management
- **T3 Stack pattern** - Type-safe environment variables
- **Zod validation** - Runtime environment validation
- **Graceful degradation** - Optional services default to 'placeholder'

## Key Version Requirements

```json
{
  "node": "Latest LTS (via pnpm)",
  "pnpm": "10.18.3",
  "typescript": "5.9.3",
  "next": "16.0.2",
  "react": "19.2.0"
}
```

## Custom Configuration

- **Development Port:** 8931 (not default 3000)
- **Self-Hosted Mode:** All payment/subscription features disabled
- **Optional Services:** Most external APIs default to 'placeholder'
