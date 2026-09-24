# Phase 5A — Content Quality: Engineering Core

**Date:** 2026-09-24  
**Status:** working branch only; do not merge until Phase 5B/5C complete.

## Baseline finding

The previous corpus had strong prompt length and unique titles, but user-facing detail was substantially templated:

- 600 titles / 600 unique
- 600 prompt starters / 600 unique
- only 359 unique pain points
- only 128 unique desired results
- the most repeated desired result appeared **70 times**
- multiple input/workflow/guardrail templates appeared 10–20 times each
- baseline heuristic score averaged **68.6/100**; 288 records were below 70

The problem was therefore not “too few prompts.” It was insufficient specificity in the fields users read to decide whether a use case is worth trying.

## 5A scope

Rewritten from the task itself for **188 use cases**:

- E — Traffic & Transport: 60
- F — Highway/Road: 45
- G — Railway: 34
- H — Structural/Civil: 34
- Q — Cross-tool advanced workflows: 15

For each item, Phase 5A synchronizes:

1. Pain Point
2. Desired Result / concrete deliverable
3. Required Inputs
4. Five-step workflow
5. Human / Engineering Check
6. Adoption hook
7. Prompt Starter
8. Research note
9. Vendor source where the task depends on current software capability

## Content standard

A rewritten use case must answer, without opening the prompt:

- **Why is this task actually difficult or risky?**
- **What exact artifact/table/register/check should I get?**
- **What data/revisions/IDs do I need before starting?**
- **What sequence should I follow?**
- **What must a human engineer verify before relying on the result?**

Engineering cases do **not** invent design thresholds. Project-approved TOR/design criteria/standards remain the source of truth.

## Source policy

Vendor documentation is required when the use case depends on software/API capability (Civil 3D, OpenRoads, OpenRail, ETABS/SAP2000, ChatGPT Work/Codex). Generic engineering judgement does not receive a random web citation merely to make the source count look better.

## Gate

`npm run check:content` currently gates the 188 Phase 5A items for:

- removal of known generic family templates,
- 5+ workflow steps,
- prompt/detail synchronization,
- minimum field substance,
- required vendor references,
- no exact duplicate detail fields crossing engineering categories.

Phase 5B will extend this standard to the remaining 412 records before this branch is eligible to merge.
