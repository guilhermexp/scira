# Análise de Migração: Better Auth → Clerk

**Data:** 2026-01-17
**Status:** Análise de Viabilidade
**Complexidade Estimada:** 🔴 Alta (7-10 dias de trabalho)

## Índice
1. [Resumo Executivo](#resumo-executivo)
2. [Estado Atual (Better Auth)](#estado-atual-better-auth)
3. [Comparação: Better Auth vs Clerk](#comparação-better-auth-vs-clerk)
4. [Pontos de Integração](#pontos-de-integração)
5. [Análise de Viabilidade](#análise-de-viabilidade)
6. [Plano de Migração](#plano-de-migração)
7. [Riscos e Mitigações](#riscos-e-mitigações)
8. [Recomendação](#recomendação)

---

## Resumo Executivo

### ✅ Viável? **SIM** - Mas com ressalvas importantes

A migração do Better Auth para Clerk é **tecnicamente viável**, mas envolve:
- **Complexidade Alta**: 27+ arquivos afetados
- **Mudança de Paradigma**: Self-hosted → SaaS gerenciado
- **Custos**: Gratuito até 10k MAU, depois $25/mês
- **Benefícios**: Melhor UX, menos manutenção, mais features

### Impacto Estimado
| Área | Impacto | Esforço |
|------|---------|---------|
| Schema do Banco | 🔴 Alto | 3-4 dias |
| Código Frontend | 🟡 Médio | 2-3 dias |
| APIs/Backend | 🟡 Médio | 2-3 dias |
| Testes | 🟡 Médio | 1-2 dias |
| **TOTAL** | 🔴 **Alto** | **7-10 dias** |

---

## Estado Atual (Better Auth)

### Implementação Atual

#### Arquivo Principal: `lib/auth.ts` (476 linhas)
```typescript
export const auth = betterAuth({
  rateLimit: { max: 50, window: 60 },
  cookieCache: { enabled: true, maxAge: 5 * 60 },
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: 'pg' }),

  // Features ativas:
  emailVerification: { sendOnSignUp: true },
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: { ... },
    google: { ... },
    twitter: { ... },
    microsoft: { ... },
  },
  plugins: [
    magicLink({ ... }),
    // Polar & DodoPayments - COMENTADOS (self-hosted)
  ],
})
```

#### Schema do Banco (4 tabelas core)
```typescript
// lib/db/schema.ts
export const user = pgTable('user', {
  id, name, email, emailVerified, image, createdAt, updatedAt
})

export const session = pgTable('session', {
  id, expiresAt, token, ipAddress, userAgent, userId
})

export const account = pgTable('account', {
  id, accountId, providerId, userId,
  accessToken, refreshToken, idToken,
  accessTokenExpiresAt, refreshTokenExpiresAt, scope, password
})

export const verification = pgTable('verification', {
  id, identifier, value, expiresAt
})
```

#### Cliente (Frontend): `lib/auth-client.ts`
```typescript
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [magicLinkClient()],
})

export const { signIn, signOut, signUp, useSession } = authClient
```

### Features em Uso

#### ✅ Autenticação
- [x] Email + Password
- [x] Magic Link (via email)
- [x] OAuth: GitHub, Google, Twitter, Microsoft
- [x] Email verification
- [x] Password reset

#### ✅ Sessão
- [x] Cookie-based sessions
- [x] Session caching (5 min)
- [x] Rate limiting (50 req/min)
- [x] IP tracking
- [x] User agent tracking

#### ✅ Banco de Dados
- [x] Drizzle ORM adapter
- [x] PostgreSQL (Neon)
- [x] Custom schema com relacionamentos

#### ❌ Desabilitado (Self-Hosted)
- [ ] Polar payments
- [ ] DodoPayments
- [ ] Subscription webhooks

---

## Comparação: Better Auth vs Clerk

### Feature Matrix

| Feature | Better Auth | Clerk | Notas |
|---------|-------------|-------|-------|
| **Autenticação** |
| Email + Password | ✅ Self-hosted | ✅ SaaS | - |
| Magic Link | ✅ Plugin | ✅ Nativo | - |
| OAuth (GitHub/Google/Twitter) | ✅ Manual setup | ✅ 1-click | Clerk mais fácil |
| Passwordless (SMS) | ❌ | ✅ | Clerk advantage |
| Multi-factor (2FA) | ❌ | ✅ | Clerk advantage |
| Passkeys/WebAuthn | ❌ | ✅ | Clerk advantage |
| **UI/UX** |
| Componentes prontos | ❌ Custom | ✅ Pré-feitos | Clerk MUITO melhor |
| Customização | ✅ Total | 🟡 Limitada | Better Auth vence |
| Temas | ❌ Manual | ✅ Dark/Light | - |
| **Infraestrutura** |
| Hosting | ✅ Self-hosted | ❌ SaaS only | - |
| Banco de dados | ✅ Seu controle | ❌ Clerk-managed | - |
| Rate limiting | ✅ Custom | ✅ Automático | - |
| Email delivery | 🟡 Resend | ✅ Incluído | Clerk inclui emails |
| **Avançado** |
| Webhooks | ✅ Manual | ✅ Pré-configurado | - |
| Organizations/Teams | ❌ | ✅ | Clerk advantage |
| RBAC | 🟡 Manual | ✅ Nativo | Clerk advantage |
| Session management | ✅ Custom | ✅ Automático | - |
| **Custos** |
| Free tier | ✅ Unlimited | ✅ 10k MAU | - |
| Paid | ❌ $0 | 🔴 $25/mês | Better Auth vence |
| **Developer Experience** |
| Setup inicial | 🟡 Complexo | ✅ Rápido | Clerk vence |
| Manutenção | 🔴 Manual | ✅ Zero | Clerk MUITO melhor |
| Docs | 🟡 Médio | ✅ Excelente | - |
| TypeScript | ✅ | ✅ | - |

### Prós e Contras

#### Better Auth (Atual)
**Prós:**
- ✅ **Controle total** do código e dados
- ✅ **Sem custos** mensais
- ✅ **Self-hosted** (privacidade)
- ✅ **Flexibilidade** máxima
- ✅ **Schema customizado** já integrado

**Contras:**
- ❌ **Manutenção manual** (atualizações, segurança)
- ❌ **UI/UX** precisa ser construída
- ❌ **Features limitadas** (sem 2FA, passkeys, orgs)
- ❌ **Complexidade** de setup e debugging
- ❌ **Email delivery** separado (Resend)

#### Clerk (Proposto)
**Prós:**
- ✅ **UI pronta** e bonita (SignIn, SignUp, UserProfile)
- ✅ **Features avançadas** (2FA, passkeys, orgs)
- ✅ **Manutenção zero** (managed service)
- ✅ **Email delivery** incluído
- ✅ **Webhooks** configurados
- ✅ **Developer experience** superior
- ✅ **Segurança** gerenciada

**Contras:**
- ❌ **Custo** ($25/mês após 10k MAU)
- ❌ **Vendor lock-in** (dependência do SaaS)
- ❌ **Controle limitado** de dados
- ❌ **Customização** UI mais restrita
- ❌ **Migração complexa** de dados existentes
- ❌ **Hospedagem externa** (não self-hosted)

---

## Pontos de Integração

### Arquivos Afetados (27 arquivos)

#### 🔴 Críticos (Reescrita total)
1. **`lib/auth.ts`** (476 linhas) - Setup completo
2. **`lib/auth-client.ts`** (20 linhas) - Cliente React
3. **`lib/auth-utils.ts`** - Utilities
4. **`lib/user-data-server.ts`** - Server-side user data
5. **`lib/subscription.ts`** - Subscription logic (integrado com auth)
6. **`app/api/auth/[...all]/route.ts`** - API route handler

#### 🟡 Modificação Média
7. **`app/(auth)/sign-in/page.tsx`** - Login page
8. **`app/(auth)/sign-up/page.tsx`** - Signup page
9. **`components/auth-card.tsx`** - Auth UI component
10. **`components/user-profile.tsx`** - User profile
11. **`components/settings-dialog.tsx`** - Settings
12. **`app/actions.ts`** (2,661 linhas) - Server actions
13. **`app/settings/page.tsx`** - Settings page
14. **`app/search/[id]/page.tsx`** - Chat page

#### 🟢 Modificação Leve (imports)
15-27. Outros 13 arquivos (imports e hooks)

### Database Schema Impact

#### ❌ Tabelas a REMOVER
```sql
-- Better Auth específico
DROP TABLE verification;
DROP TABLE account;    -- Clerk gerencia OAuth internamente
DROP TABLE session;    -- Clerk gerencia sessões
```

#### 🔄 Tabelas a MODIFICAR
```sql
-- user table - simplificar
ALTER TABLE user
  DROP COLUMN emailVerified;  -- Clerk gerencia isso
  -- Manter: id, name, email, image, createdAt, updatedAt
```

#### ✅ Manter Intacto
```sql
-- Business logic tables
chat, message, stream, extremeSearchUsage, messageUsage,
customInstructions, lookout, payment, subscription
```

#### ➕ Adicionar (Opcional)
```sql
-- Para sincronizar com Clerk
CREATE TABLE clerk_user_metadata (
  userId TEXT PRIMARY KEY REFERENCES user(id),
  clerkUserId TEXT UNIQUE,  -- Clerk's user ID
  syncedAt TIMESTAMP
);
```

---

## Análise de Viabilidade

### ✅ Pontos Favoráveis

#### 1. Separação Clara
- ✅ Autenticação está **bem isolada** em `lib/auth*`
- ✅ Business logic **não mistura** com auth logic
- ✅ Schema do banco **separado** (user vs business tables)

#### 2. Clerk SDK Robusto
```typescript
// Clerk equivalente ao Better Auth
import { ClerkProvider, SignIn, UserButton } from '@clerk/nextjs'
import { auth, currentUser } from '@clerk/nextjs/server'

// Muito mais simples!
export default function Page() {
  return (
    <ClerkProvider>
      <SignIn />
      <UserButton />
    </ClerkProvider>
  )
}
```

#### 3. Webhooks para Sincronização
```typescript
// Clerk webhook → Sync to local DB
app/api/webhooks/clerk/route.ts

export async function POST(req: Request) {
  const payload = await req.json()

  if (payload.type === 'user.created') {
    await db.insert(user).values({
      id: payload.data.id,
      email: payload.data.email_addresses[0].email_address,
      name: payload.data.first_name + ' ' + payload.data.last_name,
      image: payload.data.image_url,
    })
  }
}
```

### 🔴 Desafios Críticos

#### 1. Migração de Dados Existentes
**Problema:** Usuários atuais precisam ser migrados

**Soluções:**
- **Opção A (Recomendada):** Migração em duas fases
  1. Importar usuários existentes para Clerk via API
  2. Manter tabela `user` sincronizada via webhooks

- **Opção B:** Reset completo
  - Avisar usuários para re-criar contas
  - ⚠️ **Perda de dados** de histórico

#### 2. Self-Hosted → SaaS
**Problema:** Fork foi feito para ser **self-hosted**

**Conflito:**
- Better Auth = você controla tudo
- Clerk = terceiro controla autenticação

**Impacto:**
- ❌ Vai contra filosofia do fork
- ❌ Dados de autenticação em servidor externo
- ❌ Dependência de serviço pago

#### 3. Subscriptions Já Desabilitadas
**Problema:** Fork já **removeu** Polar/Dodo integrations

**Impacto:**
- Se usar Clerk, não precisa de pagamentos integrados mesmo
- Mas então, **qual o real benefício?**
- UI? Pode construir com Better Auth + shadcn

#### 4. Customização Limitada
**Problema:** Clerk UI é **opinativa**

```tsx
// Clerk - customização limitada
<SignIn
  appearance={{
    elements: { /* CSS limitado */ }
  }}
/>

// Better Auth - total controle
<form onSubmit={handleSignIn}>
  {/* Qualquer UI que você quiser */}
</form>
```

---

## Plano de Migração

Se decidir migrar, seguir estas fases:

### Fase 1: Setup e Preparação (1 dia)
1. Criar conta Clerk
2. Configurar OAuth providers
3. Configurar webhook endpoints
4. Instalar dependencies:
   ```bash
   npm install @clerk/nextjs
   npm uninstall better-auth better-auth/react better-auth/next-js
   ```

### Fase 2: Migração de Schema (2 dias)
1. Backup completo do banco
2. Criar script de migração:
   ```typescript
   // scripts/migrate-to-clerk.ts
   async function migrateUsers() {
     const users = await db.select().from(user)

     for (const u of users) {
       // Criar user no Clerk via API
       await clerkClient.users.createUser({
         emailAddress: [u.email],
         firstName: u.name.split(' ')[0],
         lastName: u.name.split(' ')[1],
         // password - avisar para reset
       })
     }
   }
   ```
3. Executar migração
4. Verificar sincronização
5. Remover tabelas antigas

### Fase 3: Código Frontend (2-3 dias)
1. Substituir `lib/auth-client.ts`:
   ```typescript
   // De:
   import { authClient } from '@/lib/auth-client'
   const { data: session } = authClient.useSession()

   // Para:
   import { useUser } from '@clerk/nextjs'
   const { user, isSignedIn } = useUser()
   ```

2. Atualizar páginas de auth:
   ```tsx
   // app/(auth)/sign-in/page.tsx
   import { SignIn } from '@clerk/nextjs'

   export default function Page() {
     return <SignIn />
   }
   ```

3. Substituir componentes customizados

### Fase 4: Backend/APIs (2-3 dias)
1. Atualizar server actions:
   ```typescript
   // app/actions.ts
   // De:
   import { auth } from '@/lib/auth'
   const session = await auth.api.getSession({ headers })

   // Para:
   import { auth } from '@clerk/nextjs/server'
   const { userId } = await auth()
   ```

2. Configurar middleware:
   ```typescript
   // middleware.ts
   import { clerkMiddleware } from '@clerk/nextjs/server'
   export default clerkMiddleware()
   ```

3. Webhook handler para sync:
   ```typescript
   // app/api/webhooks/clerk/route.ts
   export async function POST(req: Request) {
     const evt = await req.json()
     await syncUserToLocalDB(evt)
   }
   ```

### Fase 5: Testes (1-2 dias)
1. Teste de autenticação
2. Teste de OAuth providers
3. Teste de sincronização
4. Teste de permissões
5. Teste end-to-end

### Fase 6: Deploy (1 dia)
1. Deploy staging
2. Teste completo
3. Deploy production
4. Monitoramento

---

## Riscos e Mitigações

### 🔴 Riscos Altos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Perda de dados de usuários | 🟡 Média | 🔴 Alto | Backup + script de migração testado |
| Downtime durante migração | 🟢 Baixa | 🔴 Alto | Blue-green deployment |
| Custo mensal inesperado | 🟡 Média | 🟡 Médio | Monitorar MAU, planejar escalabilidade |
| Vendor lock-in | 🔴 Alta | 🟡 Médio | Manter abstraction layer |
| Problemas de sincronização | 🟡 Média | 🟡 Médio | Webhook retry logic + logging |

### 🟡 Riscos Médios

| Risco | Mitigação |
|-------|-----------|
| Bugs em produção | Testes extensivos, rollback plan |
| UX diferente confunde usuários | Comunicação prévia, tutorial |
| Customização insuficiente | Avaliar antes, POC com Clerk |

---

## Recomendação

### 🤔 Deveria migrar para Clerk?

**Resposta curta: DEPENDE do seu objetivo**

### ✅ Migre para Clerk SE:
1. **Velocidade** > Controle
   - Quer UI pronta e bonita
   - Não quer manter sistema de auth

2. **Features avançadas** são importantes
   - Precisa de 2FA, passkeys, organizations
   - Quer RBAC nativo

3. **Usuário final** é prioridade
   - UX de auth é crítica
   - Quer "just works" experience

4. **Custo não é problema**
   - Aceita $25/mês após 10k MAU
   - Valor do tempo > custo mensal

### ❌ NÃO migre para Clerk SE:
1. **Self-hosted** é requisito
   - Privacidade/compliance exige dados locais
   - Não quer dependência de terceiros

2. **Customização** é crítica
   - UI/UX muito específica
   - Integrações customizadas

3. **Custo** é sensível
   - Projeto pessoal/open-source
   - Crescimento pode gerar custos altos

4. **Better Auth já funciona**
   - Se não está quebrado, não conserte
   - Tempo melhor gasto em features

### 💡 Recomendação Final

**Para o fork Scira self-hosted:**

#### 🟢 MANTER Better Auth

**Razões:**
1. **Filosofia do fork** = self-hosted, sem pagamentos
2. **Already working** = funciona bem
3. **Custo zero** = importante para self-hosted
4. **Controle total** = alinhado com objetivos

**Mas melhorar:**
1. ✅ Construir UI melhor com shadcn/ui
2. ✅ Adicionar componentes de auth bonitos
3. ✅ Melhorar UX do login/signup
4. ✅ Documentar bem o setup

#### 🟡 Considerar Clerk Apenas Se:
- Criar versão **comercial/SaaS** do Scira
- Fork **mudar filosofia** para managed service
- **Contratar time** precisa auth pronto

---

## Alternativas Híbridas

### Opção C: Melhor dos Dois Mundos

**Manter Better Auth + Melhorar UI:**

```typescript
// Construir componentes bonitos com shadcn
// components/auth/sign-in-form.tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

export function SignInForm() {
  // UI linda + Better Auth backend
  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn}>
          <Input type="email" placeholder="Email" />
          <Input type="password" placeholder="Password" />
          <Button>Sign In</Button>
        </form>
        <Separator />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => signInWithGithub()}>
            <Github /> GitHub
          </Button>
          <Button variant="outline" onClick={() => signInWithGoogle()}>
            <Google /> Google
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Benefícios:**
- ✅ UI bonita (igual Clerk)
- ✅ Controle total (Better Auth)
- ✅ Custo zero
- ✅ Self-hosted

**Esforço:** 2-3 dias vs 7-10 dias de migração

---

## Conclusão

### Decisão Recomendada: ❌ NÃO MIGRAR (por enquanto)

**Justificativa:**
1. Better Auth está funcionando bem
2. Fork é self-hosted (conflita com Clerk SaaS)
3. Custo-benefício desfavorável
4. Esforço alto (7-10 dias) para benefício questionável
5. Pode melhorar UI sem migrar

### Próximos Passos Sugeridos:
1. ✅ **Melhorar UI atual** com shadcn (2-3 dias)
2. ✅ **Documentar auth setup** melhor
3. ✅ **Adicionar 2FA** se realmente necessário (há plugins)
4. ⏸️ **Reavaliar Clerk** se:
   - Criar versão SaaS comercial
   - Mudar filosofia do fork
   - Precisar de organizations/RBAC

---

**Nota Final:** Esta análise assume o contexto do **fork self-hosted**. Se o projeto evoluir para um **SaaS comercial**, a recomendação muda para **✅ MIGRAR para Clerk**.
