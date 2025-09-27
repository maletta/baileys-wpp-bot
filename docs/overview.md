# Visão Geral - WhatsApp Baileys Monorepo

## Propósito

Sistema completo para gerenciamento de conexões WhatsApp utilizando a biblioteca Baileys, com interface administrativa para gerenciar grupos, participantes e sistema de mensagens anônimas com aprovação.

## Escopo

- **Backend**: API Node.js/TypeScript com Baileys Socket, autenticação Google OAuth, gerenciamento de grupos e participantes
- **Frontend**: Interface Next.js responsiva para administração de conexões e grupos
- **Database**: PostgreSQL para dados relacionais, MongoDB para mensagens
- **Realtime**: Socket.IO para comunicação em tempo real entre frontend e backend

## Metas Principais

1. **Gestão de Conexões**: Administradores podem estabelecer, visualizar e remover conexões WhatsApp
2. **Administração de Grupos**: Visualizar grupos, sincronizar participantes, gerenciar permissões
3. **Sistema de Mensagens**: Envio de mensagens anônimas com sistema de aprovação por admins
4. **Autenticação Segura**: Login exclusivo via Google OAuth com sistema de roles
5. **Formulários de Participantes**: Sistema de cadastro e atualização de informações dos participantes

## Público-Alvo

- **High Level Admins**: Gerenciamento completo de conexões Baileys
- **Admins de Grupo**: Aprovação de mensagens e gerenciamento de participantes
- **Participantes**: Preenchimento de formulários e interação básica

## Arquitetura

- **Monorepo**: Apps separados mas integrados
- **API RESTful**: Padrões semânticos para todas as rotas
- **Real-time**: Socket.IO para QR codes e atualizações de status
- **Microserviços Internos**: Separação clara entre camadas e responsabilidades

## Tecnologias Core

- Node.js v22.20.0 LTS
- TypeScript
- Baileys WhatsApp Socket v7.0.0
- Next.js com App Router
- Prisma ORM
- PostgreSQL + MongoDB
- Shadcn/UI + Tailwind CSS

## Indicadores de Sucesso

- Conexões WhatsApp estáveis e confiáveis
- Interface intuitiva e responsiva
- Sistema de aprovação de mensagens eficiente
- Sincronização automática e precisa com WhatsApp
- Zero downtime nas operações críticas
