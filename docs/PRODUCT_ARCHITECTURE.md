# Product Architecture

## Product statement

AI Use Case Atlas is an **AI adoption/discovery product**, not a prompt dump. Its core question is:

> งานที่กำลังทำอยู่ตอนนี้ AI ช่วยตรงไหนได้บ้าง?

The current corpus contains **600 use cases + 800 quick ideas**.

## Primary journeys

### 1. Start from today's task
Search in natural Thai/English, open a use case, copy a prompt starter, and see the required Human / Engineering Check.

### 2. Guided Finder
Choose current task + role + software + preferred maturity level. The finder applies structured filters and natural-language search together.

### 3. Start from role
PM, traffic/highway/rail/structural engineers, cost/QA, secretary/admin, drafting/BIM/GIS, management.

### 4. Start from software
Excel, AutoCAD/Civil 3D, OpenRoads/OpenRail, Revit/Dynamo/Navisworks, QGIS, Bluebeam, VISSIM/Synchro/SIDRA, Power BI, Python/VBA/PowerShell, etc.

### 5. Start from inspiration
Search/browse 800 Quick Ideas, then jump to the linked full use case.

## Information architecture

- Task-first search
- Guided Finder
- Role pathways
- Software pathways
- Quick Ideas
- Use-case detail + source links + related cases
- GitHub / contribution

## AI maturity model

- L1 Ask
- L2 Assist
- L3 Produce
- L4 Workflow
- L5 Build & Automate

## Search strategy v1

Field-weighted lexical search + Thai word segmentation + domain synonyms + structured filters.

Important exact domain terms remain first-class (VISSIM, OpenRoads, Civil 3D, TOR, BOQ). The app should not hide them behind semantic-only retrieval.

## v1 principles

- task-first, not tool-first
- fast first success
- human verification always visible
- static-first/no paid backend required
- source traceability for version-sensitive workflows
- data layer isolated from presentation layer

## Later product metrics

- search → detail open rate
- detail → copy prompt rate
- Guided Finder completion
- zero-result queries
- software/role demand gaps
- repeat visits
- useful / tried / needs-update feedback