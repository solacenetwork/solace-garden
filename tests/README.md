# Local Playwright browser testing

Step 5.5 provides repeatable Chromium checks without using Codex to drive the
browser. Run the tests locally from the repository root; no GitHub Actions
workflow is required.

## Run test groups

| Command | Scope |
|---|---|
| `npm run test:e2e:smoke` | Restored IndexedDB fixture and populated page rendering |
| `npm run test:e2e:layout` | Scrolling and bottom-control reachability |
| `npm run test:e2e:lists` | Tasks and Wish List interactions |
| `npm run test:e2e:delete` | Deletion confirmation and persistence only |
| `npm run test:e2e` | Entire suite |
| `npm run test:e2e:report` | Open the last HTML report |

Use the underlying Playwright CLI for a particular test or matching name:

```bash
npx playwright test tests/e2e/layout/ --grep "800x600"
npx playwright test tests/e2e/layout/ --grep "standard"
npx playwright test tests/e2e/lists/delete.spec.mjs --grep "/tasks"
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

## Reported defects under investigation

The November 16, 2026 Chromium laptop reports describe page bottoms that
could not be reached at normal zoom, and unresponsive Task/Wish List Delete
buttons. The layout suite exercises four routes at both Simple and Standard
mode across 1366x768, 1280x600, 1024x600, 800x600, and 768x480 CSS viewports.
The deletion suite checks both cancel and confirm behavior, plus persistence
after reload.

These are regression tests, **not fixes**. A failing case should be investigated
rather than disabled or marked as passed. Physical screen resolution is not
always the browser's CSS viewport: browser chrome, OS display scaling, and zoom
can change the effective dimensions. Record the failing Chromium window's
`window.innerWidth`, `window.innerHeight`, `window.devicePixelRatio`, and
selected interface mode when reproducing a device-specific layout issue.

For day-to-day development, run the affected subset. Run smoke tests after
typical changes, and the complete suite at milestone acceptance.
