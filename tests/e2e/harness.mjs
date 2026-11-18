/**
 * tests/e2e/harness.mjs
 * ---------------------------------------------------------------------------
 * GIOIELLERIA OROECO — Opaque-Box E2E Test Harness
 *
 * A zero-dependency ESM micro test-framework built only on Node.js built-ins
 * (`node:assert/strict`, `node:perf_hooks`, `node:util`).
 *
 * Public API
 *   describe(name, fn)          Collect a group of tests (lazy, runs at runSuites).
 *   it(name, fn) / test(name, fn) Register a single (sync or async) test.
 *   beforeEach(fn)              Global hook, or suite hook when called inside describe.
 *   afterEach(fn)               Global hook, or suite hook when called inside describe.
 *   registerSuite(name, fn)     Register a whole suite body (used by tier files).
 *   runSuites(options)          Execute every not-yet-run suite; returns run stats.
 *   getGlobalStats()            Cumulative stats across all runSuites() calls.
 *   getSuiteCount()             Number of registered suites (import bookkeeping).
 *   expect(value)               Minimal assertion DSL (toBe, toEqual, ...).
 *   assert                      Re-export of node:assert/strict.
 *   formatDuration(ms), color, stripAnsi — shared presentation helpers.
 *
 * Execution modes
 *   1) Direct:   `node tests/e2e/tier1_features.test.mjs`
 *                The harness auto-runs the registered suites and sets the exit
 *                code (0 = all passed, 1 = at least one failure).
 *   2) Managed:  `node tests/e2e/runner.mjs`
 *                The runner sets OROECO_E2E_MANAGED=1 and calls runSuites()
 *                itself, so no automatic execution happens.
 * ---------------------------------------------------------------------------
 */

import { strict as nodeAssert } from "node:assert/strict";
import { inspect } from "node:util";
import { performance } from "node:perf_hooks";

/* ===========================================================================
 * Presentation helpers (colors + symbols)
 * ========================================================================= */

const supportsColor = (() => {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR && process.env.FORCE_COLOR !== "0") return true;
  if (process.env.OROECO_E2E_FORCE_COLOR === "1") return true;
  return Boolean(process.stdout && process.stdout.isTTY);
})();

const CODE = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

/** Wrap `text` in an ANSI code when colors are enabled. */
function ansi(text, code) {
  return supportsColor ? `${code}${text}${CODE.reset}` : String(text);
}

export const color = {
  bold: (t) => ansi(t, CODE.bold),
  dim: (t) => ansi(t, CODE.dim),
  red: (t) => ansi(t, CODE.red),
  green: (t) => ansi(t, CODE.green),
  yellow: (t) => ansi(t, CODE.yellow),
  blue: (t) => ansi(t, CODE.blue),
  magenta: (t) => ansi(t, CODE.magenta),
  cyan: (t) => ansi(t, CODE.cyan),
  gray: (t) => ansi(t, CODE.gray),
};

export const SYMBOL = {
  pass: "✓",
  fail: "✗",
  skip: "○",
  arrow: "▶",
  bullet: "•",
};

/** Remove ANSI escape sequences (used for visible-length width math). */
export function stripAnsi(text) {
  // eslint-disable-next-line no-control-regex
  return String(text).replace(/\x1b\[[0-9;]*m/g, "");
}

/** Human friendly duration rendering. */
export function formatDuration(ms) {
  const value = Number(ms);
  if (!Number.isFinite(value) || value <= 0) return "0.00ms";
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  if (value >= 10) return `${value.toFixed(1)}ms`;
  return `${value.toFixed(2)}ms`;
}

function indent(text, pad) {
  return String(text)
    .split("\n")
    .map((line) => pad + line)
    .join("\n");
}

function formatValue(value, depth = 3) {
  try {
    if (typeof value === "string") return JSON.stringify(value);
    if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;
    if (typeof value === "bigint") return `${value}n`;
    return inspect(value, { depth, breakLength: 90, maxArrayLength: 20 });
  } catch {
    return String(value);
  }
}

function deepEqualSafe(a, b) {
  try {
    nodeAssert.deepStrictEqual(a, b);
    return true;
  } catch {
    return false;
  }
}

/* ===========================================================================
 * Registry
 * ========================================================================= */

const suites = [];
const globalBeforeEachFns = [];
const globalAfterEachFns = [];

let currentSuite = null;
let rootSuite = null;
let suiteSeq = 0;
let testSeq = 0;

const accumulator = {
  suites: 0,
  total: 0,
  passed: 0,
  failed: 0,
  duration: 0,
  results: [],
  suiteStats: [],
};

function createSuite(name, build, kind) {
  const suite = {
    id: `suite-${++suiteSeq}`,
    name: String(name),
    kind,
    build: typeof build === "function" ? build : null,
    tests: [],
    beforeEach: [],
    afterEach: [],
    built: false,
    ran: false,
  };
  suites.push(suite);
  return suite;
}

function getRootSuite() {
  if (!rootSuite) rootSuite = createSuite("(ungrouped)", null, "root");
  return rootSuite;
}

function addTest(name, fn) {
  const suite = currentSuite || getRootSuite();
  if (typeof fn !== "function") {
    throw new TypeError(`Test "${name}" requires a function body.`);
  }
  const entry = {
    id: `test-${++testSeq}`,
    name: String(name),
    fn,
    suite: suite.name,
    suiteId: suite.id,
  };
  suite.tests.push(entry);
  return entry;
}

/* ===========================================================================
 * Public registration API
 * ========================================================================= */

/**
 * Group tests under a named suite. The callback is executed lazily, right
 * before the suite runs, so `beforeEach`/`afterEach` declared inside it are
 * scoped to the suite.
 */
export function describe(name, fn) {
  return createSuite(name, fn, "describe");
}

/** Register a single test (sync or async). */
export function it(name, fn) {
  return addTest(name, fn);
}

/** Alias of `it`. */
export function test(name, fn) {
  return addTest(name, fn);
}

/**
 * Register a suite body. The body is executed exactly once at run time and may
 * either:
 *   - declare tests with `it`/`test` (they run afterwards, isolated), or
 *   - contain assertions directly (the body itself is reported as one test).
 */
export function registerSuite(name, runnerFn) {
  return createSuite(name, runnerFn, "registered");
}

/** Global hook, or suite-scoped hook when invoked inside describe/registerSuite. */
export function beforeEach(fn) {
  if (typeof fn !== "function") throw new TypeError("beforeEach requires a function.");
  if (currentSuite) currentSuite.beforeEach.push(fn);
  else globalBeforeEachFns.push(fn);
}

/** Global hook, or suite-scoped hook when invoked inside describe/registerSuite. */
export function afterEach(fn) {
  if (typeof fn !== "function") throw new TypeError("afterEach requires a function.");
  if (currentSuite) currentSuite.afterEach.push(fn);
  else globalAfterEachFns.push(fn);
}

/** Number of suites registered so far (used by the runner for bookkeeping). */
export function getSuiteCount() {
  return suites.length;
}

/* ===========================================================================
 * Assertions
 * ========================================================================= */

/** Re-export of Node's strict assertion module. */
export const assert = nodeAssert;

const CHAINABLE = [
  "to",
  "be",
  "been",
  "is",
  "that",
  "which",
  "and",
  "has",
  "have",
  "with",
  "at",
  "of",
  "same",
  "but",
  "does",
  "still",
  "also",
];

function matchesThrown(err, expected) {
  const message = err && err.message !== undefined ? String(err.message) : String(err);
  if (typeof expected === "string") return message.includes(expected);
  if (expected instanceof RegExp) return expected.test(message);
  if (typeof expected === "function") return err instanceof expected;
  if (expected instanceof Error) return err === expected || message === expected.message;
  return false;
}

class Expectation {
  constructor(actual, negated = false) {
    this.actual = actual;
    this.negated = negated;
  }

  get not() {
    return new Expectation(this.actual, !this.negated);
  }

  _assert(pass, message) {
    const ok = this.negated ? !pass : pass;
    if (!ok) {
      throw new nodeAssert.AssertionError({
        message: (this.negated ? "Negated assertion failed: " : "") + message,
        actual: this.actual,
      });
    }
    return this;
  }

  toBe(expected) {
    return this._assert(
      Object.is(this.actual, expected),
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}be ${formatValue(expected)}`,
    );
  }

  toEqual(expected) {
    return this._assert(
      deepEqualSafe(this.actual, expected),
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}deep-equal ${formatValue(expected)}`,
    );
  }

  toStrictEqual(expected) {
    return this.toEqual(expected);
  }

  toBeTruthy() {
    return this._assert(
      Boolean(this.actual),
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}be truthy`,
    );
  }

  toBeFalsy() {
    return this._assert(
      !this.actual,
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}be falsy`,
    );
  }

  toBeNull() {
    return this._assert(this.actual === null, `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}be null`);
  }

  toBeUndefined() {
    return this._assert(
      this.actual === undefined,
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}be undefined`,
    );
  }

  toBeDefined() {
    return this._assert(
      this.actual !== undefined,
      `expected value to ${this.negated ? "not " : ""}be defined`,
    );
  }

  toBeNaN() {
    return this._assert(
      Number.isNaN(this.actual),
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}be NaN`,
    );
  }

  toBeTypeOf(type) {
    return this._assert(
      typeof this.actual === type,
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}be of type "${type}"`,
    );
  }

  toBeInstanceOf(ctor) {
    return this._assert(
      this.actual instanceof ctor,
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}be an instance of ${ctor && ctor.name}`,
    );
  }

  toBeGreaterThan(expected) {
    return this._assert(
      this.actual > expected,
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}be greater than ${formatValue(expected)}`,
    );
  }

  toBeGreaterThanOrEqual(expected) {
    return this._assert(
      this.actual >= expected,
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}be >= ${formatValue(expected)}`,
    );
  }

  toBeLessThan(expected) {
    return this._assert(
      this.actual < expected,
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}be less than ${formatValue(expected)}`,
    );
  }

  toBeLessThanOrEqual(expected) {
    return this._assert(
      this.actual <= expected,
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}be <= ${formatValue(expected)}`,
    );
  }

  toBeCloseTo(expected, digits = 2) {
    const tolerance = Math.pow(10, -digits) / 2;
    return this._assert(
      Math.abs(this.actual - expected) < tolerance,
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}be close to ${formatValue(expected)} (±${tolerance})`,
    );
  }

  toContain(expected) {
    let pass;
    if (typeof this.actual === "string") pass = this.actual.includes(String(expected));
    else if (Array.isArray(this.actual)) pass = this.actual.some((item) => deepEqualSafe(item, expected));
    else pass = false;
    return this._assert(
      pass,
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}contain ${formatValue(expected)}`,
    );
  }

  toHaveLength(expected) {
    const length = this.actual != null ? this.actual.length : undefined;
    return this._assert(
      length === expected,
      `expected value of length ${formatValue(length)} to ${this.negated ? "not " : ""}have length ${formatValue(expected)}`,
    );
  }

  toMatch(pattern) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(String(pattern));
    return this._assert(
      regex.test(String(this.actual)),
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}match ${formatValue(pattern)}`,
    );
  }

  toHaveProperty(path, ...rest) {
    const parts = (Array.isArray(path) ? path : String(path).replace(/\[(\d+)\]/g, ".$1").split(".")).filter(
      (part) => part !== "",
    );
    let cursor = this.actual;
    let exists = true;
    for (const part of parts) {
      if (cursor != null && (typeof cursor === "object" || typeof cursor === "function") && part in cursor) {
        cursor = cursor[part];
      } else {
        exists = false;
        break;
      }
    }
    let pass = exists;
    if (pass && rest.length > 0) pass = deepEqualSafe(cursor, rest[0]);
    return this._assert(
      pass,
      `expected ${formatValue(this.actual)} to ${this.negated ? "not " : ""}have property ${formatValue(path)}`,
    );
  }

  toThrow(expected) {
    if (typeof this.actual !== "function") {
      throw new nodeAssert.AssertionError({
        message: `toThrow expected a function but received ${formatValue(this.actual)}`,
      });
    }
    let threw = false;
    let thrown = null;
    try {
      this.actual();
    } catch (err) {
      threw = true;
      thrown = err;
    }
    let pass = threw;
    if (pass && expected !== undefined) pass = matchesThrown(thrown, expected);
    return this._assert(
      pass,
      `expected function to ${this.negated ? "not " : ""}throw${expected !== undefined ? ` ${formatValue(expected)}` : ""}`,
    );
  }
}

// Expose the chainable grammar words as getters that simply return `this`.
for (const word of CHAINABLE) {
  Object.defineProperty(Expectation.prototype, word, {
    get() {
      return this;
    },
  });
}

/** Minimal Jest-like expectation helper. */
export function expect(value) {
  return new Expectation(value);
}

/* ===========================================================================
 * Execution engine
 * ========================================================================= */

function normalizeError(err) {
  if (err instanceof Error) return err;
  return new Error(typeof err === "string" ? err : `Non-error thrown: ${formatValue(err)}`);
}

async function runHooks(hooks) {
  for (const hook of hooks) {
    await hook();
  }
}

function printResult(result) {
  const duration = color.gray(`(${formatDuration(result.duration)})`);
  if (result.passed) {
    console.log(`    ${color.green(SYMBOL.pass)} ${result.name} ${duration}`);
    return;
  }
  console.log(`    ${color.red(SYMBOL.fail)} ${color.red(result.name)} ${duration}`);
  if (result.error) {
    const details = (result.error.stack || String(result.error)).split("\n").slice(0, 6).join("\n");
    console.log(indent(color.red(details), "      "));
  }
}

function printSuiteStatus(stat) {
  const failed = stat.failed > 0 ? color.red(`${stat.failed} failed`) : color.gray(`${stat.failed} failed`);
  console.log(`    ${color.gray(`${stat.passed} passed`)} ${color.gray("•")} ${failed} ${color.gray(`(${formatDuration(stat.duration)})`)}`);
}

function printSummary(run) {
  const badge =
    run.failed === 0
      ? color.green(`${SYMBOL.pass} ${run.passed} passed`)
      : color.red(`${SYMBOL.fail} ${run.failed} failed`);
  console.log(
    `\n  ${color.bold("Summary:")} ${badge} ${color.gray(`| ${run.total} tests in ${formatDuration(run.duration)}`)}`,
  );
}

function accumulate(run) {
  accumulator.suites += run.suiteStats.length;
  accumulator.total += run.total;
  accumulator.passed += run.passed;
  accumulator.failed += run.failed;
  accumulator.duration += run.duration;
  accumulator.results.push(...run.results);
  accumulator.suiteStats.push(...run.suiteStats);
}

async function executeTest(suite, entry, commit) {
  const start = performance.now();
  let error = null;
  try {
    await runHooks(globalBeforeEachFns);
    await runHooks(suite.beforeEach);
    await entry.fn();
  } catch (err) {
    error = normalizeError(err);
  }
  try {
    await runHooks(suite.afterEach);
    await runHooks(globalAfterEachFns);
  } catch (err) {
    if (!error) error = normalizeError(err);
  }
  commit({
    suite: suite.name,
    name: entry.name,
    passed: !error,
    duration: performance.now() - start,
    error,
  });
}

async function executeSuiteBody(suite, commit) {
  const previous = currentSuite;
  currentSuite = suite;
  const start = performance.now();
  let error = null;
  try {
    await runHooks(globalBeforeEachFns);
    await runHooks(suite.beforeEach);
    await suite.build();
  } catch (err) {
    error = normalizeError(err);
  }
  try {
    await runHooks(suite.afterEach);
    await runHooks(globalAfterEachFns);
  } catch (err) {
    if (!error) error = normalizeError(err);
  }
  const duration = performance.now() - start;
  currentSuite = previous;

  if (suite.tests.length === 0) {
    // Direct assertion body — the body itself is the single test.
    commit({ suite: suite.name, name: suite.name, passed: !error, duration, error });
    return;
  }
  if (error) {
    commit({ suite: suite.name, name: `${suite.name} — suite body`, passed: false, duration, error });
  }
  for (const entry of suite.tests) {
    await executeTest(suite, entry, commit);
  }
}

/**
 * Run every registered suite that has not run yet.
 *
 * @param {object} [options]
 * @param {boolean} [options.print=true]         Print per-test progress + suite headers.
 * @param {boolean} [options.printSummary=true]  Print the run summary block.
 * @param {boolean} [options.printSuiteHeaders=true] Print a header per suite.
 * @param {boolean} [options.newOnly=false]      Restrict to suites added since the last run.
 * @param {boolean} [options.rerun=false]        Re-run suites that already ran.
 * @param {string}  [options.title=null]         Optional heading printed first.
 * @param {Function} [options.onSuiteStart]      (suite) => void
 * @param {Function} [options.onSuiteEnd]        (suite, stat) => void
 * @param {Function} [options.onTestResult]      (result, suite) => void
 * @returns {Promise<object>} Per-run stats: { total, passed, failed, duration, results, suiteStats }.
 */
export async function runSuites(options = {}) {
  const opts = {
    print: true,
    printSummary: true,
    printSuiteHeaders: true,
    newOnly: false,
    rerun: false,
    title: null,
    onSuiteStart: null,
    onSuiteEnd: null,
    onTestResult: null,
    ...options,
  };

  const run = { total: 0, passed: 0, failed: 0, duration: 0, results: [], suiteStats: [] };
  const candidates = suites.filter((suite) => opts.rerun || !suite.ran);

  if (opts.title && opts.print) {
    console.log(`\n${color.bold(color.cyan(opts.title))}`);
  }

  for (const suite of candidates) {
    const stat = { name: suite.name, total: 0, passed: 0, failed: 0, duration: 0 };
    run.suiteStats.push(stat);

    if (opts.print && opts.printSuiteHeaders) {
      console.log(`\n  ${color.cyan(SYMBOL.arrow)} ${color.bold(suite.name)}`);
    }
    if (typeof opts.onSuiteStart === "function") opts.onSuiteStart(suite);

    const commit = (result) => {
      stat.total += 1;
      stat.duration += result.duration;
      if (result.passed) stat.passed += 1;
      else stat.failed += 1;

      run.total += 1;
      run.duration += result.duration;
      if (result.passed) run.passed += 1;
      else run.failed += 1;
      run.results.push(result);

      if (opts.print) printResult(result);
      if (typeof opts.onTestResult === "function") opts.onTestResult(result, suite);
    };

    if (suite.kind === "registered") {
      await executeSuiteBody(suite, commit);
    } else {
      if (!suite.built && suite.build) {
        const previous = currentSuite;
        currentSuite = suite;
        const start = performance.now();
        let buildError = null;
        try {
          await suite.build();
        } catch (err) {
          buildError = normalizeError(err);
        }
        const buildDuration = performance.now() - start;
        currentSuite = previous;
        if (buildError) {
          commit({
            suite: suite.name,
            name: `${suite.name} — suite setup`,
            passed: false,
            duration: buildDuration,
            error: buildError,
          });
        }
      }
      suite.built = true;
      for (const entry of suite.tests) {
        await executeTest(suite, entry, commit);
      }
    }

    suite.ran = true;
    if (typeof opts.onSuiteEnd === "function") opts.onSuiteEnd(suite, stat);
    if (opts.print) printSuiteStatus(stat);
  }

  // Start a fresh root bucket for the next batch (important for the runner).
  rootSuite = null;

  accumulate(run);
  if (opts.printSummary && opts.print) printSummary(run);
  return run;
}

/** Cumulative stats across every runSuites() call in this process. */
export function getGlobalStats() {
  return {
    suites: accumulator.suites,
    total: accumulator.total,
    passed: accumulator.passed,
    failed: accumulator.failed,
    duration: accumulator.duration,
    results: accumulator.results.slice(),
    suiteStats: accumulator.suiteStats.map((stat) => ({ ...stat })),
  };
}

/* ===========================================================================
 * Direct-execution support
 * ========================================================================= */

// When a tier file is executed directly (`node tests/e2e/tierX.test.mjs`), the
// harness auto-runs all registered suites after module evaluation and sets the
// process exit code. The runner opts out via OROECO_E2E_MANAGED=1.
if (process.env.OROECO_E2E_MANAGED !== "1") {
  setImmediate(async () => {
    if (process.env.OROECO_E2E_MANAGED === "1") return;
    try {
      const run = await runSuites();
      process.exitCode = run.failed > 0 ? 1 : 0;
    } catch (err) {
      console.error(color.red("Fatal harness error:"), err);
      process.exitCode = 1;
    }
  });
}

export default {
  describe,
  it,
  test,
  beforeEach,
  afterEach,
  registerSuite,
  runSuites,
  getGlobalStats,
  getSuiteCount,
  expect,
  assert,
  formatDuration,
  stripAnsi,
  color,
};
