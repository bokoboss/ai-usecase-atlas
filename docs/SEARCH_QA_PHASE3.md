# Search QA — Phase 3

**Date:** 2026-09-24

Phase 3 adds a repeatable search regression check instead of relying only on visual/manual review.

## Coverage

The automated smoke set contains **40 representative Thai/English TR queries** across:

- Office / documents / meetings
- Traffic engineering and VISSIM
- Highway / OpenRoads
- Railway / OpenRail
- Structural / Civil
- CAD / BIM / GIS
- Cost / BOQ
- Proposal / TOR / CV matching

Each query has one or more acceptable use-case IDs. The test passes when at least one accepted item appears in the top 3 results.

## Relevance changes

- Do not return unrelated beginner items when a query has no semantic match.
- Add domain aliases for TIA, earthwork, risk register and alignment.
- Add stronger intent handling for external correspondence.
- Add title-term and title-bigram bonuses.
- Add domain boosts for Structural/Civil, Rail, Highway, Traffic and Proposal searches.
- Preserve exact tool matching and Phase 2 near-duplicate collapsing.

## Product hierarchy changes

The Discover page now follows a simpler three-stage path:

1. **Start Here by Role** — four curated role-specific starting points.
2. **5-Minute Quick Wins** — four low-friction examples.
3. **Explore the Library** — 24 recommended items first; broader browsing is progressive disclosure.

The old three-card entry section was removed because it repeated actions already available in the hero/search area.

Run locally with:

`npm run check:search`
