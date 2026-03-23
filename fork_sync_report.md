# Fork Sync Report

## Summary

- Date: 2026-03-23T01:47:30Z
- Branch: `codex/upstream-sync-20260322`
- Local base before sync: `3504648`
- Upstream target: `7215d53`
- Merge commit recorded: `e408e8d`
- Origin publish: skipped by design (`--no-push-origin`)

## New From Upstream

- Upstream was ahead by 23 commits relative to the local fork.
- Main upstream themes detected:
  - dependency churn and SDK updates
  - new MCP and export routes
  - new `apps`, `voice`, `content`, and chart/canvas UI surfaces
  - broader auth/platform assumptions that diverge from this self-hosted fork

## Remediation Log

- Initial sync script failed on `modify/delete` conflicts where local state was a deletion and `git checkout --ours` had no file to restore.
- Retried sync with a patched temporary copy of the script to preserve local deletions.
- `npm install` failed with peer resolution conflicts; remediated with `npm install --legacy-peer-deps`.
- Added missing dependency `@cloudflare/kumo@^1.14.1` during investigation.
- Full upstream tree proved incompatible with the current self-hosted fork:
  - missing local auth module compatibility
  - large numbers of missing upstream-only dependencies
  - duplicated/invalid code after local-delta reapplication
- Preserved the upstream merge in git history, then restored the working tree to the local fork baseline and fixed two Exa SDK typing regressions:
  - [`lib/tools/extreme-search.ts`](/Users/guilhermevarela/Documents/Projetos/Desenvolvendo/scira-upstream-sync-20260322/lib/tools/extreme-search.ts)
  - [`lib/tools/web-search.ts`](/Users/guilhermevarela/Documents/Projetos/Desenvolvendo/scira-upstream-sync-20260322/lib/tools/web-search.ts)

## Upstream Impact Analysis

- `auth`: high impact. Upstream expects modules and flows not present in the Clerk-based fork.
- `search tooling`: medium impact. Exa SDK typings required small local fixes.
- `feature surface`: high impact. New upstream routes/components add major capability areas with dependency expansion.
- `self-hosted posture`: high impact. Current upstream tree is not directly compatible with this fork's self-hosted customizations.

## Validation

- Dependency install: passed with `npm install --legacy-peer-deps`
- Functional gate: `npm run build` passed
- Browser validation:
  - `/` loaded on `http://localhost:8931` with 0 console errors and 1 non-blocking warning
  - `/sign-in` rendered, but Clerk emitted an infinite redirect loop warning in the dev server logs indicating mismatched local Clerk keys
  - `/xql` redirected unauthenticated traffic to Clerk sign-in; the external Clerk-hosted page logged a CSP note

## Blocking Observation

- The branch is functionally buildable and the public home page loads.
- Authenticated flows are not validated as healthy because the current local Clerk environment appears misconfigured:
  - `Clerk: Refreshing the session token resulted in an infinite redirect loop`
  - likely cause: publishable/secret keys from different Clerk instances in `.env.local`

## Result Expected

- This branch keeps the upstream merge in history for future comparison/cherry-pick work.
- The final tree remains aligned with the existing self-hosted fork behavior, not with the full upstream feature set.
- Safe next step: user tests this branch/worktree before any promotion to `main`.
