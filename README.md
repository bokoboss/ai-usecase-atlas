# AI Use Case Atlas

ค้นหาว่า AI ช่วยงานของคุณได้อย่างไร — จากงานจริงที่กำลังทำ ไม่ใช่จากชื่อฟีเจอร์ AI

Current corpus: **600 use cases + 800 raw quick ideas**; the UI removes 150 generated twin variants at load time, leaving 650 distinct discovery cards. for Transportation BU workflows, including everyday office work, documents/data, Traffic & Transport, Highway, Railway, Structural/Civil, cost/quantity workflows, CAD/BIM/GIS, simulation, automation, web/apps, PM, proposal and management.

## Product principles

1. **Task-first, not tool-first** — เริ่มจาก “วันนี้กำลังทำอะไร?” ก่อนเลือก Chat / Work / Codex
2. **Fast first success** — ให้ผู้ใช้เจอ use case ที่ลองได้ภายในไม่กี่วินาที
3. **Human check is visible** — ทุก use case แยก AI assistance ออกจาก engineering/professional responsibility
4. **Progressive depth** — L1 Ask → L5 Build & Automate
5. **Static-first architecture** — v1 ไม่ต้องมี paid backend/API และพร้อมย้าย data layer ไป database ภายหลัง
6. **Traceable technical cases** — workflow ที่ขึ้นกับ software/version มี research tier และ official/primary source URL เมื่อมี

## Tech stack

- React 19.3
- TypeScript
- Vite 8.3
- Custom CSS design system
- Static JSON repository/search layer
- GitHub Pages deployment workflow

## Current UX

- Natural-language search ไทย/อังกฤษ + domain synonyms
- Filters: category, role, software, ChatGPT surface, AI level
- **Guided Finder** สำหรับคนที่ยังไม่รู้จะค้นคำว่าอะไร
- 600 use-case cards
- Detail drawer: Pain Point, result, input, workflow, Prompt Starter, Human / Engineering Check
- Official/primary source links for researched software workflows
- Related use cases ranked as next-step workflows, with near-duplicate variants separated from the main search results
- Shareable URL using `?uc=<ID>`
- Searchable Quick Ideas wall with runtime deduplication and usable “Idea Only” starter actions
- Responsive desktop/mobile layout

## New 2026 expansion

Added 150 use cases + 300 quick ideas across:

- office/document/secretary/data QA
- Traffic survey, parking, curbside, speed, OD, signals and forecast workflows
- Highway / OpenRoads / Civil 3D
- Railway / OpenRail
- Structural result/schedule/quantity QA
- AutoCAD/AutoLISP, Revit/Dynamo, Navisworks, QGIS/PyQGIS, Bluebeam, MicroStation/OpenRoads
- VISSIM COM/Python and simulation QA
- PowerShell, Office Scripts, VBA, Python/Git automation
- PM, proposal, multi-bid staffing, management dashboards

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Architecture

- `docs/PRODUCT_ARCHITECTURE.md`
- `docs/UX_SPEC.md`
- `docs/BACKEND_ARCHITECTURE.md`
- `docs/DATA_MODEL.md`

## Deployment

GitHub Pages workflow is included. Vite base path:

`/ai-usecase-atlas/`

## Data

- `public/data/usecases.json` — 600 use cases served by the app
- `public/data/ideas.json` — 800 raw quick ideas served by the app
- `public/data/roleStarts.json` — recommended starting points by role
- `data/` — source/mirror dataset retained for content-production workflows

The data layer is separated from UI components so a future PostgreSQL/Supabase + hybrid semantic search backend will not require a frontend rewrite.

## Product cleanup notes

- Phase 1: search mode, relevance, Quick Ideas dedupe, mobile navigation/filtering and toolkit consolidation.
- Phase 2: readability scale, reviewed near-duplicate result grouping, Similar Variants and next-step Related Cases.


## Phase 3

- Discover hierarchy simplified to Role Start → Quick Wins → Library.
- Initial library is capped to 24 recommended items until the user searches, filters, or explicitly expands it.
- Search now has a 40-query regression suite via `npm run check:search`.


## Quick Ideas detail behavior

All Quick Idea cards now open a detail panel first. Linked ideas expose their full Use Case as a secondary action. The 50 standalone Idea Only records use contextual input/output/guardrail guides and generated prompts instead of the old generic “นำตัวอย่างงานจริงมาให้ ChatGPT...” starter.


## Phase 4

- Search/filter/tab/detail state is shareable through the URL and supports browser Back/Forward.
- Use Case cards have direct Saved/Tried controls; Detail headers expose faster Copy Prompt actions.
- Mobile/touch behavior includes safe-area navigation, body-scroll locking, larger touch targets and full-width detail panels.
- `npm run check:product` validates Quick Idea integrity and URL state round-tripping.
