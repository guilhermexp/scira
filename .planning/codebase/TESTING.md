# Testing Practices

**Last Updated:** 2026-01-17

## Overview

**Status:** ❌ No automated test framework currently implemented

The Scira codebase currently relies on manual testing using browser DevTools rather than automated test suites.

## Current Testing Approach

### Manual Testing (Primary Method)

Per `CLAUDE.md` owner's prime directive:

> **NUNCA FALE QUE ALGO ESTA FUNCIONANDO, ANTES TER CERTEZA E DE TESTAR USANDO DEVTOOLS.**
>
> *(Never say something is working before being sure and testing using DevTools)*

### Manual Testing Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   - Runs on port 8931 (custom, not default 3000)

2. **Open Browser**
   - Navigate to `http://localhost:8931`
   - Open DevTools (F12 or Cmd+Opt+I on Mac)

3. **Test the Feature**
   - **Console Tab:** Check for errors and logs
   - **Network Tab:** Verify API calls and responses
   - **Application Tab:** Inspect state, cookies, local storage
   - **Sources Tab:** Debug with breakpoints if needed

4. **Test Edge Cases**
   - Error scenarios
   - Empty states
   - Loading states
   - Invalid inputs

5. **Only Then Claim Success**
   - Never claim something works without DevTools verification

## Test Framework Status

### No Automated Tests

**Current State:**
- ❌ No test files (`*.test.ts`, `*.spec.ts`, `*.test.tsx`, `*.spec.tsx`)
- ❌ No test configuration (`vitest.config.*`, `jest.config.*`)
- ❌ No test dependencies in `package.json` (Jest, Vitest, Testing Library, etc.)
- ❌ No test scripts (`npm run test`, `npm run test:watch`)
- ❌ No CI/CD pipeline with automated tests
- ❌ No test coverage measurement

**What We Have:**
- ✅ Linting via ESLint (code quality)
- ✅ Formatting via Prettier (code style)
- ✅ Unused code detection via Knip (dead code elimination)
- ✅ TypeScript strict mode (compile-time type checking)

## Code Quality Tools (Instead of Tests)

### 1. ESLint

```bash
npm run lint
```

**Purpose:** Code quality and consistency checks

**Configuration:** `.eslintrc.json`
```json
{
  "extends": ["next/core-web-vitals"]
}
```

**Rules:** Minimal Next.js core web vitals rules

### 2. Prettier

```bash
npm run fix
```

**Purpose:** Consistent code formatting

**Configuration:** `.prettierrc`
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

### 3. Knip

```bash
npm run knip
```

**Purpose:** Detect and eliminate unused imports/exports

**Benefits:**
- Finds dead code
- Identifies unused dependencies
- Helps keep codebase clean

### 4. TypeScript Strict Mode

**Purpose:** Compile-time type safety

**Configuration:** `tsconfig.json`
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

**Benefits:**
- Catches type errors at compile time
- Ensures proper typing throughout codebase
- Reduces runtime errors

## Pre-Push Verification Workflow

Recommended workflow before committing:

```bash
# 1. Check code quality
npm run lint

# 2. Format code
npm run fix

# 3. Find unused code
npm run knip

# 4. Verify TypeScript
npm run build  # or tsc --noEmit

# 5. Manual browser testing with DevTools
npm run dev
# Then test in browser with DevTools open
```

## Testing Critical Modifications

### Self-Hosted Modifications Requiring Testing

Files modified for self-hosting that should be manually tested:

1. **Subscription System**
   - `lib/subscription.ts` - All functions return Pro status
   - Test: Verify no subscription checks block features

2. **User Data Caching**
   - `hooks/use-cached-user-data.tsx` - `isProUser` hardcoded to `true`
   - Test: Verify Pro features accessible without payment

3. **Search API**
   - `app/api/search/route.ts` - `isProUser` hardcoded to `true`
   - Test: Verify no message limits enforced

4. **Auth System**
   - `lib/auth.ts` - Payment plugins commented out
   - Test: Verify authentication works without payment integration

5. **Environment Validation**
   - `env/server.ts` - Optional APIs default to 'placeholder'
   - Test: Verify app starts with minimal API keys

### Testing New Features

When adding new features:

1. **Before Implementation:**
   - Read the relevant code files
   - Understand existing patterns

2. **During Implementation:**
   - Follow existing conventions
   - Use TypeScript types
   - Add Zod validation for inputs

3. **After Implementation:**
   - Start dev server
   - Test in browser with DevTools
   - Verify Console for errors
   - Check Network tab for API calls
   - Test error cases

4. **Edge Cases to Test:**
   - Empty states
   - Loading states
   - Error states
   - Invalid inputs
   - Network failures
   - Missing API keys

### Testing AI Tools

For new AI tools in `lib/tools/`:

1. **Tool Execution:**
   - Test with valid inputs
   - Test with invalid inputs
   - Verify error handling

2. **Integration:**
   - Verify tool appears in UI
   - Test tool selection logic
   - Check streaming response

3. **External APIs:**
   - Test with placeholder API key (should fail gracefully)
   - Test with valid API key (should work)

### Testing Database Changes

For schema or query changes:

1. **Schema Changes:**
   ```bash
   npx drizzle-kit push
   ```
   - Verify migration applied
   - Check for errors in console

2. **Query Changes:**
   - Test new queries in isolation
   - Verify data returned correctly
   - Check for N+1 query issues
   - Test with cache enabled

3. **Database Connection:**
   ```bash
   node -e "require('dotenv').config({ path: '.env.local' }); const { neon } = require('@neondatabase/serverless'); const sql = neon(process.env.DATABASE_URL); sql\`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';\`.then(result => console.log('✅ Tables found:', result.map(r => r.table_name))).catch(err => console.log('❌ Error:', err.message));"
   ```

## Known Testing Gaps

### 1. No Unit Tests

**Impact:**
- No automated verification of individual functions
- Regression risks when refactoring
- Hard to verify edge cases

**Recommendation:**
- Consider adding Vitest for unit tests
- Start with critical utility functions
- Add tests for tool execution logic

### 2. No Integration Tests

**Impact:**
- No automated verification of API routes
- No verification of database interactions
- No verification of auth flow

**Recommendation:**
- Consider adding Playwright or Cypress for integration tests
- Test critical user flows (sign-in, chat, search)

### 3. No E2E Tests

**Impact:**
- No automated verification of full user flows
- Manual testing required for each deployment

**Recommendation:**
- Consider Playwright for E2E tests
- Test main user journeys

### 4. No Test Coverage Measurement

**Impact:**
- Unknown which code paths are tested
- Hard to identify untested code

**Recommendation:**
- Add coverage tools when implementing tests
- Aim for 80%+ coverage on critical paths

### 5. No CI/CD Pipeline

**Impact:**
- No automated testing on pull requests
- Manual verification required before merge

**Recommendation:**
- Add GitHub Actions workflow
- Run lint, format check, type check on PRs
- Add tests when available

## Debugging Tools

### Browser DevTools

**Console:**
- View logs and errors
- Test code snippets in console
- Monitor warnings

**Network:**
- Inspect API requests/responses
- Check timing and payloads
- Verify streaming responses

**Application:**
- Inspect cookies
- View local storage
- Check session storage

**Sources:**
- Set breakpoints
- Step through code
- Inspect variables

### Logging Patterns

Current logging in codebase:

```typescript
// lib/db/queries.ts
console.log('✅ Cache hit for key:', cacheKey);
console.log('❌ Cache miss for key:', cacheKey);

// lib/tools/extreme-search.ts
console.log('🔍 Starting research for query:', query);

// components/ui/form-component.tsx
console.log('Selected model:', selectedModel);
```

**Note:** Console.logs should be removed or gated behind environment checks in production.

## Recommendations for Future Testing

### Short-Term (Manual Testing Improvements)

1. Document manual test cases for critical features
2. Create testing checklist for common scenarios
3. Add more comprehensive error logging

### Medium-Term (Add Basic Tests)

1. Add Vitest for unit tests
2. Test utility functions in `lib/utils.ts`
3. Test AI tools execution
4. Test database queries

### Long-Term (Full Test Suite)

1. Add Playwright for E2E tests
2. Add integration tests for API routes
3. Add test coverage measurement
4. Add CI/CD pipeline with automated tests
5. Aim for 80%+ code coverage

## Testing Self-Hosted Features

### Subscription System Testing

Manual test cases:

1. **Pro Features Access**
   - ✅ Should access all models without payment
   - ✅ Should have unlimited messages
   - ✅ Should use extreme search without limits

2. **Subscription Check Bypass**
   - ✅ `isUserSubscribed()` should return `true`
   - ✅ `isUserProCached()` should return `true`
   - ✅ `hasActiveSubscription` should be `true`

3. **Payment Integration Disabled**
   - ✅ No payment webhooks should be active
   - ✅ No subscription expiration checks
   - ✅ No payment dialogs should appear

### Environment Variable Testing

Test with minimal configuration:

```bash
# Required only:
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
XAI_API_KEY=...  # At least one AI provider

# All others default to 'placeholder'
```

**Verify:**
- ✅ App starts successfully
- ✅ Authentication works
- ✅ Chat works with available AI provider
- ✅ Optional features gracefully disabled
