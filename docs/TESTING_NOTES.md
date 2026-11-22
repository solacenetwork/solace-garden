# SOLACE Garden — Testing Notes

**Status:** Local Playwright testing foundation accepted, November 16, 2026.  
**Historical baseline:** **57/57 Playwright tests passed in 49.6 seconds** on `oakisland` on November 16 (developer-run, LMDE 7).

**Latest verified full run:** **45/45 Playwright tests passed** on November 22, 2026, after shell navigation regression coverage was added.
**Quick command reference:** [tests/README.md](../tests/README.md).  
**Related docs:** [UI_REDESIGN.md](UI_REDESIGN.md), [UI_REVIEW_NOTES.md](UI_REVIEW_NOTES.md), [ROADMAP.md](ROADMAP.md).

## 1. Purpose

Move routine, repeatable browser testing **out of Codex** and into locally executed Playwright tests. This saves Codex tokens for implementing features and fixing defects. Automated results should give Codex focused, reproducible failure reports instead of making it drive Chromium for every change.

The suite is a development tool, not a replacement for manual UI acceptance. A green run establishes only the behavior and environments actually tested.

## 2. Accepted baseline — November 16, 2026

The developer ran `npm run test:e2e` on `oakisland`: **57 passed (49.6s)**.

| Group | Spec | Cases | Assertions covered |
| --- | --- | ---: | --- |
| Smoke | `tests/e2e/smoke/populated-fixture.spec.mjs` | 1 | Garden initializes with restored IndexedDB fixture; expected stores contain records |
| Smoke | `tests/e2e/smoke/populated-navigation.spec.mjs` | 4 | Populated Gardens, Tasks, Wish List, and saved Notes routes display content |
| Layout | `tests/e2e/layout/viewport-scrolling.spec.mjs` | 40 | Last Garden/List/Note-list control reachable via wheel scroll across four routes, five viewports, both modes |
| Notes | `tests/e2e/notes/editor-accessibility.spec.mjs` | 8 | Existing nonempty Note draft: Save reachable via incremental wheel scrolling; native Tab order/focus visibility and enabled Save button, two viewports in both modes |
| Lists | `tests/e2e/lists/delete.spec.mjs` | 4 | Task and Wish List deletion: confirm, cancel, and persisted result after reload |
| **Total** | | **57** | All passed on the desktop test machine |

These are **real reported acceptance results**, not claims that the tests ran here or on the affected laptop.

### Later suite consolidation and November 21 full run

After the November 16 baseline, redundant viewport/Note-editor permutations were reduced and Garden Identity cases were added; the earlier `tests/README.md` records a **21-test snapshot** at that stage. That number is also historical, not a verified total after the latest changes. The currently tracked specs additionally include `tests/e2e/gardens/gardens-hub.spec.mjs`, `garden-identity.spec.mjs`, and the November 21 `quick-start.spec.mjs`.

**November 21 Copilot browser-test work:** [Commit `16d1080`](https://github.com/solacenetwork/solace-garden/commit/16d1080a10700a4d8dcd2d6a8a55ead78fe4fda9) updated the Gardens smoke assertions for current lifecycle headings/navigation and the Gardens Hub expanded-collection expectation, and added an isolated Quick Start workflow covering chooser → form → create → detail → reload → Gardens listing. No application or fixture changes were reported.

The previously reported Garden Hub focus-restoration failure was reproduced and fixed by synchronizing carousel lifecycle cleanup with unmount. The layout reachability test targets the last Previous Garden card when View All is correctly absent because the collection fits, and still checks View All when overflow exposes that control.

The isolated `tests/e2e/notes/notes-persistence.spec.mjs` verifies Note creation and reload/reopen, edit and reload persistence, and cancellation/confirmation of recoverable-draft discard without overwriting the saved Note.

The isolated `tests/e2e/lists/workflows.spec.mjs` verifies Task create/complete/edit persistence, Wish List optional fields/purchase/edit persistence, and moving items with accessible ordering controls. Both list tests confirm a new item appears first without changing the order that was manually established before adding it. The initial browser run exposed that list creation appended items; the repository now prepends atomically while retaining existing order.

The isolated `tests/e2e/gardens/templates.spec.mjs` verifies saving a Garden as a named Template, management-page persistence and confirmed deletion without changing its source Garden; applying and editing a saved Template to create an independent Garden that persists after reload; and applying a Template after its custom Location is deleted, including the Default Location fallback and explanation. The fallback case extends an in-memory copy of the synthetic fixture; the committed fixture is unchanged. The tests use the current Advanced creation controls and do not depend on Wizard steps.

**November 21 verification:** Garden Templates: **3 passed**; Lists group (including existing delete tests): **8 passed**; list service tests: **13 passed**; Notes persistence: **3 passed**; Notes group (including editor accessibility): **4 passed**; full Playwright suite: **39 passed**. The committed sample fixture was not modified.

The isolated `tests/e2e/gardens/lifecycle-deletion.spec.mjs` verifies Planned → Active → Completed transitions, persistence after reload, closing and reopening a Garden, archiving and unarchiving, and the absence of the Edit Garden action while locked. Its deletion workflow covers cancel and confirmation, checks that only the target Garden is removed, and verifies that associated Notes, Tasks, and Wish List items survive with cleared `gardenId` values after reload.

**November 22 verification:** Garden lifecycle/deletion: **2 passed**; full Playwright suite: **41 passed**. Tests use isolated contexts based on the synthetic fixture; the committed fixture was not modified.

The isolated `tests/e2e/navigation/shell-navigation.spec.mjs` verifies Simple Mode navigation cards at desktop and mobile widths, Standard Mode workspace and global-tool navigation, Help/About/Settings through More, browser Back/Forward, Garden and Note deep links, and interface-mode switching without losing the current route or saved Notes. Keyboard coverage exercises logo activation, Tab navigation, More-menu Enter/Space/Escape behavior, and Navigation Drawer focus and Escape dismissal at phone and medium widths.

**November 22 verification:** shell navigation: **4 passed**; complete Playwright suite: **45 passed**. Tests use isolated contexts based on the synthetic fixture; the committed fixture was not modified. The navigation cases exercise representative viewport sizes rather than every breakpoint or browser.

## 3. Running focused test groups

| Purpose | Command |
| --- | --- |
| Smoke tests | `npm run test:e2e:smoke` |
| Shell navigation and keyboard behavior | `npx playwright test tests/e2e/navigation/shell-navigation.spec.mjs` |
| Quick Start creation | `npx playwright test tests/e2e/gardens/quick-start.spec.mjs` |
| Garden Templates | `npx playwright test tests/e2e/gardens/templates.spec.mjs` |
| Garden lifecycle/deletion | `npx playwright test tests/e2e/gardens/lifecycle-deletion.spec.mjs` |
| Gardens Hub / focus regression | `npx playwright test tests/e2e/gardens/gardens-hub.spec.mjs` |
| Garden Identity | `npx playwright test tests/e2e/gardens/garden-identity.spec.mjs` |
| Scrolling/layout | `npm run test:e2e:layout` |
| Note editor | `npm run test:e2e:notes` |
| Tasks and Wish List | `npm run test:e2e:lists` |
| Task/Wish List workflows | `npx playwright test tests/e2e/lists/workflows.spec.mjs` |
| Delete regression | `npm run test:e2e:delete` |
| Entire browser suite | `npm run test:e2e` |
| HTML report | `npm run test:e2e:report` |
| Separate Vitest unit suite | `npm test` |

Playwright supports narrower filtering without extra scripts:

```bash
npx playwright test tests/e2e/lists/delete.spec.mjs --grep "/tasks"
npx playwright test tests/e2e/layout/ --grep "standard"
npx playwright test tests/e2e/layout/ --grep "1366x768"
```

**Working practice:** Run the relevant feature tests while developing, smoke checks after ordinary integration changes, and the full suite at milestone acceptance and before significant releases. Avoid paying the cost of every test after every small code change.

## 4. Suite layout

```text
tests/
├── e2e/
│   ├── smoke/
│   │   ├── populated-fixture.spec.mjs
│   │   └── populated-navigation.spec.mjs
│   ├── gardens/
│   │   ├── gardens-hub.spec.mjs
│   │   ├── garden-identity.spec.mjs
│   │   ├── lifecycle-deletion.spec.mjs
│   │   ├── quick-start.spec.mjs
│   │   └── templates.spec.mjs
│   ├── layout/
│   │   └── viewport-scrolling.spec.mjs
│   ├── notes/
│   │   ├── editor-accessibility.spec.mjs
│   │   └── notes-persistence.spec.mjs
│   ├── navigation/
│   │   └── shell-navigation.spec.mjs
│   └── lists/
│       ├── delete.spec.mjs
│       └── workflows.spec.mjs
├── fixtures/
│   └── sample-garden.json
├── scripts/
│   ├── capture-fixture.mjs
│   └── restore-fixture.mjs
└── README.md
```

Organize new tests by **feature/function** rather than project milestone. Add directories when needed, not empty directories in anticipation. Prefer accessible roles/names and stable selectors. Name tests by what they verify. An element merely existing in the DOM does not establish that it can be scrolled into view, focused, activated, or persisted.

## 5. Fixture and execution conventions

- `playwright.config.mjs` uses Playwright-managed Chromium (`@playwright/test` pinned at **1.65.1**), one worker, 30-second test timeout and 90-second browser launch allowance. Vite is started or reused at `http://localhost:5173`.
- Populated tests load `tests/fixtures/sample-garden.json` into **separate nonpersistent browser contexts**. Even deletion tests must never change the committed fixture or the persistent fixture-authoring browser profile.
- The fixture includes the `solace-config` IndexedDB database and a populated Garden data database with Gardens, Notes, list items, templates, drafts, and related records. It contains only localhost storage and no cookies.
- Run `node tests/scripts/capture-fixture.mjs` to author and recapture data using the dedicated Chromium profile. Run `node tests/scripts/restore-fixture.mjs` to inspect a temporary restored session. Review changed test data before committing; don't use real private user data in test snapshots.
- HTML reports live under `playwright-report/`, with test artifacts under `test-results/`; both are ignored by Git. Failed tests retain screenshots/traces, and certain layout failures attach JSON diagnostics.
- During alpha development, obsolete synthetic data may be regenerated when the current data contract changes. **Do not add migrations, legacy defaults or compatibility code just to preserve obsolete alpha fixtures.** Normal draft/autosave and transactional integrity still matter.

## 6. Laptop-specific defects — investigation open

**Reported November 16, 2026:** In regular Chromium on an older LMDE laptop, with **Standard Mode** selected and normal browser zoom:

1. On the **new Note editor** (not just the Notes list), controls at the bottom, including Save, were below the accessible scroll area. Tabbing/Enter did not apparently resolve this; whether the button actually received focus was unclear. Zooming Chromium out to about **50%** made the controls visible and clickable.
2. Tasks displayed a bottom card clipped below the visible area. A small exposed part could be grabbed and dragged upward, but normal scrolling did not reveal the rest. Similar behavior was reported on Gardens and Wish List.
3. Task and Wish List **Delete** controls appeared unresponsive during manual laptop testing.

**Displays:** Desktop **1920×1080 @ 60 Hz**; laptop **1366×768 @ 60 Hz**, both 16:9. Physical resolution is not necessarily the browser's actual CSS viewport.

**Evidence to date:** All 40 layout tests, eight Note editor tests and four deletion tests passed on `oakisland`. This does **not** prove the original laptop defects are fixed, because Playwright Chromium on the desktop does not reproduce every laptop/browser-profile/input condition.

**Next investigation:** Run the focused tests on the laptop itself and reproduce manually at 100% zoom in Standard Mode. Record:

```javascript
({
  viewport: [window.innerWidth, window.innerHeight],
  screen: [screen.width, screen.height],
  devicePixelRatio: window.devicePixelRatio,
  activeElement: document.activeElement?.outerHTML?.slice(0, 300),
  mode: document.querySelector('.app-shell')?.dataset.interfaceMode
})
```

Also compare browser version, extensions/profile, window state and touchpad/mouse input. If a defect is reproducible, preserve the failing condition in a focused test **before** sending a targeted fix to Codex where practical. Do not mark the laptop reports resolved solely from passing desktop tests.

## 7. Known coverage gaps and next candidate tests

- Navigation testing across all application routes, browser engines, and responsive breakpoints remains incomplete.
- The focused Gardens Hub spec checks ordered sections, lifecycle classification, Draft isolation and resume links, Garden card destinations, and header/Standard navigation routes. Run it with `npx playwright test tests/e2e/gardens/gardens-hub.spec.mjs`.
- Task/Wish List create, edit, complete/purchase, manual reorder, reload persistence, and top insertion without disturbing existing order are covered by `tests/e2e/lists/workflows.spec.mjs`; deletion confirmation/persistence is covered separately.
- Note create/edit/reload persistence and recoverable-draft discard protection are covered by `tests/e2e/notes/notes-persistence.spec.mjs`; the editor accessibility test deliberately **does not click Save**. Note deletion confirmation and persistence remain uncovered.
- **Quick Start create/reload is now covered** by the focused November 21 spec. Remaining Garden creation coverage includes Wizard-specific steps and draft recovery. Add Wizard browser-history and step-resume cases **after** 8A4–8A6 implementation stabilizes.
- Garden Template save/reload/delete, Advanced application and editing, independent creation/reload, and deleted-Location fallback are covered by `tests/e2e/gardens/templates.spec.mjs`. Garden lifecycle transitions, lock/unlock behavior, and Garden deletion/association cleanup are covered by `tests/e2e/gardens/lifecycle-deletion.spec.mjs`. Remaining Garden creation coverage includes draft recovery and Wizard-specific navigation; defer Wizard cases until 8A4–8A6 stabilize. Broader lifecycle and association workflows across interface modes, mobile layouts, and installed offline PWA remain outside this focused suite.
- Shell navigation and accessible More/Drawer interactions are covered by `tests/e2e/navigation/shell-navigation.spec.mjs`. Coverage uses representative desktop, phone, and medium viewports; other browsers and fine-grained responsive breakpoints are not covered.
- Offline/PWA startup, caching and update flows; practical testing on real devices.

These are candidates, **not implemented tests**. Add them incrementally as requirements stabilize and their regression value justifies maintenance.

## 8. Keeping this document useful

When a test is added or its behavior changes:

1. Document its purpose and important limitations here; keep `tests/README.md` concise and command-focused.
2. Update the inventory and counts after a verified full run, distinguishing reported test results from unexecuted changes.
3. Add npm shortcuts only for frequently used groups; file paths and `--grep` already support narrower selection.
4. Preserve failure evidence in Codex handoffs and distinguish test failures, inspected code changes, and manual acceptance.
5. Prioritize **reliable, selective local execution** over test count. The goal is to save development time and Codex tokens, not to create a second large project maintaining tests.
