# Content Quality Pass v3 — Coding & Web

**Date:** 2026-09-24  
**Scope:** K — Coding & Automation; L — Web & App Development  
**Corpus:** 600 use cases total; 70 K/L use cases.

## Why this pass

The K/L corpus was already materially stronger than the earlier baseline, but 57 cases still shared workflow templates across tasks that have different failure modes. This pass differentiates those workflows and removes legacy broad software labels.

## What changed

- Refined **57** K/L cases that shared workflows with materially different tasks.
- Differentiated file automation, rename/archive, scheduler jobs, parsing/OCR, CLI tools, unit/regression tests, debugging, refactoring, APIs, Git/GitHub, calculators, dashboards, forms/databases, RBAC, audit logs, document search, map apps, 2D/3D viewers, prototypes, responsive UX, file import/export and QA tools.
- Replaced legacy software labels such as `Python / VBA / PowerShell / Git` and `HTML / CSS / JS / Web framework / Database` with task-specific environments.
- Rebuilt copyable prompts so each refined case embeds its own workflow and QA gate.
- Updated current official/primary references across OpenAI Codex, Microsoft automation, GitHub/GitHub Actions, Vite, Python, PostgreSQL, MDN, Three.js and OWASP guidance.

## QA result

- K/L use cases: **70**
- K: **40**; L: **30**
- Duplicate workflow strings: **0**
- Duplicate guardrail strings: **0**
- Duplicate prompt strings: **0**
- Duplicate adoption hooks: **0**
- K/L cases without sources: **0**
- Legacy broad software labels remaining: **0**
- Forbidden temporary fields: **0**
- Unique IDs: **600/600**
- Use-case IDs changed: **0**

## Engineering rules reinforced

1. Inspect before edit.
2. Read-only/dry-run first for file and data automation.
3. Independent benchmark before modifying calculation code or expected test results.
4. Reproduce a bug before patching it.
5. Refactor separately from feature changes.
6. Server-side validation and authorization for web/data apps.
7. Least-privilege credentials and no secrets in source/logs.
8. Reproducible build/test/release with explicit rollback.
9. Traceability to source/version/record for engineering and document workflows.
10. Production deployment only from reviewed, tested artifacts.
