# AI Use Case Atlas

ค้นหาว่า AI ช่วยงานของคุณได้อย่างไร

A task-first AI adoption library for Transportation BU, designed around a master corpus of **450 use cases + 500 quick ideas** covering daily work, Office, engineering, AutoCAD/Civil 3D/Revit, VISSIM, coding/automation, PM, proposal work and management.

## Product principle

People should not need to learn AI features first. They should start from the work in front of them:

> “วันนี้กำลังทำงานอะไรอยู่?”

Then the app helps them discover where ChatGPT, Work, or Codex can help.

## MVP currently in the repo

- React + TypeScript + Vite scaffold
- Task-first search UI
- Role, software and level filters
- Responsive Modern Precision visual system
- Use-case detail drawer
- Copyable Prompt Starter
- Prominent Human / Engineering Check
- Representative seed dataset for UI/UX development
- GitHub Pages deployment workflow

The full 450-use-case dataset and 500 Quick Ideas are the next data-import step. The architecture is already designed so importing the full corpus does not require redesigning the UI.

## Architecture

- [Product architecture](docs/PRODUCT_ARCHITECTURE.md)
- [Backend architecture](docs/BACKEND_ARCHITECTURE.md)
- [UX/UI specification](docs/UX_SPEC.md)

## v1 backend strategy

Static-first. The atlas is read-heavy reference content, so v1 intentionally avoids database/API cost. The data layer is isolated so the app can later move to PostgreSQL/Supabase and hybrid semantic search without rebuilding the frontend.

## Local development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Deployment

GitHub Pages workflow:

`.github/workflows/deploy-pages.yml`

The Vite base path is configured for:

`/ai-usecase-atlas/`
