// A run in which nothing actually ran is not a passing run.
//
// Playwright exits 0 when every selected test is skipped, and 0 again when a
// whole spec file is skipped inside an otherwise green run. Both read as success
// in a terminal and in CI. That is how the atomic-acceptance suite reported
// "10 skipped" on 2026-09-25 while the code it guards was completely broken in
// production.
//
// liveEnv.js now makes absent credentials an error rather than a skip, so this
// reporter is the backstop rather than the primary guard: it exists so that no
// future skip condition, in any suite, can quietly empty a run again.
//
// It fails a run when no test ran at all, and when any spec file had every one of
// its tests skipped. A partial skip inside a file is reported but allowed — that
// is a deliberate per-case decision, not a suite that silently disappeared.
//
// TF_LIVE_E2E=skip disables both checks, because then the operator asked for the
// skipping and the exit code should not argue with them.

const OPTED_OUT = process.env.TF_LIVE_E2E === 'skip';

/** The spec file a test came from, relative to the repo, as the reporter prints it. */
function fileOf(test) {
  return test.location?.file ?? test.parent?.project()?.testDir ?? 'unknown';
}

export default class NoSilentSkip {
  constructor() {
    this.perFile = new Map(); // file -> { ran, skipped }
  }

  onTestEnd(test, result) {
    const file = fileOf(test);
    const counts = this.perFile.get(file) ?? { ran: 0, skipped: 0 };
    if (result.status === 'skipped') counts.skipped += 1;
    else counts.ran += 1;
    this.perFile.set(file, counts);
  }

  async onEnd(result) {
    if (OPTED_OUT) return;

    const totals = [...this.perFile.values()].reduce(
      (acc, c) => ({ ran: acc.ran + c.ran, skipped: acc.skipped + c.skipped }),
      { ran: 0, skipped: 0 },
    );

    if (totals.ran === 0) {
      console.error('\nNothing ran. '
        + `${totals.skipped} test(s) were skipped and none executed.\n`
        + 'Failing the run: a suite that did not execute has not passed. Set '
        + 'TF_LIVE_E2E=skip if that was intended.\n');
      return { status: 'failed' };
    }

    const emptied = [...this.perFile.entries()]
      .filter(([, c]) => c.ran === 0 && c.skipped > 0)
      .map(([file]) => file);

    if (emptied.length > 0) {
      console.error('\nEvery test was skipped in:\n'
        + emptied.map(f => `  ${f}`).join('\n')
        + '\nFailing the run: a whole suite disappearing inside a green run is the '
        + 'failure mode this check exists for. Set TF_LIVE_E2E=skip if that was '
        + 'intended.\n');
      return { status: 'failed' };
    }

    if (totals.skipped > 0 && result.status === 'passed') {
      console.warn(`\nNote: ${totals.skipped} individual test(s) were skipped.\n`);
    }
  }
}
