#!/usr/bin/env node
// Guard against the two migration faults this project has actually had.
//
// WHY THIS EXISTS
// Twice, migrations were applied through the Supabase management API instead of
// `supabase db push`. The API assigns its own timestamp version per call, so the
// database ended up recording versions like 20260924163727 while the local file
// was named 20260925000000. The CLI matches on version alone and stores no
// checksum, so it saw three unapplied migrations and would have replayed them —
// and replaying evidence_core then agreement_snapshot out of order would have
// left events.hash_version defaulting to 3, quietly writing events whose hash no
// longer covers the agreed amount and deadline. Nothing would have errored.
//
// Each repair leaves another permanent reconcile_* file in the tree. Before this
// script the only guard was prose in HANDOFF.md telling the next session to use
// the CLI. This makes it mechanical.
//
// Separately, a rebuild from migrations onto an empty database stopped at 22 of
// 28 because 20260924132813 records a version dated AFTER itself: the insert
// succeeded and `db push` then failed applying the migration it had just
// declared applied. That class is checked offline, below.
//
// USAGE
//   node scripts/check-migrations.mjs          offline checks only — no network,
//                                              no credentials, safe in CI
//   node scripts/check-migrations.mjs --live   also compares the local filenames
//                                              against the versions the linked
//                                              project has recorded
//
// Exits non-zero on any error.

import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(REPO, 'supabase/migrations');

/** `<14-digit version>_<snake_case name>.sql` — the shape `supabase db push` expects. */
const FILENAME = /^(\d{14})_([a-z0-9]+(?:_[a-z0-9]+)*)\.sql$/;

/**
 * A migration that writes a version into the history table. Matching the value
 * rather than the statement, because the insert may be spread over lines or
 * wrapped in a guard.
 */
const HISTORY_WRITE = /schema_migrations/;
const VERSION_LITERAL = /'(\d{14})'/g;

/**
 * Opt-out for a history write that is already guarded so it cannot fire on a
 * fresh database. Only 20260924132813 needs it, and only because the version it
 * records is dated after itself.
 */
const GUARD_MARKER = 'drift-check: history write is guarded';

const errors = [];
const warnings = [];
const notes = [];

// ── Offline: the filenames themselves ───────────────────────────────────────

const files = readdirSync(DIR).filter(f => f.endsWith('.sql')).sort();
if (files.length === 0) errors.push(`no migrations found in ${DIR}`);

const byVersion = new Map();
for (const file of files) {
  const m = FILENAME.exec(file);
  if (!m) {
    errors.push(`${file}: not <14-digit version>_<snake_case name>.sql — `
      + `db push orders migrations by that prefix, so a malformed name applies `
      + `at an unpredictable point`);
    continue;
  }
  const [, version] = m;
  if (byVersion.has(version)) {
    errors.push(`duplicate version ${version}: ${byVersion.get(version)} and ${file} — `
      + `the history table is keyed on version, so only one of them can ever be recorded`);
  }
  byVersion.set(version, file);
}

// ── Offline: a history write dated after the file that performs it ──────────

for (const [version, file] of byVersion) {
  const sql = readFileSync(path.join(DIR, file), 'utf8');
  if (!HISTORY_WRITE.test(sql)) continue;

  const guarded = sql.includes(GUARD_MARKER);
  const forward = [...sql.matchAll(VERSION_LITERAL)]
    .map(m => m[1])
    .filter(v => v > version && byVersion.has(v));

  for (const v of new Set(forward)) {
    const message = `${file} writes history for ${v}, which is dated after it. `
      + `On an empty database db push has not reached ${byVersion.get(v)} yet, so the `
      + `insert lands first and db push then fails recording that migration `
      + `("duplicate key ... schema_migrations_pkey") — leaving history claiming it `
      + `was applied while its DDL never ran`;
    if (guarded) notes.push(`${message}. Guarded, per the marker in the file.`);
    else errors.push(`${message}. Guard it on the row it exists to remove, or date `
      + `this file after ${v}`);
  }
}

notes.push(`${byVersion.size} migration files, names and ordering consistent`);

// ── Live: what the linked project has actually recorded ─────────────────────

if (process.argv.includes('--live')) {
  let table;
  try {
    table = execFileSync('supabase', ['migration', 'list', '--linked'],
      { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (err) {
    errors.push(`could not read the linked project's history: ${err.message.split('\n')[0]}`);
    table = '';
  }

  // The CLI has no machine-readable output for this, so the table is parsed —
  // strictly, so that a format change fails loudly instead of being read as
  // "no drift".
  const rows = table.split('\n')
    .map(line => /^\s*(\d{14})?\s*\|\s*(\d{14})?\s*\|/.exec(line))
    .filter(Boolean)
    .map(([, local, remote]) => ({ local, remote }));

  if (table && rows.length === 0) {
    errors.push('parsed no rows from `supabase migration list` — its output format '
      + 'has probably changed, and this check cannot be trusted until the parser is updated');
  }

  const recorded = rows.map(r => r.remote).filter(Boolean);
  const drift = recorded.filter(v => !byVersion.has(v));
  const pending = rows.filter(r => r.local && !r.remote).map(r => r.local);

  for (const v of drift) {
    errors.push(`the database records version ${v}, which no local file claims. `
      + `That is the management-API drift: it stamps its own version per call. Do not `
      + `"fix" it by pushing again — reconcile the history, and apply with `
      + `\`supabase db push\` from now on`);
  }

  if (pending.length) {
    notes.push(`pending (recorded locally, not yet applied): ${pending.join(', ')}`);
  }
  notes.push(`${recorded.length} versions recorded in the linked project`);
} else {
  notes.push('offline checks only — pass --live to compare against the linked project');
}

// ── Report ─────────────────────────────────────────────────────────────────

for (const n of notes) console.log(`  ${n}`);
for (const w of warnings) console.warn(`\nwarning: ${w}`);
for (const e of errors) console.error(`\nerror: ${e}`);

if (errors.length) {
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log('\nmigrations OK');
