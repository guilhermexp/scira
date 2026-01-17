# Análise do Upstream Scira - Melhorias Disponíveis

**Data da Análise:** 2026-01-17
**Upstream:** https://github.com/zaidmukaddam/scira
**Commits Analisados:** 573 commits desde 2025-01-01
**Último Commit Upstream:** `71b6b28` (2026-01-17)

---

## 📊 Resumo Executivo

O upstream teve **573 commits** desde janeiro de 2025, com mudanças significativas em:
- Novos modelos AI (GPT 5.1/5.2, Grok 4.1)
- Refatorações de performance
- Novos recursos (Export PDF, Search Library, X-Wrapped)
- Atualizações de dependências
- Melhorias de UI/UX

⚠️ **ATENÇÃO:** Algumas mudanças envolvem rate limiting e features de subscription que **NÃO devem** ser trazidas para a versão self-hosted.

---

## 🟢 ALTA PRIORIDADE - Seguro Trazer

### 1. Atualizações de AI Providers
**Commits:** `3878b4d`, `ac26478`, `d58e53c`, `465246e`

**Mudanças:**
```diff
+ Novos modelos OpenAI: GPT 5.1, 5.2, 5.1-codex, 5.1-codex-mini
+ Grok 4.1 Fast Thinking
+ Separação regional XAI (US/EU)
+ Novo provider Baseten
+ Novo provider Novita AI
+ Novo provider Anannas AI
+ Mudança de API: createOpenAI → createOpenAICompatible
+ Mudança de API: xai() → createXai()
```

**Arquivos Afetados:**
- `ai/providers.ts` (completa refatoração)

**Impacto:** ✅ Compatível com self-hosting
**Benefício:** Acesso a modelos mais recentes e performáticos

---

### 2. Better Auth v1.4.10
**Commit:** `71b6b28`

**Mudanças:**
```json
"better-auth": "1.4.10" (vs. versão dev atual)
```

**Impacto:** ✅ Versão estável
**Benefício:** Correções de bugs e melhorias de segurança

---

### 3. AI SDK - Output.object Pattern
**Commits:** `2b52951`, `cbad27c`

**Mudanças:**
```typescript
// ANTES
const { object } = await generateObject({
  schema: z.object({...})
})

// DEPOIS
const { output } = await generateText({
  output: Output.object({
    schema: z.object({...})
  })
})
```

**Arquivos Afetados:**
- `app/actions.ts` (função `suggestQuestions`)

**Impacto:** ✅ API mais moderna do Vercel AI SDK
**Benefício:** Melhor performance e compatibilidade futura

---

### 4. Bug Fixes Importantes

#### 4.1 Dropdown Menu Visibility
**Commit:** `02c9d9f`
**Descrição:** Melhora visibilidade de dropdowns no hover

#### 4.2 Form Submission & Keyboard
**Commit:** `953ffa0`
**Descrição:** Melhora handling de submissão de formulários e interações de teclado

#### 4.3 Dynamic Domain for Share URLs
**Commit:** `67cf909`
**Descrição:** Remove hardcoded `scira.ai`, usa domínio dinâmico
```diff
- const shareUrl = `https://scira.ai/share/${chatId}`
+ const shareUrl = `${baseUrl}/share/${chatId}`
```

**Impacto:** ✅ Essencial para self-hosting
**Benefício:** URLs de compartilhamento funcionam corretamente em instâncias self-hosted

---

### 5. Melhorias de Performance

#### 5.1 Dynamic Component Loading
**Commit:** `a782708`

**Descrição:** Carregamento dinâmico de componentes que dependem do browser
```typescript
// Lazy loading para componentes pesados
const MapComponent = dynamic(() => import('./map'), { ssr: false })
```

#### 5.2 Eager Tool Loading
**Commit:** `746155a`

**Descrição:** Pre-carregamento de ferramentas para melhor UX

**Impacto:** ✅ Melhora performance
**Benefício:** Menor tempo de resposta, melhor experiência do usuário

---

## 🟡 MÉDIA PRIORIDADE - Avaliar Antes

### 1. Novos Recursos

#### 1.1 Search Library Page
**Commit:** `fa09b19`

**Descrição:** Página para biblioteca de buscas anteriores
**Arquivos Novos:**
- `app/(search)/library/*`

**Impacto:** ⚠️ Requer avaliação
**Considerações:** Verificar se não há dependências de subscription

---

#### 1.2 PDF Export
**Commits:** Múltiplos

**Arquivos Novos:**
- `app/api/export/pdf/route.ts`
- `app/api/export/pdf/fonts/*`

**Dependências Novas:**
```json
"jspdf": "^2.x",
"pdf-lib": "^1.x",
"@pdf-lib/fontkit": "^1.x",
"html2canvas": "^1.x"
```

**Impacto:** ⚠️ Adiciona ~500KB ao bundle
**Benefício:** Exportar conversas em PDF

---

#### 1.3 X-Wrapped Feature
**Arquivos Novos:**
- `app/(content)/x-wrapped/page.tsx`
- `app/(content)/x-wrapped/[username]/page.tsx`

**Dependências:**
```json
"@xdevplatform/xdk": "^1.x"
```

**Descrição:** Feature de "wrapped" para perfis do X/Twitter
**Impacto:** ⚠️ Feature extra, não essencial

---

#### 1.4 Content Pages (About, Privacy, Terms)
**Arquivos Novos:**
- `app/(content)/about/page.tsx`
- `app/(content)/privacy-policy/page.tsx`
- `app/(content)/terms/page.tsx`

**Impacto:** ✅ Útil para instância self-hosted
**Benefício:** Páginas informativas customizáveis

---

### 2. Refatorações de UI/UX

#### 2.1 Sidebar State Management
**Commit:** `fb01b9a`

**Descrição:** Simplificação do gerenciamento de estado da sidebar
**Impacto:** ✅ Melhora manutenibilidade

#### 2.2 Layout & Skeleton Structure
**Commit:** `3be455f`

**Descrição:** Melhora estrutura de layout e loading states
**Impacto:** ✅ Melhor UX

#### 2.3 Message Component Styling
**Commit:** `f9dd166`

**Descrição:** Melhorias visuais no componente de mensagens
**Impacto:** ✅ Visual mais polido

---

### 3. Mudanças em Database

#### 3.1 PostgreSQL Client Change
**Mudança:**
```diff
- "@neondatabase/serverless": "^0.x"
- "postgres": "^3.x"
+ "pg": "^8.x"
```

**Impacto:** ⚠️ **BREAKING CHANGE**
**Considerações:**
- Requer migração de código de acesso ao DB
- Verificar se `drizzle-orm` funciona com `pg`
- Pode ter impacto em performance

**Recomendação:** **Avaliar cuidadosamente antes de trazer**

---

### 4. Novas Dependências Interessantes

#### 4.1 ElevenLabs Integration
```json
"@elevenlabs/elevenlabs-js": "^1.x"
```

**Funcionalidade:** Text-to-Speech
**Impacto:** Feature adicional de voz

#### 4.2 Travel API (Amadeus)
```json
"amadeus": "^8.x"
```

**Funcionalidade:** Dados de voos e viagens
**Impacto:** Feature extra, não essencial

#### 4.3 MathJax
```json
"@mathjax/mathjax-newcm-font": "^1.x",
"@mathjax/src": "^3.x"
```

**Funcionalidade:** Renderização de equações matemáticas
**Impacto:** ✅ Útil para conteúdo acadêmico

#### 4.4 Three.js
```json
"@react-three/fiber": "^8.x",
"@react-three/drei": "^9.x",
"@types/three": "^0.x"
```

**Funcionalidade:** Visualizações 3D
**Impacto:** ⚠️ Adiciona peso significativo ao bundle

---

## 🔴 NÃO TRAZER - Conflita com Self-Hosting

### 1. Rate Limiting
**Commit:** `8c9d486` - ❌ **EVITAR**

**Descrição:** Adiciona rate limiting para usuários não autenticados
**Razão:** Conflita com o modelo self-hosted ilimitado

---

### 2. Subscription Features
**Commits:** `c932bba`, `0b8448d` - ❌ **EVITAR**

**Descrição:**
- Student discount support
- Auto-apply discounts
- Gateway models gating

**Razão:** Sistema de subscription já foi removido

---

### 3. Redis/Upstash Cache
**Dependência:**
```json
"ioredis": "^5.x"
```

**Impacto:** ❌ **NÃO TRAZER**
**Razão:** Cache foi intencionalmente removido para simplificar self-hosting

---

### 4. Payment-Related Changes
**Arquivos:** `lib/auth.ts`, `lib/subscription.ts`

**Razão:** Todas modificações de payment devem ser ignoradas

---

## 📋 Plano de Ação Recomendado

### Fase 1: Updates Críticos (Seguro) ✅

1. **Atualizar AI Providers** (`ai/providers.ts`)
   - Aplicar mudanças de API (createXai, createOpenAICompatible)
   - Adicionar novos modelos (GPT 5.x, Grok 4.1)
   - Adicionar providers (Baseten, Novita, Anannas)

2. **Atualizar Better Auth**
   ```bash
   npm install better-auth@1.4.10
   ```

3. **Aplicar Bug Fixes**
   - Dynamic domain for share URLs (commit `67cf909`)
   - Dropdown visibility (commit `02c9d9f`)
   - Form submission handling (commit `953ffa0`)

4. **Refatorar AI SDK Calls**
   - Migrar `generateObject` → `generateText` com `Output.object`
   - Aplicar em `app/actions.ts` (função `suggestQuestions`)

5. **Performance Improvements**
   - Dynamic component loading (commit `a782708`)
   - Eager tool loading (commit `746155a`)

---

### Fase 2: Novos Recursos (Avaliar) ⚠️

1. **Content Pages** (About/Privacy/Terms)
   - Cherry-pick commits das páginas
   - Customizar conteúdo para versão self-hosted

2. **PDF Export** (Opcional)
   - Avaliar impacto no bundle size
   - Instalar dependências: `jspdf`, `pdf-lib`, `html2canvas`
   - Trazer `app/api/export/pdf/*`

3. **Search Library Page** (Opcional)
   - Verificar dependências
   - Trazer apenas se não houver checks de subscription

4. **MathJax Support** (Recomendado para acadêmico)
   ```bash
   npm install @mathjax/mathjax-newcm-font @mathjax/src
   ```

---

### Fase 3: Refatorações Estruturais (Cuidado) ⚠️

1. **Database Client Migration** (Avaliar Risco)
   - **ATENÇÃO:** Mudança de `@neondatabase/serverless` → `pg`
   - Requer testes extensivos
   - Verificar compatibilidade com Drizzle ORM
   - **Recomendação:** Deixar para versão futura

2. **UI/UX Refactorings**
   - Sidebar state management (commit `fb01b9a`)
   - Layout improvements (commit `3be455f`)
   - Message component styling (commit `f9dd166`)

---

## 🛠️ Comandos para Cherry-Pick

### Exemplo: Trazer um commit específico

```bash
# Ver detalhes do commit
git show upstream/main:67cf909

# Cherry-pick (aplicar commit)
git cherry-pick 67cf909

# Se houver conflitos, resolver e continuar
git cherry-pick --continue

# Ou abortar se necessário
git cherry-pick --abort
```

### Exemplo: Trazer múltiplos commits relacionados

```bash
# Trazer série de commits
git cherry-pick 02c9d9f 953ffa0 67cf909
```

---

## ⚠️ Checklist Antes de Cherry-Pick

Antes de trazer qualquer mudança do upstream, verificar:

- [ ] O commit NÃO adiciona rate limiting
- [ ] O commit NÃO adiciona checks de subscription
- [ ] O commit NÃO adiciona payment features
- [ ] O commit NÃO adiciona Redis/Upstash
- [ ] As mudanças são compatíveis com versão self-hosted
- [ ] Não há dependências com commits que devem ser evitados
- [ ] Código foi revisado manualmente

---

## 📊 Estatísticas de Mudanças

### Dependências

| Categoria | Adicionadas | Removidas |
|-----------|-------------|-----------|
| AI/ML | 5 | 1 |
| Database | 1 | 2 |
| UI/3D | 4 | 1 |
| Utils | 8 | 0 |
| **Total** | **18** | **4** |

### Commits por Categoria

| Tipo | Quantidade |
|------|-----------|
| Features | ~120 |
| Fixes | ~180 |
| Refactors | ~80 |
| Chores/Docs | ~193 |
| **Total** | **573** |

---

## 🎯 Próximos Passos

1. **Revisar este documento** e priorizar mudanças
2. **Criar branch de teste** para aplicar cherry-picks
3. **Testar extensivamente** cada mudança
4. **Atualizar CLAUDE.md** com novas modificações
5. **Documentar no CHANGELOG** todas mudanças trazidas

---

## 📝 Notas Adicionais

### Conflitos Esperados

Ao fazer cherry-pick, espere conflitos em:
- `ai/providers.ts` (muito modificado localmente)
- `lib/auth.ts` (payments comentados)
- `lib/subscription.ts` (hardcoded para Pro)
- `package.json` (porta customizada 8931)

### Resolução de Conflitos

1. Sempre manter modificações self-hosted
2. Não reativar checks de subscription
3. Não reativar payments
4. Preservar porta 8931
5. Quando em dúvida, priorizar funcionamento self-hosted

---

**Fim do Relatório**

*Gerado automaticamente por Claude Code em 2026-01-17*
