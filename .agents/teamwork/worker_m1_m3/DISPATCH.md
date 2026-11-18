# Task Assignment: Worker Implementation (Milestones M1, M2, M3)

## Identity & Role
- Archetype: teamwork_preview_worker
- Role: Full-Stack Implementation Worker
- Working directory: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\worker_m1_m3
- Parent: Orchestrator (b9f9d386-ec62-40d7-8959-4415f80bc3f0)

## Mandatory References
You MUST read:
1. `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `C:\Users\mario\Progetti Antigravity\Oroeco\PROJECT.md`
3. `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\explorer_survey_1\handoff.md`
4. `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\explorer_survey_2\handoff.md`
5. `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\explorer_survey_3\handoff.md`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Write Ownership (Exclusive Files)
You own the following files:
- `supabase/schema.sql` (NEW)
- `types/cassa.ts` (NEW)
- `store/useInventoryStore.ts` (NEW)
- `lib/auraProtocol.ts` (NEW)
- `lib/sdiProtocol.ts` (NEW)
- `components/admin/CassaTerminal.tsx` (UPDATE/ENHANCE)
- Any sub-components for cassa under `components/admin/` (e.g. `AuraReceiptModal.tsx`, `SdiInvoiceModal.tsx`, `BarcodeListener.tsx` if split)
- `components/layout/Footer.tsx` (verify/ensure "Sviluppato da Creativia Studio" credit)

## Objectives & Deliverables

### 1. Database Isolation & Standalone Schema (R3)
- Ensure total database isolation: NO external DB connections, NO Supabase credentials or queries to Creativia DB.
- Create `supabase/schema.sql`: Complete standalone PostgreSQL/Supabase schema for Oroeco's future dedicated DB instance.
  * Tables: `oroeco_brands`, `oroeco_categories`, `oroeco_products`, `oroeco_customers`, `oroeco_sales`, `oroeco_sale_items`, `oroeco_inventory_transactions`, `oroeco_aura_receipts`, `oroeco_audit_log`.
  * Enable RLS on all tables with standard policies.
  * Performance indexes on barcode (EAN-13), category, brand, created_at, receipt_number.
  * Stored procedure `oroeco_record_pos_sale(...)` for atomic sale insertion and stock decrement.

### 2. POS Types & Persistent Inventory Store (M1 & M3)
- Create `types/cassa.ts`: Types for operators ('Renato' | 'Carmela' | 'Maria'), cassa tickets, tax calculations, Ditron Aura RT commands, SDI invoice data, inventory transactions.
- Create `store/useInventoryStore.ts`: Zustand store with `persist` middleware (localStorage key `oroeco_inventory_stock`):
  * Initialize from `lib/catalog.ts` product stock.
  * Method `depleteStock(barcodeOrSku: string, quantity: number): boolean`
  * Method `getStock(barcodeOrSku: string): number`
  * Method `resetToCatalog(): void`
  * Transaction history log.

### 3. POS Terminal & Hardware Barcode Scanner Listener (`/admin/cassa` - R2)
- Update `components/admin/CassaTerminal.tsx` (and companion components):
  * **Operator Selector**: Quick toggle for Renato, Carmela, and Maria.
  * **Hardware Barcode Listener**: True global `keydown` listener on `window` (active whenever the POS page is mounted, unless an explicit modal input is active). Must detect rapid successive keystrokes from USB/Bluetooth scanner guns (<60ms inter-key interval), buffer characters, terminate on Enter, trigger Web Audio API beep (`playPosBeep()`), look up product via `findProductByCode(code)`, and automatically add/increment item in the current ticket. Differentiate from slow manual typing.
  * **Manual Search**: Live search input filtering catalog by name, brand, SKU, or category with quick add button.
  * **Quick Discounts**: Chips for 5%, 10%, 15%, 20%, 50€, 100€ and custom input.
  * **Cash Tender & Change Due**: Calculator showing "Contanti ricevuti" and automatic "Resto da dare".
  * **Real-time Tax Calculation**: Subtotal, discounts, taxable base (Imponibile IVA = Totale / 1.22), IVA 22% scorporata, Total.
  * **Stock Depletion**: On sale completion, synchronously call `useInventoryStore.depleteStock` for every line item, save sale to history, and reset ticket.
  * **Axon Micrelec Aura RT Modal & Protocol**: Generate Ditron LAN protocol command lines (`VEND REP=...`, `SUBT`, `CHIUS T=...`), show modal with command preview, LAN status simulation, and print trigger.
  * **SDI 1-Click Invoice Modal**: Form for Customer Anagraphics (Nome/Ragione Sociale, CF/P.IVA, Codice Destinatario SDI '0000000' or PEC), with instant validation and FatturaPA preview.

### 4. Luxury Storefront Verification (M2)
- Verify `components/layout/Footer.tsx` includes "Sviluppato da Creativia Studio".
- Ensure all 13 routes compile and render seamlessly without regressions.

### 5. Verification Requirements
- Execute `npx tsc --noEmit` and ensure 0 errors.
- Execute `npm run build` and ensure all routes compile successfully.
- Write your complete handoff report to:
  `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\worker_m1_m3\handoff.md`.


## 2026-10-07T06:16:32Z
You are the Full-Stack Implementation Worker for Gioielleria Oroeco (Milestones M1, M2, M3).
Working directory: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\worker_m1_m3
Read your task assignment at: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\worker_m1_m3\DISPATCH.md
Read the original request at: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\ORIGINAL_REQUEST.md
Read the project spec at: C:\Users\mario\Progetti Antigravity\Oroeco\PROJECT.md
Read the explorer handoffs:
- C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\explorer_survey_1\handoff.md
- C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\explorer_survey_2\handoff.md
- C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\explorer_survey_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your deliverables:
1. `supabase/schema.sql`: Standalone schema for Oroeco's dedicated DB (9 tables, RLS policies, indexes, stored procedure `oroeco_record_pos_sale`). Total DB isolation strictly maintained.
2. `types/cassa.ts`: Strict types for operators ('Renato' | 'Carmela' | 'Maria'), tickets, discounts, Ditron Aura RT commands, SDI invoice data, inventory transactions.
3. `store/useInventoryStore.ts`: Persistent store (localStorage `oroeco_inventory_stock`) with `depleteStock`, `getStock`, `resetToCatalog`, transaction history.
4. `lib/auraProtocol.ts`: Ditron LAN protocol command generator for Axon Micrelec Aura RT.
5. `lib/sdiProtocol.ts`: SDI 1-Click e-invoice generator and validator.
6. `components/admin/CassaTerminal.tsx` (and companion components):
   - Ergonomic UI for Renato, Carmela, and Maria (operator selector).
   - Global hardware barcode scanner listener on window (<60ms keydown interval, Enter terminator, audio beep, instant lookup and line add).
   - Manual search by name/SKU/brand/category.
   - Quick discount chips (5%, 10%, 15%, 20%, 50€, 100€).
   - Cash tender & change due calculator ("Contanti ricevuti" & "Resto da dare").
   - Real-time tax breakdown (Subtotal, Discounts, Imponibile IVA, IVA 22% scorporata, Total).
   - Axon Micrelec Aura RT receipt modal with Ditron LAN command preview.
   - SDI 1-Click invoice modal (B2C & B2B).
   - Synchronous stock depletion on sale completion and ticket reset.
7. Verify `components/layout/Footer.tsx` includes credit "Sviluppato da Creativia Studio".
8. Run `npx tsc --noEmit` (0 errors) and `npm run build` (all routes successful).

Write your full handoff report to:
`C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\worker_m1_m3\handoff.md`.
Send a message to orchestrator (Recipient: "parent", ID: "b9f9d386-ec62-40d7-8959-4415f80bc3f0") when complete.
