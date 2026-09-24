# Content Quality Phase 5 — Full Corpus

**Date:** 2026-09-24  
**Scope:** 600 full Use Cases  
**Branch:** `content-quality-phase5`

## Why Phase 5 was treated as a product-critical rebuild

The earlier corpus had 600 unique titles and 600 unique prompt starters, but many visible fields were still family templates. Before Phase 5:

| Field | Unique values / 600 | Largest exact duplicate family |
|---|---:|---:|
| Pain Point | 359 | 15 |
| Desired Result | 128 | 70 |
| Inputs | 139 | 20 |
| Workflow | 177 | 20 |
| Human/Engineering Check | 173 | 20 |

A user could therefore open two apparently different engineering tasks and see almost the same problem, input, workflow, output and check. That undermines the core value of the Atlas.

## What Phase 5 changed

Phase 5 used several passes rather than a bulk synonym rewrite:

1. **5A — Engineering core**  
   Traffic, Highway, Railway, Structural/Civil and Cross-tool workflows were rebuilt around task-specific engineering artifacts, inputs, sequence and verification.

2. **5B — Office/Data/CAD/Simulation/PM/Proposal/Executive/Research**  
   Large family templates were rewritten around their real job-to-be-done.

3. **5C — Semantic refinement**  
   High-duplication families were split further and near-duplicate pairs were given explicit scope differences. Examples:
   - full TOR compliance matrix vs first-pass TOR extraction,
   - VISSIM offset experiment design vs batch-automation implementation,
   - corridor travel-time reliability vs run-level travel-time QA,
   - create Civil 3D styles vs audit style compliance,
   - build load-combination requirements vs audit actual model combinations,
   - stakeholder matrix vs communication plan,
   - analytical dashboard vs internal operational dashboard.

## Current corpus metrics

After Phase 5:

| Field | Unique values / 600 | Largest exact duplicate family |
|---|---:|---:|
| Pain Point | 442 | 4 |
| Desired Result | 453 | 4 |
| Inputs | 445 | 4 |
| Workflow | 465 | 4 |
| Human/Engineering Check | 465 | 4 |
| Prompt Starter | 600 | 1 |
| Adoption Hook | 600 | 1 |

All 600 workflows contain at least five explicit steps.

Reusing a field across a small family is still allowed when the work genuinely shares a mechanism (for example, closely related traffic-count summaries). The gate prevents broad 5–20 item template families from returning.

## Full-corpus quality gate

`npm run check:content` now checks **600/600**, not only engineering categories:

- 600 unique IDs and titles,
- 600 unique Prompt Starters and Adoption Hooks,
- no empty core fields,
- minimum substance for Pain Point / Output / Input / Human Check,
- at least 5 workflow steps,
- Prompt Starter synchronized with title, output and human check,
- legacy generic/template phrases forbidden,
- exact duplicate family size ≤ 4 in user-facing detail fields,
- no record with the entire detail fingerprint duplicated,
- vendor/primary sources required for software-heavy I/J/K/L cases,
- targeted vendor-source rules for Civil 3D/OpenRoads/OpenRail/ETABS/SAP2000 and cross-tool OpenAI workflows,
- a regression watchlist for known near-duplicate pairs.

## Source policy

Source coverage is intentionally **not** forced to 600/600.

A current vendor/primary source is required when a use case depends on software/API/version capability. For ordinary engineering judgement, office work or project-specific rules, the Atlas should point the user back to the project's approved TOR, design criteria, contract, baseline, procedure or source data rather than attach an unrelated web citation merely to increase source counts.

## Content standard going forward

Every Use Case should answer five questions before the user even copies the prompt:

1. What makes this task difficult or risky?
2. What concrete artifact/output should AI help create?
3. What input/revision/IDs must be prepared?
4. What sequence should be followed?
5. What must a human or engineer verify before relying on the result?

A new Use Case that cannot answer these specifically should not be added to the Atlas.
