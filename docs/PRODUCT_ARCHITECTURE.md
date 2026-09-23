# Product Architecture

## Product statement

AI Use Case Atlas is a discovery and adoption product, not just a prompt library. Its core question is:

> งานที่กำลังทำอยู่ตอนนี้ AI ช่วยตรงไหนได้บ้าง?

The product is optimized for staff who completed AI training but still do not habitually use AI because they do not know what to try, do not feel fluent, or assume AI will add extra work.

## Primary journeys

### 1. Start from today's task
Search in natural Thai/English, open a relevant use case, copy the prompt starter, and see the required Human / Engineering Check.

### 2. Start from role
Filter by PM, Engineer, Secretary, Senior, MD, etc. Progress from L1/L2 quick wins toward L4/L5 workflows.

### 3. Start from software
Find AI-assisted workflows around Excel, AutoCAD, Civil 3D, Revit, VISSIM and other existing tools.

### 4. Start from inspiration
Browse Quick Ideas when the user still does not know what to try.

## Information architecture

Top-level:
- Search / Discover
- Role pathways
- Software pathways
- Quick Ideas
- Use-case detail
- GitHub / contribution

Use-case detail:
- ID, surface, level
- Pain Point
- Desired Result
- Moment of Need
- Role
- Software
- Prompt Starter
- Human / Engineering Check
- Tags / related cases

## AI maturity model

- L1 Ask
- L2 Assist
- L3 Produce
- L4 Workflow
- L5 Build & Automate

## v1 principles

- Task-first, not tool-first
- Fast first success
- Human verification is always visible
- Static-first architecture
- No paid AI API required for discovery
- Data layer isolated from presentation layer

## Later product metrics

- search → detail open rate
- detail → copy prompt rate
- repeat visits
- common filters
- zero-result queries
- useful / tried feedback
