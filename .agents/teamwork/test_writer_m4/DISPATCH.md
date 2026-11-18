# Task Assignment: E2E Test Writer (Milestone M4)

## Identity & Role
- Archetype: teamwork_preview_test_writer
- Role: E2E Test Writer
- Working directory: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\test_writer_m4
- Parent: Orchestrator (b9f9d386-ec62-40d7-8959-4415f80bc3f0)

## Mandatory References
You MUST read:
1. `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `C:\Users\mario\Progetti Antigravity\Oroeco\PROJECT.md`
3. `C:\Users\mario\Progetti Antigravity\Oroeco\TEST_INFRA.md`
4. `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\explorer_survey_1\handoff.md`
5. `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\explorer_survey_2\handoff.md`
6. `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\explorer_survey_3\handoff.md`

## Write Ownership (Exclusive Files)
You own:
- `tests/e2e/runner.mjs`
- `tests/e2e/tier1_features.test.mjs`
- `tests/e2e/tier2_boundaries.test.mjs`
- `tests/e2e/tier3_pairwise.test.mjs`
- `tests/e2e/tier4_scenarios.test.mjs`
- `package.json` test script entry (if updating `scripts: { "test:e2e": "node tests/e2e/runner.mjs" }`)
- `TEST_READY.md` (publish at project root when all suites are created and ready)

## Objective & Deliverables
Implement the complete opaque-box requirement-driven E2E test suite according to `TEST_INFRA.md`:

1. **Test Runner (`tests/e2e/runner.mjs`)**:
   - Zero-dependency Node.js test runner executing all tier files, collecting results, formatting assertions, and reporting summary metrics with exit code 0 on all pass, 1 on fail.
2. **Tier 1 — Feature Coverage (`tests/e2e/tier1_features.test.mjs`)**:
   - ≥45 test cases covering all 9 feature areas (Database Isolation, Schema, Visual Identity/CSS, Navigation Routes, Cart Drawer & Free Shipping, POS Barcode Listener, Ticket & Tax, Aura RT, SDI Modal, Stock Depletion).
3. **Tier 2 — Boundary & Corner Cases (`tests/e2e/tier2_boundaries.test.mjs`)**:
   - ≥45 test cases covering boundary values: 149.99€ vs 150.00€ vs 150.01€ shipping threshold, 0% vs 100% discount, empty cart/ticket, maximum discounts, invalid barcode inputs, rapid scanner burst timing (<60ms vs slow typing), Codice Fiscale & P.IVA formatting boundaries.
4. **Tier 3 — Cross-Feature Interactions (`tests/e2e/tier3_pairwise.test.mjs`)**:
   - ≥10 cross-feature tests: Cart + Catalog navigation, Barcode Scan + Stock Depletion + Ticket Tax Calculation, POS Sale + Axon Aura RT LAN payload + Inventory transaction logging, SDI 1-Click modal + Customer data + Ticket summary.
5. **Tier 4 — Real-World Application Scenarios (`tests/e2e/tier4_scenarios.test.mjs`)**:
   - 5 comprehensive realistic scenarios (S1 Walk-in Sale, S2 Corporate SDI Invoice, S3 E-Commerce Customer Journey, S4 Omnichannel Stock Depletion, S5 Christmas Campaign Rush).
6. **Execution & Validation**:
   - Run the test suite: `node tests/e2e/runner.mjs`.
   - Ensure all tests pass.
   - Publish `TEST_READY.md` at project root (`C:\Users\mario\Progetti Antigravity\Oroeco\TEST_READY.md`) with the coverage summary table.
   - Write your handoff report to `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\test_writer_m4\handoff.md`.
