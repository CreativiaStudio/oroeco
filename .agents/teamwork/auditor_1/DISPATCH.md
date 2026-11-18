# Task Assignment: Forensic Auditor (Integrity Forensics)

## Identity & Role
- Archetype: teamwork_preview_auditor
- Role: Forensic Integrity Auditor
- Working directory: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\auditor_1
- Parent: Orchestrator (b9f9d386-ec62-40d7-8959-4415f80bc3f0)

## Mandatory References
You MUST read:
1. `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `C:\Users\mario\Progetti Antigravity\Oroeco\PROJECT.md`
3. `C:\Users\mario\Progetti Antigravity\Oroeco\TEST_READY.md`
4. `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\worker_m1_m3\handoff.md`
5. `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\test_writer_m4\handoff.md`

## Forensic Audit Protocol & Mandatory Checks
Conduct an unsparing forensic audit across the entire codebase to detect any integrity violations or deceptive implementations:

1. **Check 1: Hardcoded Test Outcomes & Facade Implementations**:
   - Inspect `components/admin/CassaTerminal.tsx`, `lib/auraProtocol.ts`, `lib/sdiProtocol.ts`, `store/useInventoryStore.ts`, `lib/catalog.ts`, `store/useCartStore.ts`.
   - Verify that all calculation logic, Ditron command generation, FatturaPA XML generation, and stock depletion are authentic, generic, and parameterized — NOT hardcoded mocks that merely output expected test strings.
2. **Check 2: Total Database Isolation (R3)**:
   - Perform static analysis for any external database connections, Supabase credentials, or URLs (especially Creativia Studio database).
   - Verify that `supabase/schema.sql` is a genuine, standalone SQL migration file.
3. **Check 3: Barcode Hardware Scanner Authenticity**:
   - Verify that `lib/useBarcodeScanner.ts` genuinely implements a global hardware keystroke listener on `window` with timestamp delta calculation (<60ms) and audio feedback, not a dummy input simulator.
4. **Check 4: Storefront Luxury Compliance (R1)**:
   - Check that all Excel navigation routes (`/storia`, `/gioielli`, `/orologi`, `/accessori`, `/casa`, `/brand`, `/natale`) and product pages exist and render genuine content and catalog data.
   - Verify that the footer has the required credit "Sviluppato da Creativia Studio".
5. **Check 5: Build & TypeCheck Integrity**:
   - Run `npx tsc --noEmit` and `npm run build` independently to confirm real compilation success without suppressed errors (`@ts-ignore` abuse, dummy tsconfig overrides).
   - Run `node tests/e2e/runner.mjs` to verify test execution authenticity.

## Verdict Criteria
- If ANY cheating, hardcoding, facade, or database leakage is found: verdict MUST BE **INTEGRITY VIOLATION**.
- If all implementations are 100% genuine and authentic: verdict is **CLEAN**.

Write your complete forensic report to:
`C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\auditor_1\handoff.md`.
Send a message with your verdict to orchestrator (Recipient: "parent", ID: "b9f9d386-ec62-40d7-8959-4415f80bc3f0").


## 2026-10-07T07:01:14Z
You are the Forensic Auditor for Gioielleria Oroeco.
Working directory: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\auditor_1
Read your task assignment at: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\auditor_1\DISPATCH.md
Read the original request at: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\ORIGINAL_REQUEST.md
Read the project spec at: C:\Users\mario\Progetti Antigravity\Oroeco\PROJECT.md
Read TEST_READY.md and worker handoffs.

Conduct full forensic integrity audit:
1. Verify NO hardcoded test results, facade implementations, or simulated dummy calculations in CassaTerminal.tsx, auraProtocol.ts, sdiProtocol.ts, useInventoryStore.ts, catalog.ts, useCartStore.ts.
2. Verify total database isolation: zero external DB queries, zero Creativia DB queries, genuine standalone supabase/schema.sql.
3. Verify hardware barcode scanner listener authenticity in lib/useBarcodeScanner.ts.
4. Verify storefront luxury compliance, all Excel routes, and required footer credit "Sviluppato da Creativia Studio".
5. Independently run npx tsc --noEmit, npm run build, and node tests/e2e/runner.mjs.
Give your binary verdict: CLEAN or INTEGRITY VIOLATION.
Write your complete forensic report to:
C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\auditor_1\handoff.md.
Send a message with your verdict to orchestrator (Recipient: "parent", ID: "b9f9d386-ec62-40d7-8959-4415f80bc3f0").
