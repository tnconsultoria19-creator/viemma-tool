# Argon Integration Guide — Viemma Tours

## Objective
Integrate only valuable, still-missing functionality from the legacy feature branches into the current `main` application. Do not merge or copy whole branches wholesale. The current `main` branch is the source of truth for architecture, UI, data models, and existing workflows.

## Current baseline
- The validated presentation library and compact day-grouped programme List View have been merged into `main`.
- PR #5 was merged after its GitHub Actions validation passed.
- The merged work includes the bilingual reusable presentation media/copy library, image selection in editorial pages, and the programme list/day-add workflow.
- Firebase Firestore and Storage rules are committed but still require deployment to the correct Firebase project before shared cloud media access works.

## Branches to audit selectively
Review these branches for unique capabilities that are not already present in `main`:
- `feat/viemma-workflow-and-printing`
- `feat/operations-data-and-qa`
- `fix/firebase-security-attachments-11894852056215581423`
- `south-african-tour-workflow-v2`
- `ux-south-african-language-json-flow`

These branches are behind and/or diverged from the current baseline. Treat their implementations as reference material, not merge-ready replacements. Rebase or port individual changes only after understanding their dependencies.

## Integration rules
1. Inspect the current implementation before changing any file. Map each candidate feature to the existing component, service, type, route, and Firebase rule.
2. Keep one authoritative implementation per capability. Do not introduce duplicate login/authentication flows, attachment/storage services, hotel or activity catalogues, itinerary importers, finance calculations, print/PDF pipelines, or presentation editors.
3. Preserve current Argon-generated UI, current navigation, existing data, and working user journeys. Do not replace whole components simply because a branch contains an alternative implementation.
4. Preserve backward compatibility for existing trip records and Firestore documents. Add safe migrations/defaults where needed; never silently discard fields or operational records.
5. Prefer the smallest additive change that closes a verified gap. If a branch feature is already covered by `main`, leave it out.
6. Security changes must be reviewed as a complete set. Do not loosen Firestore or Storage rules to make a feature work. Verify staff authorization, ownership checks, upload paths, and least-privilege access.
7. Do not add sample/demo records to production state. Keep empty first-run workspaces clean.
8. For every integrated feature, add or update focused tests and verify TypeScript, regression/acceptance tests, and the production build.
9. If a change risks existing functionality, creates overlapping state models, or cannot be validated, do not integrate it. Document the reason and leave the current implementation intact.
10. Do not delete legacy branches until all unique changes have been assessed and the owner confirms cleanup.

## Priority review areas
- Authentication and authorization: assess the explicit staff login/security work, but reconcile it with the authentication model already in `main` before changing it.
- Attachments: inspect upload, preview, download, and failure handling; retain one Firebase Storage implementation and do not restore insecure data-URL fallbacks.
- Operations workflows: review group/traveller intake, flights, rooming, transfers, drivers, hotel catalogue, and pickup-board improvements for missing functionality only.
- South African tour workflow and language: review activity/day planning, finance, Portuguese/English content, JSON import, and South Africa-specific terminology. Extend existing flows rather than creating parallel ones.
- Printing and presentations: preserve the newly merged presentation library and existing PDF/print pipeline. Port only improvements that demonstrably add value without duplicating the new library or editor controls.

## Required handoff
Before implementation, provide a concise branch-by-branch assessment listing:
- unique capability found;
- whether it is already covered in `main`;
- exact files/components affected;
- dependencies and data/security implications;
- decision: integrate, adapt, or leave out, with rationale.

After implementation, report the exact commits/files changed and the validation results. Do not claim a branch was merged unless it actually was.
