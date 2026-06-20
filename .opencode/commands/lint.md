---
description: Lint e type-check em ambos os workspaces
agent: build
---
Run `npm run lint` across backend and frontend workspaces.
If ESLint reports errors, fix them and re-run until clean.
After lint passes without errors, run `npm run type-check`.
Fix any TypeScript type errors found.
Report final pass/fail status.
