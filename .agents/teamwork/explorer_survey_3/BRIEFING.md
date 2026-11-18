# BRIEFING — 2026-10-07T06:13:30Z

## Mission
Investigate and design requirements R2 (POS Gestionale Cassa Banco at /admin/cassa) and R3 (Total Database Isolation) for Gioielleria Oroeco.

## 🔒 My Identity
- Archetype: teamwork_preview_explorer
- Roles: POS Hardware & Database Isolation Explorer
- Working directory: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\explorer_survey_3
- Original parent: b9f9d386-ec62-40d7-8959-4415f80bc3f0
- Milestone: survey_exploration

## 🔒 Key Constraints
- Read-only investigation — do NOT implement main project code directly
- Strict isolation from any external or Creativia DB (NO Supabase URL/key to other clients)
- POS UI tailored to Renato, mom, and aunt (touch-friendly, high contrast, readable)
- Dedicated hardware barcode scanner listener design (EAN keystrokes buffer < 50ms, Enter terminator)
- Design standalone `supabase/schema.sql` and local typed catalog/Zustand store architecture

## Current Parent
- Conversation ID: b9f9d386-ec62-40d7-8959-4415f80bc3f0
- Updated: not yet

## Investigation State
- **Explored paths**: `ORIGINAL_REQUEST.md`, `DISPATCH.md`, `components/admin/CassaTerminal.tsx`, `types/product.ts`, `lib/catalog.ts`, `store/useCartStore.ts`, Scelta Makeup POS (`QuickScanBarcodeModal.tsx`, `supabase_schema.sql`), Axon Micrelec Aura RT Ditron protocol specs.
- **Key findings**:
  1. Oroeco app builds cleanly with zero errors (`tsc --noEmit` 0 errors, `npm run build` succeeds). Total isolation currently verified (no Supabase client, zero env vars).
  2. Current `CassaTerminal.tsx` has basic UI and simple focus redirect listener, but lacks keystroke timing buffer (< 50ms), Enter terminator capture, Web Audio synthesizer beep, operator switcher (Renato, mom, aunt), cash & change calculation, quick discount chips, and VAT 22% breakdown.
  3. Stock depletion is not connected to a persistent store; sales do not decrement stock.
  4. Standalone `supabase/schema.sql` does not exist yet and must be fully designed with 9 tables, triggers, POS function, and RLS.
- **Unexplored areas**: None for R2/R3 survey scope.

## Key Decisions Made
- Formulate comprehensive analysis and code blueprints for R2 POS and R3 Database Isolation in `handoff.md`.
- Detail the Ditron LAN protocol (`VEND REP=1, PRE=..., DES=...`, `SUBT`, `CHIUS T=1|2`) and the Web Audio synthesizer beep.
- Provide the full production DDL design for `supabase/schema.sql` and the typed inventory/cassa store architecture.

## Artifact Index
- `BRIEFING.md` — persistent working memory
- `progress.md` — liveness heartbeat
- `handoff.md` — 5-component handoff report
