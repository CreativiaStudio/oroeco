/**
 * ORO&CO — Protocollo Ditron LAN per Registratore Telematico Axon Micrelec Aura RT
 *
 * Generatore comandi ECR (Standard Ditron / Axon) per la trasmissione su socket LAN (porta 9100/23)
 * o tramite gateway REST locale (Axon FPID / fpmate).
 *
 * Specifiche comandi Ditron ECR:
 * - VEND REP=<rep>, PRE=<prezzo>, DES='<descrizione>'
 * - SUBT
 * - SCONTO S=<importo>
 * - LOTTERIA COD='<codice>'
 * - CHIUS T=<1|2> (1 = Contanti, 2 = Carta/POS)
 */

import type { CassaTicket, DitronAuraResult, PaymentMethod } from "@/types/cassa";
import type { ProductCategory } from "@/types/product";

/** Reparti registratore telematico Ditron Aura RT con aliquota IVA 22% */
export const AURA_DEPARTMENTS: Record<
  ProductCategory,
  { id: number; label: string; vatRate: number }
> = {
  gioielli: { id: 1, label: "GIOIELLERIA E PREZIOSI", vatRate: 22.0 },
  orologi: { id: 1, label: "OROLOGERIA DI LUSSO", vatRate: 22.0 },
  accessori: { id: 2, label: "ACCESSORI E PELLETTERIA", vatRate: 22.0 },
  casa: { id: 3, label: "CASA E BOMBONIERE", vatRate: 22.0 },
  natale: { id: 4, label: "SELEZIONE NATALE", vatRate: 22.0 },
};

/** Sanitizza la descrizione articolo per il display e la stampante termica (max 24 caratteri, no apici) */
export function sanitizeAuraDescription(name: string): string {
  return name
    .replace(/['"’]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim()
    .slice(0, 24);
}

/** Risolve il reparto Ditron in base alla categoria */
export function getDepartmentForCategory(category?: ProductCategory): number {
  if (!category) return 1;
  return AURA_DEPARTMENTS[category]?.id ?? 1;
}

/**
 * Genera il payload Ditron LAN ECR completo a partire da uno scontrino CassaBanco.
 */
export function generateDitronAuraPayload(
  ticket: CassaTicket,
  operator: string = ticket.operator,
): {
  commandLines: string[];
  totalEuro: number;
  rawPayload: string;
  formattedLines: string;
} {
  const commands: string[] = [];

  // 1. Operatore
  commands.push(`OPER DES='${sanitizeAuraDescription(operator)}'`);

  // 2. Linee di vendita (VEND)
  ticket.items.forEach((line) => {
    const sanitizedName = sanitizeAuraDescription(line.product.name);
    const department = getDepartmentForCategory(line.product.category);
    const priceStr = line.unitPrice.toFixed(2);

    if (line.quantity > 1) {
      commands.push(
        `VEND REP=${department}, QTA=${line.quantity}, PRE=${priceStr}, DES='${sanitizedName}'`,
      );
    } else {
      commands.push(`VEND REP=${department}, PRE=${priceStr}, DES='${sanitizedName}'`);
    }
  });

  // 3. Subtotale
  commands.push("SUBT");

  // 4. Sconto negoziato (se applicato)
  if (ticket.discountAmount > 0) {
    commands.push(`SCONTO S=${ticket.discountAmount.toFixed(2)}`);
  }

  // 5. Lotteria degli scontrini (se presente codice alfanumerico di 8 caratteri)
  if (ticket.lotteryCode && ticket.lotteryCode.trim().length === 8) {
    const sanitizedLottery = ticket.lotteryCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (sanitizedLottery.length === 8) {
      commands.push(`LOTTERIA COD='${sanitizedLottery}'`);
    }
  }

  // 6. Chiusura e Pagamento (CHIUS)
  // T=1 Contanti, T=2 Carta di credito / POS, T=3 Misto/Assegno
  const tender = ticket.paymentMethod === "cash" ? 1 : ticket.paymentMethod === "card" ? 2 : 1;
  const totalStr = ticket.total.toFixed(2);

  if (ticket.paymentMethod === "cash" && ticket.cashTendered > 0) {
    commands.push(`CHIUS T=${tender}, IMP=${ticket.cashTendered.toFixed(2)}`);
  } else {
    commands.push(`CHIUS T=${tender}, IMP=${totalStr}`);
  }

  const rawPayload = commands.join("\r\n") + "\r\n";
  const formattedLines = commands.join("\n");

  return {
    commandLines: commands,
    totalEuro: ticket.total,
    rawPayload,
    formattedLines,
  };
}

/**
 * Genera l'anteprima testuale fedele del documento commerciale termico emesso dalla cassa Aura RT.
 */
export function buildThermalReceiptPreview(
  ticket: CassaTicket,
  operator: string,
  docNumber = `00${Math.floor(Math.random() * 80 + 10)}-00${Math.floor(Math.random() * 900 + 100)}`,
  serialRT = "99MEY012480",
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const width = 42;
  const divider = "-".repeat(width);
  const doubleDivider = "=".repeat(width);

  const center = (text: string) => {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(pad) + text;
  };

  const justify = (left: string, right: string) => {
    const space = Math.max(1, width - left.length - right.length);
    return left + " ".repeat(space) + right;
  };

  const lines: string[] = [
    doubleDivider,
    center("GIOIELLERIA ORO & CO"),
    center("di Calabrese Speranza"),
    center("Via Filippo Turati, 30"),
    center("84010 San Marzano sul Sarno (SA)"),
    center("TEL. 081 518 6476 · WA 351 877 8689"),
    divider,
    center("DOCUMENTO COMMERCIALE DI VENDITA"),
    center("RT FISCALE ONLINE · TRASMISSIONE AdE"),
    divider,
    justify(`DATA: ${dateStr}`, `ORA: ${timeStr}`),
    justify(`DOC. COMM. N.: ${docNumber}`, `RT: ${serialRT}`),
    justify(`OPERATORE: ${operator}`, `CASSA: 01`),
    divider,
    justify("DESCRIZIONE ARTICOLO", "EURO"),
    divider,
  ];

  ticket.items.forEach((item) => {
    const rep = getDepartmentForCategory(item.product.category);
    const repLabel = `[REP ${rep}]`;
    const desc = sanitizeAuraDescription(item.product.name);
    const priceFormatted = `${item.lineTotal.toFixed(2)} €`;

    if (item.quantity > 1) {
      lines.push(`${desc}`);
      lines.push(
        justify(
          `  ${item.quantity} x ${item.unitPrice.toFixed(2)} € ${repLabel}`,
          priceFormatted,
        ),
      );
    } else {
      lines.push(justify(`${desc} ${repLabel}`, priceFormatted));
    }
  });

  lines.push(divider);
  lines.push(justify("SUBTOTALE", `${ticket.subtotal.toFixed(2)} €`));

  if (ticket.discountAmount > 0) {
    lines.push(
      justify(
        `SCONTO NEGOZIATO (${ticket.discountMode === "percent" ? `${ticket.discountValue}%` : "VALORE"})`,
        `-${ticket.discountAmount.toFixed(2)} €`,
      ),
    );
  }

  lines.push(doubleDivider);
  lines.push(justify("TOTALE COMPLESSIVO", `${ticket.total.toFixed(2)} €`));
  lines.push(doubleDivider);

  // Scorporo IVA 22%
  lines.push(justify("di cui IVA 22,00%", `${ticket.taxBreakdown.vatAmount.toFixed(2)} €`));
  lines.push(justify("Totale Imponibile Netto", `${ticket.taxBreakdown.taxableBase.toFixed(2)} €`));
  lines.push(divider);

  // Metodo di pagamento
  const tenderLabel =
    ticket.paymentMethod === "cash"
      ? "PAGAMENTO CONTANTI"
      : ticket.paymentMethod === "card"
        ? "PAGAMENTO CARTA / POS"
        : "PAGAMENTO MISTO";

  lines.push(justify(tenderLabel, `${ticket.total.toFixed(2)} €`));

  if (ticket.paymentMethod === "cash" && ticket.cashTendered > 0) {
    lines.push(justify("CONTANTI RICEVUTI", `${ticket.cashTendered.toFixed(2)} €`));
    lines.push(justify("RESTO DA DARE", `${ticket.changeDue.toFixed(2)} €`));
  }

  if (ticket.lotteryCode) {
    lines.push(divider);
    lines.push(justify("LOTTERIA SCONTRINI", ticket.lotteryCode.toUpperCase()));
  }

  lines.push(divider);
  lines.push(center("ARRIVEDERCI E GRAZIE"));
  lines.push(center("GIOIELLERIA ORO&CO — DAL 1992"));
  lines.push(doubleDivider);

  return lines.join("\n");
}

/**
 * Simula l'esecuzione del protocollo Ditron con la cassa fisica Aura RT.
 */
export function simulateAuraExecution(
  ticket: CassaTicket,
  operator: string,
): DitronAuraResult {
  const payload = generateDitronAuraPayload(ticket, operator);
  const docNum = `00${Math.floor(Math.random() * 80 + 10)}-00${Math.floor(Math.random() * 900 + 100)}`;
  const zReport = `Z-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-001`;
  const thermalText = buildThermalReceiptPreview(ticket, operator, docNum);

  return {
    commandLines: payload.commandLines,
    totalEuro: payload.totalEuro,
    rawPayload: payload.rawPayload,
    simulatedReceiptNumber: docNum,
    zReport,
    timestamp: new Date().toISOString(),
    formattedThermalReceipt: thermalText,
  };
}
