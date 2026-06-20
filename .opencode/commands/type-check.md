---
description: Verificação de tipos TypeScript em ambos os apps
agent: build
---
Run `npm run type-check` which executes `tsc --noEmit` in both workspaces.
Fix any TypeScript type errors found.
Re-run until clean.
Report status.
