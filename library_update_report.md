# Library Update Report

## Execution
- Timestamp (UTC): 2026-03-23T03:49:04Z
- Project root: /Users/guilhermevarela/Documents/Projetos/Desenvolvendo/scira
- Package manager: pnpm
- Lockfile: pnpm-lock.yaml
- Git repo detected: true
- Git tree before: dirty
- Git tree after: dirty
- Dry run: false

## Analysis
- Dependencies before update: 159
- Dependencies after update: 159
- Outdated status: completed
- Outdated count: 0
- Outdated log: /Users/guilhermevarela/Documents/Projetos/Desenvolvendo/scira/library_update_report.outdated.log

## Divergences
- Potential peer/conflict warnings found in update log: 13

## Update
- Commands executed:
  - pnpm up --latest
- Update status: updated
- Update log: /Users/guilhermevarela/Documents/Projetos/Desenvolvendo/scira/library_update_report.update.log

### Update Log Tail
     WARN  12 deprecated subdependencies found: @esbuild-kit/core-utils@3.3.2, @esbuild-kit/esm-loader@2.6.5, @npmcli/move-file@1.1.2, are-we-there-yet@3.0.1, gauge@4.0.4, glob@7.2.3, inflight@1.0.6, node-domexception@1.0.0, npmlog@6.0.2, prebuild-install@7.1.3, rimraf@3.0.2, tar@6.2.1
    Packages: +2 -3
    ++---
    Progress: resolved 1380, reused 1240, downloaded 1, added 2, done
     WARN  Issues with peer dependencies found
    .
    ├─┬ eslint-plugin-import 2.32.0
    │ └── ✕ unmet peer eslint@"^2 || ^3 || ^4 || ^5 || ^6 || ^7.2.0 || ^8 || ^9": found 10.1.0
    ├─┬ eslint-config-next 16.2.1
    │ ├─┬ eslint-plugin-import 2.32.0
    │ │ └── ✕ unmet peer eslint@"^2 || ^3 || ^4 || ^5 || ^6 || ^7.2.0 || ^8 || ^9": found 10.1.0
    │ ├─┬ eslint-plugin-react 7.37.5
    │ │ └── ✕ unmet peer eslint@"^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9.7": found 10.1.0
    │ ├─┬ eslint-plugin-jsx-a11y 6.10.2
    │ │ └── ✕ unmet peer eslint@"^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9": found 10.1.0
    │ └─┬ eslint-plugin-react-hooks 7.0.1
    │   └── ✕ unmet peer eslint@"^3.0.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0-0 || ^9.0.0": found 10.1.0
    ├─┬ @dodopayments/better-auth 1.4.3
    │ └── ✕ unmet peer better-auth@^1.4.0: found 1.3.3
    ├─┬ @polar-sh/better-auth 1.8.3
    │ └── ✕ unmet peer better-auth@^1.4.12: found 1.3.3
    ├─┬ @supermemory/tools 1.4.1
    │ └─┬ openai 4.104.0
    │   └── ✕ unmet peer zod@^3.23.8: found 4.3.6
    ├─┬ react-latex-next 3.0.0
    │ ├── ✕ unmet peer react@"^15.0.0 || ^16.0.0 || ^17.0.0 || ^18.0.0": found 19.2.4
    │ └── ✕ unmet peer react-dom@"^15.0.0 || ^16.0.0 || ^17.0.0 || ^18.0.0": found 19.2.4
    └─┬ react-simple-maps 3.0.0
      ├── ✕ unmet peer react@"^16.8.0 || 17.x || 18.x": found 19.2.4
      └── ✕ unmet peer react-dom@"^16.8.0 || 17.x || 18.x": found 19.2.4
    
    ╭ Warning ─────────────────────────────────────────────────────────────────────╮
    │                                                                              │
    │   Ignored build scripts: @clerk/shared, protobufjs.                          │
    │   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
    │   to run scripts.                                                            │
    │                                                                              │
    ╰──────────────────────────────────────────────────────────────────────────────╯
    
    Done in 26.1s using pnpm v10.18.3


## Tests
- Planned commands:
  - pnpm run build
- Executed commands:
  - pnpm run build
- Test status: passed
- Test exit code: 0
- Test log: /Users/guilhermevarela/Documents/Projetos/Desenvolvendo/scira/library_update_report.tests.log

### Test Log Tail
      Generating static pages using 10 workers (10/22) 
      Generating static pages using 10 workers (16/22) 
    ✓ Generating static pages using 10 workers (22/22) in 950ms
      Finalizing page optimization ...
    
    Route (app)
    ┌ ○ /
    ├ ○ /_not-found
    ├ ƒ /api/clean_images
    ├ ƒ /api/lookout
    ├ ƒ /api/og/chat/[id]
    ├ ƒ /api/raycast
    ├ ƒ /api/search
    ├ ƒ /api/search/[id]/stream
    ├ ƒ /api/transcribe
    ├ ƒ /api/upload
    ├ ƒ /api/xql
    ├ ○ /apple-icon.png
    ├ ƒ /connectors/[provider]/callback
    ├ ○ /icon.png
    ├ ○ /lookout
    ├ ○ /manifest.webmanifest
    ├ ○ /new
    ├ ○ /opengraph-image.png
    ├ ○ /robots.txt
    ├ ƒ /search/[id]
    ├ ○ /settings
    ├ ƒ /sign-in/[[...sign-in]]
    ├ ƒ /sign-up/[[...sign-up]]
    ├ ○ /success
    ├ ○ /twitter-image.png
    └ ○ /xql
    
    
    ƒ Proxy (Middleware)
    
    ○  (Static)   prerendered as static content
    ƒ  (Dynamic)  server-rendered on demand
    
    


## Changed Files
- Changed files count: 5
- components/ui/chart.tsx
- lib/connectors.tsx
- lib/memory-actions.ts
- package.json
- pnpm-lock.yaml

