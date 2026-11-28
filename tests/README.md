# Local Playwright browser testing

Step 5.5 provides repeatable Chromium checks without using Codex to drive the
browser. Run the tests locally from the repository root; no GitHub Actions
workflow is required.

## Run test groups

| Command | Scope |
|---|---|
| `npx playwright test tests/e2e/navigation/shell-navigation.spec.mjs` | Simple/Standard navigation, More and Drawer keyboard behavior, deep links, and mode persistence |
| `npx playwright test tests/e2e/gardens/gardens-hub.spec.mjs` | Garden lifecycle classification, section ordering, and navigation |
| `npx playwright test tests/e2e/gardens/garden-identity.spec.mjs` | Step 6.5 Garden Identity interactions and persistence |
| `npx playwright test tests/e2e/gardens/quick-start.spec.mjs` | Create from chooser through Quick Start; verify persistence across reload |
| `npx playwright test tests/e2e/gardens/templates.spec.mjs` | Template save/reload/delete, Advanced application, and deleted-Location fallback |
| `npx playwright test tests/e2e/gardens/lifecycle-deletion.spec.mjs` | Garden lifecycle transitions, unlocks, confirmed deletion, and association cleanup |
| `npm run test:e2e:smoke` | Restored IndexedDB fixture and populated page rendering |
| `npm run test:e2e:layout` | Scrolling and bottom-control reachability |
| `npm run test:e2e:lists` | Tasks and Wish List create/edit/complete/order and deletion workflows |
| `npm run test:e2e:notes` | Note create/edit/discard persistence and editor scroll/focus accessibility |
| `npm run test:e2e:delete` | Deletion confirmation and persistence only |
| `npm run test:e2e` | Entire suite |
| `npm run test:e2e:report` | Open the last HTML report |

Use the underlying Playwright CLI for a particular test or matching name:

```bash
npx playwright test tests/e2e/layout/ --grep "short desktop"
npx playwright test tests/e2e/layout/ --grep "mobile-width"
npx playwright test tests/e2e/layout/ --grep "standard"
npx playwright test tests/e2e/lists/delete.spec.mjs --grep "/tasks"
npx playwright test tests/e2e/lists/workflows.spec.mjs
```

Playwright starts Vite at `http://localhost:5173` if needed. The config
allows 90 seconds for Chromium launch on slower hardware. A failed test
generates a screenshot and trace, available through the HTML report.

## Fixture isolation

Every populated test loads `tests/fixtures/sample-garden.json` into a new
non-persistent browser context. Tests may edit or delete records there without
changing the committed JSON file or the fixture-authoring browser profile.

The developer utilities accept a fixture filename relative to `tests/fixtures/`.
With no filename they continue to use `sample-garden.json`:

```bash
node tests/scripts/capture-fixture.mjs
node tests/scripts/restore-fixture.mjs
node tests/scripts/capture-fixture.mjs sample-data.json
node tests/scripts/restore-fixture.mjs sample-data.json
```

Capture uses the existing `tests/.chrome-fixture-profile/` authoring profile by
default. Select a separate, named test-only profile with `--profile`:

```bash
node tests/scripts/capture-fixture.mjs sample-data.json --profile sample-data
```

Named profiles live below `tests/.chrome-fixture-profiles/` and are ignored by
Git. Profile names may contain letters, numbers, hyphens, and underscores. The
utility does not accept an arbitrary profile path, so it cannot be pointed at a
personal browser profile. It also never clears a profile. To start clean, close
Chromium and choose a new, unused profile name. A developer may manually remove
an obsolete test profile while Chromium is closed if it is no longer needed.

Start Vite at `http://localhost:5173` before running either utility. Capture
waits until the application shell confirms successful storage initialization,
then leaves Chromium open for fixture authoring. Before pressing Enter in the
terminal, finish the active edit and navigate away from a draft editor or
confirm that its saved status is visible. Draft autosaves are asynchronous and
the application has no public pending-save signal for the utility to await.
Capture therefore does not guess with a fixed delay.

Before writing, capture validates the application origin, control database and
main configuration, exact active Garden database pointer, current native
database versions, stores, indexes, records needed for summary calculations,
and important relationships. Structural errors abort without replacing the
destination. Recoverable states, such as a Template whose custom Location was
deleted or an unfinished Garden draft containing an unavailable Garden Type,
are printed as informational warnings and do not block capture. Malformed draft
fields and incomplete or conflicting seeded catalogs remain blocking errors.
Draft validation covers the current persisted structure and value types, not
whether unfinished form content is ready to be finalized.
The write uses a temporary sibling file followed by replacement, so a failed
write does not truncate an existing fixture.

Both capture and restore print record counts; Garden lifecycle and open/closed
counts; Garden and Note draft counts; Task and Wish List completion and Garden
association counts; Note association counts; catalog counts; and the number of
localStorage entries. Note bodies and other record payloads are not printed.

Restore validates the source JSON before launching Chromium, restores it into a
new non-persistent context, follows the configured active database rather than
choosing a name by prefix, waits for successful application initialization,
and compares restored store counts with the snapshot. Interactive changes in
that context disappear when the utility closes and never change the source
fixture or an authoring profile.

The fixture contains only `http://localhost:5173` storage and no cookies.
Playwright storage state preserves IndexedDB records without per-field
serialization and preserves origin localStorage preferences, including
interface mode and accordion state.

Keep `sample-garden.json` unchanged while authoring and reviewing the new
standardized `sample-data.json`. Automated tests remain on the existing fixture
until a separate, approved migration task.

## Viewport cleanup and Step 6.5 Garden Identity

The original 40 viewport cases repeated the same bottom-reachability check over
five desktop sizes, four routes, and both interface modes. They are consolidated
into two representative cases: all four routes in Simple and Standard at
1280x600, and all four routes at a 390x844 mobile-width viewport. This keeps
route, mode, short-desktop, and mobile coverage while removing redundant
viewport permutations. The repeated cases at 1366x768, 1024x600, 800x600, and
768x480 were removed. The Note editor's eight
wheel/keyboard-by-mode-and-height cases are consolidated into one long-form
case that retains wheel scrolling and Tab reachability in both modes at
1366x600.

The Playwright config uses `viewport: null`; tests that exercise responsive
behavior set their CSS viewport explicitly. Seven Garden Identity cases use an
isolated synthetic Garden appended to the committed fixture snapshot. They cover
initial Color/Icon tabs, color and icon persistence, custom icon validation,
independent resets, cancel/close dismissal, and mobile dialog scrolling and
footer reachability.

The suite changed from 59 tests to 21: 40 viewport tests became 2, eight Note
editor tests became 1, and 7 Garden Identity tests were added. Other suites were
left unchanged.

The focused `tests/e2e/navigation/shell-navigation.spec.mjs` covers Simple and
Standard destinations, More-menu Help/About/Settings links, browser history and
deep links, mode switching, and keyboard activation/focus behavior for the
header and responsive Navigation Drawer. It checks representative desktop,
phone, and medium viewports without duplicating Gardens Hub navigation tests.

The deletion suite continues to check both cancel and confirm behavior, plus
persistence after reload. Layout and Note editor checks are regression tests,
not fixes: investigate a failing case rather than disabling it or marking it
passed. Physical screen resolution is not always the browser's CSS viewport;
record the failing Chromium window's `window.innerWidth`,
`window.innerHeight`, `window.devicePixelRatio`, and selected interface mode
when reproducing a device-specific issue.

For day-to-day development, run the affected subset. Run smoke tests after
typical changes, and the complete suite at milestone acceptance.

**November 21 verification:** Garden Templates: **3 passed**; complete Playwright suite: **39 passed**. Template coverage uses isolated contexts based on the synthetic fixture; the missing-Location case adds its custom test records to an in-memory copy, and the committed fixture is unchanged.

**November 22 verification:** Garden lifecycle/deletion: **2 passed**; complete Playwright suite: **41 passed**. Tests use isolated contexts based on the synthetic fixture and do not modify the committed fixture.

**November 22 verification:** Shell navigation: **4 passed**; complete Playwright suite: **45 passed**. Navigation tests use isolated contexts based on the synthetic fixture; the committed fixture was not modified.
