# Backend Architecture

## v1: static-first

The corpus is reference content (currently 600 use cases + 800 quick ideas). It is read-heavy and changes much less frequently than transactional data.

```text
Master inventory / researched additions
        ↓
versioned JSON data
        ↓
repository + weighted search layer
        ↓
React UI
```

No backend/API/database is required for the current public discovery experience.

## Why this is deliberate

- zero database hosting cost
- no authentication requirement for public content
- Git diff/version history for every content change
- fast client-side search at this corpus size
- fewer privacy/security surfaces

## Phase 2 triggers

Add a backend when requirements include:
- frequent multi-user editing and approval workflow
- favorites/history/profile-based pathways
- feedback analytics / search telemetry
- private/internal-only use cases
- semantic/hybrid search at larger scale
- admin CMS
- AI-generated recommendations

## Suggested Phase 2

```text
React frontend
   │
   ├─ GET /api/use-cases
   ├─ GET /api/use-cases/:id
   ├─ GET /api/search?q=&role=&software=
   ├─ POST /api/feedback
   └─ admin/editor endpoints
          │
   PostgreSQL / Supabase
      ├─ use_cases
      ├─ source_links
      ├─ roles / software / tags
      ├─ quick_ideas
      ├─ feedback
      └─ embeddings (optional)
```

## Search architecture Phase 2

Use **hybrid retrieval**, not vector-only:
1. exact/lexical match
2. field weights
3. structured filters
4. vector similarity for fuzzy natural-language intent
5. rerank/business rules

## Security / enterprise future

If later versions accept company files or confidential prompts:
- authenticated backend and access controls
- retention policy
- no sensitive browser persistence by default
- separate public atlas content from uploaded user content
- minimize logging of document content
- company AI/data-handling policy applies

## Content lifecycle future

Draft → Technical Review → Published → Superseded

Store owner, reviewer, updated date, research source, software/version basis and verification date.