# Content Quality Pass v1

Scope: AI Use Case Atlas specialist and cost/quantity workflows.

## Coverage

- Specialist categories improved: E Traffic & Transport, F Highway/Road, G Railway, H Structural/Civil, I CAD/BIM/GIS, J Simulation.
- Specialist records: 261.
- Additional cost/quantity records outside those categories: 5.
- Total records updated: 266.

## Changes applied

- Replaced generic `AI-assisted` workflows with domain-aware multi-step workflows.
- Rewrote adoption hooks to be task-specific and unique.
- Rewrote pain points around traceability, revision control, assumptions and QA risk.
- Replaced generic prompt seeds with structured prompts that separate source facts, assumptions, derived values, exceptions, human checks and next actions.
- Added task-specific guardrails for engineering, modelling and software automation cases.
- Added official/vendor source links when the workflow depends on software/API capability.

## Vendor/source families reviewed

- Autodesk AutoCAD 2026 developer documentation / AutoLISP / .NET.
- Autodesk Civil 3D 2026 API documentation.
- Autodesk Revit 2026 API / parameter and schedule documentation.
- PTV Vissim 2026 COM and scripting documentation.
- Bentley OpenRoads Designer documentation and quantity workflows.
- Bentley OpenRail Designer documentation and current rail workflow materials.
- QGIS 3.44 Processing / PyQGIS documentation.
- Autodesk Navisworks 2026 / Clash Detective documentation.
- Bluebeam Revu 21 measurement and Markups List documentation.
- CSI ETABS / SAP2000 developer/API documentation.

## QA result

- Generic specialist workflows remaining: 0.
- Specialist adoption hooks unique: 261 / 261.
- Specialist use cases with official/vendor sources: 141 / 261.
- Dataset IDs remain unchanged; no new use cases added in this pass.

## Content rule

For engineering standards and project criteria, the atlas does not invent acceptance values. Use cases instruct the user to provide the project-approved TOR, design criteria, standard, software version and revision as the source of truth.