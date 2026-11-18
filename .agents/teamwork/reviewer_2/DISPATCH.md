# Task Assignment: Reviewer 2 (POS Gestionale Cassa Banco - R2 & Database Isolation - R3)

## Identity & Role
- Archetype: teamwork_preview_reviewer
- Role: POS & Backend Reviewer
- Working directory: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\reviewer_2
- Parent: Orchestrator (b9f9d386-ec62-40d7-8959-4415f80bc3f0)

## Mandatory References
You MUST read:
1. `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `C:\Users\mario\Progetti Antigravity\Oroeco\PROJECT.md`
3. `C:\Users\mario\Progetti Antigravity\Oroeco\TEST_READY.md`
4. `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\worker_m1_m3\handoff.md`

## Review Objective
Independently inspect, build, and verify requirements R2 (POS Cassa Banco) and R3 (Database Isolation):
1. POS Terminal at `/admin/cassa`:
   - Operator switcher: Renato, Carmela, Maria.
   - Global hardware barcode scanner keydown listener (<60ms inter-keystroke interval, Enter terminator, audio feedback beep).
   - Rapid manual catalog search.
   - Real-time ticket calculation: item lines, quantity adjust, quick discount chips (5%, 10%, 15%, 20%, 50€, 100€), taxable base (imponibile), IVA 22% scorporata, grand total.
   - Cash tender ("Contanti ricevuti") & Change due ("Resto da dare") calculator.
   - Axon Micrelec Aura RT modal with Ditron LAN protocol generator (`VEND REP=...`, `SUBT`, `CHIUS T=...`).
   - SDI 1-Click electronic invoice modal with customer validation and FatturaPA v1.2 XML preview.
   - Immediate inventory stock depletion and ticket reset on sale completion.
2. Total Database Isolation & Schema (R3):
   - Standalone `supabase/schema.sql` (9 tables, RLS policies, performance indexes, stored procedure).
   - Zero remote DB queries or Creativia DB connections.
3. Verification:
   - Run `npx tsc --noEmit`
   - Run `npm run build`
   - Run `node tests/e2e/runner.mjs`
4. Provide a clear verdict: **APPROVE** or **REQUEST_CHANGES**.

Write your complete review to:
`C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\reviewer_2\handoff.md`.
Send a message with your verdict and key findings to orchestrator (Recipient: "parent", ID: "b9f9d386-ec62-40d7-8959-4415f80bc3f0").


## 2026-10-07T07:01:14Z
You are Reviewer 2 for Gioielleria Oroeco.
Working directory: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\reviewer_2
Read your task assignment at: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\reviewer_2\DISPATCH.md
Read the original request at: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\ORIGINAL_REQUEST.md
Read the project spec at: C:\Users\mario\Progetti Antigravity\Oroeco\PROJECT.md
Read the worker handoff at: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\worker_m1_m3\handoff.md
Read TEST_READY.md at: C:\Users\mario\Progetti Antigravity\Oroeco\TEST_READY.md

Review requirement R2 (POS Cassa Banco) and R3 (Database Isolation):
1. POS Terminal at /admin/cassa: operator switcher (Renato, Carmela, Maria), global barcode scanner listener (<60ms interval + Enter terminator + audio beep), manual search, discount chips, cash tender & change due calculator, tax calculation (imponibile + IVA 22%), Aura RT modal & Ditron LAN protocol generator, SDI 1-Click invoice modal, stock depletion.
2. Total Database Isolation & standalone supabase/schema.sql (9 tables, RLS, indexes, stored procedure).
3. Run: npx tsc --noEmit, npm run build, and node tests/e2e/runner.mjs.
Give your verdict (APPROVE or REQUEST_CHANGES) and write your handoff to:
C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\reviewer_2\handoff.md.
Send a message with your verdict to orchestrator (Recipient: "parent", ID: "b9f9d386-ec62-40d7-8959-4415f80bc3f0").
