# Estratégia de modelos de IA (qualidade + Cursor)

Este documento implementa a política acordada para desenvolvimento assistido por IA neste repositório: **prioridade em qualidade**, uso **principalmente no Cursor**, e papéis distintos por camada de modelo.

## 1. User story piloto para baseline entre modelos (Camada 1)

Use **sempre o mesmo escopo** ao comparar dois modelos da Camada 1 (`claude-4-sonnet`, `gpt-5.2-xhigh`, `gpt-5.2-high`, `claude-4.5-haiku-thinking`). Evita comparar “laranja com maçã”.

### US-PILOTO-001 — Comando `/pause` + persistência + CRM

**Objetivo**: Um operador autenticado pausa o processamento de comandos de texto de automação para uma sessão/conexão WhatsApp identificada; o estado persiste e aparece na área administrativa (CRM).

**Fluxo principal**

1. Usuário envia mensagem de texto no WhatsApp com o comando `/pause` (ou prefixo acordado pelo projeto).
2. O backend valida sessão, permissões e idempotência; atualiza o estado “automação pausada” para o escopo correto (ex.: sessão/jid).
3. A API expõe leitura do estado para o frontend autenticado.
4. Uma tela do CRM/admin lista ou detalha conexões e mostra indicador “pausado / ativo”.

**Critérios de aceite mínimos**

- Comando tratado no fluxo Baileys sem bloquear o socket inteiro indevidamente.
- Persistência clara (qual entidade/campo; migração ou uso de modelo existente documentado).
- Autorização alinhada ao RBAC do projeto (não expor estado a usuário errado).
- Resposta ao usuário no WhatsApp confirmando pausa (ou erro explícito).
- UI mínima mas funcional no frontend alinhada ao design system existente.

**Entregáveis para comparação justa**

- Mesmo conjunto de arquivos tocados em espírito: handler de mensagens, serviço de domínio, persistência, rota(s), componente(s) de UI, testes onde o projeto exige.
- Mesmo nível de instrução no prompt (colar o mesmo enunciado para cada modelo).

### Rubrica de comparação (preencher após cada execução)

| Critério | Peso | Modelo A (nota 1–5) | Modelo B (nota 1–5) | Notas |
| -------- | ---- | ------------------- | ------------------- | ----- |
| Consistência TypeScript e camadas (domain/app/infra) | Alto | | | |
| Tratamento Baileys (async, erros, sem travar fluxo) | Alto | | | |
| Segurança (RBAC, sem vazar dados internos na API) | Alto | | | |
| Retrabalho necessário após implementação (1=pouco, 5=muito) | Alto | | | invertido: menor é melhor |
| Testes / observabilidade alinhados ao projeto | Médio | | | |
| Clareza da UX no CRM (estado visível) | Médio | | | |

**Como registrar**: salve uma cópia desta tabela em issue ou nota de sprint com os slugs exatos (ex.: `claude-4-sonnet` vs `gpt-5.2-xhigh`) e data.

---

## 2. Defaults no Cursor (dia a dia vs. milestones)

| Situação | Modelo recomendado | Observação |
| -------- | ------------------ | ---------- |
| Implementação contínua no mesmo repositório | **composer-2** | Motor principal do agente no Cursor para features multi-arquivo. |
| Micro-ajustes (rename, fix local, uma tela pequena) | **composer-2-fast** | Não substitui o desenho do núcleo WhatsApp/CRM sozinho. |
| Milestones de arquitetura (schema CRM, máquina de comandos, integrações novas) | **claude-4-sonnet** ou **gpt-5.2-xhigh** | Escolha um; **xhigh** quando o erro custa caro. |
| Debug conceitual (invariantes, estados, comandos) | **claude-4.5-haiku-thinking** | Quando “pensar antes” importa mais que velocidade. |
| Blocos grandes de código / refactors com foco em diff | **gpt-5.3-codex-spark-preview-high** ou **-xhigh** | Ver secção 3 (preview). |
| Implementação focada em código com arquitetura já fechada | **gpt-5.2-codex** | |

### Fluxo sugerido

1. Milestone ou decisão crítica → **Sonnet** ou **gpt-5.2-xhigh**.
2. Implementação no Cursor → **composer-2**.
3. Refactor pesado de código → **codex-spark** / **gpt-5.2-codex** (com validação).
4. Antes de merge em área crítica → de novo **Camada 1** (revisão ou passagem focada).

### Checklist obrigatório antes de merge em núcleo WhatsApp

Independentemente do modelo que implementou, validar explicitamente:

- Reconexão e ciclo de vida do socket Baileys.
- Deduplicação / idempotência de mensagens e comandos.
- Rate limiting ou proteção contra abuso em comandos de texto.
- Logs sem dados sensíveis (telefone completo, tokens), conforme políticas do projeto.

Para essa revisão final, usar **claude-4-sonnet** ou **gpt-5.2-xhigh**.

---

## 3. Política para modelos “preview” (experimental)

Os seguintes modelos são **experimentais** até validação explícita no stack Baileys + este monorepo:

- **gpt-5.3-codex-spark-preview** (todas as variantes: `high`, `xhigh`, etc.)
- **gemini-3.1-pro-preview**

**Regras**

1. **Não** basar sozinhos decisões irreversíveis (schema de banco, contratos públicos de API, modelo de permissões) sem revisão por **Camada 1** (`claude-4-sonnet` ou `gpt-5.2-xhigh` / `gpt-5.2-high`).
2. **gemini-3.1-pro-preview**: útil para auditorias com **contexto muito longo**; após mudanças relevantes, confirmar comportamento com testes e revisão humana ou Camada 1.
3. Slugs preview podem mudar entre atualizações da plataforma; revalidar política periodicamente.

### Modelos de volume (uso restrito)

**gpt-5.4-mini-\***, **gpt-5.2-fast**, **claude-4.5-haiku** (sem `thinking`): apenas scaffolding, testes repetitivos ou CRUD simples — **não** como única linha para estado do WhatsApp ou regras do CRM.

---

## 4. Referência cruzada

- Arquitetura geral: [architecture.md](./architecture.md)
- Template de feature: [specs/feature-template.md](../specs/feature-template.md)
- Regras Cursor: [.cursor/rules/ai-models.mdc](../.cursor/rules/ai-models.mdc)
