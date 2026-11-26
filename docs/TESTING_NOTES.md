# SOLACE Garden — Testing Notes

**Status:** Local Playwright testing foundation accepted, November 16, 2026.  
**Historical baseline:** **57/57 Playwright tests passed in 49.6 seconds** on `oakisland` on November 16 (developer-run, LMDE 7).

**Latest 8B6 checkpoint (November 25, 2026):** 35/35 focused Vitest, 722/722 full Vitest (76 files), production build, diff check and all 33 manual acceptance checks passed (reported by Copilot/developer). Integrated Playwright pending; see 8B6 record below.

**8B8 checkpoint (November 25, 2026):** Developer reported all Vitest and manual acceptance checks passed; exact count and explicit build/diff-check/Playwright results not supplied. See 8B8 record below.

**8B7 checkpoint (November 25, 2026):** 693/693 full Vitest, 74 files, desktop/phone manual acceptance passed; build/diff check and post-8B7 Playwright not confirmed. See 8B7 record below.

**Prior accepted baseline (November 24, 2026):** Bootstrap 6 Alpha 2 — 679/679 Vitest (71 files), 56/56 Playwright, production build and developer manual acceptance passed. See the upgrade record below.

**Historical developer-reported full run (November 23):** **49/49 Playwright tests passed** on November 23, 2026 following 8A6-C and Copilot's updated Template chooser tests in commit [`584a9a9`](https://github.com/solacenetwork/solace-garden/commit/584a9a95211df2f562e7e17e705607360e92759d). The developer also reported all desktop/mobile 8A6 manual acceptance checks passed and `npm run build` succeeded. (These commands were run locally by the developer/Copilot, not independently by the documentation editor.)
**Latest 8A8 Playwright checkpoint (Copilot-reported, November 23, 2026):** New Advanced creation regression tests in [`275dc47`](https://github.com/solacenetwork/solace-garden/commit/275dc47148ab6d03168c75863851d2be562fbfbb) and follow-up [`8514628`](https://github.com/solacenetwork/solace-garden/commit/85146289db67703258c492f14bccae1fbdf48e24) were accepted. Initial focused Advanced/Template **8/8**, Gardens Hub **3/3**; initial full suite **53/54** with unrelated navigation browser-context teardown timeout passing alone. Follow-up focused Advanced spec **7/7**, full suite **55/56** with unrelated short-desktop viewport-scrolling failure passing alone. These **were not clean full-suite runs**; the failures appear intermittent but remain worth monitoring. No confirmed application regression; `git diff --check` passed. A final production build and optional clean full Playwright run belong to 8A9.
**Final 8A8 verification (developer-reported, November 23, 2026):** After Copilot stabilized the Garden Identity dismissal and reload test in [`f567cfd`](https://github.com/solacenetwork/solace-garden/commit/f567cfdd5687565acf1b3bc7e8c02358375031c8), the developer independently reran the full Playwright suite with other workloads stopped: **56/56 passed**. Earlier intermittent timeouts occurred while other processes, including two Vite development servers, were running on an older machine; resource contention is a plausible explanation but was not conclusively proven. For reliable regression checkpoints, avoid unnecessary competing workloads and duplicate dev servers. Do not obscure genuine bugs with blanket retries or timeout increases. **8A8 accepted/closed; 8A9 manual acceptance and production build remain pending.**
**8A9 final acceptance (developer-reported, November 23, 2026):** `npm run build` **passed**; deployment to [`garden.solace.network`](https://garden.solace.network) **passed**; desktop browser, Galaxy S22 and installed-PWA manual acceptance **passed**. The developer reported normal behavior and accepted 8A9. Final 8A8 automated baseline remained **56/56 Playwright passed**. Supplemental screenshots and notes are pending triage for later UI refinements; no unreported specific findings are asserted here. **Step 8A is complete; next Step 8B.**
**8B1 accepted November 24, 2026.** Implementation [`c5f2006`](https://github.com/solacenetwork/solace-garden/commit/c5f200635485659fa9624a2f3df47ec3f41e9d64); corrective implementation [`5e9d0c5`](https://github.com/solacenetwork/solace-garden/commit/5e9d0c502d9904d1ab2fae98a696b25a5cd41a90). Quick Start now participates in shared Garden draft persistence and atomic consumption; all three editors establish drafts only after meaningful data changes (including explicit Template application). First-save URL replacement preserves the mounted editor; failed autosaves retain the latest snapshot for retry and failed discard leaves persistence usable. Developer confirmed all corrective and remaining functional manual checks passed, including reduced-height desktop and Galaxy S22 editing continuity, explicit resume, fresh flows, Template workflows and draft management. Codex reported 628/628 full Vitest (65 files), 88/88 focused (8 files), successful production PWA build and diff check; no Playwright run or changes in this slice. Test commands were not independently rerun by the documentation editor. Abrupt termination can recover only committed autosaves. No alpha migration or schema version change. **Next: 8B2.**

**8B2 accepted November 24, 2026.** Implementation [`5c5402c`](https://github.com/solacenetwork/solace-garden/commit/5c5402c49b55f43edbe83e75d6b42de3f616b589). Draft-only bottom creation-method ribbons (Quick Start, Wizard, Advanced) use persisted editor metadata and the shared card presentation on the Gardens Hub and dedicated Drafts page. Names/subtitles are preserved, saved cards unchanged, Resume and Discard remain separate, and the Hub View All link is hidden for zero drafts. Codex reported 39/39 focused Vitest tests across two files, successful diff check and clean worktree; no full suite, Playwright or build was run in this slice. Developer confirmed all manual acceptance checks passed. Test commands were not independently rerun by the documentation editor. **Next: 8B3 — Conditional Geographic Location.**

**8B3 accepted November 24, 2026.** Implementation [`24d817c`](https://github.com/solacenetwork/solace-garden/commit/24d817ce645b76e3b2a651155de5e1d527aa14d5); corrective implementation [`d30810c`](https://github.com/solacenetwork/solace-garden/commit/d30810c29c6d3ee1928196794380b000da7789a3). Wizard and Advanced share conditional Geographic Location presentation: hide the entire field when the stable system Default ID is the sole available selection; retain recovery for unavailable selections. Manual acceptance confirmed draft recovery, saved-Garden Location deletion protection, Template snapshot preservation and Default fallback, and all final corrective checks. Explicit finalization failures now reveal validation feedback after rendering and clearing busy state, preserving draft data and non-disruptive autosave. Codex reported initial focused Vitest 68/68 (6 files), corrective focused Vitest 90/90 (8 files), and successful diff checks; full suite, Playwright and production build deferred. Tests were not independently rerun by the documentation editor. Mocked focus/scroll tests establish orchestration only; browser acceptance was developer-confirmed. Nonblocking integration review consideration: unexpected unmapped Wizard error fields should not leave a pending feedback request. Linked Gardens blocking deletion remains a separate Parking Lot enhancement. **Next: 8B4 — Templates Management.**

**8B4 accepted November 24, 2026.** Implementation [`35783a3`](https://github.com/solacenetwork/solace-garden/commit/35783a38fba0311b9e01b18362d3a593fe4ab62d); developer wording refinement [`801ffa9`](https://github.com/solacenetwork/solace-garden/commit/801ffa9c1ca7ec3af4157ada20fcfdf7a41bc3b2) and matching test expectations [`4e0dd4f`](https://github.com/solacenetwork/solace-garden/commit/4e0dd4f7e71853751c3d8c9ffea3ac2ef6f4169e). Template cards prioritize direct Guided Wizard and Advanced Form links using the existing UUID-based dispatcher, with the contextual heading “Create a Garden from this Template.” Effective Location presentation uses the current name of the stable system Default ID when the original is unavailable, without rewriting the snapshot. Native independent collapsed Technical details disclose the full UUID; ordinary deletion confirmation omits it, with UUID-based targeting and existing protections preserved. The developer confirmed all manual acceptance checks passed, including mobile, direct creation, fallback, disclosure and deletion. Codex reported focused Vitest 34/34, full Vitest 645/645, production PWA build and diff check passed at initial implementation; developer reported focused Template tests 10/10 after wording refinement. No Playwright run; tests were not independently rerun by the documentation editor. Nonblocking integration review considerations: place fallback explanatory text inside its associated definition-list `dd` and explicitly verify independent creation URLs for duplicate-name cards. No storage contract, dependency or UI convention change. **Next: 8B5 — Notes browsing and linked-Garden context.**

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

## Planned incremental ZIP verification (November 24, 2026)

8H1–8H4 introduce the isolated backup test bench, shared archive definition, validator/sandbox round trip, UX prototype and production current-data backup/restore. Verify read-only source snapshot, sandbox isolation, manifest/record/reference validation, empty and populated datasets, stable IDs, invalid archive/failed writes, staging/pointer rollback and offline laptop/phone transfer. Prototype cannot switch real active pointers. Preserve existing synthetic direct IndexedDB Playwright fixture path independently of ZIP; add synthetic ZIP fixtures for dedicated restore and portability coverage. In 8J–8L and 8O–8Q, each new persistent dataset requires tested backup/validation/restore coverage. 8N integrates corruption, quota, interruption, rollback and realistic mobile/media stress checks; 8U is final offline readiness. No obsolete-alpha fixture/backup migration requirement. No implementation or execution claimed by this planning note.

**Post-8B4 Playwright maintenance (November 24, 2026):** [`d100e0b`](https://github.com/solacenetwork/solace-garden/commit/d100e0b99a7e378cebbf5cc63b772983b77f7b78) updates only `advanced-creation.spec.mjs` and `wizard-finalization.spec.mjs`. Six obsolete expectations after 8B1/8B3 were corrected: assert fresh routes and no new untouched draft, wait for persisted status and UUID-bearing route before ID extraction, and expect the sole-Default Location selector to be hidden. Copilot reported focused 11/11, full Playwright 56/56 and diff check passed; developer confirmed production build passed. No production defects identified or application changes. Code review observation for integrated acceptance: the earlier-step validation case now correctly checks an untouched form creates no draft, but its existing title still says ‘without losing the draft’; add a separate established-draft validation/preservation assertion and clarify the title when reviewing coverage. Tests not independently rerun by documentation editor. 8B4 acceptance unchanged; next 8B5.

**8B5-A accepted November 24, 2026.** Implementation [`dc170cb`](https://github.com/solacenetwork/solace-garden/commit/dc170cb21e784a355ed1d8cdbe2b852699bc84be). Native independent Bootstrap 6 details/summary accordions group saved Notes by stable Garden UUID across lifecycle statuses; application-level Notes defaults open, Garden groups default closed, live text/name filtering reveals matches without overwriting local expansion preferences. Separate unfinished drafts retain resume links. Codex reported focused Vitest 11/11, related Notes 30/30, full Vitest 656/656 (68 files), production PWA build and diff check passed. Developer confirmed all 13 manual checks passed, including a separate device with an empty collection. Actual commit reviewed; automated tests not independently rerun; Playwright not run. No domain data contract or schema changes. **Next: 8B5-B** (Note editor/draft recovery and autosave consistency, plus approved compact drafts refinement).

**8B5-B accepted November 24, 2026.** Implementation [`4403723`](https://github.com/solacenetwork/solace-garden/commit/4403723ea4a79a1a1e33c1ee4ebf3fdea2062227); corrective implementation [`716e0e7`](https://github.com/solacenetwork/solace-garden/commit/716e0e7fdba2e52d627ab18a370fd2d2c584dcab). Note drafts now recover text and required nullable `gardenId`; obsolete text-only alpha drafts are disposable, without migration or schema-version change. Fresh creation stays on `/notes/new` until successful meaningful persistence; URL replacement does not remount. Back to Notes verifies persisted snapshot and passes one-shot exact draft UUID context to the compact independent drafts accordion. Explicit expansion preference is retained separately from contextual/filter expansion. Save/discard and error recovery preserve current data; explicit validation reveals feedback. Corrective work restores the shared Garden selector to its prior behavior, recovers a missing draft Garden to No Garden with explanatory feedback and persistence, locks both fields during busy operations, and lets explicit accordion interaction supersede contextual expansion. Codex reported 91/91 focused tests across 12 files, 34/34 final editor/component edge-case tests, production PWA build and diff check passed for the initial implementation. Codex hit its five-hour limit during corrective verification; developer committed the changes, ran 78/78 focused Vitest tests across 10 files and confirmed committed diff check passed. Developer confirmed initial manual checks and all corrective acceptance checks passed. Actual implementation and corrective commits reviewed; tests not independently rerun by documentation editor. Full Vitest, Playwright and production build against corrective commit deferred to integration. **8B5 complete; next 8B6 — Tasks and Wish List consistency.**

**Post-8B5 Playwright maintenance (November 24, 2026):** [`097a133`](https://github.com/solacenetwork/solace-garden/commit/097a133d4420df877109f34e6adcd1a3fdf04f3e) resolves nine failures in the 56-test suite after the accepted Notes redesign. Three seeded Note drafts in `sample-garden.json` lacked the now-required nullable `gardenId`, preventing Notes initialization; fixtures were corrected to `gardenId: null`, without production compatibility code. Five specs now use UUID-scoped accordion locators and explicit expansion when needed, preserving visibility, scrolling, navigation, deletion and persistence checks. Note persistence tests additionally verify untouched fresh creation, first meaningful persistence and UUID route, draft consumption on Save, exact-draft contextual highlighting/resume, and draft removal on confirmed discard. The editor accessibility spec required no changes after fixture correction. Copilot reported focused 16/16, full Playwright 56/56 and diff checks passed; actual commit reviewed, tests not independently rerun. No production changes or defects identified. Full Vitest and production build on the final corrective implementation remain deferred to integration. 8B5 acceptance unchanged.

**Bootstrap 6 Alpha 2 upgrade accepted (November 24, 2026):** The exact dependency pin advanced from `6.0.0-alpha.1` to `6.0.0-alpha.2` in [`4239625`](https://github.com/solacenetwork/solace-garden/commit/42396256e15b84cdb716a8ca747042e0d8456e6b); the developer reported only package.json and package-lock.json changed. Full Vitest **679/679 across 71 files** and production build passed. Initial full Playwright **55/56**; the Standard phone/medium navigation Drawer bounding-box test measured a negative X during opening, reproduced in all three isolated attempts. Test-only correction [`ad02a5c`](https://github.com/solacenetwork/solace-garden/commit/ad02a5ccb914123a2f41202d2019b50de197b01e) polls the computed transform until `none` before measuring the open Drawer, preserving viewport containment, keyboard and focus assertions without fixed sleeps. Developer reported **3/3 repeated focused passes, 56/56 full Playwright (2.2 minutes), and manual acceptance passed**. Actual correction reviewed; commands not independently rerun by the documentation editor. Results support premature transition measurement rather than a confirmed production defect; no production source changes required. Alpha.2 is the accepted development baseline, not a new feature milestone or production-release acceptance. Broader responsive/offline verification and revalidation of CSS tokens/utilities remain in Steps 9 and 10.

**8B7 accepted November 25, 2026.** Implementation [`55b42b1`](https://github.com/solacenetwork/solace-garden/commit/55b42b11fc88dbf45057ef6ddea474e489037f69). Help has provisional Getting Started, Documentation and Support sections; About is wired to its dedicated branded view; Settings uses Automatic, Simple Mode and Standard Mode; Harvest has a nonfunctional contextual placeholder with Back to Gardens. Geographic Locations provides validated Settings/Gardens return references, preserving nested Settings origin through refresh (`ref=settings&settingsRef=notes`, for example); direct or invalid origin returns to Settings. Field-scoped validation, local focus handling and persistence busy guards were added without changing domain/storage rules. Welcome and global route focus remain unchanged. Codex reported focused Vitest **180/180 (11 files)** and full **693/693 (74 files)** before weekly quota exhaustion interrupted its final report; the actual committed implementation was reviewed. Developer confirmed desktop browser and phone manual acceptance passed. Production build and committed diff-check results for this slice were not supplied; Playwright was not reported run after 8B7. Retain these checks for integration; no independent rerun claimed. Nonblocking review notes: confirm About project URL (`solacenetwork.com` versus `solace.network`), Retry control busy-state edge case, and investigate More-menu route-transition focus only if reproduced. No dependency or schema changes. **8B7 closed; next 8B8, then 8B6, then 8B9.**

**8B8 accepted November 25, 2026.** Implementation [`0be9ef5`](https://github.com/solacenetwork/solace-garden/commit/0be9ef5a0cac7de9a2bd22d59e8106060b29863d), merged into main at [`e3c0f82`](https://github.com/solacenetwork/solace-garden/commit/e3c0f8227729b84f420d8277a8693ad1e5eded48). ChatGPT prepared the isolated implementation branch without Codex or Copilot. The dedicated `/search` view accurately states that global Search is not yet available, provides Back to Home, and ignores arbitrary query input. Route metadata and registration were updated; existing responsive navbar Search submission, focus and dismissal behavior remains unchanged. Three new placeholder Vitest tests and strengthened existing HeaderSearch safety assertions cover the interim contract. Developer reported all Vitest tests and all nine manual acceptance checks passed, merged the PR and synchronized the local repository. Exact test count, explicit build output and post-change Playwright/diff-check results were not supplied; retain those checks for integration. No independent test execution claimed. No dependency, storage, schema, global CSS or production navbar component changes. Search engine and query-to-results workflow remain 8M; approved navbar wording, Go button and ordering refinements remain Step 10. **8B8 closed; next 8B6, then 8B9.**

**8B6 accepted November 25, 2026.** Copilot implementation [`2e0c43c`](https://github.com/solacenetwork/solace-garden/commit/2e0c43cd5b8395d7258a4acaba409d6d5a53fd37) and corrective implementation [`65885be`](https://github.com/solacenetwork/solace-garden/commit/65885be8eaf3d105ece7788143b0048ff829b3b5). Tasks and Wish List retain separate routes and shared implementation, with compact outstanding rows and independent default-collapsed Completed/Purchased accordions whose explicit expansion preferences persist locally. Completion/reopening preserves underlying `sortOrder`; drag and accessible up/down ordering are collection-local and reconstruct the complete ID sequence while preserving the other collection's relative order. Quick Add and explicit inline editing remain unchanged in scope. Corrections add per-kind operation guards, route-epoch/unmount checks, SortableJS teardown and DOM restoration, recoverable loading errors, field-specific validation/reveal, visible focus targets and unsuccessful deletion handling. Copilot reported initial focused 14/14 and full 703/703 Vitest, then corrective focused **35/35**, full **722/722 (76 files)**, production build and diff check passed. Developer confirmed all 33 manual acceptance checks passed, including desktop/phone, persistent ordering/preferences and keyboard focus transfer to the collapsed summary and reopened checkbox. Actual commits reviewed; automated tests not independently rerun by documentation editor. Playwright deferred to 8B9. Quantity intentionally remains optional free-form text (e.g. `3 bags`, `10 lbs`, `2 packets`); explain this in future user documentation rather than restrict to numbers. No schema, dependency or stored-record contract changes. Expanded/contextual creation remains a V2 Parking Lot candidate. Nonblocking static review observation: a rapid leave-and-return while an earlier write is pending might temporarily display stale data; investigate if reproduced. **8B6 closed; next 8B9 integrated acceptance.**

**8B9 and umbrella Step 8B accepted November 25, 2026.** Test-only Playwright maintenance [`8310ad4`](https://github.com/solacenetwork/solace-garden/commit/8310ad4b3c921058c99b6bae7f595b852b50bf9f) updated six specs for contextual Locations URLs, completed/purchased accordions, stable record IDs, collection-local ordering, branded About heading and real wheel scrolling below the sticky header from a verified top position. Added established Wizard draft preservation regression coverage. Copilot reported focused 20/20, full 57/57 and diff check passed; actual commit reviewed. Developer independently reran full Playwright **57/57** and Vitest **722/722 (76 files)**, and confirmed production build and HTTPS deployment. Existing desktop Chrome installed PWA updated without uninstalling or clearing storage: initial `registration.update()` rejected with HTTP 401 while directory password protection was enabled; after developer removed it, replacement worker installed and waited, then naturally activated on closing and reopening the PWA (#68 received Nov 23 → #72 received Nov 25). Developer confirmed updated pages and retained existing records; offline Garden creation, Template application, Notes, Tasks, Wish List, Garden associations, draft creation/recovery/continued editing and lifecycle status changes passed. An existing Update available notification was observed briefly; its interactive behavior was not tested and remains for 8S. Build identity/freshness diagnostics remain 8G. Developer chose to leave directory authentication off for alpha testing; treat deployment as publicly accessible and serve only intended public assets. No production defects reproduced by Playwright maintenance. No independent execution by documentation editor. Comprehensive responsive/device/keyboard/PWA matrix remains Step 9; scrollbar stability remains Step 10. **8B closed; subsequent execution reordered to Step 10 before Step 9.**

**Step 10A implementation and manual review (November 25, 2026):** [`a2e5d77`](https://github.com/solacenetwork/solace-garden/commit/a2e5d7747c71131bcd886861fd02076162032fda). Copilot reported focused 136/136, full 726/726 (77 files), production build and diff check passed. Developer independently ran Playwright 57/57 (2.5m). Manual scrollbar and shared header alignment checks passed; remaining checks passed apart from long-title layout and reported visual observations: detail title overlaps actions, oversized card title stretches filmstrip, inherited H1 sizing distorts identity badge, narrow Close action moves left, brief loading flash switching creation forms. Corrective batches in UI_REDESIGN.md; short landscape Standard drawer parked. 10A not closed. No independent automated execution by documentation editor.

**10A and 10A.1 accepted November 25, 2026.** Initial shared PageHeader/workspace implementation [`a2e5d77`](https://github.com/solacenetwork/solace-garden/commit/a2e5d7747c71131bcd886861fd02076162032fda) and corrective implementation [`344f006`](https://github.com/solacenetwork/solace-garden/commit/344f0065a31c5497c3704f72f86f0035961b0118). Root `scrollbar-gutter: stable`, shared 72rem workspace anchor and independent body constraints passed manual acceptance. Corrections provide wrapping nonoverlapping full detail titles, top-aligned leading visuals, isolated badge typography, three-line card title/two-line subtitle clamping with underlying values retained, right-aligned wrapping header actions, accessible responsive Settings Close label and Search leading-icon cleanup. Developer confirmed all remaining manual tests passed, independently ran **726/726 Vitest**, successful production build and **57/57 Playwright (2.6m)** after corrections. Copilot reported diff check passed; no test files changed in corrective commit and no automated suites/build run by Copilot as requested. Actual changes reviewed; documentation editor did not independently run tests. Brief creation-route loading flash investigated as legitimate draft/reference retrieval and left intact; defer further polish to 8T if needed. Short landscape manually selected Standard drawer remains parked. No dependency/storage changes. Copilot reported usage by developer increased from 85% to 88%, leaving 12%. **10A closed; next 10B navigation/dashboard.**

**10B accepted November 25, 2026 (manual acceptance with explicit deferral).** Navigation/dashboard implementation [`d308030`](https://github.com/solacenetwork/solace-garden/commit/d308030cbcb9e812d89f92c23088a5456a59f877) standardized header control order, Search placeholder/Go, responsive Standard navigation controls, Calendar information trigger, and Home Tasks/Wish List preview presentation with scoped stretched links. Developer updated three Vitest assertions in [`29e694a`](https://github.com/solacenetwork/solace-garden/commit/29e694a5f1509331f1256f3b916f8b1816330d55), reported 726/726 Vitest and successful production build. Initial Playwright 55/57; developer corrected tab order assertion and ambiguous drawer close-button locator, then reported focused navigation spec 4/4. Full rerun was started; developer subsequently indicated only manual testing remained, but exact final full-suite output was not supplied. About URL and package version corrected in [`a08002b`](https://github.com/solacenetwork/solace-garden/commit/a08002b87f42d71701127eb28d13518215f2e08e), version 0.0.3-alpha; post-change automated results not separately reported. Developer confirmed manual acceptance including keyboard activation of View all links and About link, with empty Search submission feedback dismissal (whitespace and text submissions do show a clear control) explicitly deferred to 8M (UI-016 in UI_ISSUES.md). Drawer lateral whitespace remains deferred to UI-003. Actual implementation reviewed; no independent automated execution by documentation editor. No dependency or storage-contract changes. Copilot allowance remaining last reported 10%. **10B closed; next 10C Garden UI.**
