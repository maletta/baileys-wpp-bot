# Guia de Contribuição

## Fluxo de Desenvolvimento

### Branch Naming

- `feature/[descrição-curta]` - Novas funcionalidades
- `fix/[descrição-do-bug]` - Correções de bugs
- `docs/[tipo-de-doc]` - Atualizações de documentação
- `refactor/[área-refatorada]` - Refatorações sem mudança de comportamento
- `test/[área-testada]` - Adição/melhoria de testes

### Commit Messages

Seguir padrão Conventional Commits:

```
tipo(escopo): descrição curta

Descrição mais detalhada se necessário

- Detalhe 1
- Detalhe 2

Closes #123
```

**Tipos válidos:**

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Tarefas de build, deps, etc.

### Pull Request Process

1. **Antes de começar**

   - Criar issue descrevendo a mudança
   - Discutir abordagem se necessário
   - Criar branch a partir de `main`

2. **Durante desenvolvimento**

   - Seguir style guides do projeto
   - Adicionar testes para novas funcionalidades
   - Manter cobertura de testes acima de 80%
   - Documentar mudanças significativas

3. **Antes do PR**

   - Executar `npm run lint`
   - Executar `npm run test`
   - Executar `npm run type-check`
   - Testar em ambiente local

4. **Pull Request**

   - Título claro e descritivo
   - Descrição detalhada das mudanças
   - Screenshots se aplicável (frontend)
   - Linkar issues relacionadas
   - Marcar reviewers apropriados

5. **Review Process**
   - Pelo menos 1 aprovação necessária
   - CI/CD deve passar completamente
   - Resolver todos os comentários
   - Merge somente após aprovação

## Configuração do Ambiente

### Pré-requisitos

- Node.js v22.20.0 LTS+
- npm ou yarn
- PostgreSQL
- MongoDB
- Firebase account (para uploads)
- Google OAuth credentials

### Setup Inicial

```bash
# Clone do repositório
git clone [url-do-repo]
cd whatsapp-baileys-IA

# Instalação de dependências
npm install

# Configuração de ambiente
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Setup do banco de dados
npm run db:push
npm run db:generate

# Executar em desenvolvimento
npm run dev
```

### Variáveis de Ambiente

Consultar arquivos `.env.example` em cada app para configurações necessárias.

## Padrões de Código

### TypeScript

- Tipagem estrita obrigatória
- Evitar `any` quando possível
- Interfaces para objetos complexos
- Enums para constantes agrupadas

### Backend

- Classes para lógica de negócio
- Padrões SOLID
- Injeção de dependência
- Error handling consistente
- Logs estruturados

### Frontend

- Componentes funcionais
- Hooks para lógica
- Context API para estado global
- Validação com Zod
- Responsividade mobile-first

### Database

- CamelCase para colunas
- Migrations para mudanças
- Seeds para dados iniciais
- Soft delete quando apropriado

## Testes

### Backend

```bash
npm run test:backend
npm run test:backend:watch
npm run test:backend:coverage
```

### Frontend

```bash
npm run test:frontend
npm run test:frontend:watch
npm run test:frontend:e2e
```

### Padrões de Teste

- AAA (Arrange, Act, Assert)
- Nomes descritivos
- Setup/teardown adequado
- Mocks para dependências externas
- Testes determinísticos

## Documentação

### Código

- JSDoc para funções públicas
- README em cada diretório importante
- Comentários para lógica complexa
- ADRs para decisões arquiteturais

### Features

- Usar template em `specs/feature-template.md`
- Documentar APIs com exemplos
- Atualizar docs/architecture.md se necessário

## Questões e Suporte

### Reportar Bugs

1. Verificar se já existe issue similar
2. Usar template de bug report
3. Incluir steps to reproduce
4. Adicionar logs/screenshots relevantes

### Solicitar Features

1. Usar template de feature request
2. Justificar necessidade/valor
3. Descrever comportamento esperado
4. Considerar alternativas

### Obter Ajuda

- Issues com label "question"
- Documentação em `/docs`
- Código de exemplo em `/examples`

## Política de Merge

- **Squash merge** para features pequenas
- **Merge commit** para features grandes com múltiplos commits relevantes
- **Rebase** não recomendado para branches compartilhadas
- Delete branch após merge
- Atualizar CHANGELOG.md em releases
