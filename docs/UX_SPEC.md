# UX / UI Specification

## Design character

**Modern Precision Workspace**

- deep navy workspace
- restrained teal/cyan accents
- high-contrast typography
- thin borders and layered panels
- compact metadata
- generous reading area
- professional engineering/business tone

## Core UX rule

Never force users to know AI terminology first.

Bad:
> เลือก Chat / Work / Codex

Preferred:
> วันนี้คุณกำลังทำงานอะไรอยู่?

Tool selection appears after the task is identified.

## Home

1. Sticky navigation
2. Task-first search
3. Quick search chips
4. Three entry paths:
   - task
   - role
   - software
5. Filters
6. Use-case cards

## Search

Weight fields conceptually in this order:
1. title
2. adoption hook
3. pain point
4. desired result
5. tags
6. software
7. role / discipline
8. moment of need
9. category

For 450 records, client-side weighted search is sufficient.

## Card

A card should answer in under five seconds:
- What is this?
- Is it relevant to me?
- Which ChatGPT surface?
- How advanced is it?

## Detail drawer

Use a right-side drawer for fast browse/open/close cycles. Keep shareable IDs/URLs later.

Strong visual sections:
- Prompt Starter
- Human / Engineering Check

The verification section must never be visually subordinate.

## Responsive

Desktop:
- sticky filter rail
- two-column use-case grid

Mobile:
- filters in normal flow
- one-column cards
- full-width detail drawer

## Future UX

### Guided Finder
Ask:
- role
- current task
- software/file available
- desired output: quick answer / deliverable / automation

Then recommend 3–5 cases.

### Related cases
Recommend next cases by role, software, category and level.

### Adoption paths
Create role-specific progressions from quick L1/L2 wins toward L4/L5.

### Feedback
Add:
- ลองแล้ว
- มีประโยชน์
- ต้องปรับ
