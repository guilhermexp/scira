# Sistema de Agentes Scira

**Última Atualização:** 2025-11-12
**Versão:** 1.0

## Visão Geral

Sistema multi-modo com agentes especializados. Cada modo = prompt específico + conjunto de ferramentas.

## Arquitetura

```
Usuário → Seleciona Modo → Backend aplica:
                            ├─ groupInstructions[modo] (system prompt)
                            └─ groupTools[modo] (ferramentas disponíveis)
                                    ↓
                            LLM executa com contexto específico
```

**Localização do código:**
- Modos e prompts: `app/actions.ts` (linhas 253-1410)
- Tools: `lib/tools/` (diretório)
- API handler: `app/api/search/route.ts`
- UI toggle: `components/ui/form-component.tsx` (linha 1503)

---

## Modos Disponíveis

### 1. Web (Padrão)
- **Prompt:** Motor de busca AI geral
- **Tools:** 14 ferramentas (web_search, weather, maps, translate, code_interpreter, etc)
- **Resposta:** Markdown conciso com citações inline
- **Requer login:** Não

### 2. Extreme
- **Prompt:** Pesquisador avançado - relatório de 3 páginas
- **Tools:** `extreme_search` apenas
- **Resposta:** Pesquisa profunda com 3x mais fontes
- **Requer login:** Sim
- **Funcionamento:**
  1. LLM cria plano de pesquisa (1-5 tópicos, 3-5 tarefas cada)
  2. Agente autônomo executa plano (limite: 15 ações)
  3. Usa webSearch (Exa), xSearch (Grok), codeRunner (Python)
  4. Retorna relatório extenso com citações obrigatórias

### 3. Academic
- **Prompt:** Assistente de pesquisa acadêmica
- **Tools:** academic_search, code_interpreter, datetime
- **Resposta:** Prosa acadêmica formal, citações com DOI
- **Formato citação:** `[Author et al. (Year) Title](URL)`

### 4. X (Twitter)
- **Prompt:** Expert em conteúdo X/Twitter
- **Tools:** x_search
- **Resposta:** Mix de listas, parágrafos, tabelas
- **Busca:** Grok-4 com suporte nativo a X search

### 5. Memory
- **Prompt:** Companheiro de memórias
- **Tools:** search_memories, add_memory, datetime
- **Resposta:** Tom amigável e pessoal
- **Requer login:** Sim

### 6. Chat
- **Prompt:** Conversação pura
- **Tools:** Nenhuma
- **Resposta:** Chat direto sem ferramentas

### 7. Reddit
- **Tools:** reddit_search, datetime
- **Prompt:** Especialista em conteúdo Reddit

### 8. YouTube
- **Tools:** youtube_search, datetime
- **Prompt:** Especialista em conteúdo YouTube

### 9. Stocks
- **Tools:** stock_chart, currency_converter, datetime
- **Prompt:** Analista financeiro

### 10. Crypto
- **Tools:** coin_data, coin_ohlc, coin_data_by_contract, datetime
- **Prompt:** Analista de criptomoedas

### 11. Code
- **Tools:** code_context
- **Prompt:** Assistente de contexto de código

### 12. Connectors
- **Tools:** connectors_search, datetime
- **Prompt:** Busca em Google Drive, Notion, OneDrive
- **Requer login:** Sim + Pro

---

## Ferramentas Disponíveis

### Busca e Conteúdo
| Tool | Descrição | Provider |
|------|-----------|----------|
| `web_search` | Busca web multi-query (3-5 queries paralelas) | Tavily/Exa/Firecrawl |
| `extreme_search` | Pesquisa profunda autônoma com planejamento | Exa + Firecrawl + Grok |
| `academic_search` | Busca papers acadêmicos | Exa |
| `x_search` | Busca posts no X/Twitter | Grok-4 (native) |
| `reddit_search` | Busca posts no Reddit | Reddit API |
| `youtube_search` | Busca vídeos no YouTube | YouTube API |
| `retrieve` | Extrai conteúdo de URL específica | Firecrawl |
| `mcp_search` | Busca via MCP (Model Context Protocol) | MCP |
| `connectors_search` | Busca em Drive/Notion/OneDrive | Supermemory |

### Mídia e Entretenimento
| Tool | Descrição | Provider |
|------|-----------|----------|
| `movie_or_tv_search` | Busca filmes/séries | TMDB |
| `trending_movies` | Filmes em alta | TMDB |
| `trending_tv` | Séries em alta | TMDB |

### Finanças
| Tool | Descrição | Provider |
|------|-----------|----------|
| `stock_chart` | Gráficos de ações | yfinance |
| `currency_converter` | Conversor de moedas | yfinance |
| `coin_data` | Dados de cripto | CoinGecko |
| `coin_ohlc` | OHLC de cripto | CoinGecko |
| `coin_data_by_contract` | Dados por contrato | CoinGecko |

### Localização e Clima
| Tool | Descrição | Provider |
|------|-----------|----------|
| `get_weather_data` | Dados de clima | OpenWeather |
| `find_place_on_map` | Busca lugares | Google Maps |
| `nearby_places_search` | Lugares próximos | Google Maps |

### Utilitários
| Tool | Descrição | Provider |
|------|-----------|----------|
| `code_interpreter` | Executa Python | Daytona Sandbox |
| `code_context` | Contexto de linguagens/frameworks | Interno |
| `text_translate` | Tradução de texto | Interno |
| `track_flight` | Rastreamento de voos | FlightAware |
| `datetime` | Data/hora atual | Sistema |
| `greeting` | Responde saudações | Interno |

### Memória
| Tool | Descrição | Provider |
|------|-----------|----------|
| `search_memories` | Busca memórias do usuário | Supermemory |
| `add_memory` | Adiciona memória | Supermemory |

---

## Fluxo de Execução

### 1. Modo Web (exemplo)
```
Usuário: "clima em São Paulo"
  ↓
Backend: getGroupConfig('web')
  ↓
System Prompt: "You are Scira, an AI search engine..."
Tools: [web_search, weather, maps, ...]
  ↓
LLM decide: usar get_weather_data
  ↓
Tool executa → retorna dados
  ↓
LLM formata resposta em markdown com citações
```

### 2. Modo Extreme (exemplo)
```
Usuário: "análise da IA em 2025"
  ↓
Backend: getGroupConfig('extreme')
  ↓
System Prompt: "You are an advanced research assistant..."
Tools: [extreme_search]
  ↓
LLM chama extreme_search
  ↓
Extreme Search:
  1. Grok-4 cria plano (5 tópicos, 15 tarefas)
  2. Agente executa:
     - webSearch("AI 2025 developments")
     - webSearch("AI market trends 2025")
     - xSearch("AI discussions")
     - ... (até 15 ações)
  3. Coleta 24-30 fontes
  ↓
LLM sintetiza em relatório de 3 páginas
```

---

## Características Técnicas

### Web Search (multi-query)
- **Paralelo:** 3-5 queries simultâneas
- **Providers:** Tavily (padrão), Exa, Firecrawl
- **Switch:** Baseado em `searchProvider` (localStorage)
- **Recency:** Inclui ano/data nas queries

### Extreme Search (autônomo)
- **Model:** Grok-4-Fast-Think
- **Planning:** `generateObject` com schema Zod
- **Execution:** `generateText` com `stopWhen(stepCountIs(totalTodos))`
- **Tools internos:**
  - `webSearch`: 8 resultados/query (Exa → Firecrawl fallback)
  - `xSearch`: Grok-4 native X search (15 resultados)
  - `codeRunner`: Python sandbox (Daytona)
- **Limites:** Max 15 ações + 2 extras para erros
- **Content extraction:** 3000 chars max por fonte

### Code Interpreter
- **Sandbox:** Daytona
- **Libs disponíveis:** pandas, numpy, scipy, keras, seaborn, matplotlib, transformers, scikit-learn
- **Install on-demand:** Detecta imports e instala libs faltantes
- **Charts:** Suporte a visualizações (PNG removido do output)

---

## Limitações

### 1. Extreme Search
- Limite rígido de 15 ações (pode ser insuficiente para pesquisas muito complexas)
- Sem controle manual do plano (100% autônomo)
- Não reutiliza resultados entre queries similares
- Python libs limitadas (não instala qualquer pacote)

### 2. Web Search
- Máximo 5 queries paralelas
- Dependente de providers externos (Exa/Tavily downtime = falha)
- Firecrawl como fallback nem sempre funciona (paywall, JS dinâmico)

### 3. X Search
- Depende 100% do Grok-4 (sem fallback)
- Limitado a 15 resultados por query
- Requer API key da xAI

### 4. Geral
- **Sem streaming de tool calls:** Usuário não vê progresso das ferramentas em tempo real
- **1 tool por turno (Web mode):** Regra artificial pode limitar eficiência
- **Sem retry logic:** Falha de tool = resposta incompleta
- **Sem caching:** Queries idênticas refazem requests
- **Rate limits não robustos:** Self-hosted = unlimited, mas providers externos têm limites

### 5. Memory/Connectors
- Dependente de Supermemory (placeholder = feature desabilitada)
- Sem sincronização em tempo real

---

## Pontos de Melhoria

### Alta Prioridade

1. **Streaming de tool calls**
   - Mostrar progresso de cada tool em tempo real
   - UI: "🔍 Buscando... (3/5 queries completas)"

2. **Retry logic com fallbacks**
   - Tool falhou → tentar provider alternativo
   - Exemplo: Exa down → automaticamente usar Tavily

3. **Cache de resultados**
   - Redis cache para queries repetidas (TTL: 1h)
   - Reduzir custos de API e latência

4. **Remoção do limite "1 tool/turno" no Web mode**
   - Permitir múltiplas tools quando faz sentido
   - Exemplo: weather + maps em uma resposta

5. **Extreme Search: plano editável**
   - UI para revisar/editar plano antes da execução
   - Botão "Reprovar plano e gerar novo"

### Média Prioridade

6. **Multi-provider search com scoring**
   - Executar Exa + Tavily + Firecrawl em paralelo
   - Deduplicar e rankear resultados

7. **Tool execution em paralelo (Extreme mode)**
   - Múltiplas webSearch queries simultâneas
   - Reduzir tempo total de pesquisa

8. **Histórico de plans (Extreme mode)**
   - Salvar plans gerados no DB
   - Permitir reutilizar plans similares

9. **Monitoring e observability**
   - Logs estruturados de tool calls
   - Métricas: tempo de execução, taxa de sucesso, custos

10. **Custom instructions por modo**
    - Usuário pode customizar system prompt de cada modo
    - Salvo no DB (tabela `custom_instructions`)

### Baixa Prioridade

11. **Modo híbrido**
    - Web + Extreme: busca rápida → se insuficiente → trigger extreme
    - Auto-switch baseado em confiança da resposta

12. **Tool chaining automático**
    - LLM detecta necessidade de múltiplas tools
    - Executa chain: web_search → retrieve → code_interpreter

13. **Suporte a mais search providers**
    - Brave Search, Bing, Google Custom Search
    - Configurável via settings

14. **Extreme Search: suporte a branches**
    - Plan com paths alternativos
    - Execução condicional baseada em resultados

15. **Memory: auto-save**
    - LLM detecta info importante → salva sem pedir
    - Usuário pode desabilitar via settings

---

## Configuração dos Modos

**Código:** `app/actions.ts`

```typescript
// Linha 253: Ferramentas por modo
const groupTools = {
  web: ['web_search', 'greeting', 'weather', ...],
  extreme: ['extreme_search'],
  // ...
}

// Linha 285: Prompts por modo
const groupInstructions = {
  web: `You are Scira, an AI search engine...`,
  extreme: `You are an advanced research assistant...`,
  // ...
}

// Linha 1413: Função que retorna config
export async function getGroupConfig(groupId) {
  const tools = groupTools[groupId];
  const instructions = groupInstructions[groupId];
  return { tools, instructions };
}
```

**Aplicação no backend:** `app/api/search/route.ts` (linha ~300)

```typescript
const { tools, instructions } = await getGroupConfig(group);

const result = streamText({
  model: scira.languageModel(model),
  system: instructions,  // ← Prompt específico
  tools: tools,          // ← Ferramentas específicas
  messages: messages,
});
```

---

## Alternar Modos na UI

**Código:** `components/ui/form-component.tsx` (linha 1503)

```typescript
const handleToggleExtreme = useCallback(() => {
  if (isExtreme) {
    // Extreme → Web
    onGroupSelect(webGroup);
  } else {
    // Web → Extreme
    if (!session) window.location.href = '/sign-in';
    else onGroupSelect(extremeGroup);
  }
}, [isExtreme, session]);
```

**Botão:** Ícone de átomo (AtomicPowerIcon) ao lado do seletor de modo

---

## Resumo Executivo

| Aspecto | Status |
|---------|--------|
| **Modos disponíveis** | 12 (Web, Extreme, Academic, X, Memory, Chat, Reddit, YouTube, Stocks, Crypto, Code, Connectors) |
| **Total de tools** | 32+ ferramentas |
| **Providers externos** | 15+ (Exa, Tavily, Firecrawl, Grok, TMDB, yfinance, OpenWeather, etc) |
| **Extreme Search** | Pesquisa autônoma com planejamento (até 15 ações, 3x mais fontes) |
| **Maior limitação** | Dependência de providers externos sem fallbacks robustos |
| **Maior força** | Sistema multi-modo flexível com especialização por domínio |
| **Prioridade #1** | Implementar streaming de tool calls e retry logic |

---

**Documentação relacionada:**
- [Quick Start](../ai_quickstart.md)
- [MCP Search Integration](./MCP_SEARCH_INTEGRATION.md)
- [Project Guidelines](../CLAUDE.md)
