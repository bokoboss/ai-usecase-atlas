# Backend Architecture

## v1 decision: static-first

The corpus is reference data: 450 use cases + 500 quick ideas. It is read-heavy and changes slowly. A database in v1 would add hosting, auth, migration and operations without improving the core discovery experience.

v1:

```text
Master Inventory
   ↓
JSON / typed data export
   ↓
Repository / search layer
   ↓
React UI
```

The UI should never depend directly on where data is stored. That boundary allows later migration to a real backend.

## Phase 2 triggers

Add a backend when requirements include:
- frequent multi-user content editing
- favorites/history
- feedback analytics
- private/internal use cases
- semantic search
- admin CMS
- AI-generated recommendations
- approval/version lifecycle

## Suggested Phase 2 stack

```text
React frontend
   │
   ├─ GET /api/use-cases
   ├─ GET /api/use-cases/:id
   ├─ GET /api/search
   ├─ POST /api/feedback
   └─ POST /api/admin/use-cases
          │
   Serverless API
          │
   PostgreSQL / Supabase
      ├─ use_cases
      ├─ roles
      ├─ software
      ├─ tags
      ├─ quick_ideas
      ├─ feedback
      └─ embeddings (optional)
```

## Search architecture

Use hybrid retrieval later, not vector-only:
1. lexical/field-weighted search
2. structured filters
3. optional vector similarity
4. rerank/business rules

Exact terms such as VISSIM, Civil 3D, TOR and BOQ must remain deterministic.

## Security

If the app later accepts company files or confidential prompts:
- require authenticated backend
- do not store sensitive content in browser persistence by default
- define retention policy
- separate public atlas content from user content
- minimize logging of document contents
- follow company AI/data-handling policy

## Content lifecycle

Recommended:
Draft → Technical Review → Published → Superseded

Keep owner, reviewer, updated date, research source, software/version basis and verification date.
