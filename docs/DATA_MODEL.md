# Data Model

## v1 UseCase JSON

```ts
type UseCase = {
  id: string
  categoryCode: string
  categoryTh: string
  category: string
  title: string
  painPoint: string
  desiredResult: string
  primaryUsers: string
  discipline: string
  level: number
  levelName: string
  surface: string
  software: string
  integrationPattern: string
  inputs: string
  promptSeed: string
  guardrail: string
  priority: string
  tags: string
  depth: string
  momentOfNeed: string
  adoptionHook: string
  researchTier: string
  researchNote: string
  sources?: string[]
  isNew?: boolean
}
```

`sources` is used for official/primary documentation on version-sensitive or software-specific workflows. `isNew` marks the 2026 expansion set for discovery/highlighting only; it is not a quality score.

## QuickIdea JSON

- id
- idea
- useCaseId
- category
- role
- moment
- starter
- surface
- software
- time

## Normalized Phase 2 schema

### use_cases
- id (text PK, e.g. A01)
- category_id
- title_th / title_en
- pain_point / desired_result
- level / surface / integration_pattern
- inputs / prompt_starter / guardrail
- depth / moment_of_need / adoption_hook
- research_tier / research_note
- status / owner / reviewer / updated_at

### source_links
- id
- use_case_id
- url
- source_type (`official`, `standard`, `paper`, `internal`)
- vendor_or_body
- product_or_standard_version
- verified_at

### categories / roles / software / tags
Normalized vocabularies with many-to-many junction tables.

### quick_ideas
- id
- idea
- linked_use_case_id
- role / moment / starter / surface / software
- estimated_start_time

### feedback (future)
- id
- use_case_id
- useful / tried / needs_update
- comment
- role (optional)
- created_at

## Search document

Build one denormalized search document per use case:

`title + adoption_hook + pain_point + desired_result + inputs + tags + software + roles + discipline + moment_of_need + workflow + category`

Keep structured fields separately so filters do not depend on text parsing. v1 adds a small Thai/English domain synonym dictionary; Phase 2 can add hybrid lexical + vector retrieval while preserving exact matching for terms such as VISSIM, Civil 3D, OpenRoads, OpenRail and TOR.