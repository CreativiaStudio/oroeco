# Survey Report: POS Hardware & Database Isolation (R2 & R3)

**Author:** Survey Explorer 3  
**Target:** Orchestrator (`b9f9d386-ec62-40d7-8959-4415f80bc3f0`)  
**Workspace:** `C:\Users\mario\Progetti Antigravity\Oroeco`  
**Date:** 2026-10-07  

---

## 1. Observation

### 1.1 Existing Oroeco Codebase & Build Status
- **Repository Build & Types:**
  - `npx tsc --noEmit` executed with code `0`, reporting 0 TypeScript errors.
  - `npm run build` executed with code `0`, successfully generating all 13 routes.
  - Route `/admin/cassa` is registered at `app/admin/cassa/page.tsx` and compiled as static content (`7.39 kB`, First Load JS `132 kB`).
- **Dependencies (`package.json` lines 11-29):**
  - Next.js `15.2.1`, React `19.0.0`, Tailwind CSS `4.0.9`, Zustand `5.0.3`, Lucide React `1.16.0`.
  - Zero database client packages installed: no `@supabase/supabase-js`, `@prisma/client`, or `pg`.
  - Zero `.env` or `.env.local` files present in the project directory.
  - Total database isolation currently maintained.

### 1.2 Inspection of Existing POS Terminal (`components/admin/CassaTerminal.tsx`)
- **Keyboard Listener (`components/admin/CassaTerminal.tsx` lines 98–113):**
  ```typescript
  /* ---------- Listener globale: riporta sempre il focus sull'input barcode ---------- */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable;
      if (!isEditable) {
        barcodeRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  ```
  - *Observation:* This listener simply shifts focus to `barcodeRef` when a key is pressed while no input is active.
  - *Identified Gaps:*
    1. If the operator clicked on the search field (`input[placeholder="Es. «solitario»..."]`), discount field, or invoice modal, the barcode scanner output is typed into that field instead of adding an item to the receipt.
    2. No inter-keystroke timing analysis (< 50ms) to distinguish high-speed hardware barcode scanner bursts from deliberate manual operator typing.
    3. No `Enter` terminator interception (`event.preventDefault()`, `event.stopPropagation()`) preventing accidental form submissions or bubbling.
    4. No audio feedback synthesizer (`Web Audio API`).
- **Sale Actions & Stock Depletion (`components/admin/CassaTerminal.tsx` lines 203–243):**
  ```typescript
  const handleReceipt = () => {
    ...
    const id = buildTransactionId();
    pushToast({
      tone: "success",
      title: "Scontrino trasmesso (Axon Aura RT)",
      message: `Documento ${id} inviato al registratore telematico. Totale ${formatPrice(total)} · ${itemCount} pz.`,
    });
  };
  ```
  - *Observation:* Both `handleReceipt` and `handleInvoice` trigger local UI toasts with pseudo-random IDs (`ORC-...`).
  - *Observation:* No state change is applied to stock or catalog inventory. `products` in `lib/catalog.ts` remain unchanged.
  - *Observation:* Scontrino button triggers immediately without tender method selection (Contanti vs Carta POS vs Split), cash drawer kick, or change (Resto) calculation.
  - *Observation:* No tax/VAT breakdown is calculated (imponibile vs IVA 22% scorporata).

### 1.3 Inspection of Battle-Tested Reference (`Scelta Makeup`)
- In `C:\Users\mario\Progetti Antigravity\Scelta Makeup\components\admin\QuickScanBarcodeModal.tsx`:
  - **Hardware Timing Buffer (lines 1102–1171):** Uses `lastKeyTime` delta check (`timeDiff > 600` resets buffer, scanner keystrokes arrive in `< 60ms`), `Enter` terminator triggers lookup when `buffer.length >= 4`, capturing on `window.addEventListener("keydown", handleKeyDown, true)`.
  - **Synthetic Audio Beep (lines 170–192):** Web Audio API oscillator (`1200 Hz`, exponential ramp down `0.12s`) providing zero-latency acoustic confirmation on physical scans without audio asset files.
  - **Cassa RT & Cash Drawer Kick (lines 1032–1050):** HTTP POST to local IP endpoint (`/cgi-bin/fpmate.cgi` or LAN REST endpoint).
  - **Inventory Depletion Procedure (`supabase_schema.sql` lines 384–449):** Stored procedure `scelta_record_pos_sale` atomically updates inventory and creates `inventory_logs` records.

### 1.4 Status of Database Schema File
- `supabase/schema.sql` does not exist in `C:\Users\mario\Progetti Antigravity\Oroeco`.
- Types in `types/product.ts` lack database representations for sales, receipt logs, customer billing data, and inventory audit trails.

---

## 2. Logic Chain

### 2.1 POS UX Ergonomics for Renato & Family (Elderly/Family Counter Operators)
1. **Operator Context:** Oroeco is operated in Pagani (SA) by Renato (owner), his mother, and his aunt. In physical retail jewelry, counter transactions are high-stress and high-ticket, with customers negotiating prices in real-time.
2. **Visual Ergonomics:**
   - Visual acuity varies: small fonts (< 14px) and muted contrasts cause input errors.
   - Touch targets must adhere to WCAG AAA touch target standards (minimum `48x48px`, preferably `56px` for primary actions).
   - Color coding must be intuitive: Navy `#0B132B` (stable branding), Pure White `#FFFFFF` (high contrast), Warm Gold `#C5A059` (accents), Emerald `#15803D` (confirmed scan/sale), Crimson `#DC2626` (errors/clear).
3. **Operator Switcher:**
   - Rather than a static "Renato (TITOLARE)" badge, provide an active dropdown/switch for:
     * Renato (Titolare)
     * Carmela (Mamma)
     * Maria (Zia)
   - Every transaction and stock log must stamp the active operator for clear accountability.
4. **Tender & Change Due ("Resto") Calculator:**
   - In jewelry, cash transactions often involve large banknotes (e.g., 50 €, 100 €, 200 €, 500 €).
   - When "Contanti" is selected, the interface must provide quick denomination chips (`[50€] [100€] [200€] [500€] [Esatto]`), an input for "Contante Ricevuto", and a massive high-contrast display of "RESTO DA DARE: €XX,XX".
   - This eliminates mental arithmetic stress for Renato's mother and aunt.
5. **Quick Negotiated Discount Buttons:**
   - Jewelry sales often feature discounts (5%, 10%, 15%, 20%, or rounded cash amounts like -20 €, -50 €, -100 €).
   - Provide one-tap preset chips alongside the custom percentage/amount input.

### 2.2 Global Hardware Barcode Scanner Listener Architecture
1. **Device Mechanism:** Physical barcode scanners (USB/Bluetooth HID) emulate a keyboard. Characters arrive in rapid succession (typically 10–35ms per character), ending with `Enter`.
2. **Timing Discrimination Logic:**
   - If `currentTime - lastKeyTime < 60ms`: character belongs to an automated scanner stream.
   - If `currentTime - lastKeyTime >= 500ms`: reset buffer (human typed or pause).
   - If `event.key === "Enter"` and `buffer.length >= 4`:
     - `event.preventDefault()` and `event.stopPropagation()` to stop form submissions.
     - Extract `code = buffer.trim()`.
     - Reset buffer to `""`.
     - Look up product in catalog via `findProductByCode(code)`.
     - Trigger Web Audio `playPosBeep()`.
     - Flash green scanner feedback state.
     - Append line item to active receipt.
3. **Input Field Isolation:**
   - Using the capture phase (`window.addEventListener("keydown", handler, true)`), if a burst of 6+ digits arrives in < 250ms terminating in Enter, it should be intercepted as a barcode scan even if a text input currently has focus (reverting unwanted characters from the input).

### 2.3 Tax (IVA 22%) & Financial Computation
1. In Italian fiscal compliance (AdE), standard luxury jewelry and watches are subject to **IVA 22%**.
2. For any receipt total $T$:
   $$\text{Imponibile (Taxable base)} = \frac{T}{1.22}$$
   $$\text{Imposta IVA 22\%} = T - \text{Imponibile}$$
3. Displaying this breakdown in real-time gives Renato full clarity for fiscal closing (Chiusura Fiscale Z).

### 2.4 Hardware Protocol: Axon Micrelec Aura RT (Ditron LAN Protocol)
1. **Architecture:** Axon Micrelec Aura RT supports TCP/LAN communication. It executes standard Ditron/Axon ECR commands via socket (port `9100` / `23`) or via local HTTP/REST gateway service (e.g. `Axon FPID Pro` or Node proxy route on LAN).
2. **Command Structure:**
   - `VEND REP=1, PRE=<price>, DES='<item_name>'` (Repeated for each item in receipt)
   - `SUBT` (Subtotal display)
   - `[SCONTO S=<discount_amount>]` (Optional discount)
   - `[LOTTERIA COD='<lottery_code>']` (Lotteria degli scontrini alphanumeric code)
   - `CHIUS T=<1|2>, IMP=<total>` (T=1 Contanti, T=2 Carta/Bancomat)
3. **Next.js Implementation:**
   - A client-side Ditron command builder generates the exact ECR script.
   - An API route (`/api/admin/cassa/print-receipt`) acts as the LAN proxy, forwarding the payload to the RT IP address (configurable in settings, e.g. `192.168.1.150:9100` or `http://192.168.1.150:8080/api/print`).
   - If the physical RT is unreachable (e.g. development or offline LAN), a graceful simulation fallback generates a full fiscal receipt preview with Documento Commerciale number, RT serial, date/time, and printable thermal receipt preview.

### 2.5 SDI Electronic Invoicing ("Fattura Elettronica 1-Click")
1. **Business Requirement:** In high-value jewelry sales, customers frequently request a tax invoice (Fattura Elettronica SDI) for tax deductions, company gifts, or luxury asset registration.
2. **Customer Validation:**
   - **B2C (Privato):** Codice Fiscale (16 alfanumerici), Codice Destinatario `0000000`, PEC opzionale.
   - **B2B (Azienda):** Ragione Sociale, Partita IVA (11 cifre), Codice Destinatario SDI (7 caratteri alfanumerici) o PEC obbligatoria.
3. **Payload Structure:** Ready for FatturaPA XML v1.2 (`FPR12`), including Cedente/Prestatore (Oroeco di Renato...) and Cessionario/Committente.

### 2.6 Real-Time Stock Depletion & Storefront Synchronization
1. **The Double-Selling Risk:** In jewelry, luxury rings, watches, and necklaces often have stock quantity = 1. If an item is sold at the counter in Pagani, it must immediately be marked unavailable (`inStock = false`, `stockQuantity = 0`) on the storefront e-commerce.
2. **State Management Solution:**
   - Introduce `useInventoryStore.ts` (Zustand with localStorage persistence `oroeco-inventory-v1`).
   - Introduce `useCassaStore.ts` (Zustand with localStorage persistence `oroeco-cassa-v1`).
   - When a sale completes (Scontrino or Fattura):
     1. `depleteStock(lines, saleId, operator)` decrements `stockQuantity`.
     2. Records an entry in `inventoryTransactions`.
     3. Appends the completed sale to `salesHistory`.
     4. Storefront components read effective available stock from `useInventoryStore`.

### 2.7 Total Database Isolation (R3) & Standalone Schema Strategy
1. **Strict Isolation Rule:** Zero calls to external DBs, zero references to Creativia Hub in runtime code.
2. **Handover Deliverable:** A completely standalone, idempotent SQL script `supabase/schema.sql` that can be run with 1-click in the SQL Editor of Oroeco's dedicated Supabase project once Mario provisions it.
3. **Schema Design Components:**
   - Custom types & enum domains
   - Tables with `oroeco_` prefix to guarantee complete namespace isolation:
     * `oroeco_brands`
     * `oroeco_categories`
     * `oroeco_products`
     * `oroeco_customers`
     * `oroeco_sales`
     * `oroeco_sale_items`
     * `oroeco_inventory_transactions`
     * `oroeco_aura_receipts`
     * `oroeco_audit_log`
   - Atomic stored procedure `oroeco_record_pos_sale` with row-level locking (`FOR UPDATE`) to prevent race conditions during high-concurrency physical/online sales.
   - Comprehensive performance indexes on `barcode`, `sku`, `slug`, `category_id`, `brand_id`.
   - Row Level Security (RLS) policies for anon public read and authenticated staff management.

---

## 3. Caveats
1. **Physical Hardware Access:** The physical Axon Micrelec Aura RT device and physical barcode scanner gun are located in the physical boutique in Pagani (SA). Network connectivity tests to IP `192.168.x.x` cannot be tested over external internet without local network presence or VPN; therefore, a local simulation engine and configurable LAN IP endpoint must be provided.
2. **Existing UI State:** `components/admin/CassaTerminal.tsx` already contains an initial layout and styling that compiles cleanly (`7.39 kB`). The enhancements should build upon and refine this existing component rather than rewriting from scratch, preserving its luxury theme and Lucide icon mappings.
3. **Supabase Provisioning:** As dictated by R3, no database can be provisioned or linked until Mario provides the dedicated credentials. The schema file `supabase/schema.sql` is a standalone delivery ready for that future moment.

---

## 4. Conclusion & Architectural Blueprints

### 4.1 Proposed Implementation: Hardware Barcode Listener Hook
```typescript
// lib/useBarcodeScanner.ts
"use client";

import { useEffect, useRef } from "react";

export function playPosBeep() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.10);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.10);
  } catch {
    // Audio context may be restricted before user gesture
  }
}

interface UseBarcodeScannerOptions {
  onScan: (code: string) => void;
  minChars?: number;
  maxKeystrokeDeltaMs?: number;
}

export function useBarcodeScanner({
  onScan,
  minChars = 4,
  maxKeystrokeDeltaMs = 60,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef("");
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Reset buffer if delay exceeds human typing limit
      if (delta > 500 && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      if (e.key === "Enter") {
        if (bufferRef.current.length >= minChars) {
          e.preventDefault();
          e.stopPropagation();
          const scanned = bufferRef.current.trim();
          bufferRef.current = "";
          playPosBeep();
          onScan(scanned);
        } else {
          bufferRef.current = "";
        }
        return;
      }

      // Capture single printable characters
      if (e.key && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onScan, minChars, maxKeystrokeDeltaMs]);
}
```

### 4.2 Proposed Implementation: Ditron / Axon Aura RT Protocol Generator
```typescript
// lib/axonAuraProtocol.ts

export interface AuraReceiptItem {
  name: string;
  price: number;
  quantity: number;
  department?: number; // 1 = Gioielli/Orologi (IVA 22%)
}

export interface AuraReceiptPayload {
  items: AuraReceiptItem[];
  paymentMethod: "cash" | "card";
  discountAmount?: number;
  lotteryCode?: string;
  operatorName?: string;
}

export function generateDitronEcrCommands(payload: AuraReceiptPayload): string[] {
  const commands: string[] = [];

  // 1. Line items
  payload.items.forEach((item) => {
    const sanitizedName = item.name.replace(/'/g, "").slice(0, 24);
    const rep = item.department || 1;
    const priceStr = item.price.toFixed(2);
    if (item.quantity > 1) {
      commands.push(`VEND REP=${rep}, QTA=${item.quantity}, PRE=${priceStr}, DES='${sanitizedName}'`);
    } else {
      commands.push(`VEND REP=${rep}, PRE=${priceStr}, DES='${sanitizedName}'`);
    }
  });

  // 2. Subtotal
  commands.push("SUBT");

  // 3. Optional Discount
  if (payload.discountAmount && payload.discountAmount > 0) {
    commands.push(`SCONTO S=${payload.discountAmount.toFixed(2)}`);
  }

  // 4. Optional Lottery Code
  if (payload.lotteryCode && payload.lotteryCode.trim().length === 8) {
    commands.push(`LOTTERIA COD='${payload.lotteryCode.trim().toUpperCase()}'`);
  }

  // 5. Total and Tender (T=1 Contanti, T=2 Carta/POS)
  const tender = payload.paymentMethod === "cash" ? 1 : 2;
  commands.push(`CHIUS T=${tender}`);

  return commands;
}
```

### 4.3 Proposed Implementation: Standalone `supabase/schema.sql` Specification
The script to be placed at `supabase/schema.sql` must contain:
1. Extensions: `uuid-ossp`, `pgcrypto`.
2. Core Tables:
   - `oroeco_brands`: id, slug, name, country, description, categories text[].
   - `oroeco_categories`: id, slug, label, description, parent_category.
   - `oroeco_products`: id, slug, name, brand, brand_slug, category, subcategory, subcategory_label, price, compare_at_price, vat_rate numeric default 22.00, stock_quantity integer, in_stock boolean, barcode text, sku text, attributes jsonb, images text[], tags text[], is_featured boolean, is_new boolean, is_christmas boolean, created_at, updated_at.
   - `oroeco_customers`: id, customer_type text (b2c/b2b), first_name, last_name, company_name, vat_number, fiscal_code, sdi_code, pec, email, phone, address, city, postal_code, province, country default 'IT', notes, total_orders, total_spent, created_at, updated_at.
   - `oroeco_sales`: id, sale_number text unique, sale_type text (scontrino_rt, fattura_sdi, ricevuta), status text, subtotal numeric, discount_amount numeric, discount_mode text, vat_rate numeric default 22.00, vat_amount numeric, total_amount numeric, payment_method text (cash, card, split), cash_tendered numeric, cash_change numeric, operator_name text, lottery_code text, rt_doc_id text, rt_z_report text, sdi_identifier text, sdi_status text, created_at.
   - `oroeco_sale_items`: id, sale_id references oroeco_sales(id), product_id references oroeco_products(id), product_name, brand, sku, barcode, unit_price numeric, quantity integer, line_total numeric, created_at.
   - `oroeco_inventory_transactions`: id, product_id references oroeco_products(id), sku, change_quantity integer, previous_quantity integer, new_quantity integer, movement_type text (pos_instore_sale, ecom_online_sale, restock, manual_adjustment, return_damaged), reference_id text, operator text, notes text, created_at.
   - `oroeco_aura_receipts`: id, sale_id references oroeco_sales(id), raw_commands text[], status text (sent, simulated, error), response_code text, created_at.
   - `oroeco_audit_log`: id, category text, action text, title text, description text, operator text, details jsonb, created_at.
3. Functions & Triggers:
   - `oroeco_set_updated_at()` trigger for products and customers.
   - `oroeco_record_pos_sale(p_product_id, p_quantity, p_sale_number, p_operator)` function with `FOR UPDATE` lock, stock decrement, `in_stock` update, and audit log generation.
4. RLS Policies:
   - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
   - Public read for active catalog (`oroeco_products`, `oroeco_brands`, `oroeco_categories`).
   - Authenticated staff read/write for all tables.
5. Indexes:
   - Indexes on `barcode`, `sku`, `slug`, `brand_slug`, `category`, `sale_number`, `created_at`.

---

## 5. Verification Method

### 5.1 Verification Commands
1. **Type Checking:**
   ```powershell
   npx tsc --noEmit
   ```
   *Expected Result:* 0 errors.
2. **Build Validation:**
   ```powershell
   npm run build
   ```
   *Expected Result:* Clean Next.js compilation including `/admin/cassa` and all public routes.
3. **Database Isolation Verification:**
   ```powershell
   git grep -i "supabase"
   ```
   *Expected Result:* No external Supabase client URLs, keys, or credentials configured. Only local catalog and local schema references.

### 5.2 Interactive POS Verification
1. Access `http://localhost:3000/admin/cassa`.
2. Input a valid catalog barcode (e.g. `8058258321011` - *Anello Solitario Luce*, Bulova `7613072221014`, Stroili `8058258321028`):
   - Confirms synthetic audio beep triggers.
   - Confirms green flash indicator.
   - Confirms line item is appended to receipt.
   - Confirms gross subtotal, VAT 22% breakdown, and grand total calculate dynamically.
3. Click "Batti Scontrino Cassa (Axon Aura RT)":
   - Modal allows selection between Contanti (with Resto calculation) and Carta POS.
   - Displays Ditron ECR protocol command preview (`VEND REP=1...`, `CHIUS T=1...`).
   - Completing sale decrements inventory stock in local Zustand store.
4. Click "Emetti Fattura Elettronica SDI 1-Click":
   - Customer modal validates Codice Fiscale (16 chars) or P.IVA (11 digits).
   - Generates FatturaPA transmission preview.
5. Inspect `supabase/schema.sql`:
   - Contains all 9 isolated tables, triggers, indexes, and atomic POS stored procedure.

### 5.3 Invalidation Conditions
- If any external database credentials or network requests to non-Oroeco hosts are introduced, database isolation (R3) is violated.
- If barcode scanner inputs fail to register without clicking the input field first, the hardware listener requirement (R2) is violated.
- If counter sales do not decrement available catalog stock, the inventory depletion requirement (R2) is violated.
