---
description: Checklist pré-merge para código WhatsApp/Baileys core
agent: plan
model: deepseek/deepseek-chat
---
Execute the pre-merge checklist for WhatsApp/Baileys core code changes:

1. Run `npm run type-check` across all workspaces
2. Run `npm run lint` across all workspaces
3. Verify reconnection logic integrity (check BaileysSocketManager)
4. Verify event deduplication for groups.upsert and group-participants.update
5. Verify rate limiting is respected on message sends
6. Verify no sensitive data leaks in logs or API responses
7. Run affected test suites

Report pass/fail for each item. If any item fails, do NOT proceed with merge.
