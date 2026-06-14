# Self-hosting status

Last updated: 2026-06-10

This document records the current local/self-hosted state of this checkout so a new operator can understand what has already been integrated and what still needs attention.

## Git state

- Local branch: `main`
- Remote: `origin` -> `https://github.com/zaidmukaddam/scira.git`
- There is no separate `upstream` remote configured in this checkout.
- `main` tracks `origin/main`.
- Local checkpoint commit created before syncing: `0b43b05 chore: checkpoint local self-hosted changes`
- After `git fetch origin` and `git merge origin/main`, the branch was already up to date with `origin/main`.
- Current branch is ahead of `origin/main` by the local checkpoint commit.

## Dev server

- Dev command: `bun run dev`
- Local URL: `http://localhost:3000`
- Network URL observed locally: `http://192.168.1.11:3000`
- Current Next.js runtime: `Next.js 16.2.1-canary.2` with Turbopack.
- The app was restarted after environment changes and responded with `HTTP 200` at `/`.
- Current known runtime warning: `pg-connection-string` warns that `sslmode=prefer`, `require`, and `verify-ca` are treated as `verify-full` until the next major version. This warning is unrelated to R2.

## Memory issue mitigation

The initial dev server had a high memory spike. The main mitigation was to split static imports away from the broad `app/actions.ts` module.

New action modules:

- `app/chat-actions.ts`
- `app/form-actions.ts`
- `app/suggest-questions-action.ts`
- `app/enhance-prompt-action.ts`

Several components now import narrower action modules instead of importing everything from `app/actions.ts`. After the split, `bun run typecheck` passed and the warm dev server RSS dropped from the multi-GB range to a few hundred MB in local observation.

## Enabled feature flags

These are enabled in `.env.local` for this machine:

- `NEXT_PUBLIC_CANVAS_ENABLED=true`
- `NEXT_PUBLIC_MCP_ENABLED=true`
- `NEXT_PUBLIC_VOICE_BACKEND_URL=http://localhost:8000`
- `NEXT_PUBLIC_MCP_SANDBOX_ORIGIN=`

Notes:

- The voice backend URL points to a local service. Voice will only work when the voice backend is actually running at `http://localhost:8000`.
- MCP UI is enabled, but provider OAuth credentials still need to be configured for each managed connector that should work in production.

## Cloudflare R2

R2 was enabled and configured through the Cloudflare account used in this environment.

Current R2 setup:

- Bucket: `scira-uploads`
- Public bucket URL: `https://pub-555986fe1a6849038ac885cd16baea34.r2.dev`
- S3 endpoint pattern: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
- Managed `r2.dev` public access: enabled
- CORS rule id: `scira-local-dev`
- CORS origins:
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`
- CORS methods:
  - `GET`
  - `PUT`
  - `POST`
  - `DELETE`
  - `HEAD`
- CORS allowed headers: `*`
- CORS exposed headers: `ETag`
- CORS max age: `3600`

An R2 Account API token was created with:

- Permission: `Object Read & Write`
- Scope: specific bucket only
- Bucket scope: `scira-uploads`
- TTL: `Forever`

The generated R2 S3 credentials were written to `.env.local`:

- `R2_ACCOUNT_ID`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

Do not commit `.env.local` or paste the R2 secret values into docs, issues, or chat logs. Cloudflare only shows the secret once; rotate the R2 token if the secret is lost or exposed.

R2 validation completed:

```bash
r2 smoke test: put/head/delete ok
```

## Environment variables now expected for this local setup

Feature flags and public URLs:

```bash
NEXT_PUBLIC_CANVAS_ENABLED=true
NEXT_PUBLIC_MCP_ENABLED=true
NEXT_PUBLIC_VOICE_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_MCP_SANDBOX_ORIGIN=
```

R2:

```bash
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=scira-uploads
R2_PUBLIC_URL=https://pub-555986fe1a6849038ac885cd16baea34.r2.dev
```

Optional or still-unfinished integration areas noticed during audit:

- `GITHUB_MCP_CLIENT_ID` / `GITHUB_MCP_CLIENT_SECRET`
- `BOX_MCP_CLIENT_ID` / `BOX_MCP_CLIENT_SECRET`
- `DROPBOX_MCP_CLIENT_ID` / `DROPBOX_MCP_CLIENT_SECRET`
- `SLACK_MCP_CLIENT_ID` / `SLACK_MCP_CLIENT_SECRET`
- `HUBSPOT_MCP_CLIENT_ID` / `HUBSPOT_MCP_CLIENT_SECRET`
- `NEXT_PUBLIC_MCP_SANDBOX_ORIGIN` if a sandbox origin is deployed
- production voice backend URL when not using local `localhost:8000`

## Operational notes

- `.env.local` is the source of truth for this local machine and contains secrets. Keep it local.
- Restart `bun run dev` after changing `.env.local`.
- R2 uploads are implemented through `lib/r2.ts` and used by upload/build/extreme-search paths.
- Public R2 reads use `R2_PUBLIC_URL`; S3 write/delete/list operations use the S3 credentials.
- If R2 upload fails, first verify the env variables are loaded and then repeat a put/head/delete smoke test with the project SDK.
