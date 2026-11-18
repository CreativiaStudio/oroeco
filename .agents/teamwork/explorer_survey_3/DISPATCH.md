# Task Assignment: Survey Explorer 3 - POS Hardware & Database Isolation Requirements

## Identity & Role
- Archetype: teamwork_preview_explorer
- Role: POS Hardware & Database Isolation Explorer
- Working directory: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\explorer_survey_3
- Parent: Orchestrator (b9f9d386-ec62-40d7-8959-4415f80bc3f0)

## Objective
Read `ORIGINAL_REQUEST.md` at `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\ORIGINAL_REQUEST.md`.
Examine requirement R2 (POS Gestionale Cassa Banco & Listener Hardware Pistola Barcode) and R3 (Total Database Isolation):
1. POS Interface at `/admin/cassa`:
   - High readability and touch-friendly for Renato, mom, and aunt.
   - Global hardware barcode scanner keydown listener:
     * Fast EAN keystrokes buffer with Enter terminator detection (differentiating scanner input from slow manual keyboard input).
     * Instant lookup and automatic line addition to current receipt.
   - Rapid manual search (name, supplier code, category).
   - Real-time sale summary: items list, quantity adjustment, percentage/fixed discounts, tax/VAT calculation, grand total.
   - Action buttons:
     * "Batti Scontrino Fiscale": Axon Micrelec Aura RT command logic/modal (Ditron/Axon LAN protocol preparation).
     * "Emetti Fattura Elettronica SDI 1-Click": Rapid modal for customer anagraphics (Codice Fiscale, P.IVA, SDI code/PEC) and SDI invoice generation.
   - Stock depletion: immediate reduction of inventory stock on completed sale.
2. Total Database Isolation (R3):
   - Strict isolation from any external or Creativia DB.
   - Local typed catalog layer (`lib/catalog.ts`), Zustand stores (`cart`, `cassa`, `inventory`), mirrored to Supabase TypeScript types (`types/product.ts`).
   - Design of standalone SQL script `supabase/schema.sql` (tables: products, categories, brands, sales, sale_items, customers, audit_log, inventory_transactions; RLS policies, indexes).

Write your report to `C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\explorer_survey_3\handoff.md`.
Report back using `send_message` when complete.


## 2026-10-07T06:06:42Z
You are Survey Explorer 3 for Gioielleria Oroeco.
Working directory: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\explorer_survey_3
Read your task assignment at: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\explorer_survey_3\DISPATCH.md
Read the original request at: C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\ORIGINAL_REQUEST.md

Investigate requirements R2 (POS Gestionale Cassa Banco at /admin/cassa) and R3 (Total Database Isolation):
1. POS Interface UX for Renato & family: high contrast, large touch targets, touch-friendly.
2. Global hardware barcode listener: keydown timing threshold to detect fast scanner keystrokes, Enter terminator, item lookup, sound/feedback, adding to ticket.
3. Quick manual search, real-time ticket calculation (discounts, VAT 22%, totals).
4. Action modals: "Batti Scontrino Fiscale" (Axon Micrelec Aura RT LAN protocol Ditron preparation), "Emetti Fattura Elettronica SDI 1-Click" (customer SDI/PEC modal).
5. Immediate stock depletion.
6. Database isolation: strictly local catalog layer (`lib/catalog.ts`), Zustand stores, `types/product.ts`, and full design of standalone `supabase/schema.sql`.
Write your comprehensive analysis to C:\Users\mario\Progetti Antigravity\Oroeco\.agents\teamwork\explorer_survey_3\handoff.md.
When finished, send a message to the orchestrator (Recipient: "parent", ID: "b9f9d386-ec62-40d7-8959-4415f80bc3f0") with your findings and path to handoff.md.
