# Project: Gioielleria Oroeco Suite

## Architecture
- **Framework**: Next.js 15 (App Router), React 19, Tailwind CSS 4, Zustand 5, Lucide React.
- **Visual Identity**: Luxury benchmark inspired by Baggio Gioielli.
  - Palette: Pure White (`#FFFFFF`), Deep Ebony (`#0A0A0A`, `#151515`), Warm Graphite (`#4E423E`), Satin Gold (`#C5A059`, `#D4AF37`), Refined Borders (`1px solid #EAEAEA`), Oroeco Navy (`#023351`, `#012840`).
  - Typography: Editorial serif (`Playfair Display`) for headings; clean sans-serif (`Plus Jakarta Sans`) for micro-copy and prices.
- **Data Architecture & Isolation (R3)**:
  - 100% decoupled from any external or Creativia Supabase database.
  - In-memory & localStorage typed catalog (`lib/catalog.ts`), Zustand stores (`useCartStore`, `useWishlistStore`, `useCassaStore`, `useInventoryStore`).
  - Standalone SQL migration script: `supabase/schema.sql` (9 relational tables, RLS policies, indexes, stored procedure).
- **POS Banco & Hardware (R2)**:
  - Terminal at `/admin/cassa` tailored for Renato, Carmela, and Maria.
  - Global keystroke listener for USB/Bluetooth barcode guns (<60ms inter-keystroke delta + Enter terminator).
  - Audio feedback beep via Web Audio API.
  - Axon Micrelec Aura RT command generation (Ditron LAN protocol).
  - SDI 1-Click invoice modal.
  - Immediate local inventory depletion on sale.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Strict Database Isolation | 0 external DB queries; purely local typed catalog | M1 | ORIGINAL_REQUEST §R3 |
| 2 | Standalone Supabase Schema | `supabase/schema.sql` standalone ready for dedicated DB | M1 | ORIGINAL_REQUEST §R3 |
| 3 | Core Types Definition | `types/product.ts` and `types/cassa.ts` with strict types | M1 | ORIGINAL_REQUEST §R3 |
| 4 | Local Catalog & Brands | `lib/catalog.ts` with >50 products & 18 luxury brands | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Persistent Inventory Store | `store/useInventoryStore.ts` tracking stock & depletion | M1 | ORIGINAL_REQUEST §R2 |
| 6 | Visual Identity & Design System | Baggio Gioielli theme in `globals.css` (Playfair, Gold, Ebony) | M2 | ORIGINAL_REQUEST §R1 |
| 7 | Storefront Layout & Header | Sticky header, mega-menu, search modal, dual logo | M2 | ORIGINAL_REQUEST §R1 |
| 8 | Announcement Bar | Navy bar with >150€ free shipping, boutique heritage | M2 | ORIGINAL_REQUEST §R1 |
| 9 | Homepage Editorial Flow | Hero, CategoryGrid, FeaturedTabs, BrandBar, AtelierStory | M2 | ORIGINAL_REQUEST §R1 |
| 10 | Route `/storia` | Storytelling atelier orafico a Pagani dal 1992 | M2 | ORIGINAL_REQUEST §R1 |
| 11 | Route `/gioielli` | 5 subcategories (anelli, collane, orecchini, bracciali, ciondoli) | M2 | ORIGINAL_REQUEST §R1 |
| 12 | Route `/orologi` | 2 subcategories (uomo, donna) | M2 | ORIGINAL_REQUEST §R1 |
| 13 | Route `/accessori` | 4 subcategories (pelletteria, portachiavi, gemelli, penne) | M2 | ORIGINAL_REQUEST §R1 |
| 14 | Route `/casa` | 9 subcategories (posate, bicchieri, vasi, profumatori, etc.) | M2 | ORIGINAL_REQUEST §R1 |
| 15 | Route `/brand` | Directory & filters for all 18 boutique brands | M2 | ORIGINAL_REQUEST §R1 |
| 16 | Route `/natale` | Holiday selection for November launch (`isChristmas: true`) | M2 | ORIGINAL_REQUEST §R1 |
| 17 | Dynamic Product Page | `/prodotto/[slug]` specs, gallery, related items | M2 | ORIGINAL_REQUEST §R1 |
| 18 | Zustand Cart Drawer | Slide-over cart, dynamic progress bar for >150€ threshold | M2 | ORIGINAL_REQUEST §R1 |
| 19 | Luxury Footer | Structured navigation & "Sviluppato da Creativia Studio" | M2 | ORIGINAL_REQUEST §R1 |
| 20 | POS Terminal UI (`/admin/cassa`) | High-contrast touch UI for Renato, Carmela, and Maria | M3 | ORIGINAL_REQUEST §R2 |
| 21 | Operator Switcher | Fast switch between Renato, Carmela, and Maria | M3 | Explorer Survey 3 |
| 22 | Hardware Barcode Scanner Listener | Global listener (<60ms timing, Enter terminator, beep) | M3 | ORIGINAL_REQUEST §R2 |
| 23 | Manual Catalog Search | Real-time filtering by name, SKU, brand, or category | M3 | ORIGINAL_REQUEST §R2 |
| 24 | Real-time Ticket Summary | Item lines, quantities, discounts, tax breakdown (22%) | M3 | ORIGINAL_REQUEST §R2 |
| 25 | Cash Tender & Change Calculator | "Contanti ricevuti" & "Resto da dare" helper | M3 | Explorer Survey 3 |
| 26 | Axon Micrelec Aura RT Modal | Ditron LAN protocol generator & receipt modal | M3 | ORIGINAL_REQUEST §R2 |
| 27 | SDI 1-Click Invoice Modal | B2C/B2B customer form, PEC/SDI code, FatturaPA prep | M3 | ORIGINAL_REQUEST §R2 |
| 28 | Immediate Stock Depletion | Synchronous inventory deduction & transaction log | M3 | ORIGINAL_REQUEST §R2 |
| 29 | Opaque-Box E2E Test Suite | Comprehensive tests (Tiers 1-4) across all features | M4 | Project Architecture |
| 30 | Adversarial Coverage Hardening | White-box stress tests (Tier 5) & full verification | M5 | Project Architecture |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Foundation & Schema | Standalone schema.sql, types/cassa.ts, useInventoryStore | none | PLANNED |
| M2 | Luxury Storefront Verification | Complete Excel navigation, Cart Drawer, Footer credit | M1 | PLANNED |
| M3 | POS Cassa Banco & Hardware | /admin/cassa, Barcode listener, Aura RT & SDI modals, stock depletion | M1 | PLANNED |
| M4 | E2E Testing Suite (Tiers 1-4) | Opaque-box test harness, test runner, TEST_READY.md | M1, M2, M3 | PLANNED |
| M5 | Final E2E Pass & Adversarial Hardening | Pass 100% E2E tests, Tier 5 hardening, tsc & build pass | M4 | PLANNED |

## Interface Contracts
### `store/useInventoryStore` ↔ `components/admin/CassaTerminal`
- `depleteStock(barcodeOrSku: string, quantity: number): boolean`
- `getStock(barcodeOrSku: string): number`
- `resetInventory(): void`
- `getTransactionHistory(): InventoryTransaction[]`

### `components/admin/CassaTerminal` ↔ Axon Micrelec Aura RT Generator
- `generateDitronAuraPayload(ticket: CassaTicket, operator: string): { commandLines: string[]; totalEuro: number; rawPayload: string }`

### `components/admin/CassaTerminal` ↔ SDI Invoice Generator
- `generateSdiPayload(customer: SdiCustomerData, ticket: CassaTicket): SdiInvoicePayload`

## Code Layout
```
Oroeco/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── storia/page.tsx
│   ├── gioielli/page.tsx
│   ├── orologi/page.tsx
│   ├── accessori/page.tsx
│   ├── casa/page.tsx
│   ├── brand/page.tsx
│   ├── natale/page.tsx
│   ├── prodotto/[slug]/page.tsx
│   ├── wishlist/page.tsx
│   └── admin/cassa/page.tsx
├── components/
│   ├── layout/ (Header, Footer, AnnouncementBar, Logo, MegaPanel)
│   ├── home/ (HeroSection, CategoryGrid, FeaturedTabs, BrandBar, AtelierStory)
│   ├── cart/ (CartDrawer)
│   ├── product/ (ProductCard, CategoryExplorer)
│   └── admin/ (CassaTerminal, BarcodeListener, AuraReceiptModal, SdiInvoiceModal)
├── lib/
│   ├── catalog.ts
│   ├── navigation.ts
│   ├── auraProtocol.ts
│   └── sdiProtocol.ts
├── store/
│   ├── useCartStore.ts
│   ├── useWishlistStore.ts
│   ├── useCassaStore.ts
│   └── useInventoryStore.ts
├── types/
│   ├── product.ts
│   └── cassa.ts
├── supabase/
│   └── schema.sql
└── tests/
    └── e2e/ (test runner and test suites for Tiers 1-5)
```
