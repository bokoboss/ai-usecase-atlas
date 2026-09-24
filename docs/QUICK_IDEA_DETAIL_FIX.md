# Quick Ideas Detail — Interaction Fix

**Date:** 2026-09-24

## Problem

The 50 standalone `Idea Only` records used a generic starter:

> นำตัวอย่างงานจริงมาให้ ChatGPT แล้วขอให้ช่วย: ...

Clicking those cards copied that text immediately. This made the Quick Ideas wall behave like a prompt-copy wall instead of a discovery product.

## New behavior

Every Quick Idea opens a detail panel first.

The panel shows:

- when to use the idea,
- intended user/role,
- recommended ChatGPT surface/tool,
- expected starting time,
- what input to prepare,
- what output to expect,
- a short workflow,
- a human/engineering check,
- a contextual Prompt Starter.

For ideas connected to a full Use Case, the panel uses that Use Case's prompt/guardrail and offers **Open full Use Case** as a secondary action.

For QI-451 through QI-500, the app contains explicit contextual guides. Examples include whiteboard-to-action-list, site-photo review, MM checks, BOQ-to-drawing checklist, TOR clarification, CV comparison, acceptance tests, mock data, and edge-case testing.

The old generic `starter` field remains in the raw JSON for backward compatibility but is no longer used by the UI for these standalone ideas.
