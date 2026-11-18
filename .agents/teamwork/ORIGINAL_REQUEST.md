# Original User Request

## 2026-10-07T06:03:51Z

Costruire la suite completa per Gioielleria Oroeco: lo storefront e-commerce luxury ispirato al benchmark Baggio Gioielli e il gestionale cassa banco ispirato all'architettura di Scelta Makeup (con listener hardware per pistola barcode e predisposizione scontrino/fattura), mantenendo l'isolamento totale dai database esterni fino alla creazione dell'istanza Supabase dedicata di Oroeco.

Working directory: C:\Users\mario\Progetti Antigravity\Oroeco
Integrity mode: development

## Requirements

### R1. Storefront E-Commerce Luxury (Benchmark Baggio Gioielli & Navigazione Excel)
- Sviluppare il front-end pubblico in Next.js 15 (App Router), React 19 e Tailwind CSS 4 con design system luxury ispirato a [Baggio Gioielli](https://www.baggiogioielli.it/):
  - Palette cromatica: Sfondo bianco puro (`#FFFFFF`), testi ebano profondo (`#0A0A0A` e `#151515`), accenti in oro satinato caldo (`#C5A059`), bordi sottili e rifiniti.
  - Tipografia: Serif classico ed elegante per titoli (Playfair Display / Cormorant), sans-serif pulito per micro-copy e prezzi.
  - Navigazione fedele all'alberatura aziendale da foglio Excel:
    1. *La Nostra Storia* (`/storia`): Storytelling atelier orafico a Pagani dal 1992.
    2. *Gioielli* (`/gioielli`): Anelli, Collane, Orecchini, Bracciali, Ciondoli e Componenti.
    3. *Orologi* (`/orologi`): Uomo, Donna.
    4. *Accessori* (`/accessori`): Pelletteria, Portachiavi, Gemelli, Penne.
    5. *Casa* (`/casa`): Posate, Bicchieri, Vasi, Profumatori, Statue, Candele, Cornici, Decanter, Solidali.
    6. *Brand* (`/brand`): I 18 marchi ufficiali (Bulova, Locman, Unoaerre, Stroili, Davide Delucchi, Cammeo Italiano, AMEN, Guess, Golay, ecc.).
    7. *Natale* (`/natale`): Selezione stagionale prioritaria per il lancio di Novembre.
  - Funzionalità storefront: Announcement bar, Header sticky con mega-menu e ricerca, Hero editoriale ad alto impatto, griglie categorie e prodotti in evidenza, brand carousel, drawer carrello laterale (Zustand) con calcolo spedizione gratuita sopra i 150 €, e footer luxury con credit "Sviluppato da Creativia Studio".

### R2. Gestionale Cassa Banco & Listener Hardware Pistola Barcode (`/admin/cassa`)
- Implementare l'interfaccia punto cassa touch-friendly per il banco vendita (ispirata al POS di Scelta Makeup), ad alta leggibilità per Renato, la mamma e la zia:
  - **Listener Tastiera Globale Barcode:** Cattura automatica degli eventi di input della pistola ottica barcode USB/Bluetooth (sequenza EAN rapida con terminatore Enter), con ricerca istantanea e inserimento automatico del gioiello nello scontrino corrente.
  - **Ricerca Manuale Rapida:** Filtro per nome, codice fornitore o categoria.
  - **Riepilogo Vendita Real-Time:** Lista articoli scansionati, modifiche quantità, sconti percentuali o a valore, e calcolo automatico totali.
  - **Pulsanti d'Azione Banco:**
    1. *Batti Scontrino Fiscale:* Predisposizione logica e modale per comando cassa Axon Micrelec Aura RT (connettività protocollo Ditron/Axon LAN).
    2. *Emetti Fattura Elettronica SDI 1-Click:* Modale rapido per anagrafica cliente e trasmissione SDI.
  - **Aggiornamento Giacenze:** Scalo immediato della disponibilità di magazzino ad ogni vendita completata.

### R3. VINCOLO TASSATIVO: Isolamento Totale Database (Stop al Collegamento DB)
- **Divieto categorico:** Non connettere, interrogare o modificare il database di Creativia Studio o di altri clienti.
- L'intera applicazione deve operare con un layer di dati tipizzato locale (`lib/catalog.ts` e store Zustand in memoria/localStorage), con schemi speculari ai tipi TypeScript di Supabase (`types/product.ts`).
- **Punto di Arresto:** Appena l'infrastruttura di codice e il frontend/gestionale sono completi e pronti al collegamento del database, il team deve **fermarsi** e rilasciare il file SQL standalone `supabase/schema.sql`, in attesa che Mario fornisca le credenziali del database dedicato di Oroeco.

## Acceptance Criteria

### Standard Architetturali & Qualità Codice
- [ ] `npx tsc --noEmit` completato con 0 errori TypeScript.
- [ ] `npm run build` completato con successo su tutte le rotte pubbliche e admin.
- [ ] Nessuna variabile o chiamata fa riferimento al Supabase URL di Creativia Studio.

### Storefront & Carrello
- [ ] Tutte le rotte di navigazione (`/`, `/storia`, `/gioielli`, `/orologi`, `/accessori`, `/casa`, `/brand`, `/natale`) sono navigabili e renderizzano correttamente i layout e i prodotti.
- [ ] Il cart drawer laterale si apre, permette aggiunta/rimozione articoli, aggiorna il subtotale in tempo reale e mostra la progress bar per la spedizione gratuita (>150 €).

### Gestionale Cassa & Barcode
- [ ] La rotta `/admin/cassa` è accessibile e risponde sia alla digitazione manuale sia alla simulazione di scansione barcode.
- [ ] Gli articoli scansionati vengono sommati correttamente nello scontrino con calcolo dell'IVA e del totale.
- [ ] Il file `supabase/schema.sql` è generato e salvato nella cartella del progetto, pronto per essere eseguito sul nuovo DB dedicato.
