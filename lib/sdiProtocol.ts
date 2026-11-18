/**
 * ORO&CO — Modulo Fatturazione Elettronica SDI 1-Click (FatturaPA v1.2)
 *
 * Generatore e validatore conforme agli standard Agenzia delle Entrate (AdE) per:
 * - Fattura B2C (Consumatore finale / Privato): CF 16 caratteri, SDI '0000000'
 * - Fattura B2B (Azienda / Professionista): P.IVA 11 cifre, Codice SDI 7 caratteri o PEC
 * - Tracciato XML FatturaPA (formato FPR12 / FPA12)
 */

import type {
  CassaTicket,
  SdiCustomerData,
  SdiInvoicePayload,
  SdiValidationErrors,
} from "@/types/cassa";

/** Dati societari cedente/prestatore ORO&CO San Marzano sul Sarno */
export const OROECO_CEDENTE = {
  denominazione: "GIOIELLERIA ORO & CO - DI CALABRESE SPERANZA",
  partitaIva: "02847580651",
  codiceFiscale: "02847580651",
  regimeFiscale: "RF01", // Ordinario
  indirizzo: "Via Filippo Turati, 30",
  cap: "84010",
  comune: "San Marzano sul Sarno",
  provincia: "SA",
  nazione: "IT",
  pec: "oroeco@pec.it",
  telefono: "081 5186476",
};

/** Regex di validazione fiscale italiana */
const REGEX_CF_PERSONA =
  /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/i;
const REGEX_PIVA_OR_CF_NUM = /^[0-9]{11}$/;
const REGEX_SDI = /^[A-Z0-9]{7}$/i;
const REGEX_PEC = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_CAP = /^[0-9]{5}$/;

/**
 * Valida i dati fiscali dell'anagrafica cliente prima dell'emissione della fattura.
 */
export function validateSdiCustomer(customer: SdiCustomerData): {
  isValid: boolean;
  errors: SdiValidationErrors;
} {
  const errors: SdiValidationErrors = {};

  const cleanCF = customer.codiceFiscale.trim().toUpperCase();
  const cleanPIVA = customer.partitaIva.trim();
  const cleanSDI = customer.codiceDestinatario.trim().toUpperCase();
  const cleanPEC = customer.pec.trim().toLowerCase();

  // Validazione B2C (Privato)
  if (customer.customerType === "b2c") {
    if (!customer.ragioneSociale.trim()) {
      errors.ragioneSociale = "Nome e Cognome del cliente obbligatori.";
    }

    if (!cleanCF) {
      errors.codiceFiscale = "Codice Fiscale obbligatorio per i privati.";
    } else if (!REGEX_CF_PERSONA.test(cleanCF) && !REGEX_PIVA_OR_CF_NUM.test(cleanCF)) {
      errors.codiceFiscale = "Codice Fiscale non valido (deve essere di 16 caratteri alfanumerici).";
    }

    if (cleanPEC && !REGEX_PEC.test(cleanPEC)) {
      errors.pec = "Indirizzo PEC non valido.";
    }
  }

  // Validazione B2B (Azienda)
  if (customer.customerType === "b2b") {
    if (!customer.ragioneSociale.trim()) {
      errors.ragioneSociale = "Ragione Sociale o Denominazione aziendale obbligatoria.";
    }

    if (!cleanPIVA) {
      errors.partitaIva = "Partita IVA obbligatoria per aziende e professionisti.";
    } else if (!REGEX_PIVA_OR_CF_NUM.test(cleanPIVA)) {
      errors.partitaIva = "Partita IVA non valida (deve essere di esattamente 11 cifre).";
    }

    if (!cleanSDI && !cleanPEC) {
      errors.codiceDestinatario =
        "Inserire il Codice Destinatario SDI (7 caratteri) oppure la PEC aziendale.";
    } else if (cleanSDI && !REGEX_SDI.test(cleanSDI)) {
      errors.codiceDestinatario = "Il Codice SDI deve contenere esattamente 7 caratteri alfanumerici.";
    }

    if (cleanPEC && !REGEX_PEC.test(cleanPEC)) {
      errors.pec = "Indirizzo PEC non valido.";
    }
  }

  // Indirizzo di residenza / sede legale
  if (!customer.indirizzo.trim()) {
    errors.indirizzo = "Indirizzo e numero civico obbligatori.";
  }

  if (!customer.comune.trim()) {
    errors.comune = "Comune di residenza / sede obbligatorio.";
  }

  if (customer.cap && !REGEX_CAP.test(customer.cap.trim())) {
    errors.cap = "CAP non valido (deve contenere 5 cifre numeriche).";
  }

  if (!customer.provincia.trim() || customer.provincia.trim().length !== 2) {
    errors.provincia = "Provincia non valida (sigla di 2 lettere, es. SA, NA, RM).";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Genera il tracciato XML conforme allo standard ministeriale FatturaPA v1.2 (FPR12).
 */
export function buildFatturaPaXml(
  invoiceNumber: string,
  dateISO: string,
  customer: SdiCustomerData,
  ticket: CassaTicket,
): string {
  const cedente = OROECO_CEDENTE;
  const sdiCode =
    customer.codiceDestinatario.trim() || (customer.customerType === "b2c" ? "0000000" : "0000000");

  let lineeXml = "";
  ticket.items.forEach((item, index) => {
    const numLinea = index + 1;
    const desc = item.product.name.replace(/[<>&'"]/g, "");
    const pu = item.unitPrice.toFixed(2);
    const pt = item.lineTotal.toFixed(2);

    lineeXml += `
      <DettaglioLinee>
        <NumeroLinea>${numLinea}</NumeroLinea>
        <Descrizione>${desc}</Descrizione>
        <Quantita>${item.quantity}.00</Quantita>
        <PrezzoUnitario>${pu}</PrezzoUnitario>
        <PrezzoTotale>${pt}</PrezzoTotale>
        <AliquotaIVA>22.00</AliquotaIVA>
      </DettaglioLinee>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>IT</IdPaese>
        <IdCodice>${cedente.partitaIva}</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>${invoiceNumber.replace(/[^A-Za-z0-9]/g, "").slice(-10)}</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
      <CodiceDestinatario>${sdiCode.toUpperCase()}</CodiceDestinatario>
      ${customer.pec ? `<PECDestinatario>${customer.pec}</PECDestinatario>` : ""}
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>${cedente.partitaIva}</IdCodice>
        </IdFiscaleIVA>
        <CodiceFiscale>${cedente.codiceFiscale}</CodiceFiscale>
        <Anagrafica>
          <Denominazione>${cedente.denominazione}</Denominazione>
        </Anagrafica>
        <RegimeFiscale>${cedente.regimeFiscale}</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${cedente.indirizzo}</Indirizzo>
        <CAP>${cedente.cap}</CAP>
        <Comune>${cedente.comune}</Comune>
        <Provincia>${cedente.provincia}</Provincia>
        <Nazione>${cedente.nazione}</Nazione>
      </Sede>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        ${
          customer.partitaIva
            ? `<IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>${customer.partitaIva.trim()}</IdCodice>
        </IdFiscaleIVA>`
            : ""
        }
        ${
          customer.codiceFiscale
            ? `<CodiceFiscale>${customer.codiceFiscale.trim().toUpperCase()}</CodiceFiscale>`
            : ""
        }
        <Anagrafica>
          <Denominazione>${customer.ragioneSociale.replace(/[<>&'"]/g, "").trim()}</Denominazione>
        </Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${(customer.indirizzo + (customer.civico ? " " + customer.civico : "")).replace(/[<>&'"]/g, "")}</Indirizzo>
        <CAP>${customer.cap || "84016"}</CAP>
        <Comune>${customer.comune.replace(/[<>&'"]/g, "")}</Comune>
        <Provincia>${(customer.provincia || "SA").toUpperCase()}</Provincia>
        <Nazione>${customer.nazione || "IT"}</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Divisa>EUR</Divisa>
        <Data>${dateISO.slice(0, 10)}</Data>
        <Numero>${invoiceNumber}</Numero>
        <ImportoTotaleDocumento>${ticket.total.toFixed(2)}</ImportoTotaleDocumento>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      ${lineeXml}
      <DatiRiepilogo>
        <AliquotaIVA>22.00</AliquotaIVA>
        <ImponibileImporto>${ticket.taxBreakdown.taxableBase.toFixed(2)}</ImponibileImporto>
        <Imposta>${ticket.taxBreakdown.vatAmount.toFixed(2)}</Imposta>
        <EsigibilitaIVA>I</EsigibilitaIVA>
      </DatiRiepilogo>
    </DatiBeniServizi>
    <DatiPagamento>
      <CondizioniPagamento>TP02</CondizioniPagamento>
      <DettaglioPagamento>
        <ModalitaPagamento>${ticket.paymentMethod === "card" ? "MP08" : "MP01"}</ModalitaPagamento>
        <DataScadenzaPagamento>${dateISO.slice(0, 10)}</DataScadenzaPagamento>
        <ImportoPagamento>${ticket.total.toFixed(2)}</ImportoPagamento>
      </DettaglioPagamento>
    </DatiPagamento>
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;

  return xml.trim();
}

/**
 * Genera l'intero payload della fattura elettronica per l'anteprima e la trasmissione.
 */
export function generateSdiPayload(
  customer: SdiCustomerData,
  ticket: CassaTicket,
  operator: string = ticket.operator,
): SdiInvoicePayload {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const randNum = Math.floor(Math.random() * 899 + 100);
  const invoiceNumber = `FATT-${year}${month}${day}-${randNum}`;
  const dateISO = now.toISOString();

  const xmlFatturaPA = buildFatturaPaXml(invoiceNumber, dateISO, customer, ticket);

  const summaryLines = ticket.items.map((line, idx) => ({
    numeroLinea: idx + 1,
    descrizione: line.product.name,
    quantita: line.quantity,
    prezzoUnitario: line.unitPrice,
    prezzoTotale: line.lineTotal,
    aliquotaIVA: 22.0,
  }));

  return {
    invoiceNumber,
    date: dateISO,
    customer,
    ticket,
    cedente: OROECO_CEDENTE,
    xmlFatturaPA,
    summaryLines,
    totaleDocumento: ticket.total,
    imponibileTotale: ticket.taxBreakdown.taxableBase,
    impostaTotale: ticket.taxBreakdown.vatAmount,
  };
}
