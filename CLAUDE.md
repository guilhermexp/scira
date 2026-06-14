# scira — AI search engine (self-hosted fork)

Fork pessoal de [`zaidmukaddam/scira`](https://github.com/zaidmukaddam/scira) (open source, AI search engine). Modo `personal-fork` definido em `.fork-config.json`. **Estado operacional vivo em [`SELF_HOSTING_STATUS.md`](SELF_HOSTING_STATUS.md)** — sempre ler antes de mudanças amplas.

## Stack
Next.js 16.2.1-canary.2 (App Router, Turbopack) · Bun · TypeScript · Drizzle ORM · Neon Postgres · Cloudflare R2 · React + Tailwind · MCP

## Comandos
- `bun run dev` — dev server (http://localhost:3000)
- `bun run build` — build de produção
- `bun run start` — start do build prod
- `bun run typecheck` — type check (passa após o split de `app/actions.ts`)
- `bun run lint` — eslint

## Environment
- `.env` (default) + `.env.local` (overrides) — locais, **NUNCA commitar**
- `.env.example` é o template versionado (ver pra lista canônica de keys)
- Restart `bun run dev` após qualquer mudança em `.env.local`

## Self-hosting (resumo — `SELF_HOSTING_STATUS.md` é canônico)
- **DB:** Neon Postgres (`DATABASE_URL` em `.env`)
- **Storage:** Cloudflare R2 bucket `scira-uploads` (S3 endpoint + public `R2_PUBLIC_URL`)
- **Auth:** better-auth (sessions) + GitHub OAuth
- **Search/AI:** chaves em `.env` (Anthropic, OpenAI, Exa, Tavily, Firecrawl, etc.)
- **Memory mitigation:** `app/actions.ts` foi split em `app/{chat,form,suggest-questions,enhance-prompt}-actions.ts` (jun/2026). **NÃO consolidar de volta** — causa regressão de RSS no dev server.
- **Voice backend** (opcional): `NEXT_PUBLIC_VOICE_BACKEND_URL=http://localhost:8000` — só funciona com o backend rodando.

## Fork workflow
- Único remote: `origin` → `zaidmukaddam/scira`. **Não adicionar remote `upstream` separado** sem antes alinhar com o maintainer.
- Estado local: branch `main`, 1 commit ahead (`0b43b05 chore: checkpoint local self-hosted changes`), 8 arquivos modified, `SELF_HOSTING_STATUS.md` e `lib/uploads/` untracked.
- Mudança de comportamento → **OpenSpec change** em `openspec/changes/<id>.md` ANTES de codar (ver `openspec/project.md`).

## Lessons learned
- **2026-05-04** — fork criado via rotina `.fork-*` (audit 125K, build, db-push, typecheck, home.png, redis, migrate, dev). Veja `.fork-config.json` pra config da rotina.
- **2026-06-10** — split de `app/actions.ts` mitigou spike de memória no dev server. `bun run typecheck` passa, RSS caiu pra poucas centenas de MB.
- **2026-06-10** — R2 validado com put/head/delete smoke test; CORS `scira-local-dev` configurado pra localhost.
