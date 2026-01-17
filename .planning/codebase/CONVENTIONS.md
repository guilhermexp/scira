# Code Conventions

**Last Updated:** 2026-01-17

## Code Style & Formatting

### Prettier Configuration

From `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 120,
  "tabWidth": 2,
  "useTabs": false
}
```

**Key Rules:**
- Semicolons enabled
- Single quotes for strings
- Trailing commas everywhere
- Max line width: 120 characters
- 2-space indentation
- Spaces (not tabs)

### ESLint Configuration

From `.eslintrc.json`:

```json
{
  "extends": ["next/core-web-vitals"]
}
```

**Minimal config** - relies on Next.js core web vitals rules.

### TypeScript Configuration

From `tsconfig.json`:

- **Target:** ESNext
- **Strict mode:** Enabled (`"strict": true`)
- **Module resolution:** bundler
- **Path aliases:** `@/*` maps to root directory

### Available Scripts

```bash
npm run lint      # ESLint checking
npm run fix       # Prettier formatting
npm run knip      # Unused import detection
npm run dev       # Development server (port 8931)
npm run build     # Production build
```

## Naming Conventions

### File Naming

**Components:**
- React components: PascalCase or kebab-case
  - Examples: `ChatInterface.tsx`, `chat-interface.tsx`
- UI components (Shadcn): lowercase kebab-case
  - Examples: `button.tsx`, `dialog.tsx`, `accordion.tsx`

**Utilities & Services:**
- kebab-case for all utility files
  - Examples: `auth-client.ts`, `auth-utils.ts`, `performance-cache.ts`

**Hooks:**
- kebab-case with `use-` prefix
  - Examples: `use-cached-user-data.tsx`, `use-local-storage.tsx`

**Contexts:**
- kebab-case with `-context` suffix
  - Examples: `user-context.tsx`, `language-context.tsx`

**API Routes:**
- `route.ts` for route handlers
- Organized by feature directories

**Database:**
- `schema.ts` for Drizzle schemas
- `queries.ts` for database operations
- `[feature]-queries.ts` for feature-specific queries

**Tools:**
- kebab-case in `lib/tools/`
  - Examples: `web-search.ts`, `code-interpreter.ts`, `extreme-search.ts`

### Variable & Function Naming

**Constants:**
```typescript
const DEFAULT_MODEL = 'scira-default';
const SEARCH_LIMITS = { free: 10, pro: 100 };
const PRICING = { monthly: 999 };
```

**Boolean Flags:**
```typescript
const isProUser = true;
const hasActiveSubscription = false;
const canSendEmails = !!process.env.RESEND_API_KEY;
const shouldCheckLimits = false;
```

**Event Handlers:**
```typescript
function handleOpenSettings() { }
function handleManualScroll() { }
function handleSubmit() { }
```

**Getters:**
```typescript
function getSearchGroups() { }
function getWebSearchDescription() { }
function getImageUrl() { }
```

**Setters/Updaters:**
```typescript
function setSelectedModel() { }
function updateChatVisibilityById() { }
```

**Database Queries:**
```typescript
function getChatsByUserId() { }
function deleteChatById() { }
function createLookout() { }
function updateLookoutStatus() { }
```

### Type & Interface Naming

**Interfaces:**
Use `interface` for object shapes in React components:

```typescript
interface ChatInterfaceProps {
  initialMessages?: Message[];
  chatId?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
}
```

**Types:**
Use `type` for unions, aliases, and complex types:

```typescript
type SearchGroupId = 'web' | 'academic' | 'video' | 'social';
type ErrorCode = `${ErrorType}:${Surface}`;
type ConnectorProvider = 'google-drive' | 'notion' | 'onedrive';
```

**Exported Types:**
PascalCase for all exported types:

```typescript
export type ComprehensiveUserData = { ... };
export type ChatMessage = { ... };
export interface ToolResult { ... }
```

## Code Organization

### Import Organization

From `app/actions.ts`:

```typescript
// 1. Server directive (if applicable)
'use server';

// 2. External imports (organized by package)
import { geolocation } from '@vercel/functions';
import { serverEnv } from '@/env/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';

// 3. Local imports (organized by depth)
import { SearchGroupId } from '@/lib/utils';
import type { ModelMessage } from 'ai';
import { getChatsByUserId } from '@/lib/db/queries';
```

### Tool Pattern

Standard pattern from `lib/tools/`:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const myTool = tool({
  description: "What this tool does",
  parameters: z.object({
    query: z.string().describe("Parameter description"),
  }),
  execute: async ({ query }) => {
    // Implementation
    return result;
  },
});
```

### Server Action Pattern

From `app/actions.ts`:

```typescript
'use server';

export async function getCurrentUser() {
  return await getComprehensiveUserData();
}

export async function deleteChatById(chatId: string) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  return await db.delete(chat).where(eq(chat.id, chatId));
}
```

### Database Query Pattern

From `lib/db/queries.ts`:

```typescript
export async function getUser(email: string): Promise<User[]> {
  return await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1)
    .$withCache();
}
```

### Graceful Degradation Pattern

For optional features:

```typescript
const API_KEY = process.env.FEATURE_API_KEY;
const FEATURE_ENABLED = !!API_KEY && API_KEY !== 'placeholder';

export function featureFunction() {
  if (!FEATURE_ENABLED) {
    return null; // or throw error, or return empty result
  }
  // Normal implementation
}
```

## Comment & Documentation Style

### Inline Comments

```typescript
// Double slash with space for inline comments
const cleanTitle = (title: string) => {
  return title
    .replace(/\[.*?\]/g, '') // Remove [content]
    .replace(/\(.*?\)/g, '') // Remove (content)
    .trim();
};
```

### File Headers

```typescript
// /lib/utils.ts
```

### Function Documentation

JSDoc style (not universally used but available):

```typescript
/**
 * Send lookout completion email
 * @param to - Recipient email
 * @param chatTitle - Title of the chat
 * @param assistantResponse - AI response text
 * @param chatId - Chat ID for link
 */
export async function sendLookoutCompletionEmail({
  to,
  chatTitle,
  assistantResponse,
  chatId,
}: SendLookoutCompletionEmailParams) {
  // Implementation
}
```

### Console Logging

- Portuguese messages in some places: `console.warn('📬 RESEND_API_KEY não configurada...')`
- Emoji usage for visual distinction: ✅, ❌, 📬

### TODO/FIXME Comments

Not prominent in main codebase.

## Code Quality Tools

### Linting

```bash
npm run lint
```

- ESLint with Next.js core-web-vitals rules
- Configured in `.eslintrc.json`

### Formatting

```bash
npm run fix
```

- Prettier for consistent formatting
- Configured in `.prettierrc`

### Dead Code Detection

```bash
npm run knip
```

- Detects unused imports, exports, and files
- Helps keep codebase clean

## API Patterns

### Route Naming

- Route structure follows Next.js App Router conventions
- `/api/search`, `/api/auth/[...all]`

### Tool Naming

- `${feature}Tool` suffix
- Examples: `stockChartTool`, `webSearchTool`, `extremeSearchTool`

### Server Action Naming

- Plain verb/noun pattern
- Examples: `getCurrentUser()`, `deleteChat()`, `updateChatVisibilityById()`

## Error Handling

### Custom Error Classes

From `lib/errors.ts`:

```typescript
export class ChatSDKError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ChatSDKError';
  }

  toResponse() {
    return Response.json(
      { error: this.message, code: this.code },
      { status: this.statusCode }
    );
  }

  isAuthError() {
    return this.code.startsWith('auth:');
  }
}
```

## Best Practices

### Type Safety

- Use TypeScript strict mode
- Avoid `any` types where possible
- Use Zod for runtime validation

### Performance

- Use `React.memo` for expensive components
- Lazy load heavy components with dynamic imports
- Use Drizzle's `.$withCache()` for query caching

### Security

- Never hardcode API keys
- Use environment variables with validation
- Input validation with Zod schemas
- CSRF protection for state-changing operations
- HttpOnly cookies for session tokens

### Testing (Manual)

Per `CLAUDE.md` owner's prime directive:

> **NUNCA FALE QUE ALGO ESTA FUNCIONANDO, ANTES TER CERTEZA E DE TESTAR USANDO DEVTOOLS.**

**Manual testing workflow:**
1. Start dev server: `npm run dev`
2. Open browser to `http://localhost:8931`
3. Open DevTools (F12 or Cmd+Opt+I)
4. Test the feature:
   - Check Console for errors
   - Check Network tab for API calls
   - Verify Application state if applicable
5. Test edge cases and error scenarios
6. Only then claim success

## Git Workflow

### Branch Naming

- Feature: `feat/description`
- Fix: `fix/description`
- Chore: `chore/description`

### Commit Messages

Use conventional commits:

```
type(scope): description

Examples:
- feat(search): add MCP search integration
- fix(connectors): handle missing Supermemory API key
- refactor(ai): change default provider to Tavily
```

### Never

- Force push to main
- Commit without testing
- Include API keys or secrets

## Self-Hosting Conventions

As per `CLAUDE.md`, self-hosted modifications follow these patterns:

### Subscription Bypass Pattern

```typescript
// lib/subscription.ts
export async function isUserSubscribed(): Promise<boolean> {
  return true; // SELF-HOSTED: Always return true
}
```

### Optional Service Pattern

```typescript
// env/server.ts
SUPERMEMORY_API_KEY: z.string().default('placeholder'),

// lib/connectors.tsx
const SM_KEY = process.env.SUPERMEMORY_API_KEY;
const SM_ENABLED = !!SM_KEY && SM_KEY !== 'placeholder';
```

### Payment Plugin Pattern

```typescript
// lib/auth.ts (lines 155-293)
// COMMENTED OUT: Polar and DodoPayments plugins
// Kept for reference but not active in self-hosted fork
```
