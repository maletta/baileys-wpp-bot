# Feature: [Nome da Feature]

## Objetivo

Descrever em 2-3 linhas o que esta feature visa resolver e qual valor entrega para o usuário.

## Fluxo Principal

1. [Passo 1: Ação inicial do usuário]
2. [Passo 2: Sistema processa]
3. [Passo 3: Validações necessárias]
4. [Passo 4: Ação do sistema]
5. [Passo 5: Resultado final para o usuário]

## Regras de Negócio

- **RN01**: [Regra específica com código]
- **RN02**: [Outra regra importante]
- **RN03**: [Validações necessárias]

## Modelos/Dados

### Entidades Envolvidas

- [Entidade 1]: descrição breve
- [Entidade 2]: descrição breve

### DTOs/Interfaces

```typescript
interface [NomeDTO] {
  propriedade1: tipo;
  propriedade2: tipo;
}
```

## Critérios de Aceite

- [ ] **CA01**: [Cenário de sucesso principal]
- [ ] **CA02**: [Cenário de erro/validação]
- [ ] **CA03**: [Cenário de borda/exceção]
- [ ] **CA04**: [Responsividade/performance]

## APIs/Endpoints

| Método | Endpoint   | Descrição   | Autenticação |
| ------ | ---------- | ----------- | ------------ |
| POST   | `/api/...` | [Descrição] | JWT Required |
| GET    | `/api/...` | [Descrição] | JWT Required |

## Componentes Frontend

- [Componente 1]: Responsabilidade específica
- [Componente 2]: Responsabilidade específica

## Riscos/Observações

- **Risco 1**: [Descrição e mitigação]
- **Risco 2**: [Dependência externa]
- **Observação**: [Consideração importante]

## Dependências

- [ ] [Feature/componente necessário]
- [ ] [Configuração de ambiente]
- [ ] [Integração externa]

## Testes

### Cenários de Teste

- [Teste 1]: Happy path
- [Teste 2]: Error handling
- [Teste 3]: Edge cases

### Dados de Teste

```json
{
  "exemplo": "dados para teste"
}
```
