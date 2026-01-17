# Technical Debt & Concerns

**Last Updated:** 2026-01-17

## Overview

This document outlines technical debt, security concerns, performance issues, and documentation gaps identified in the Scira self-hosted codebase.

## Summary Table

| Category | Severity | Count | Impact |
|----------|----------|-------|--------|
| **Large Components** | Medium | 5 | Maintainability, IDE performance |
| **Error Handling** | High | 3 | Debugging difficulty, user experience |
| **Type Safety** | Medium | 4 | Refactoring risk, runtime errors |
| **Security Config** | Medium | 2 | Silent failures, fragile feature flags |
| **Performance** | Low | 2 | Database overhead, log pollution |
| **Documentation** | Medium | 3 | Developer onboarding, maintainability |

## Critical Issues (High Priority)

### 1. Hardcoded Pro Status Bypass

**Severity:** 🔴 High (Security/Architecture Risk)

**Files Affected:**
- `lib/subscription.ts` (lines 96-102, 105-149)
- `hooks/use-cached-user-data.tsx` (lines 36-40, 74-78)
- `app/api/search/route.ts` (line 159)

**Problem:**
All subscription functions hardcoded to return `true`/`active` status for self-hosting. No feature flags or runtime checks distinguish self-hosted vs. production deployment.

```typescript
// lib/subscription.ts
export async function isUserSubscribed(): Promise<boolean> {
  return true; // SELF-HOSTED: Always return true
}

// hooks/use-cached-user-data.tsx
const isProUser = true; // Hardcoded for self-hosting
```

**Risk:**
If code is accidentally deployed in non-self-hosted context, all users get Pro access without payment.

**Recommendation:**
Add explicit self-hosted mode detection:

```typescript
const IS_SELF_HOSTED = process.env.DEPLOYMENT_MODE === 'self-hosted';

export async function isUserSubscribed(): Promise<boolean> {
  if (IS_SELF_HOSTED) return true;
  // Original subscription logic
}
```

### 2. Payment Plugins Commented Out (Dead Code)

**Severity:** 🔴 High (Code Quality)

**Files Affected:**
- `lib/auth.ts` (lines 155-293)

**Problem:**
140+ lines of commented-out Polar and DodoPayments webhook handler code. If reactivated, lacks proper error recovery strategy.

**Concerns:**
- Dead code cluttering the codebase
- No structured logging if reactivated
- Inconsistent with self-hosted mission

**Recommendation:**
- Either remove entirely, OR
- Extract to separate conditional feature module with feature flag

### 3. Missing Error Handling in Critical Paths

**Severity:** 🔴 High (User Experience)

**Files Affected:**
- `lib/tools/extreme-search.ts` (lines 112-150)
- `lib/tools/extreme-search.ts` (lines 106-109)

**Problem:**
Silent failures in search tools make debugging difficult. No error context passed to user.

```typescript
// getContents() catches Exa errors silently
try {
  const result = await exa.getContents(urls);
} catch (error) {
  // Adds to failed list but no details logged
  failedUrls.push(...urls);
}

// searchWeb() returns empty array on error
try {
  return await search(query, category);
} catch (error) {
  return []; // User sees no results, no explanation
}
```

**Impact:**
- Users don't know why search failed
- Developers can't debug provider issues
- No visibility into API limits or errors

**Recommendation:**
Implement structured error logging:

```typescript
try {
  return await search(query, category);
} catch (error) {
  logger.error('Search failed', {
    provider: 'exa',
    category,
    error: error.message,
  });
  throw new SearchError('Search provider unavailable', { cause: error });
}
```

## Performance Concerns (Medium Priority)

### 4. Large Component Files

**Severity:** 🟡 Medium (Maintainability)

**Files with Size Concerns:**

| File | Lines | Issue |
|------|-------|-------|
| `components/ui/form-component.tsx` | 3,490 | Massive model switcher with complex state |
| `app/actions.ts` | 2,661 | All server actions in single file |
| `components/interactive-stock-chart.tsx` | 2,420 | Complex chart rendering |
| `components/extreme-search.tsx` | 2,408 | Research tool UI with timeline |
| `components/message-parts/index.tsx` | 2,343 | Huge switch statement for 40+ tool types |

**Impact:**
- Increased cognitive load
- Difficult to test in isolation
- IDE performance degradation
- Merge conflict risks

**Recommendation:**
Split into smaller, focused modules:

**Example: `form-component.tsx` →**
- `ModelSwitcher.tsx`
- `SearchProviderSelector.tsx`
- `AttachmentUploader.tsx`
- `EnhanceToggle.tsx`

**Example: `app/actions.ts` →**
- `actions/chat.ts`
- `actions/user.ts`
- `actions/lookout.ts`
- `actions/connectors.ts`

### 5. Potential N+1 Queries in Pagination

**Severity:** 🟡 Medium (Performance)

**File:** `lib/db/queries.ts` (lines 112-127)

**Problem:**
`getChatsByUserId()` performs extra SELECT for `startingAfter`/`endingBefore` cursor handling.

```typescript
// Line 113: Extra query to fetch cursor chat
const [selectedChat] = await db.select().from(chat)
  .where(eq(chat.id, startingAfter)).limit(1);

// Then uses timestamp for pagination
.where(lt(chat.createdAt, selectedChat.createdAt))
```

**Impact:**
Adds extra database round-trip per paginated request.

**Recommendation:**
Use cursor value directly or refactor to keyset pagination:

```typescript
// Option 1: Pass cursor timestamp directly
getChatsByUserId({ userId, afterTimestamp })

// Option 2: Use keyset pagination
.where(and(
  eq(chat.userId, userId),
  lt(chat.id, cursor)
))
.orderBy(desc(chat.id))
```

### 6. Unnecessary Console.logs in Production Code

**Severity:** 🟡 Medium (Code Quality)

**Files Affected:**
- `lib/db/queries.ts` (lines 145, 154, 262-281, 294-298)
- `lib/tools/extreme-search.ts` (lines 78, 94, 104, 113)
- `components/ui/form-component.tsx` (lines 401-412, 437)

**Problem:**
Console.logs will appear in production, polluting logs and potentially exposing sensitive information.

```typescript
// lib/db/queries.ts
console.log('✅ Cache hit for key:', cacheKey);
console.log('❌ Cache miss for key:', cacheKey);

// lib/tools/extreme-search.ts
console.log('🔍 Starting research for query:', query);
```

**Recommendation:**
Use environment-gated logging or structured logging system:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Starting research for query:', query);
}

// OR use structured logging
logger.debug('Starting research', { query, category });
```

## Type Safety Issues (Medium Priority)

### 7. Weakly Typed Tool Results

**Severity:** 🟡 Medium (Type Safety)

**Files Affected:**
- `lib/tools/extreme-search.ts` (line 64): `toolResults: any[]`
- `app/api/search/route.ts` (lines 531-570): `experimental_repairToolCall` with minimal typing

**Problem:**
`any` type defeats TypeScript's benefits and makes refactoring risky.

**Recommendation:**
Create proper TypeScript interfaces:

```typescript
interface ToolResult {
  toolName: string;
  result: unknown;
  error?: Error;
  metadata?: Record<string, unknown>;
}

interface WebSearchResult extends ToolResult {
  toolName: 'webSearch';
  result: {
    results: SearchResultItem[];
    query: string;
  };
}
```

### 8. Missing Input Validation in Search Tools

**Severity:** 🟡 Medium (Robustness)

**Files Affected:**
- `lib/tools/web-search.ts` (lines 64-69)
- `lib/tools/extreme-search.ts` (lines 77-110)

**Problem:**
Malformed inputs could cause API errors or unexpected behavior.

```typescript
// processDomains() filters empty strings but no format validation
const processDomains = (domains?: (string | null)[]): string[] | undefined => {
  if (!domains || domains.length === 0) return undefined;
  const processedDomains = domains
    .map((domain) => extractDomain(domain))
    .filter((domain) => domain.trim() !== '');
  return processedDomains.length === 0 ? undefined : processedDomains;
};
```

**Recommendation:**
Add Zod schema validation:

```typescript
const domainSchema = z.string().regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/);

const processDomains = (domains?: (string | null)[]): string[] | undefined => {
  if (!domains) return undefined;
  const validated = domains
    .map(d => domainSchema.safeParse(d))
    .filter(r => r.success)
    .map(r => r.data);
  return validated.length > 0 ? validated : undefined;
};
```

## Security Concerns (Medium Priority)

### 9. API Keys with Loose Validation

**Severity:** 🟡 Medium (Security)

**File:** `env/server.ts` (lines 15-62)

**Problem:**
48 environment variables with `.default('placeholder')`. No validation that required APIs are actually set in production.

```typescript
XAI_API_KEY: z.string().default('placeholder'),
OPENAI_API_KEY: z.string().default('placeholder'),
// ... 46 more
```

**Concerns:**
- `placeholder` string used as feature flag is fragile
- If any code path doesn't check for placeholder, API call will fail silently
- No validation that at least one AI provider is configured

**Recommendation:**
Add startup validation:

```typescript
const hasAIProvider = (key: string) => key && key !== 'placeholder';
const providers = [
  serverEnv.OPENAI_API_KEY,
  serverEnv.ANTHROPIC_API_KEY,
  serverEnv.GROQ_API_KEY,
  serverEnv.XAI_API_KEY,
];

if (!providers.some(hasAIProvider)) {
  throw new Error('At least one AI provider required (XAI, OpenAI, Anthropic, or Groq)');
}
```

### 10. Supermemory Graceful Degradation Not Fully Tested

**Severity:** 🟡 Medium (Robustness)

**Files Affected:**
- `lib/connectors.tsx` (lines 4-14)
- `app/api/search/route.ts` (lines 523-529)

**Problem:**
If Supermemory API key is invalid (not just placeholder), `getClient()` will throw during runtime, not startup.

```typescript
function getClient() {
  if (!SM_ENABLED) {
    throw new Error('Supermemory disabled');
  }
  return new Supermemory({ apiKey: SM_KEY! });
}
```

**Risk:**
Invalid API key causes runtime failure instead of graceful degradation.

**Recommendation:**
Validate credentials at startup:

```typescript
async function validateSupermemoryKey() {
  if (!SM_ENABLED) return;
  try {
    const client = new Supermemory({ apiKey: SM_KEY! });
    await client.ping(); // Test connection
  } catch (error) {
    console.warn('⚠️ Invalid Supermemory API key - feature disabled');
    SM_ENABLED = false;
  }
}
```

## Database & Persistence

### 11. Cached Query Timing But No Metrics

**Severity:** 🟢 Low (Observability)

**File:** `lib/db/queries.ts` (lines 145-154)

**Problem:**
Timing code for cache performance but no actual metrics collection or aggregation.

```typescript
const startTime = Date.now();
// ... query execution
const duration = Date.now() - startTime;
console.log(`Query took ${duration}ms`);
```

**Recommendation:**
Integrate with observability system or remove timing code:

```typescript
metrics.histogram('db.query.duration', duration, {
  cache: cacheHit ? 'hit' : 'miss',
  table: 'chat',
});
```

### 12. Missing Database Constraints

**Severity:** 🟢 Low (Data Integrity)

**File:** `lib/db/schema.ts` (not fully reviewed)

**Problem:**
Line 77-78 in queries.ts deletes messages before chat, but no foreign key cascade defined in schema.

**Concern:**
Potential for orphaned messages if delete order changes.

**Recommendation:**
Add ON DELETE CASCADE foreign key constraints:

```typescript
export const message = pgTable('message', {
  chatId: text('chat_id')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  // ...
});
```

## Documentation Gaps

### 13. Complex Tool Integration Undocumented

**Severity:** 🟡 Medium (Developer Experience)

**Files Affected:**
- `lib/tools/extreme-search.ts` (entire file - 29KB)
- `app/api/search/route.ts` (lines 157-283)

**Problem:**
No JSDoc comments explaining:
- The research plan generation flow
- Tool execution strategy
- Why certain operations run in parallel

**Impact:**
New developers won't understand critical operations structure.

**Recommendation:**
Add JSDoc blocks:

```typescript
/**
 * Executes a multi-step research plan with parallel tool execution
 *
 * @param query - User's research question
 * @param plan - Generated research plan with steps
 * @returns Array of tool results with citations
 *
 * Flow:
 * 1. Generate research plan (3-5 steps)
 * 2. Execute steps in parallel where possible
 * 3. Aggregate results and citations
 * 4. Return structured response
 */
export async function executeResearch(query: string, plan: ResearchPlan) {
  // ...
}
```

### 14. Self-Hosted Modifications Not Centrally Listed

**Severity:** 🟡 Medium (Maintainability)

**Problem:**
Multiple files have "SELF-HOSTED:" comments but no centralized checklist.

**Files Modified:**
- `lib/auth.ts` - Payment plugins commented
- `lib/subscription.ts` - All functions return Pro
- `hooks/use-cached-user-data.tsx` - Hardcoded Pro
- `app/api/search/route.ts` - Hardcoded Pro status
- `env/server.ts` - Optional env vars

**Recommendation:**
Add to `CLAUDE.md`:

```markdown
## Self-Hosted Modifications Checklist

- [ ] lib/auth.ts:155-293 - Payment plugins commented
- [ ] lib/subscription.ts:96-149 - Pro status hardcoded
- [ ] hooks/use-cached-user-data.tsx:36-40,74-78 - Pro flags hardcoded
- [ ] app/api/search/route.ts:159 - Pro status hardcoded
- [ ] env/server.ts - Optional APIs default to 'placeholder'
```

## Dependency & Configuration

### 15. No Health Check for Optional Services

**Severity:** 🟡 Medium (Developer Experience)

**File:** `env/server.ts`

**Problem:**
All optional services use placeholder defaults but no startup validation or health checks.

**Impact:**
If user forgets to set API key, application will start but fail at runtime with cryptic errors.

**Recommendation:**
Add startup health check:

```typescript
async function validateOptionalServices() {
  const warnings: string[] = [];

  if (serverEnv.EXA_API_KEY === 'placeholder') {
    warnings.push('⚠️ Exa search disabled - set EXA_API_KEY to enable');
  }

  if (serverEnv.TAVILY_API_KEY === 'placeholder') {
    warnings.push('⚠️ Tavily search disabled - set TAVILY_API_KEY to enable');
  }

  // ... check others

  if (warnings.length > 0) {
    console.warn('Optional services disabled:\n' + warnings.join('\n'));
  }
}
```

## Code Quality

### 16. Missing Null Checks in Tool Output Rendering

**Severity:** 🟢 Low (Robustness)

**File:** `components/message-parts/index.tsx` (lines 1900-2000+)

**Problem:**
Renders tool output without null checks.

```typescript
// Line 1972
<div>{part.output.greeting}</div>

// Line 1975
<div>{part.output.dayOfWeek}</div>
```

**Risk:**
If tool returns incomplete output, component will render undefined/null values.

**Recommendation:**
Add fallback UI:

```typescript
<div>{part.output?.greeting ?? 'No greeting available'}</div>
```

### 17. Incomplete Type Definitions

**Severity:** 🟢 Low (Type Safety)

**Files Affected:**
- `components/ui/form-component.tsx` (line 66): `subscriptionData?: any`
- `app/actions.ts` (line 94): history parameter not typed

**Recommendation:**
Create proper types:

```typescript
interface SubscriptionData {
  isProUser: boolean;
  planName: string;
  expiresAt: Date | null;
}

interface ChatInterfaceProps {
  subscriptionData?: SubscriptionData;
}
```

## Streaming & Real-Time

### 18. Stream Context Initialization Silent Failure

**Severity:** 🟢 Low (Observability)

**File:** `app/api/search/route.ts` (lines 88-105)

**Problem:**
`getStreamContext()` catches errors and logs conditionally. If Redis is misconfigured, streams are silently disabled.

**Recommendation:**
Make Redis requirement explicit:

```typescript
try {
  streamContext = await getStreamContext();
} catch (error) {
  if (process.env.REDIS_URL && process.env.REDIS_URL !== 'placeholder') {
    // Redis configured but failing - this is an error
    throw new Error('Redis configured but connection failed');
  }
  // Redis not configured - expected, continue without streams
  console.info('Resumable streams disabled (Redis not configured)');
}
```

## Actionable Next Steps

### High Priority (Do First)

1. ✅ **Add startup validation for optional services**
   - Prevents runtime failures
   - Better developer experience

2. ✅ **Extract large components into modules**
   - `form-component.tsx` → 4-5 smaller components
   - `app/actions.ts` → feature-based modules
   - Improves maintainability and testing

3. ✅ **Add structured logging system**
   - Replace console.logs with proper logger
   - Environment-gated debug logs
   - Better debugging in production

### Medium Priority (Plan For)

4. ⚠️ **Improve error handling in search tools**
   - Add error context and user messaging
   - Structured error logging
   - Better debugging

5. ⚠️ **Document tool integration flows**
   - Add JSDoc comments
   - Explain optimization strategies
   - Improve developer onboarding

### Low Priority (Nice to Have)

6. 📝 **Clean up commented-out payment code**
   - Remove dead code or extract to feature module
   - Reduce file sizes

7. 📝 **Add database foreign key constraints**
   - Prevent orphaned records
   - Improve data integrity

8. 📝 **Implement observability metrics**
   - Track query performance
   - Monitor API failures
   - Better production debugging
