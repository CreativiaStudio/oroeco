# E2E Test Infra: Gioielleria Oroeco Suite

## Test Philosophy
- Opaque-box, requirement-driven: verifies requirements directly from `ORIGINAL_REQUEST.md` and user specs.
- Strictly decoupled from internal database implementation: relies on typed local catalog and local store state.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial + Real-World Workload Testing.

## Feature Areas & Coverage Matrix
| # | Feature Area | Requirement Source | Tier 1 (Happy) | Tier 2 (Boundary) | Tier 3 (Cross) | Tier 4 (Workload) |
|---|--------------|-------------------|:--------------:|:-----------------:|:--------------:|:-----------------:|
| 1 | Database Isolation & Schema | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 2 | Visual Identity & Design System | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 3 | Navigation & Excel Routes | ORIGINAL_REQUEST §R1 | 7 | 5 | ✓ | ✓ |
| 4 | Cart Drawer & Free Shipping (>150€) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 5 | POS Barcode Hardware Listener | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 6 | POS Ticket & Tax Computation | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 7 | Axon Micrelec Aura RT Modal | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 8 | SDI 1-Click Invoice Modal | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 9 | Stock Depletion & Inventory | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test Runner: standalone Node.js verification test harness in `tests/e2e/runner.mjs`.
- Exit Code Semantics: 0 on all tests passing, >0 on failure.
- Directory Layout:
  ```
  tests/e2e/
  ├── runner.mjs
  ├── tier1_features.test.mjs
  ├── tier2_boundaries.test.mjs
  ├── tier3_pairwise.test.mjs
  ├── tier4_scenarios.test.mjs
  └── tier5_adversarial.test.mjs
  ```

## Real-World Application Scenarios (Tier 4)
1. **Scenario S1 (In-Store Luxury Walk-In Sale)**: Renato scans an 18kt gold diamond ring via barcode gun (`8054112300017`), applies a 10% boutique discount, calculates cash tender with change due, triggers the Axon Aura RT fiscal receipt, and verifies immediate stock depletion.
2. **Scenario S2 (High-Ticket Corporate SDI Invoice)**: Carmela sells two Bulova watches to a local business client, captures corporate P.IVA and SDI recipient code, calculates VAT 22% scorporata, generates the SDI 1-Click e-invoice payload, and logs the sale.
3. **Scenario S3 (E-Commerce Luxury Customer Journey)**: A client browses `/storia`, enters `/gioielli`, filters by tennis bracelets, adds a 1,850€ item to cart, unlocks the >150€ free shipping benefit with the animated gold progress bar, inspects the luxury footer with Creativia Studio credit, and validates navigation integrity.
4. **Scenario S4 (Omnichannel Inventory Depletion)**: POS sale at `/admin/cassa` decrements stock for an Unoaerre wedding band, ensuring live availability across both the local inventory store and storefront catalog.
5. **Scenario S5 (Christmas Campaign Seasonal Rush)**: Customer navigates to `/natale`, adds holiday decorations, switches to POS to simulate busy seasonal checkout, tests scanner input timing burst, and verifies flawless totals.

## Coverage Thresholds
- Tier 1: ≥45 test cases (≥5 per feature area)
- Tier 2: ≥45 test cases (edge cases, 0/negative numbers, threshold boundaries 149.99€ vs 150.00€ vs 150.01€, scanner timing burst)
- Tier 3: ≥10 cross-feature tests (Cart + Catalog, POS + Barcode, POS + Stock Depletion, POS + Aura RT, POS + SDI)
- Tier 4: ≥5 realistic workflow scenarios
- **Total Minimum Target**: ≥105 E2E test cases before publishing `TEST_READY.md`.
