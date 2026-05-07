# Plano de ação — formulário público e autorização de participante (sem Google obrigatório)

Este documento fraciona o trabalho em **fases executáveis** no Cursor, alinhadas à arquitetura atual (Express + camadas domain / application / infrastructure / presentation, Prisma, Next.js).

**Convenções do repositório a manter**

- Novos casos de uso em `application/use-cases/`, repositórios com interfaces em `domain/interfaces/repositories/`, implementação Prisma em `infrastructure/repositories/`.
- Rotas em `presentation/routes/`, controllers finos, validação com **Zod** + limites de payload (regras OWASP do workspace).
- **Rate limiting** nos endpoints públicos; logs de eventos de segurança sem dados sensíveis (não logar OTP completo, telefone completo apenas se necessário e mascarado).
- JWT Google existente (`userId`); novo JWT temporário com `participantId` + claim explícita de tipo (ex.: `authKind: 'participant_session'`) e **segredo dedicado** ou prefixo de validação no middleware (evitar confundir com token de usuário).

---

## Fase 0 — Modelagem e base de dados (parcialmente feita)

| ID | Tarefa | Detalhes |
|----|--------|----------|
| 0.1 | Tabela `participant_temporary_tokens` | Armazena OTP/autorização **somente** vinculada a `ParticipantsWpp` (sem `User`). |
| 0.2 | Enums | `ParticipantTemporaryTokenType` (ex.: `AUTHORIZE_PARTICIPANT`), `ParticipantAuthorizationContext` (ex.: `PUBLIC_FORM`). |
| 0.3 | Migração / `db push` | Aplicar no ambiente de desenvolvimento; produção via pipeline habitual. |
| 0.4 | `ParticipantForm` 1:1 com participante | Ver decisões abaixo: **um formulário por participante**; grupo escolhido na UI **não** exige modelo “um form por grupo”. Opcional depois: coluna nullable `lastSelectedGroupId` só para lembrar último grupo no pré-preenchimento. |

**Decisões sugeridas (implementação futura)**

- Guardar **hash do OTP** (ex.: bcrypt) na tabela, nunca o código em claro.
- `deletedAt` para soft delete ao reenviar; `consumedAt` ao validar; `expiresAt` = 24h.
- Campo `lastSentAt` / `sendCount` (ou tabela de auditoria) para anti-abuso no reenvio.

---

## Fase 1 — Variáveis de ambiente e contratos

| ID | Tarefa | Detalhes |
|----|--------|----------|
| 1.1 | `APP_DISPLAY_NAME` | Nome exibido na mensagem WhatsApp de verificação. |
| 1.2 | `JWT_PARTICIPANT_SECRET` (ou derivado) | Assinatura separada do JWT de usuário Google. |
| 1.3 | TTL | JWT temporário 24h alinhado ao negócio; expiração do OTP/token na base 24h. |
| 1.4 | OpenAPI / tipos compartilhados | Contratos REST estáveis para o frontend (request/response Zod). |

---

## Fase 2 — Endpoints públicos (telefone + OTP)

| ID | Tarefa | Detalhes |
|----|--------|----------|
| 2.x | **Feito (backend):** `POST /api/public/participant-auth/request-otp`, `resend-otp`, `verify-otp` — hash bcrypt, DM Baileys, rate limit, JWT participante (`JWT_PARTICIPANT_SECRET`, `JWT_PARTICIPANT_EXPIRES_SEC`). |

---

## Fase 3 — Middleware e autorização híbrida

| ID | Tarefa | Detalhes |
|----|--------|----------|
| 3.1 | `authenticateParticipantSession` | **`HybridParticipantAuthMiddleware.authenticateParticipantSession`** — valida só JWT OTP (`JWT_PARTICIPANT_SECRET`), injeta `req.participantSession.participantId`; confere existência em `participants_wpp`. |
| 3.2 | `authenticateUserOrParticipant` | **`authenticateUserOrParticipant`** — tenta primeiro JWT participante, depois JWT Google + `ParticipantUserLink` ativo; injeta `req.participantPortal`. **Rota:** `GET /api/participant-portal/session` (diagnóstico / bootstrap do front). |
| 3.3 | RBAC | Rotas admin inalteradas (`AuthMiddleware` + papéis). |

---

## Fase 4 — Grupos e formulário (backend)

| ID | Tarefa | Detalhes |
|----|--------|----------|
| 4.1 | `GET /api/participant-portal/groups` | Lista grupos distintos onde algum dos participantes autorizados é membro ativo (`deleted = false`). |
| 4.2 | Schema `ParticipantForm` | `@@unique([idParticipantWpp])`, `sendFormMessageToGroup` (default `true`). |
| 4.3 | `GET /api/participant-portal/form` | Query opcional `participantId` (obrigatório se JWT Google com vários vínculos). Foto em URL `/uploads/...`. |
| 4.4 | `PUT /api/participant-portal/form` | `multipart/form-data`, campo opcional `photo`; inclui **`favoriteActivity`** (rolê favorito). |
| 4.5 | Envio ao grupo | Valida membership **antes** de gravar; mensagem com legenda + imagem (Baileys `sendGroupFormMessage`); avisos se offline/falha após save. |

**Estáticos:** `GET /uploads/...` servido a partir de `./uploads` (pasta criada ao arranque).

---

## Fase 5 — Frontend (Next.js)

| ID | Tarefa | Detalhes |
|----|--------|----------|
| 5.1–5.3 | **Feito:** `/formulario` multi-step (telefone + OTP + formulário); JWT em `sessionStorage` + reabertura com sessão válida. |
| 5.2 | **Opcional:** `libphonenumber-js` / máscara por país (bundle). |
| 5.4–5.5 | **Feito:** etapa formulário com React Hook Form + Zod; grupos + preview; Instagram com prefixo visual; switch envio ao grupo (desativado sem grupos); `PUT` multipart para `/api/participant-portal/form` incl. `favoriteActivity`. |
| 5.6 | Parcial: erros de validação no formulário; fluxo OTP mantém mensagens genéricas. |

---

## Fase 6 — Testes e endurecimento

| ID | Tarefa | Detalhes |
|----|--------|----------|
| 6.1 | Testes unitários | Normalização de telefone, hashing OTP, emissão/validação JWT. |
| 6.2 | Testes de integração | Fluxo request → verify com DB em memória ou test container (se existir padrão no repo). |
| 6.3 | Revisão de segurança | Rate limit, tamanho máximo de body, headers, CORS para origem do front. |

---

## Decisões de produto (alinhadas)

1. **Formulário**: **um `ParticipantForm` por participante** (global). O select de grupo na UI serve para definir **para qual grupo** enviar a mensagem quando a opção estiver marcada, não para multiplicar linhas de formulário por grupo.
2. **Telefone (OTP / request)**: o match na base é contra **`ParticipantsWpp.cellphone`** em formato **somente dígitos** (ex.: `5511982653547`). `whatsappRegistry` segue o padrão JID (ex.: `5511982653547@s.whatsapp.net`) e **não** é o campo principal de lookup nesse fluxo.
3. **Mensagem no grupo**: envio **somente** para o **grupo selecionado no formulário** naquele submit, **nunca** broadcast para todos os grupos do participante. O backend deve confirmar **membro ativo** nesse grupo antes de enviar.

---

## Backlog (após fechar o escopo atual)

1. **Fotos do formulário**: substituir gravação em `./uploads` + `GET /uploads` por **armazenamento em serviço de imagens** (ex.: S3, Cloudflare R2, Cloudinary). Manter em `photoUrl` apenas a **URL pública** (ou chave + CDN); remover dependência de ficheiros estáticos locais em produção.

---

## Como usar este plano no Cursor

- Abra uma **fase** por sessão (ex.: “Implementar Fase 2.1–2.2”).
- Cole o trecho da tabela correspondente no prompt e referencie arquivos existentes (`AuthController`, `BaileysSocketService`, repositórios).
- Após cada fase: `npm run type-check` nos workspaces afetados e smoke manual do fluxo.

---

## Estado de implementação

| Fase | Status |
|------|--------|
| 0.1–0.3 | **Feito:** modelos `ParticipantTemporaryToken`, enums e `prisma db push` no ambiente local; SQL espelhado em `apps/backend/prisma/migrations/005_participant_temporary_tokens.sql` para quem aplicar migrations manualmente. |
| 2 (backend OTP) | **Feito:** rotas `/api/public/participant-auth/*`, envio DM, JWT participante; índice `cellphone` + SQL `006_participants_wpp_cellphone_idx.sql`. |
| 3 (middleware híbrido) | **Feito:** `hybridParticipantAuthMiddleware.ts`, `GET /api/participant-portal/session`. |
| 4 (grupos + formulário) | **Feito:** portal `GET/PUT /form`, `GET /groups`, `favoriteActivity`, `sendFormMessageToGroup`, unique participante; **pendente (ver Backlog):** CDN para fotos em vez de `/uploads` local. |
| 5 (frontend portal) | **Feito (núcleo):** fluxo `/formulario` até salvar com portal API; pendente **5.2** (telefone com libphonenumber) e endurecimento **5.6** / cookie httpOnly se desejado. |
| 1, 6+ | Pendente |
