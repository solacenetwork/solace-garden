# Local Playwright browser testing

Step 5.5 provides repeatable Chromium checks without using Codex to drive the
browser. Run the tests locally from the repository root; no GitHub Actions
workflow is required.

## Run test groups

| Command | Scope |
|---|---|
| `npx playwright test tests/e2e/gardens/gardens-hub.spec.mjs` | Garden lifecycle classification, section ordering, and navigation |
| `npx playwright test tests/e2e/gardens/garden-identity.spec.mjs` | Step 6.5 Garden Identity interactions and persistence |
| `npx playwright test tests/e2e/gardens/quick-start.spec.mjs` | Create from chooser through Quick Start; verify persistence across reload |
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

- `node tests/scripts/capture-fixture.mjs`: launch the dedicated persistent
  Chromium profile to add sample data; press Enter in the terminal to save it.
- `node tests/scripts/restore-fixture.mjs`: open the saved snapshot in an
  isolated, temporary Chromium session for manual inspection.

The fixture contains only `http://localhost:5173` storage and no cookies.

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

The deletion suite continues to check both cancel and confirm behavior, plus
persistence after reload. Layout and Note editor checks are regression tests,
not fixes: investigate a failing case rather than disabling it or marking it
passed. Physical screen resolution is not always the browser's CSS viewport;
record the failing Chromium window's `window.innerWidth`,
`window.innerHeight`, `window.devicePixelRatio`, and selected interface mode
when reproducing a device-specific issue.

For day-to-day development, run the affected subset. Run smoke tests after
typical changes, and the complete suite at milestone acceptance.
