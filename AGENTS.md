# scira — Agent guidance

Fork self-hosted de [`zaidmukaddam/scira`](https://github.com/zaidmukaddam/scira) (AI search engine open source). Configuração fork em `.fork-config.json` (modo `personal-fork`). **Estado operacional vivo em [`SELF_HOSTING_STATUS.md`](SELF_HOSTING_STATUS.md)** — sempre ler antes de mudanças amplas. Comandos/stack/self-host em [`CLAUDE.md`](CLAUDE.md).

## Project overview
- **Local name:** scira. Path com timestamp (`scira-20260504T025051Z`) reflete `createdAt` do fork (2026-05-04T02:51:28Z) — **manter como está**, foi gerado por rotina `.fork-*`.
- **Stack:** Next.js 16.2.1-canary.2 (App Router, Turbopack) · Bun · TS · Drizzle · Neon Postgres · Cloudflare R2 · React + Tailwind · MCP.
- **Fork workflow:** só `origin` aponta pro upstream. **Não adicionar remote `upstream` separado** sem alinhar com o maintainer upstream.

## Local rules
- **NÃO consolidar** `app/actions.ts` — foi split em `app/{chat,form,suggest-questions,enhance-prompt}-actions.ts` por mitigação de memória (jun/2026). Reverter causa spike de RSS no dev server.
- **NÃO commitar** `.env`, `.env.local`, R2 secrets, OAuth tokens. `.env.example` é o template versionado.
- **Mudança de comportamento** → criar OpenSpec change em `openspec/changes/<id>.md` ANTES de codar. Workflow OpenSpec v1.4.1: `proposal → specs → design → tasks` (use `openspec instructions` / `openspec templates` pra templates canônicos; arquivos de instrução da tool são criados via `openspec init --tools <tool>` quando aplicável).
- **Voice backend** (`NEXT_PUBLIC_VOICE_BACKEND_URL=http://localhost:8000`) precisa estar rodando pra voice funcionar — não é garantia do dev server.
- **OpenSpec/DOX** (ver bloco DOX abaixo): agente DEVE ler a cadeia AGENTS.md raiz→alvo antes de editar; DOX pass antes de done. Sub-agente sem o brief completo erra esses passos.

## DOX Framework

- Este repo usa DOX: AGENTS.md hierárquico, 1 por domínio/pasta durável. Cada AGENTS.md é contrato vinculante da sua subárvore.
- DOX é o eixo ESPAÇO (onde o código mora, como editar aqui). O eixo TEMPO (o que mudar, capability nova/breaking) é OpenSpec — antes de mudar comportamento, ver `openspec/` e seguir `openspec/project.md`. DOX não reescreve as rules do OpenSpec.

### Read Before Editing
1. Ler este AGENTS.md (raiz) + identificar cada path que vai tocar.
2. Caminhar da raiz até cada alvo, lendo todo AGENTS.md no caminho (Child DOX Index aponta o próximo).
3. Doc mais próximo controla detalhe local; pais controlam regra repo-wide. Em conflito, o mais próximo vence no detalhe — nenhum filho enfraquece DOX nem OpenSpec.
4. Não confiar em memória: re-ler a cadeia DOX na sessão atual antes de editar. Fazer a edição MÍNIMA no lugar certo (não duplicar função, não criar helper novo se dá pra estender).

### Update After Editing (DOX pass — obrigatório no closeout)
- Toda mudança significativa: atualizar o AGENTS.md dono mais próximo + pais afetados + Child DOX Index. Remover texto stale na hora.
- Atualizar quando muda: propósito, escopo, ownership, estrutura durável, contratos, workflow, inputs/outputs/permissões/constraints, preferência durável do usuário, ou criação/move/rename de AGENTS.md.
- Mudança de comportamento de capability → também rodar o ciclo OpenSpec (validate → archive).

### Child Doc Shape
Criar AGENTS.md filho quando a pasta vira boundary durável com regra própria. Seções (vazias se não há padrão ainda):
- **Purpose** · **Ownership** · **Local Contracts** · **Work Guidance** · **Verification** · **Child DOX Index**

### Closeout
1. Re-checar paths mudados contra a cadeia DOX.
2. Atualizar docs donos + pais/filhos afetados + cada Child DOX Index.
3. Remover texto stale/contraditório.
4. Rodar verificação existente (testes/lint) + ciclo OpenSpec se mudou comportamento.

## Child DOX Index
This project is not yet indexed. Scan the repo recursively, build the DOX tree, and replace this with the real index. Create nested AGENTS.md where complexity warrants.
