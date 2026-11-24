# SOLACE Garden — Testing Notes

**Status:** Local Playwright testing foundation accepted, November 16, 2026.  
**Historical baseline:** **57/57 Playwright tests passed in 49.6 seconds** on `oakisland` on November 16 (developer-run, LMDE 7).

**Latest developer-reported full run:** **49/49 Playwright tests passed** on November 23, 2026 following 8A6-C and Copilot's updated Template chooser tests in commit [`584a9a9`](https://github.com/solacenetwork/solace-garden/commit/584a9a95211df2f562e7e17e705607360e92759d). The developer also reported all desktop/mobile 8A6 manual acceptance checks passed and `npm run build` succeeded. (These commands were run locally by the developer/Copilot, not independently by the documentation editor.)
**Latest 8A8 Playwright checkpoint (Copilot-reported, November 23, 2026):** New Advanced creation regression tests in [`275dc47`](https://github.com/solacenetwork/solace-garden/commit/275dc47148ab6d03168c75863851d2be562fbfbb) and follow-up [`8514628`](https://github.com/solacenetwork/solace-garden/commit/85146289db67703258c492f14bccae1fbdf48e24) were accepted. Initial focused Advanced/Template **8/8**, Gardens Hub **3/3**; initial full suite **53/54** with unrelated navigation browser-context teardown timeout passing alone. Follow-up focused Advanced spec **7/7**, full suite **55/56** with unrelated short-desktop viewport-scrolling failure passing alone. These **were not clean full-suite runs**; the failures appear intermittent but remain worth monitoring. No confirmed application regression; `git diff --check` passed. A final production build and optional clean full Playwright run belong to 8A9.
**Final 8A8 verification (developer-reported, November 23, 2026):** After Copilot stabilized the Garden Identity dismissal and reload test in [`f567cfd`](https://github.com/solacenetwork/solace-garden/commit/f567cfdd5687565acf1b3bc7e8c02358375031c8), the developer independently reran the full Playwright suite with other workloads stopped: **56/56 passed**. Earlier intermittent timeouts occurred while other processes, including two Vite development servers, were running on an older machine; resource contention is a plausible explanation but was not conclusively proven. For reliable regression checkpoints, avoid unnecessary competing workloads and duplicate dev servers. Do not obscure genuine bugs with blanket retries or timeout increases. **8A8 accepted/closed; 8A9 manual acceptance and production build remain pending.**
**8A9 final acceptance (developer-reported, November 23, 2026):** `npm run build` **passed**; deployment to [`garden.solace.network`](https://garden.solace.network) **passed**; desktop browser, Galaxy S22 and installed-PWA manual acceptance **passed**. The developer reported normal behavior and accepted 8A9. Final 8A8 automated baseline remained **56/56 Playwright passed**. Supplemental screenshots and notes are pending triage for later UI refinements; no unreported specific findings are asserted here. **Step 8A is complete; next Step 8B.**
**8B1 accepted November 24, 2026.** Implementation [`c5f2006`](https://github.com/solacenetwork/solace-garden/commit/c5f200635485659fa9624a2f3df47ec3f41e9d64); corrective implementation [`5e9d0c5`](https://github.com/solacenetwork/solace-garden/commit/5e9d0c502d9904d1ab2fae98a696b25a5cd41a90). Quick Start now participates in shared Garden draft persistence and atomic consumption; all three editors establish drafts only after meaningful data changes (including explicit Template application). First-save URL replacement preserves the mounted editor; failed autosaves retain the latest snapshot for retry and failed discard leaves persistence usable. Developer confirmed all corrective and remaining functional manual checks passed, including reduced-height desktop and Galaxy S22 editing continuity, explicit resume, fresh flows, Template workflows and draft management. Codex reported 628/628 full Vitest (65 files), 88/88 focused (8 files), successful production PWA build and diff check; no Playwright run or changes in this slice. Test commands were not independently rerun by the documentation editor. Abrupt termination can recover only committed autosaves. No alpha migration or schema version change. **Next: 8B2.**

**8B2 accepted November 24, 2026.** Implementation [`5c5402c`](https://github.com/solacenetwork/solace-garden/commit/5c5402c49b55f43edbe83e75d6b42de3f616b589). Draft-only bottom creation-method ribbons (Quick Start, Wizard, Advanced) use persisted editor metadata and the shared card presentation on the Gardens Hub and dedicated Drafts page. Names/subtitles are preserved, saved cards unchanged, Resume and Discard remain separate, and the Hub View All link is hidden for zero drafts. Codex reported 39/39 focused Vitest tests across two files, successful diff check and clean worktree; no full suite, Playwright or build was run in this slice. Developer confirmed all manual acceptance checks passed. Test commands were not independently rerun by the documentation editor. **Next: 8B3 — Conditional Geographic Location.**

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
- **Quick Start create/reload is covered** by the focused November 21 spec. **Wizard 8A5 browser coverage was added November 23** in `tests/e2e/gardens/wizard-finalization.spec.mjs` (four isolated-context tests): five-step rendering; required name/invalid-date focus; validation-free Back and browser history; draft autosave/reload with icon/color/type/date preservation; whole-Garden final validation returning to Identity; Save-as-Template dialog cancel/confirm; IndexedDB assertions for Garden/Template creation and draft consumption. More comprehensive Template chooser/prefill tests belong to 8A6.
- **8A8 accepted browser coverage:** `tests/e2e/gardens/advanced-creation.spec.mjs` tests Advanced Completed/open, Archived/Locked, Active/Locked creation and actual IndexedDB persistence; draft autosave/reload/resume; Save as Template cancellation and atomic creation; Wizard/Advanced lifecycle and editor isolation; and simultaneous visibility/order of the five Advanced form sections. The new/updated selectors also align with the `Geographic Location` label, and the Gardens Hub fixture includes the current required `isClosed` draft field.
- Garden Template save/reload/delete, Advanced application and editing, independent creation/reload, and deleted-Location fallback are covered by `tests/e2e/gardens/templates.spec.mjs`. Garden lifecycle transitions, lock/unlock behavior, and Garden deletion/association cleanup are covered by `tests/e2e/gardens/lifecycle-deletion.spec.mjs`. Wizard 8A5 draft recovery, finalization and navigation are now covered by the new isolated-context E2E spec; Template chooser/prefill Advanced flow and missing-Location fallback are now covered by updated E2E tests (8A6). Broader lifecycle and association workflows across interface modes, mobile layouts, and installed offline PWA remain outside this focused suite.
- Shell navigation and accessible More/Drawer interactions are covered by `tests/e2e/navigation/shell-navigation.spec.mjs`. Coverage uses representative desktop, phone, and medium viewports; other browsers and fine-grained responsive breakpoints are not covered.
- Offline/PWA startup, caching and update flows; practical testing on real devices.

These are candidates, **not implemented tests**. Add them incrementally as requirements stabilize and their regression value justifies maintenance.

**Real-device limitation found during 8A5 manual acceptance (November 23):** On Vivaldi Mobile, browser Back/Forward retains the correct Wizard step and draft data but scrolls to the page bottom and highlights/focuses Continue. This did not block functional acceptance; vertical scroll/focus-restoration polish is tracked in [UI_REDESIGN.md](UI_REDESIGN.md) Step 10 item 18. Chromium Playwright passing does not prove this mobile-browser usability behavior is fixed.

## 8A6 acceptance — November 23, 2026

**8A6 acceptance (November 23, 2026):** The gardener accepted desktop and phone workflows for scratch and Template-prefilled Wizard/Advanced creation, edited-draft reload, and the Gardens → Templates breadcrumb. Implementation: routing tests [`74d65fc`](https://github.com/solacenetwork/solace-garden/commit/74d65fcfabe48592885b79cbc6beedbc4d4d50bc), atomic initial prefill [`959220d`](https://github.com/solacenetwork/solace-garden/commit/959220d53933591e3f7b71d6375b8d00e3ce7ed1), editor cleanup/breadcrumb [`526ae30`](https://github.com/solacenetwork/solace-garden/commit/526ae301767c74e5d04cc8d12e1c34c0dd79f880), and updated E2E selectors [`584a9a9`](https://github.com/solacenetwork/solace-garden/commit/584a9a95211df2f562e7e17e705607360e92759d). Codex reported focused Vitest 43/43 (B) and 37/37 (C); Copilot reported full Playwright 49/49; developer confirmed `npm run build` succeeded. **Next: 8A7** Advanced form grouping and hiding editor switching (preserving underlying draft/mode functionality).

## 8. Keeping this document useful

When a test is added or its behavior changes:

1. Document its purpose and important limitations here; keep `tests/README.md` concise and command-focused.
2. Update the inventory and counts after a verified full run, distinguishing reported test results from unexecuted changes.
3. Add npm shortcuts only for frequently used groups; file paths and `--grep` already support narrower selection.
4. Preserve failure evidence in Codex handoffs and distinguish test failures, inspected code changes, and manual acceptance.
5. Prioritize **reliable, selective local execution** over test count. The goal is to save development time and Codex tokens, not to create a second large project maintaining tests.
