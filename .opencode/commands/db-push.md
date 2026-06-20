---
description: Sincroniza schema Prisma com PostgreSQL
agent: build
---
Run `npm run db:generate` to regenerate the Prisma client.
Then run `npm run db:push` to sync the schema with PostgreSQL.
Review any pending schema changes before confirming the push.
Report the database state after sync.
