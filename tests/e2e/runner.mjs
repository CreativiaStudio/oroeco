/**
 * tests/e2e/runner.mjs
 * ---------------------------------------------------------------------------
 * GIOIELLERIA OROECO — Opaque-Box E2E Suite Runner
 *
 * Zero-dependency orchestrator that executes every tier test file in sequence
 * and prints an elegant aggregate report.
 *
 *   node tests/e2e/runner.mjs
 *
 * Exit code: 0 when every executed test passes, 1 when at least one fails.
 * ---------------------------------------------------------------------------
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Tell the harness to stay passive: this runner drives runSuites() itself.
process.env.OROECO_E2E_MANAGED = "1";

// Imported after the env flag so the harness never schedules its auto-run.
const { runSuites, getGlobalStats, getSuiteCount, registerSuite, color, formatDuration, stripAnsi } = await import(
  "./harness.mjs"
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BANNER = "=== GIOIELLERIA OROECO - OPAQUE-BOX E2E TEST SUITE ===";

/**
 * Tier configuration. `target` mirrors the coverage thresholds in
 * TEST_INFRA.md (Tier 5 is an optional adversarial pass with no minimum).
 */
const TIERS = [
  { name: "Tier 1 — Features (Happy Path)", file: "tier1_features.test.mjs", target: 45, required: true },
  { name: "Tier 2 — Boundaries & Edge Values", file: "tier2_boundaries.test.mjs", target: 45, required: true },
  { name: "Tier 3 — Pairwise Cross-Feature", file: "tier3_pairwise.test.mjs", target: 10, required: true },
  { name: "Tier 4 — Real-World Scenarios", file: "tier4_scenarios.test.mjs", target: 5, required: true },
  { name: "Tier 5 — Adversarial & Abuse", file: "tier5_adversarial.test.mjs", target: null, required: false },
];

/* ===========================================================================
 * Table rendering
 * ========================================================================= */

function padCell(value, width, align) {
  const text = String(value ?? "");
  const visible = stripAnsi(text).length;
  const space = Math.max(0, width - visible);
  if (align === "right") return " ".repeat(space) + text;
  if (align === "center") {
    const left = Math.floor(space / 2);
    return " ".repeat(left) + text + " ".repeat(space - left);
  }
  return text + " ".repeat(space);
}

function renderTable(headers, rows, aligns, totalRow) {
  const allRows = totalRow ? [...rows, totalRow] : rows;
  const widths = headers.map((_, column) =>
    Math.max(...[headers, ...allRows].map((row) => stripAnsi(String(row[column] ?? "")).length)),
  );

  const rule = (left, middle, right) => "  " + left + widths.map((w) => "─".repeat(w + 2)).join(middle) + right;
  const renderRow = (cells, header = false) =>
    "  │ " +
    cells
      .map((cell, column) => {
        const padded = padCell(cell, widths[column], aligns[column]);
        return header ? color.bold(padded) : padded;
      })
      .join(" │ ") +
    " │";

  const lines = [rule("┌", "┬", "┐"), renderRow(headers, true), rule("├", "┼", "┤")];
  for (const row of rows) lines.push(renderRow(row));
  if (totalRow) {
    lines.push(rule("├", "┼", "┤"));
    lines.push(renderRow(totalRow));
  }
  lines.push(rule("└", "┴", "┘"));
  return lines.join("\n");
}

function numCell(value) {
  return Number.isFinite(value) ? String(value) : "—";
}

function durationCell(ms) {
  return Number.isFinite(ms) && ms > 0 ? formatDuration(ms) : "—";
}

function indentBlock(text, pad) {
  return String(text)
    .split("\n")
    .map((line) => pad + line)
    .join("\n");
}

/* ===========================================================================
 * Main flow
 * ========================================================================= */

const startedHr = process.hrtime.bigint();

console.log("");
console.log(color.bold(color.cyan(BANNER)));
console.log(color.gray(`  Gioielleria Oroeco • Opaque-Box E2E • Node ${process.version}`));
console.log(color.gray(`  ${__dirname}`));
console.log("");

const rows = [];
const missingRequired = [];
let runnerFailures = 0;
let executedAny = false;

for (const tier of TIERS) {
  const filePath = path.join(__dirname, tier.file);
  const exists = fs.existsSync(filePath);

  process.stdout.write(`  ${color.cyan("▶")} ${color.bold(tier.name)}\n`);

  if (!exists) {
    if (tier.required) missingRequired.push(tier.file);
    const label = tier.required ? "MISSING (required)" : "MISSING (optional)";
    console.log(`    ${color.yellow("○")} ${color.yellow(label)} ${color.gray(tier.file)}`);
    rows.push({
      name: tier.name,
      target: tier.target,
      executed: "—",
      passed: "—",
      failed: "—",
      duration: "—",
      failedCount: 0,
    });
    continue;
  }

  let run = { total: 0, passed: 0, failed: 0, duration: 0 };
  try {
    const suitesBefore = getSuiteCount();
    const mod = await import(pathToFileURL(filePath).href);
    // Support a tier file that exports its body as `export default function`.
    if (typeof mod.default === "function" && getSuiteCount() === suitesBefore) {
      registerSuite(tier.name, mod.default);
    }
    run = await runSuites({ print: true, printSummary: false, printSuiteHeaders: false });
  } catch (err) {
    runnerFailures += 1;
    console.error(`    ${color.red("✗ tier crashed:")} ${color.red(err && err.message ? err.message : String(err))}`);
    if (err && err.stack) console.error(color.gray(indentBlock(err.stack, "      ")));
    rows.push({
      name: tier.name,
      target: tier.target,
      executed: "—",
      passed: "—",
      failed: "CRASH",
      duration: "—",
      failedCount: 1,
    });
    continue;
  }

  executedAny = executedAny || run.total > 0;
  rows.push({
    name: tier.name,
    target: tier.target,
    executed: run.total,
    passed: run.passed,
    failed: run.failed,
    duration: run.duration,
    failedCount: run.failed,
  });
}

/* ===========================================================================
 * Report
 * ========================================================================= */

const global = getGlobalStats();

const tableRows = rows.map((row) => [
  color.cyan(row.name),
  row.target == null ? "—" : String(row.target),
  numCell(row.executed === "—" ? NaN : row.executed),
  numCell(row.passed === "—" ? NaN : row.passed),
  row.failed === "CRASH"
    ? color.red("CRASH")
    : Number(row.failed) > 0
      ? color.red(String(row.failed))
      : color.gray("0"),
  durationCell(row.duration === "—" ? NaN : row.duration),
]);

const totalDuration = Number(process.hrtime.bigint() - startedHr) / 1e6;
const totalExecuted = global.total + runnerFailures;
const totalPassed = global.passed;
const totalFailed = global.failed + runnerFailures;

const totalRow = [
  color.bold("TOTAL"),
  "",
  color.bold(String(totalExecuted)),
  color.green(String(totalPassed)),
  totalFailed > 0 ? color.red(String(totalFailed)) : color.gray("0"),
  durationCell(global.duration),
];

console.log("");
console.log(color.bold(color.cyan("─────────────────────────────── RESULTS ───────────────────────────────")));
console.log("");
console.log(renderTable(
  ["Tier Name", "Target Tests", "Executed", "Passed", "Failed", "Duration"],
  tableRows,
  ["left", "right", "right", "right", "right", "right"],
  totalRow,
));
console.log("");
console.log(`  ${color.bold("Total tests executed:")} ${color.bold(String(totalExecuted))}`);
console.log(`  ${color.bold("Total passed:")}         ${color.green(String(totalPassed))}`);
console.log(
  `  ${color.bold("Total failed:")}         ${totalFailed > 0 ? color.red(String(totalFailed)) : color.gray("0")}`,
);
console.log(`  ${color.bold("Total duration:")}       ${formatDuration(global.duration)} ${color.gray(`(wall clock ${formatDuration(totalDuration)})`)}`);
console.log("");

if (missingRequired.length > 0) {
  console.log(
    color.yellow(`  ⚠ ${missingRequired.length} required tier file(s) not found: ${missingRequired.join(", ")}`),
  );
  console.log("");
}

if (!executedAny && runnerFailures === 0 && missingRequired.length > 0) {
  console.log(color.yellow("  ⚠ No tests were executed because the tier files are missing."));
  console.log("");
}

if (totalFailed === 0) {
  console.log(color.green(color.bold(`  ${String.fromCharCode(0x2713)} RESULT: ALL TESTS PASSED (${totalPassed}/${totalExecuted})`)));
  console.log("");
  process.exit(0);
}

console.log(color.red(color.bold(`  ${String.fromCharCode(0x2717)} RESULT: TEST SUITE FAILED (${totalFailed} failing)`)));
console.log("");
process.exit(1);
