const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

const ROOT = path.join(process.cwd(), "Oroeco fatture");

async function readPdf(p) {
  const parser = new PDFParse({ data: fs.readFileSync(p) });
  try {
    return (await parser.getText()).text || "";
  } finally {
    if (typeof parser.destroy === "function") await parser.destroy();
  }
}

(async () => {
  // 1. Leggi i 7 file in TIMEWAY/GUESS
  const guessDir = path.join(ROOT, "TIMEWAY", "GUESS");
  const guessFiles = fs.readdirSync(guessDir).filter((f) => f.endsWith(".pdf")).sort();
  console.log("=== ANALISI DETTAGLIATA TIMEWAY/GUESS ===");
  for (const f of guessFiles) {
    const t = await readPdf(path.join(guessDir, f));
    console.log(`\n--- ${f} (len=${t.length}) ---`);
    console.log(t);
  }

  // 2. Leggi le fatture Timeway che citano GUESS
  const twRoot = path.join(ROOT, "TIMEWAY");
  const twPdfs = fs.readdirSync(twRoot).filter((f) => f.endsWith(".pdf")).sort();
  console.log("\n=== FATTURE TIMEWAY CON RIFERIMENTO GUESS ===");
  for (const f of twPdfs) {
    const t = await readPdf(path.join(twRoot, f));
    if (/\bguess\b|GUW\s|GW\d{4}|JUB[A-Z0-9]+/i.test(t)) {
      console.log(`\n--- ${f} ---`);
      console.log(t.slice(0, 3500));
    }
  }
})();
