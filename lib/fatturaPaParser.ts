import type { ProductCategory } from "@/types/product";

export interface ParsedInvoiceLine {
  lineNumber: number;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  lineTotal: number;
}

export interface ParsedFatturaPa {
  supplierName: string;
  supplierVat: string;
  inferredBrand: string;
  inferredCategory: ProductCategory;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  lines: ParsedInvoiceLine[];
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirstTag(block: string, tagName: string): string {
  const re = new RegExp(`<(?:[\\w.-]+:)?${tagName}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${tagName}>`, "i");
  const match = re.exec(block);
  return match ? decodeXmlEntities(match[1]) : "";
}

function extractAllBlocks(xml: string, tagName: string): string[] {
  const re = new RegExp(`<(?:[\\w.-]+:)?${tagName}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${tagName}>`, "gi");
  const out: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    out.push(match[1]);
  }
  return out;
}

/** Rileva il marchio ORO&CO corrispondente alla ragione sociale del fornitore SDI. */
export function inferBrandFromSupplier(supplierName: string): {
  brand: string;
  category: ProductCategory;
} {
  const up = supplierName.toUpperCase();
  if (up.includes("TIMEWAY") || up.includes("STROILI")) return { brand: "Stroili", category: "gioielli" };
  if (up.includes("URIGOLD") || up.includes("UNOAERRE")) return { brand: "Unoaerre", category: "gioielli" };
  if (up.includes("EMMEBI") || up.includes("CUORE MATTO") || up.includes("CUOREMATTO")) {
    return { brand: "Cuorematto", category: "natale" };
  }
  if (up.includes("VILLEROY")) return { brand: "Villeroy & Boch", category: "natale" };
  if (up.includes("LOCMAN")) return { brand: "Locman", category: "orologi" };
  if (up.includes("BULOVA") || up.includes("CITIZEN")) return { brand: "Bulova", category: "orologi" };
  if (up.includes("PAUL PICOT")) return { brand: "Paul Picot", category: "orologi" };
  if (up.includes("GERBA")) return { brand: "Gerba", category: "accessori" };
  if (up.includes("LLADRO") || up.includes("LLADRÓ")) return { brand: "Lladró", category: "casa" };
  if (up.includes("GUESS")) return { brand: "Guess", category: "gioielli" };
  if (up.includes("ALBERELLI")) return { brand: "Gli Alberelli", category: "casa" };
  return { brand: "Stroili", category: "gioielli" };
}

function parseNumeric(raw: string, fallback = 0): number {
  if (!raw) return fallback;
  const normalized = raw.replace(",", ".").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
}

function extractSkuFallback(description: string, lineNumber: number): string {
  const codeMatch = /\b([A-Z]{1,4}\d{4,}[A-Z0-9-]*|\d{6,13})\b/.exec(description.toUpperCase());
  if (codeMatch) return codeMatch[1];
  return `LINEA-${String(lineNumber).padStart(3, "0")}`;
}

/** Parsa un XML FatturaPA fornitore (B2B/SDI) estraendo testata e righe articolo. */
export function parseFatturaPaXml(xml: string): ParsedFatturaPa {
  const cedente = extractFirstTag(xml, "CedentePrestatore");
  const denominazione = extractFirstTag(cedente, "Denominazione");
  const nomeCognome = [extractFirstTag(cedente, "Nome"), extractFirstTag(cedente, "Cognome")]
    .filter(Boolean)
    .join(" ");
  const supplierName = denominazione || nomeCognome || "Fornitore SDI";
  const supplierVat = extractFirstTag(cedente, "IdCodice");

  const docData = extractFirstTag(xml, "DatiGeneraliDocumento");
  const invoiceNumber = extractFirstTag(docData, "Numero") || `FAT-${Date.now()}`;
  const invoiceDate = extractFirstTag(docData, "Data") || new Date().toISOString().slice(0, 10);
  const totalAmount = parseNumeric(extractFirstTag(docData, "ImportoTotaleDocumento"), 0);

  const lineBlocks = extractAllBlocks(xml, "DettaglioLinee");
  const lines: ParsedInvoiceLine[] = lineBlocks
    .map((block, index) => {
      const lineNumber = parseNumeric(extractFirstTag(block, "NumeroLinea"), index + 1);
      const description = extractFirstTag(block, "Descrizione") || `Articolo fornitore #${lineNumber}`;
      const codeBlock = extractFirstTag(block, "CodiceArticolo");
      const rawSku = extractFirstTag(codeBlock, "CodiceValore");
      const sku = (rawSku || extractSkuFallback(description, lineNumber)).toUpperCase();
      const quantity = Math.max(1, Math.round(parseNumeric(extractFirstTag(block, "Quantita"), 1)));
      const unitPrice = Math.max(0, parseNumeric(extractFirstTag(block, "PrezzoUnitario"), 0));
      const vatRate = parseNumeric(extractFirstTag(block, "AliquotaIVA"), 22);
      const lineTotal = parseNumeric(extractFirstTag(block, "PrezzoTotale"), quantity * unitPrice);

      return {
        lineNumber,
        sku,
        description,
        quantity,
        unitPrice,
        vatRate,
        lineTotal,
      };
    })
    .filter((line) => line.description.length > 0);

  const inferred = inferBrandFromSupplier(supplierName);

  return {
    supplierName,
    supplierVat,
    inferredBrand: inferred.brand,
    inferredCategory: inferred.category,
    invoiceNumber,
    invoiceDate,
    totalAmount,
    lines,
  };
}

/** XML FatturaPA realistico di prova per testare il compartimento stagno prima dell'invio al catalogo. */
export const SAMPLE_FATTURAPA_XML = `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2">
  <FatturaElettronicaHeader>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>09876540152</IdCodice>
        </IdFiscaleIVA>
        <Anagrafica>
          <Denominazione>TIMEWAY S.R.L. DISTRIBUZIONE STROILI</Denominazione>
        </Anagrafica>
      </DatiAnagrafici>
    </CedentePrestatore>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Divisa>EUR</Divisa>
        <Data>2026-11-22</Data>
        <Numero>FC26-STAGING-0042</Numero>
        <ImportoTotaleDocumento>412.50</ImportoTotaleDocumento>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DettaglioLinee>
        <NumeroLinea>1</NumeroLinea>
        <CodiceArticolo>
          <CodiceTipo>FORNITORE</CodiceTipo>
          <CodiceValore>1702345</CodiceValore>
        </CodiceArticolo>
        <Descrizione>Stroili Bracciale Lady Cherie Orologio Riassortimento</Descrizione>
        <Quantita>2.00</Quantita>
        <PrezzoUnitario>49.50</PrezzoUnitario>
        <PrezzoTotale>99.00</PrezzoTotale>
        <AliquotaIVA>22.00</AliquotaIVA>
      </DettaglioLinee>
      <DettaglioLinee>
        <NumeroLinea>2</NumeroLinea>
        <CodiceArticolo>
          <CodiceTipo>FORNITORE</CodiceTipo>
          <CodiceValore>ST-TEST-9901</CodiceValore>
        </CodiceArticolo>
        <Descrizione>Stroili Collana Punto Luce Nuovo Arrivo Compartimento Stagno</Descrizione>
        <Quantita>3.00</Quantita>
        <PrezzoUnitario>79.70</PrezzoUnitario>
        <PrezzoTotale>239.10</PrezzoTotale>
        <AliquotaIVA>22.00</AliquotaIVA>
      </DettaglioLinee>
    </DatiBeniServizi>
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;
