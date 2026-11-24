# SOLACE Garden — Milestone History

**Created:** 2026-11-21  
**Updated:** 2026-11-24  
**Purpose:** Durable evidence for accepted milestones, whether or not their monday.com items are currently retained.

## Policy

See the [SOLACE project-management policy](https://github.com/solacenetwork/.github/blob/main/docs/PROJECT_MANAGEMENT.md). The [master roadmap](ROADMAP.md) retains the complete milestone sequence and concise status/scope; [UI_REDESIGN.md](UI_REDESIGN.md) owns the current UI redesign specification. monday.com tracks milestone status and progress.

Records below were transferred from the roadmap **without rewriting acceptance claims**. They may include historical plans, contemporaneous test counts, and dated follow-up observations. Preserve those as historical evidence, not as current instructions. Consult the current [ROADMAP.md](ROADMAP.md), [TECH_SPEC.md](TECH_SPEC.md), [UI_REDESIGN.md](UI_REDESIGN.md) and [TESTING_NOTES.md](TESTING_NOTES.md) for active contracts and latest test results.

Only developer-accepted work belongs here. An acceptance date is recorded only when established in the original record. Don't remove a monday.com item merely because its documentation now lives here. Before a future capacity-driven retirement, preserve any unique monday.com notes, attachments and links.

**Identifier distinction:** `GARDEN-UI-8A4` is part of the post-8F UI redesign and is distinct from `GARDEN-V1-8A` (Storage Foundations). V1 feature work resumes at `GARDEN-V1-8G` after UI Step 10.

## Historical acceptance records


### Early accepted milestones


#### GARDEN-V1-0.5

##### Step 0.5 — Equip Codex with Bootstrap 6 guidance

**Status:** Complete (2026-11-04). Bootstrap 6 remains an alpha dependency; verify against the exact installed package when implementing components.

- [x] Install and review **official Bootstrap agent skills** via `npx skills add twbs/bootstrap` as repository-local guidance in `.agents/skills/`. Commit the skills and `skills-lock.json` so they travel with the project.
- [x] Identify and review the official [Bootstrap llms.txt](https://getbootstrap.com/llms.txt) index, [llms-full.txt](https://getbootstrap.com/llms-full.txt) reference, and [Bootstrap 6 AI guide](https://getbootstrap.com/docs/6.0/getting-started/ai/) for Codex use. Prefer version-matched documentation over Bootstrap 5 examples.
- [x] Add `AGENTS.md` instructions requiring Bootstrap 6 conventions, consultation of the local skills, and validation against the installed `bootstrap@6.0.0-alpha.1` package.
- [x] Verify installed Bootstrap and Bootstrap Icons versions, confirm the Bootstrap CSS/JS imports build with Vite, and inspect the Bootstrap 6 **Drawer** implementation and documentation. Drawer replaces Offcanvas and uses native `<dialog>`; use the `Drawer` API for the future `AppDrawer`.
- [x] Validate the current scaffold with `npm run build` and `npm ls --depth=0` (both passed). A mounted, interactive Preact component smoke test is **not yet done**; complete it during Milestones 2–3 as part of UI/library integration.

**Ongoing maintenance:** Recheck the skills, documentation, and component APIs whenever the pinned Bootstrap 6 version changes (alpha, beta, or stable).

**Completion record:** Official skills, `skills-lock.json`, and `AGENTS.md` were committed in [c850ae8](https://github.com/solacenetwork/solace-garden/commit/c850ae819a01fe6e7edd20167806ff634b74a92e). Initial package checks and Drawer research are complete; actual interactive component testing remains part of the upcoming UI implementation.


#### GARDEN-V1-1

**Accepted:** November 22, 2026 (retrospective developer confirmation of the initial UI choices; not a claim that all design questions were resolved that day).

**Outcome:** Initial implementation-blocking UI choices were settled sufficiently to build and accept the working application shell, including Simple/Standard modes, Automatic mode preference, responsive layout direction, navigation, and reusable UI patterns. This checkpoint is complete; UI decisions remain revisable through subsequent approved design/implementation milestones.

**Evidence:** The accepted and implemented V1 shell, responsive modes, navigation and reusable UI building blocks are recorded under [Milestones 2–7](ROADMAP.md) and their acceptance entries below; continuing UI changes are governed by [UI_REDESIGN.md](UI_REDESIGN.md). The developer confirmed on November 22 that Milestone 1 referred to the initial decision checkpoint and should be marked Done.

**Caveat:** The source plan below contains unchecked questions/deliverables. These remain the *historical initial planning checklist*, **not conditions requiring this completed checkpoint to stay open**, and not independently accepted implementation claims. Subsequent UI milestones own the remaining refinement.

##### Original milestone plan (archived verbatim)

## Milestone 1 — Finalize UI Choices

**Status:** In discussion (not yet complete)  
**Objective:** Establish enough navigation, responsive behavior, primary screens, and interaction patterns to build an initial **working UI mockup/skeleton** before major V1 features. Iterate based on use on real devices; pixel-perfect designs are not a prerequisite.

### 1.1 Decisions already agreed

- **Mobile-first, desktop-complete:** Gardeners will often collect information outside on phones and tablets, then review, organize, and plan on larger screens. Both experiences access the same records and functionality.
- **Two interface presentations:** **Simple Mode** favors fast, touch-friendly data collection (large controls, checkboxes, buttons, camera/photo capture, date pickers, short forms); **Standard Mode** favors full garden management, history, planning, and detailed editing. These are two presentations of the **same application and Dexie data**, not separate apps or business logic.
- **Mode preference has exactly three exclusive choices:** `Automatic` (default), `Simple Mode`, and `Standard Mode`, displayed in Settings as a **single native/Bootstrap radio-button group**; only one option can be selected at once.
- **Automatic selection:** Use responsive viewport/media-query behavior (aligned with Bootstrap breakpoints) to choose Simple Mode on narrower displays and Standard Mode on wider displays. Gardeners can explicitly override the automatic behavior on any screen size. Persist **the selected preference**, not the calculated mode, in local settings (proposed key: `interfaceMode`; values: `auto | simple | standard`).
- **Responsive, not device-restricted:** Simple Mode is not limited to phones; Standard Mode is not limited to desktops. Browser “Show desktop site” may change the viewport, but is not a reliable substitute for an in-app override.
- **Shared behaviors:** Both presentations call the same application services and validation rules to create and update records. The simpler interface is not a second source of truth.
- **Outdoor usability:** Prioritize legibility/contrast in sunlight, touch targets, minimal typing, clear save feedback, accessible controls, and offline workflows. Never rely on hover alone for essential actions.
- **Garden creation UX redesign:** The original Wizard/Quick Start/Advanced flows are being refined through the separate post-8F UI redesign. The dedicated Create a Garden chooser and Quick Start are accepted; see [UI_REDESIGN.md](UI_REDESIGN.md) §7C and Step 8A for the current approved design and remaining work.

### 1.2 UI questions to finalize

- [ ] **Automatic breakpoint:** Test responsive layouts and choose the threshold(s) for switching effective modes; do not assume browser desktop-site mode crosses a particular breakpoint.
- [ ] **Mode switch placement:** Determine how gardeners quickly find/change the preference outside Settings, if desired; define behavior on resize/rotation, including while editing an unsaved form.
- [ ] **Simple Mode scope:** Decide which quick actions are on its home view and which detailed screens remain accessible. Candidates: plant-phase updates, harvest entry, photo capture, task checkoff, calendar entry, and quick notes.
- [x] **Landing experience:** Home (`/`) is the overview dashboard, reached through the SOLACE logo. A fresh installation shows the full-page Welcome route when **Show Welcome at startup** is enabled (default); otherwise normal launch opens Home. Direct/deep links are preserved. See [GOALS.md](GOALS.md) §2.13b and the detailed [UI_REDESIGN.md](UI_REDESIGN.md).
- [ ] **Navigation and core views:** Detailed destinations, navbar/sidebar structure, Simple/Standard presentation, and page-level UI are maintained in the authoritative [UI_REDESIGN.md](UI_REDESIGN.md). Do not maintain a parallel navigation or page-layout decision list here.
- [ ] **Interaction details:** Finalize any cross-page interaction and accessibility requirements in UI_REDESIGN.md and [UI_CONVENTIONS.md](UI_CONVENTIONS.md), including responsive cards, dialogs/forms, save/cancel behavior, empty states, and offline/storage feedback.
- [ ] **Visual language:** Refine colors, typography, icon conventions, spacing, and theme behavior consistently with Bootstrap and UI_CONVENTIONS.md.
- [ ] **Wireframes/prototypes:** Produce and review representative phone/tablet/desktop layouts for the approved shell, Home, Gardens, Welcome, and Garden creation workflows before implementation prompts.

### 1.3 Deliverables / definition of done

- [ ] Written UI decisions and a navigation map covering both modes and responsive behavior.
- [ ] Agreed default/override and radio-group Settings behavior, with selected breakpoint(s).
- [ ] Representative reviewed wireframes or lightweight prototypes for major views and common data-entry tasks.
- [ ] Reusable Preact + Bootstrap component and accessibility conventions, including shared service calls across modes.
- [ ] Remaining open items explicitly deferred so implementation can proceed without repeated UI redesign.

**Scope guard:** This milestone is **planning and UI validation**, not implementation of all features or a commitment to duplicate every screen. The mockup may intentionally change during later slices.

#### GARDEN-V1-2

##### Milestone 2 — UI mockup and application skeleton

**Status:** Complete (2026-11-04); provisional visual design accepted for continued development.

- [x] Build a running Preact + Bootstrap 6 shell with SOLACE Garden branding, provisional header/Home area, primary content region, and a temporary page layout.
- [x] Use representative placeholder content and basic mobile/tablet/desktop styling, without requiring a database or feature implementation.
- [x] Keep mockup styling easy to adjust based on testing; document substantive changes to navigation or mode behavior.

**Completion record:** Implemented in [fdfd878](https://github.com/solacenetwork/solace-garden/commit/fdfd878b1a80b3ad8624318c60508c5aeec0e01b). Repurposed the existing Preact header/home/404 scaffold, retained `preact-iso`, imported Bootstrap Icons, added six Simple Mode action links and placeholder pages, and removed unused demo code. Codex reported a passing production build and browser checks at 375 × 812 and 1440 × 1000. The user also tested the UI on desktop and on a Samsung Galaxy Tab in portrait orientation and accepted the layout for now. Colors and layout remain provisional; further design refinement is deferred.

**Done when:** The app opens as a recognizable Garden UI on a narrow mobile viewport and a desktop, even though feature pages are not functional. **Satisfied.**


#### GARDEN-V1-3

##### Milestone 3 — Library integration and smoke tests

**Status:** Complete (2026-11-04); no scaffold-blocking incompatibilities identified.

- [x] Verify installed library versions and that the selected dependencies compile/load with the Preact/Vite scaffold: Dexie and dexie-react-hooks, FullCalendar/RRule, Tiptap, FilePond and its needed plugins, lightGallery, JSZip, SortableJS, and PWA tooling.
- [x] Run isolated import/render/use smoke tests for potentially difficult integrations and record incompatibilities or limitations without adding production features.
- [x] Preserve a small application bundle and plan route-level or feature-level lazy loading for large libraries; no feature libraries were added to the startup bundle.

**Completion record:** Codex reported successful browser or isolated tests for Dexie CRUD and `useLiveQuery`, FullCalendar 7 rendering and RRule recurrence, vanilla Tiptap editing, FilePond image processing, lightGallery initialization, JSZip round-trip, SortableJS lifecycle, and temporary PWA build generation. `npm ls --depth=0`, `npm run build`, and `git diff --check` passed. Temporary smoke-test files were removed and the working tree was clean. This was a verification-only milestone; no new production code or permanent test suite was committed.

**Integration findings to revisit when implementing the corresponding features:**

- **Preact:** Garden uses Preact 11; FullCalendar 7 includes its own Preact 10 and `dexie-react-hooks` declares a React peer. Tested integrations work; initially use FullCalendar's imperative API within a lifecycle-managed wrapper, and keep Garden storage access behind application services/repositories. FullCalendar + RRule remain the selected V1 calendar libraries after reviewing alternatives.
- **lightGallery:** The open-source GPLv3 distribution is intended to use the project's open-source licensing path. Its default license-key warning still needs an appropriate open-source key/configuration before Gallery release; a simple configurable key can accommodate differently licensed distributions where applicable.
- **PWA:** A temporary `generateSW` build succeeded, but production offline/installability is **not yet enabled or validated**. The Bootstrap Icons font assets require explicit precaching (tested with `woff`/`woff2` patterns); manifest/icons, static-data caching, offline launch, and update behavior remain future acceptance tests.
- **Deferred testing:** Real photos/EXIF and memory use, interactive drag-and-drop and accessible alternatives, large ZIP archives, and mobile/offline stress testing are not covered by these initial smokes.

**Done when:** Relevant imports and basic demonstrations work with no unresolved scaffold-blocking compatibility issues. **Satisfied.** Calendar, Journal, Gallery, and ZIP processing are not implemented by this milestone.


#### GARDEN-V1-4

##### Milestone 4 — Router, route catalog, and Home navigation

**Status:** Complete (2026-11-04). The route infrastructure is shared; full Simple/Standard presentation behavior remains for Milestones 5–6.

- [x] Establish a single route map and placeholder pages for Home, Gardens, Plants/Update Plants, Harvest, Photos/Gallery, Tasks, Calendar, Notes, Journal, Settings, and appropriate supporting sections (Templates, Locations, Search, etc.).
- [x] Make navigation links/buttons lead to their intended placeholders, with working back/forward navigation, meaningful unknown-route fallback, and a Home action/logo available in the interface.
- [x] Share routes and application destinations across Simple and Standard presentations, rather than duplicating pages.

**Completion record:** Implemented in [8167a65](https://github.com/solacenetwork/solace-garden/commit/8167a65370d227293054b2e9033308a5048cbdbe). `src/navigation.js` now defines 13 routes (Home plus six primary and six secondary destinations), with derived navigation groups and catalog-driven placeholders. The six Simple Mode home actions were preserved, and a compact secondary workspace directory makes the remaining routes accessible. Codex reported successful tests of link navigation, Home/logo links, Back/Forward, direct URL loading, refresh, 404 handling, Bootstrap Icon rendering, and responsive layouts; `npm run build` passed. Production hosting will require SPA fallback to `index.html` for refreshed deep links.

**Done when:** All planned top-level destinations are reachable, and Home and browser navigation behave correctly without real garden data. **Satisfied.**


#### GARDEN-V1-5

##### Milestone 5 — Simple Mode layout first

**Status:** Complete (2026-11-05). Implementation: [1505cd6](https://github.com/solacenetwork/solace-garden/commit/1505cd6289992c0e200f42d5d0c96d6dc18eaac1). Browser acceptance testing passed.

- [x] Build the favored six large touch-oriented home actions: Plants/Update Plants, Harvest, Photos, Tasks, Calendar, Notes; route all to placeholder workspaces.
- [x] Implement Automatic / Simple / Standard as one exclusive radio-button preference group, defaulting to Automatic; persist the explicit preference, and test viewport-based selection and overrides.
- [x] Develop the phone-size shell, Home/logo behavior, legible buttons, accessible touch targets, and placeholders for full-screen plant-group editing; keep unsaved-form protections for actual editing slices.
- [x] Ensure Simple Mode works on tablets/desktop when explicitly selected; leave exact breakpoint and final layout tuning open to prototype testing.

**Completion record:** Added a shared Preact interface-mode context, isolated localStorage-backed preference persistence (default `auto`), and a provisional 48rem `matchMedia` breakpoint. Settings provides a three-option radio group; explicit mode selections persist across navigation and reload and are not overridden by viewport changes. Existing routes and six primary actions remain available. The Plants route now has a clearly labeled demonstration-only group selector and a Bootstrap 6 fullscreen-on-small-screens Dialog placeholder, with a Close/Cancel action but no Save or real data. Codex reported successful build and browser smoke tests with cleanup of test processes; user browser acceptance testing also passed.

**Deferred UI observations (not Milestone 5 blockers):** Hide the technical `(max-width: 47.999rem)` media-query text from end-user Settings messaging. For the shared header, use the upper-left SOLACE Garden logo/title as the Home link and an upper-right gear icon as the direct Settings link, removing the redundant Home control. Address these while refining the application shell (Milestone 6). Full Standard Mode and actual plant editing/persistence are separate future work.

**Done when:** The Simple Mode landing screen and its six navigation paths work end to end with placeholders and the user can select the interface mode. **Satisfied.**


#### GARDEN-V1-6

##### Milestone 6 — Standard Mode layout

**Status:** Complete (2026-11-05). Implementation: [80cf317](https://github.com/solacenetwork/solace-garden/commit/80cf317de091028f5370e462dc5821bee64ca5f4). User manual acceptance testing completed.

- [x] Build a desktop-oriented Standard shell with primary navigation and workspace structure, reusing the same routes and future services as Simple Mode.
- [x] Test narrower viewports when Standard Mode is selected manually; don't disable functionality based on display size.
- [x] Prototype contextual information placement without committing to the old Infobox/Infobar design.

**Completion record:** Added catalog-driven grouped Standard sidebar navigation, responsive compact navigation for narrow Standard Mode, a Standard Home workspace overview, and an optional collapsed “About this workspace” description. Simple Mode retains its six home actions, and both presentations share the same route catalog, Router, and page components. The Header now uses the SOLACE Garden brand as the Home link and a direct Settings gear; Settings explains Automatic mode in plain language. The Plants demonstration Dialog received a fix for quick-close requests during its opening transition. The coding assistant reported a successful build and browser checks of routes, mode overrides, responsive layouts, and dialog behavior. The user manually confirmed the main interactions and desktop keyboard navigation.

**Deferred observations (not blockers):** Settings currently requires browser Back or another navigation action to return to the originating workspace; Milestone 7 will add a Close control using validated short route identifiers (e.g. `/settings?ref=plants`), without a general navigation-history store. Native links/buttons do not require explicit `tabindex`; more comprehensive keyboard and mobile device tests remain useful. A wider Samsung tablet landscape check is pending; explicit Standard Mode on narrow phone screens correctly retains the compact layout. Placement/spacing and other UI polish are deferred until real workflows provide stronger requirements.

**Done when:** Both modes have usable navigation and share destinations; switching modes preserves application route state, while Settings return-to-origin is a separate planned navigation enhancement. **Satisfied.**


#### GARDEN-V1-7

##### Milestone 7 — Reusable UI building blocks

**Status:** Complete (2026-11-05). Implementation: [8ef556a](https://github.com/solacenetwork/solace-garden/commit/8ef556aff3ddca901d187551cc198aef75fc4412) (merge commit containing Milestone 7 changes). Manual acceptance completed on phone and desktop.

- [x] Establish focused, reusable conventions for Bootstrap 6 Dialogs, accessible navigation and icon controls, focus management, Close/Cancel, and future Save/dirty-state behavior. Document them in `docs/UI_CONVENTIONS.md` without building speculative components.
- [x] Add validated short route IDs for Settings return navigation (`/settings?ref=plants`, etc.), with a visible Close link and safe Home fallback for missing, invalid, or Settings references. Preserve normal history and mode changes without a navigation-history store.
- [x] Prototype optional `AppDrawer` using Bootstrap 6 Drawer on native `<dialog>` (not Bootstrap 5 Offcanvas). Limit its use to Calendar's secondary-context prototype, with event-driven trigger visibility, safe-area-aware dynamic viewport sizing, focus restoration, and unmount cleanup.
- [x] Document empty/loading/error and Save/dirty-state conventions for future data-backed features. Keep the Simple and Standard presentations on shared routes and components.
- [x] Review implementation and complete manual checks across phone and desktop, including Settings return paths, mode switching, repeated Dialog/Drawer operation, Escape/Close, focus behavior, responsive layout, and navigation away while the Drawer is open.

**Completion record:** Settings return links use stable catalog IDs and resolve unknown or untrusted references to Home. The Calendar-only Drawer prototype uses Bootstrap 6 lifecycle events and disposal; the Plants quick-close behavior was preserved and its installed Bootstrap 6 CSS variables corrected. Codex reported passing build, navigation assertions, and automated browser checks; the implementation was inspected on GitHub and the user subsequently reported all nine manual acceptance checks passing across phone and desktop.

**Deferred / observation:** One intermittent flicker on mobile Home/Settings was reported, but subsequent phone testing could not reproduce it; **resolved for now — unable to reproduce**, revisit if it returns. Camera/photo selectors, real date controls, search/filter controls, Journal components, shared feedback components, and data-backed Save/dirty guards remain deferred until their concrete feature milestones. Reassess Drawer sizing and placement with real content.

**Done when:** Current reusable patterns are implemented and documented, with the Settings-return flow and optional Drawer manually validated; feature-specific controls remain intentionally deferred. **Satisfied.**


### 8A–8D foundations

#### GARDEN-V1-8A

**8A verification and completion (November 5, 2026):** Two implementation parts plus focused corrections established the offline control/data bootstrap, native non-creating existence checks, non-destructive missing-control recovery, six-store schema, active-database connection lifecycle, a minimal Notes repository, shared validation/error conventions and Notes-only atomic transactions. Codex reported **24 Vitest tests passing**, successful `npm run build` and `git diff --check` after the final correction in [commit `3e1d20d`](https://github.com/solacenetwork/solace-garden/commit/3e1d20ddab1fc2f7d9e90efcf68c8bdbacdd799f). The reviewer inspected committed code; these command results were not independently rerun. Manual browser checks confirmed fresh initialization, unchanged pointer on reload, six stores, normal navigation, orphaned-data protection after deletion of `solace-config`, and recreation of both databases after clearing the disposable IndexedDB state. A transient-error Retry-button round-trip and broader cross-browser/storage-restriction scenarios remain follow-up regression coverage rather than 8A acceptance blockers. **8A accepted.**

#### GARDEN-V1-8B

**8B / 8A2 acceptance (November 6, 2026):** The Notes implementation includes plain-text create/edit/delete, persistent recoverable drafts in a separate Dexie store, bookmarkable Note and new-draft URLs, explicit authoritative Save, draft restoration, Discard and normal browser Back/Forward navigation without a custom history guard. Draft recovery was implemented in [commit `ab3f3c2`](https://github.com/solacenetwork/solace-garden/commit/ab3f3c2756f5753b9698f6f21bca570468f9e108). Codex reported 46 passing automated tests plus successful build and diff checks. The user passed seven of eight draft-recovery browser acceptance scenarios on November 6 (including navigation, reload, Save, multiple drafts, Discard, immediate navigation and browser restart). The V1→V2 IndexedDB migration is covered by an automated test; manual migration verification is deferred. Garden association/link-unlink integration remains to be verified when Gardens are implemented in 8E; this does not reopen 8B. **8B accepted; proceed to 8C.**

#### GARDEN-V1-8C

**8C acceptance (November 6, 2026):** Tasks and Wish List were implemented with shared Preact list UI, independent persistent items, editing, completion/purchased status, deletion, ordering by drag-and-drop and keyboard-accessible Move Up/Down controls, and Wish List quantity/notes/URL validation. During manual testing, two bugs and one UX issue were corrected: controlled checkbox state on uncheck ([commit `58f66b4`](https://github.com/solacenetwork/solace-garden/commit/58f66b4e7f17a2d78fdc5f4e8bcddff0bfd01ab1)), browser form-history suggestions ([commit `1a22c13`](https://github.com/solacenetwork/solace-garden/commit/1a22c13a0b7874b8a85b88d2e3be863e07cfc859)), and incomplete public product URL acceptance ([commit `7743214`](https://github.com/solacenetwork/solace-garden/commit/7743214132c4e7cf6fb702b713578d6d1f698b70)). Codex reported **66 automated tests passing** and successful production build after the URL fix; GitHub diffs were reviewed. The gardener confirmed **all 11 manual acceptance tests passed**, including an installed PWA operating offline with Tasks, Wish List, Notes and recoverable drafts after reload. For deliberate reorder-failure testing, a temporary exception was injected into the Dexie repository; both Tasks and Wish List showed an error, restored the original display order, and retained that order after refresh. The temporary injection was removed and normal reordering retested; this is based on user manual verification, not an automated browser assertion. **8C accepted; proceed to 8D.**

#### GARDEN-V1-8D1

**8D1 acceptance (November 6, 2026):** Geographic Locations implemented in [commit `36cac84`](https://github.com/solacenetwork/solace-garden/commit/36cac849bf8006a990faf8a4bdff86269fa28a9c): stable protected Default Location seeded idempotently at startup, editable names and manual USDA hardiness zones, custom Location CRUD, transactional deletion protection for any Garden reference (including archived/closed Gardens), Settings navigation, and responsive Locations UI. No IndexedDB schema version or store changes. Codex reported **76 automated tests passing across nine files**, successful `npm run build`, and clean `git diff --check`; committed changes were inspected on GitHub. The gardener independently confirmed **all 10 manual browser acceptance checks passed**, including default persistence after reload, editing and zone normalization/clearing/validation, custom creation/deletion and confirmation, protected Default, responsive Simple/Standard navigation, and offline PWA persistence. Referenced-Location deletion is covered by automated tests using Garden records; its normal UI workflow is deferred to 8E when Garden CRUD exists. **8D1 accepted; 8D remains open pending 8D2 Garden Types.**

#### GARDEN-V1-8D2

**8D2 acceptance (November 7, 2026):** Garden Types implemented in [commit `d952bce`](https://github.com/solacenetwork/solace-garden/commit/d952bce609ec8740b5cb9a62093518b76976c8f1): eight fixed definitions with stable IDs, ordered and idempotent Dexie seeding, validation and non-destructive recovery, read-only repository/service interfaces, selection validation, and an accessible, controlled Preact checkbox-grid selector. A Vite-only development preview was provided; Codex reported verifying it is excluded from production. Codex reported **88 automated tests passing across 11 files**, successful `npm run build` and `git diff --check`; the committed changes were reviewed on GitHub. The gardener confirmed **all 10 manual acceptance tests passed**, covering eight definitions and order, zero/multiple selection and deselection, state labels, keyboard operation, disabled behavior, responsive layouts and reload/regression checks. Selection state in the preview is intentionally transient; actual Garden `typeIds` persistence is deferred to 8E. **8D2 accepted; with 8D1 already accepted, Milestone 8D is complete. Proceed to 8E Gardens.**

### 8E Gardens


#### GARDEN-V1-8E1

**8E1 focused acceptance (November 7, 2026):** Garden data foundation implemented in [commit `0a143ee`](https://github.com/solacenetwork/solace-garden/commit/0a143ee4bb92ae76218096509bd55799fc2eaf3c). Adds storage-neutral Garden create/list/get/update, normalization and nullable defaults, independent UUID identities even for duplicate name/subtitle labels, calendar-date validation, transactional Location/Garden Type references, safe record copies, and prevention of ordinary edits to closed/archived Gardens. No deletion or lifecycle mutation APIs, UI, or schema version changes were introduced. Codex reported **124 passing automated tests**, a successful production/PWA build, and clean `git diff --check`; reviewer inspected the committed source and tests but did not independently rerun commands. **8E1 accepted by focused code review and automated-test evidence, without a temporary browser UI.** Subsequent UI integration and complete end-to-end Garden acceptance remain scheduled for 8E2–8E8; umbrella 8E remains open.


#### GARDEN-V1-8E2

**8E2 focused acceptance (November 7, 2026):** Implemented in [commit `39edbd0`](https://github.com/solacenetwork/solace-garden/commit/39edbd0259f78da9d66b2e88219b4ddb72062706): read-only Current/Previous Gardens overview, UUID-based bookmarkable detail routes, saved Location and Garden Type labels, and loading/retry/empty/not-found states. A separately invoked Vite-development-only sample helper provides disposable Planned, Active, Completed and Archived records without production seeding. Codex reported **136 passing automated tests**, successful production/PWA build and clean `git diff --check`; the committed changes were reviewed on GitHub but the commands were not independently rerun. The gardener manually confirmed **all four focused browser acceptance checks passed**, covering status-grouped overview, separate details for duplicate-named Gardens, detail reload and browser navigation across interface modes, and missing/empty states. **8E2 accepted; proceed to 8E3 Quick Start.** Overall 8E remains open until integrated acceptance at 8E8.


#### GARDEN-V1-8E3

**8E3 focused acceptance (November 7, 2026):** Implemented in [commit `3260ba0`](https://github.com/solacenetwork/solace-garden/commit/3260ba0f6f16dd87d38d8b28ebb469e5302b5bb5): accessible responsive Quick Start at `/gardens/new`, visible Create Garden entry on the overview, validated name-only creation with the protected Default Location ID and `in-ground` type, prevention of simultaneous duplicate submissions, recoverable save-error UI, and navigation to the new UUID detail page. Codex reported **143 passing automated tests across 15 files**, successful production/PWA build, and clean `git diff --check`; committed source was reviewed on GitHub but commands were not independently rerun. The gardener confirmed **all four focused manual browser checks passed**: create and view defaults, duplicate names with distinct UUIDs, blank-name validation/cancellation, and persistence/reload/direct `/gardens/new` navigation. **8E3 accepted; proceed to 8E4 Wizard and Advanced creation.** Umbrella 8E remains open until 8E8 integrated acceptance.


#### GARDEN-V1-8E4

**8E4 focused acceptance (November 7, 2026):** Implemented in [commit `e1e7ae8`](https://github.com/solacenetwork/solace-garden/commit/e1e7ae8b2a1b27c29a75d54c3674516eb1c44918): Wizard and Advanced Garden creation use the same UUID-addressable recoverable structured `kind: 'garden'` draft in the existing Dexie `drafts` store; creation supports responsive Bootstrap 6 Stepper, mode switching without field loss, multiple drafts, resume after browser restart, selective confirmed discard, strict Note/Garden draft-kind isolation, unchanged draft-free Quick Start, and atomic Garden creation with specific-draft consumption. Update-only draft autosaves prevent recreating consumed drafts. No store/schema/version changes. Codex reported **159 automated tests passing across 17 files**, successful production/PWA build, and clean `git diff --check`; committed source and tests were reviewed on GitHub, but the commands were not independently rerun. **The gardener confirmed all six focused browser acceptance tests passed:** Wizard creation; Wizard/Advanced switching; restart/recovery; independent drafts and targeted discard; validation plus Advanced creation; Note draft and Quick Start regressions. The gardener also noted confusing UI details; these are deferred to the **post-8F UI Tweaks pass**, not treated as failures of 8E4's agreed functional criteria. The modular, smaller-screen Wizard redesign remains a design candidate in `PARKING_LOT.md`; its V1 entry-point, step, validation, and resume questions are consolidated in [UI_REDESIGN.md](UI_REDESIGN.md) §7C. **8E4 accepted; proceed to 8E5 Garden editing and embedded Garden Notes.** Umbrella 8E remains open until integrated 8E8 acceptance.


#### GARDEN-V1-8E5

**8E5 focused acceptance (November 7, 2026):** Implemented Garden editing and embedded Notes in [commit `a499d5a`](https://github.com/solacenetwork/solace-garden/commit/a499d5ac96d60c409937115eb59ab3107630f616), followed by **8E5.1** reusable presentational `CharacterCounter` ([`0daf66f`](https://github.com/solacenetwork/solace-garden/commit/0daf66f0b1d138728711df57225847c89ba5e1ae)) and **8E5.2** Garden Notes integration with native HTML `maxlength=1000` ([`a1905ba`](https://github.com/solacenetwork/solace-garden/commit/a1905ba11f46de75ac1728df7d3b62df2e00c438)). Editable Gardens support UUID-based edit navigation, explicit Save/Cancel, validated Location/types/dates, nullable embedded Garden Notes independent of standalone/Linked Notes, accessible character counts, read-only safeguards, and no schema changes. Codex reported **178 automated tests passing across 19 files**, successful production/PWA build, and clean `git diff --check` after the final follow-up; committed code/diffs were reviewed, but commands were not independently rerun. **The gardener confirmed all seven focused manual browser checks passed** (field edits/persistence; native character limit; clearing Notes; Locations and Garden Types; validation/Cancel; read-only handling where testable; creation/Notes regressions). A long Garden name exposed uneven card heights; the possible ~200-character name limit and two-line card truncation are **open design questions** in [UI_REDESIGN.md](UI_REDESIGN.md) §7B, with supporting detail retained in `PARKING_LOT.md`; this was not an 8E5 blocker. **8E5 accepted; proceed to 8E6 lifecycle.** Overall 8E remains open pending 8E6, 8E7 and 8E8 integrated acceptance.


#### GARDEN-V1-8E6

**8E6 focused acceptance (November 7, 2026):** Implemented in [commit `cf25723`](https://github.com/solacenetwork/solace-garden/commit/cf257230626953abee811c5ac37067e5d35cd73b): explicit atomic lifecycle service/repository operations for manual Planned/Active/Completed/Archived status changes, Close/Reopen, Archive/Unarchive, optional Complete and Close with embedded Garden Notes, stale-state/duplicate-submit guards, read-only protections, and responsive Bootstrap 6 confirmation dialogs. Codex reported **188 automated tests passing across 20 files**, successful production/PWA build, and clean `git diff --check`; the committed source and tests were reviewed, but the commands were not independently rerun. **The gardener confirmed all seven focused browser acceptance checks passed:** Planned → Active; Active → Completed remaining editable; Complete and Close; Close/Reopen; Archive/Unarchive; dialog cancellation and Notes length; reload, classification, and basic regressions. **Known UI awkwardness remains** in how the lifecycle controls and workflows are presented. Their functionality is accepted, but UX/layout refinements are deliberately deferred for the **post-8F UI Tweaks pass**; specific design changes have not yet been chosen. **8E6 accepted; proceed to 8E7 Associations and Permanent Deletion.** Umbrella 8E remains open through 8E8 integrated acceptance.


#### GARDEN-V1-8E7

**8E7 focused acceptance (November 8, 2026):** Implemented in [commit `40d3254`](https://github.com/solacenetwork/solace-garden/commit/40d32540deb27b479deba8293d037032d62c4e41): a reusable UUID-based Garden association selector with distinguishing labels; Note, Task, and Wish List link/change/unlink workflows; associated independent-item sections on Garden detail; confirmed permanent Garden deletion that atomically clears `gardenId` on dependent-independent records without deleting them. Existing Garden reference validation and association writes were brought inside matching transactions to prevent races with deletion. Codex reported **199 automated tests passing across 21 files**, a successful production/PWA build, clean `git diff --check`, and a clean working tree; committed changes were reviewed, but tests/build were not independently rerun. **The gardener confirmed all eight focused browser acceptance checks passed**, covering linked Note creation and persistence, moving/unlinking Notes, draft behavior, Task/Wish List associations, Garden-detail displays, lifecycle preservation, confirmed deletion/cancellation with independent record preservation, and unrelated Garden/Location integrity. A linked-Note indicator/popover enhancement remains an open UI refinement in [UI_REDESIGN.md](UI_REDESIGN.md) §7D, with supporting observation detail in `PARKING_LOT.md`; it does not block functional acceptance. **8E7 accepted; proceed to 8E8 integrated Garden acceptance.** Umbrella 8E remains open until 8E8 passes.


#### GARDEN-V1-8E8

**8E8 integrated acceptance (November 8, 2026):** The gardener reported **all integrated acceptance checklist items passed**. After building and uploading the application to the HTTPS production server, the gardener performed a **fresh PWA installation** and completed the end-to-end acceptance covering Garden creation (Quick Start, Wizard, Advanced, drafts), editing, lifecycle actions, associations and permanent deletion, Simple/Standard navigation and responsive use, reload/restart and installed offline PWA behavior, and regressions for Notes, Tasks, Wish List, Locations and Garden Types. This records the gardener's manual test report; these tests were not independently rerun by the reviewer. Deferred navigation/page-type, Garden hub, Wizard, and other UX refinements were carried into the post-8F design process. Their current decisions and open questions are consolidated in [UI_REDESIGN.md](UI_REDESIGN.md); future alternatives remain in `PARKING_LOT.md`. These do not reopen 8E. **8E8 accepted; umbrella Milestone 8E complete. Proceed to 8F Garden Templates.**


### 8F Garden Templates


#### GARDEN-V1-8F1

**8F1 focused acceptance (November 8, 2026):** Implemented in [commit `b7a7246`](https://github.com/solacenetwork/solace-garden/commit/b7a7246f2f616c11c57e1ae34917a5cfa2e3e224): storage-neutral Garden Template service and Dexie repository, creation of independent named snapshots from existing Gardens (including closed/archived), list/get, immutable configuration resolution with Default Location fallback metadata, and permanent Template removal. Template configuration copies only agreed reusable fields; source Garden and dependent records are unaffected. Repository code and focused tests were inspected on GitHub. Codex reported **213 passing automated tests across 22 files**, successful production/PWA build, clean `git diff --check`, and clean working tree; these commands were not independently rerun by the reviewer. No new schema version, dependencies, UI, or planning changes in the implementation. **8F1 accepted by focused code review and automated-test evidence, without a temporary UI.** Integration follow-up for 8F3: ensure a custom Location deleted after initial Template resolution falls back to Default at final creation rather than silently retaining a stale reference; existing Garden create validation currently rejects stale Location IDs correctly. **Proceed to 8F2 Template management UI.** Umbrella 8F remains open until 8F4 integrated acceptance.


#### GARDEN-V1-8F2

**8F2 focused acceptance (November 8, 2026):** Implemented in [commit `3698990`](https://github.com/solacenetwork/solace-garden/commit/36989907c97743dcc7999c87d51bd3056b0f9d5a). Code review covered Garden detail Save as Template, `/templates` management, Bootstrap 6 dialogs, route registration, missing-Location display, and tests. Codex reported **228 passing tests across 24 files**, successful production/PWA build, `git diff --check`, and clean working tree; these commands were not independently rerun by the reviewer. **All eight gardener-reported browser acceptance checks passed**, including save, view, persistence after reload, duplicate names, canceled and confirmed deletion, Closed/Archived source Gardens, and dialog/focus/layout checks on phone and desktop. The Template UUID is currently visible in management cards; this is acceptable during development. Its post-8F presentation refinement is tracked in the authoritative [UI_REDESIGN.md](UI_REDESIGN.md) §7D (keep IDs available on demand for advanced users/troubleshooting). **8F2 accepted; proceed to 8F3.** Umbrella 8F remains open through 8F4.


#### GARDEN-V1-8F3

**8F3 focused acceptance (November 9, 2026):** Implemented Create Garden from Template in [commit `d0973d3`](https://github.com/solacenetwork/solace-garden/commit/d0973d3eeb40bd93f12e000904c6cd95b1c7e3bd), with follow-up fixes for durable selected Template/editor metadata and draft recovery ([`79eb7d0`](https://github.com/solacenetwork/solace-garden/commit/79eb7d09cbc0fca4bd38edda6a87925ad815fc70)), mandatory current alpha Garden draft metadata without legacy normalization ([`a605ee6`](https://github.com/solacenetwork/solace-garden/commit/a605ee69a2071057ec83298ac36cac7a86e050f6)), and Wizard progression with an already-applied or deleted source Template without reapplying/overwriting edits ([`3ee22f0`](https://github.com/solacenetwork/solace-garden/commit/3ee22f06727536d2d84c6dbb43ee361b4535fe31)). Committed source and focused tests were reviewed through GitHub; Codex reported **254 passing automated tests across 26 files**, successful production/PWA build, and clean `git diff --check` at the final correction; these commands were not independently rerun by the reviewer. **The gardener confirmed all focused 8F3 browser acceptance scenarios passed**, including Wizard/Advanced application, overwrite cancellation, recovering edited drafts and applied Template selection, last-used editor persistence, scratch selection retaining fields, deleted Template handling, Location fallback/safeguards, and creating an independent Planned Garden while removing its consumed draft. **All four targeted browser retests after the final Wizard correction also passed.** The distinction between merely selecting a Template and applying it is intentional: unapplied selections are not persisted. Draft-only metadata is excluded from finished Gardens, and no IndexedDB store/index change or alpha migration was needed. **8F3 accepted; proceed to 8F4 integrated acceptance.** Umbrella 8F remains open through 8F4; comprehensive UI/UX restructuring stays deferred until after 8F.


#### GARDEN-V1-8F4

**8F4 integrated acceptance (November 9, 2026):** The gardener reported **all nine integrated checks passed**, covering saving Templates from existing Gardens; applying edited Template configurations to independent Planned Gardens; repeat reuse; unfinished draft recovery across reload and Wizard/Advanced; deletion safety; custom Location deletion rules and Default Location substitution with an explanatory notice; Simple/Standard mode use on different devices; updated installed/offline PWA behavior; and Quick Start, scratch creation and related feature regressions. These are gardener-reported manual results, not independently rerun browser tests. The gardener also identified **post-8F UI Review** items that do not block functional acceptance: clearer distinction/discoverability of Save as Template on an existing Garden versus Apply Template during creation; hide Template-related wording/controls when no Templates exist while preserving deleted-source notices, with Template UI encapsulated in `GardenTemplateSelection`; on `/templates`, display the effective, possibly renamed Default Location when the saved Location is unavailable, accompanied by a Help FAQ explaining fallback (without silently changing the Template snapshot). **8F4 accepted; umbrella Milestone 8F complete. Proceed to the comprehensive UI/UX Review, then 8G build identification and PWA freshness check.**


### UI redesign history


#### GARDEN-UI-HISTORICAL-CHECKPOINT

##### Post-8F UI redesign checkpoint (historical November 15 report; current status above)

**Historical acceptance:** Steps 1–5 and 4.5A/B were accepted by November 15. Step 5 Home dashboard was implemented in `881d125` (Codex reported 446 passing tests and successful build); the gardener reported desktop/device acceptance. **Subsequent progress supersedes this snapshot:** Steps 6A–6D, 6.5, 6.6, 7 and 8A1–8A5 have since been accepted, while 8A6 onward remains pending. Refer to [UI_REDESIGN.md](UI_REDESIGN.md) for the authoritative current step status.

**Local browser-testing checkpoint, Step 5.5 — accepted November 16, 2026:** The original Playwright `1.65.1` harness, synthetic IndexedDB fixture and isolated-browser tests were accepted; the developer reported **57/57 passing in 49.6 seconds** on `oakisland` at that time. This is a **historical baseline**, not the current suite count or a claim that later tests pass. Subsequent viewport consolidation, Garden Identity tests and November 21 Quick Start coverage are recorded in [TESTING_NOTES.md](TESTING_NOTES.md). The Garden collection focus regression was fixed in [commit `b0384f2`](https://github.com/solacenetwork/solace-garden/commit/b0384f265a4cd1d714536b972d75d1db28e5af0c); Copilot subsequently reported **45/45 passing** in the November 22 full Playwright run (see [TESTING_NOTES.md](TESTING_NOTES.md)). GitHub Actions remains deferred.

**Step 6.5 — Garden visual identity (historical plan, accepted November 19, 2026):** After Step 6 Gardens Hub acceptance and before Step 7 Wizard redesign, implement a reusable circular Garden identity badge: the selected Garden color forms the outer ring and the selected icon appears in a contrasting center. Add optional icon/color selection and validated persistence using the existing `icon` and `color` Garden record fields; expose the controls in the existing Garden editor and make them reusable by Step 7 Wizard/Advanced flows. Use sensible neutral defaults when no personalization exists. Keep record identity distinct from the Draft-versus-saved editing-state styling; avoid relying on color alone. Scope excludes new Gallery/media infrastructure, thumbnail assignment, and the Step 10 app-wide button palette. **Acceptance:** verify create/edit persistence after reload, distinct identifiers for Gardens with duplicate names, card and compact-list display, keyboard/accessibility, Simple/Standard modes, and regression safety. Follow the alpha data policy: a record-property change alone does not mandate a Dexie store/index version bump.


#### GARDEN-UI-7

**Step 7 accepted:** The normal `/welcome` route, four-slide informational photo carousel, explicit Show Welcome at startup preference (enabled by default), direct/deep-link preservation, Skip / Go to Gardens, Help revisit and offline/mobile behavior were manually accepted. These controls **do not** set a one-time `welcomeSeen` flag. The approved/current behavior and original acceptance evidence are documented in [UI_REDESIGN.md](UI_REDESIGN.md), Step 7; see [GOALS.md](GOALS.md) §2.13b for product intent.


#### GARDEN-UI-8A4

**Accepted:** November 22, 2026 — gardener confirmation following desktop browser and phone testing.

**Outcome:** Five-step Garden Wizard navigation accepted, with production-owned strictly validated step definition (Identity, Details, Garden Type, Dates, Additional Options), headless reusable stable-ID resolution/adjacency, Garden-specific `?step=` URL/history handling, persisted `currentStepId` for draft resume, invalid-step recovery, and visible invalid-production-configuration failure. Existing Template selection and Advanced Form were preserved; all existing Garden fields deliberately remain together pending 8A5. No new IndexedDB stores/indexes, alpha-data compatibility migrations, sixth Review step, or generic Wizard Engine were introduced.

**Implementation:** [`2c01b88`](https://github.com/solacenetwork/solace-garden/commit/2c01b8834e14b559d92307a42acdfc37e2e270cb). Targeted correction for an eager current-step reference mutation before persistence success, with failed-write regression: [`1ed9da3`](https://github.com/solacenetwork/solace-garden/commit/1ed9da3b2658778043205c3ce96175bc5729552c). Playwright test fixture correction to require `currentStepId: null` on Advanced drafts: [`abe05a3`](https://github.com/solacenetwork/solace-garden/commit/abe05a3b832b6cf10fc2fec1dc9ceaf90416b162).

**Verification (reported, not independently executed by reviewer):** Codex reported **585/585 Vitest passing across 62 files**, successful production PWA build and `git diff --check` for implementation; focused follow-up reported **16/16 passing** for the Garden editor test file. The first full Playwright run yielded 39 passing and six failures due to obsolete alpha Garden draft fixtures; Copilot updated four fixture records (no production changes), then reported **6/6 previously failing cases and 45/45 full Playwright E2E tests passing**, with `git diff --check`. The gardener separately confirmed successful desktop browser and phone acceptance, including stepper navigation and browser Back/Forward buttons.

**Remaining work:** Step-specific field organization and validation/finalization belong to **8A5**; Template entry/prefill cleanup belongs to **8A6**. This acceptance does not complete the broader UI redesign.


#### GARDEN-UI-8A5

**Accepted:** November 23, 2026 — gardener confirmation after desktop and Vivaldi Mobile acceptance tests.

**Outcome:** Garden-specific five-step form registry with Identity, Details, Garden Type, Dates and Additional Options; active-step Continue validation with focus, validation-free Back, whole-Garden validation that returns to invalid earlier steps, durable icon/color/status/Save-as-Template draft fields, and final creation directly to Garden detail. Optional Save as Template opens an editable Template-name dialog before creation, with cancellation leaving the draft and no Garden/Template created; successful confirmation creates Garden, independent Template snapshot, and removes draft in one IndexedDB transaction. Existing Quick Start, Advanced, and Template application remain operational. Template selection UI within Wizard/Advanced intentionally remains until 8A6.

**Code/verification evidence:** Implementation [`91a2853`](https://github.com/solacenetwork/solace-garden/commit/91a2853af6ff654d1d5766331a77cf17066dc2cf) and technical contract update in `TECH_SPEC.md`; fixture/validator test update [`2308a41`](https://github.com/solacenetwork/solace-garden/commit/2308a41ca2485b14a9cf6f4895720b6ab7db6188); new isolated-context four-test browser spec [`504eea5`](https://github.com/solacenetwork/solace-garden/commit/504eea578cfa3fa384f0d4adf25ca870ca48a55d). Codex reported **82/82 focused, 601/601 full Vitest, production PWA build and diff check passing**. Copilot reported fixture-contract Vitest **19/19** and **4/4 focused Wizard Playwright** plus **49/49 full Playwright** passing after a transient smoke-test timeout was cleared by isolated and full-suite reruns. These test commands were reported by the developer and agents, not independently executed by the document editor. Existing unit tests cover atomic rollback and draft retention on failure.

**Manual acceptance:** The gardener confirmed the desktop checklist and phone checks passed, including field layout/touch interaction, validation, local draft reload/recovery, icon/color/status/options persistence, template-name dialog cancel/confirm, and browser Back/Forward retaining correct step and draft data. A phone storage-control issue (`CONTROL_DATABASE_MISSING` after clearing browsing history but not all site storage) was resolved by clearing Vivaldi's site data; it did not remain an 8A5 blocker.

**Deferred usability observation (Step 10 item 18):** Vivaldi Mobile browser Back/Forward restores the correct Wizard step and data but scrolls to the page bottom and highlights/focuses Continue; gardener must manually scroll up to inspect the stepper. Investigate vertical scroll/focus restoration while preserving keyboard focus, intentional scrolling, horizontal stepper behavior and reduced motion. This does not block 8A5 acceptance.

**Remaining UI redesign:** 8A7 Advanced refinement, 8A8 integrated tests, 8A9 final acceptance, subsequent 8B and Step 9/10. 8A5 acceptance does not complete the redesign.


#### GARDEN-UI-8A6 — Template entry and one-time prefill

**8A6 acceptance (November 23, 2026):** The gardener accepted desktop and phone workflows for scratch and Template-prefilled Wizard/Advanced creation, edited-draft reload, and the Gardens → Templates breadcrumb. Implementation: routing tests [`74d65fc`](https://github.com/solacenetwork/solace-garden/commit/74d65fcfabe48592885b79cbc6beedbc4d4d50bc), atomic initial prefill [`959220d`](https://github.com/solacenetwork/solace-garden/commit/959220d53933591e3f7b71d6375b8d00e3ce7ed1), editor cleanup/breadcrumb [`526ae30`](https://github.com/solacenetwork/solace-garden/commit/526ae301767c74e5d04cc8d12e1c34c0dd79f880), and updated E2E selectors [`584a9a9`](https://github.com/solacenetwork/solace-garden/commit/584a9a95211df2f562e7e17e705607360e92759d). Codex reported focused Vitest 43/43 (B) and 37/37 (C); Copilot reported full Playwright 49/49; developer confirmed `npm run build` succeeded. **Next: 8A7** Advanced form grouping and hiding editor switching (preserving underlying draft/mode functionality).

#### GARDEN-UI-8A8 — Integrated Playwright regression coverage

**Accepted November 23, 2026.** The developer accepted the Copilot-authored Playwright tests and corrections, including follow-up coverage:

- [`275dc47`](https://github.com/solacenetwork/solace-garden/commit/275dc47148ab6d03168c75863851d2be562fbfbb): new `tests/e2e/gardens/advanced-creation.spec.mjs` verifying Advanced Completed and Archived/Locked record creation and IndexedDB persistence, Advanced draft reload/resume, Save as Template cancel/confirm with Garden/Template records and draft consumption, Wizard/Advanced status isolation and absence of mode-switching controls. Updated the Gardens Hub synthetic draft to include required `isClosed: false` and aligned Template selectors with the `Geographic Location` label. No production-code changes.
- [`8514628`](https://github.com/solacenetwork/solace-garden/commit/85146289db67703258c492f14bccae1fbdf48e24): added explicit Active + Locked creation/persistence and simultaneous five-section Advanced heading order. No production-code changes.

**Reported verification:** Initial focused Advanced/Template **8/8** and Gardens Hub **3/3** passed; initial full Playwright **53/54** with unrelated navigation browser-context teardown timeout passing on isolated rerun. After follow-up, focused Advanced **7/7** passed; full Playwright **55/56** with unrelated short-desktop viewport-scrolling failure passing on isolated rerun. `git diff --check` passed in both assignments. These results support acceptance of the changes but **do not constitute a clean full-suite run**; retain possible intermittent test behavior as a testing observation. No confirmed application regression was reported.

**Final 8A8 stabilization and closure (November 23, 2026):** Copilot's [`f567cfd`](https://github.com/solacenetwork/solace-garden/commit/f567cfdd5687565acf1b3bc7e8c02358375031c8) updated the Garden Identity Playwright test to wait for observable dialog-hidden state instead of the Bootstrap `hidden.bs.dialog` event, and added editor-readiness and persisted IndexedDB identity assertions after reload. Copilot reported a **56/56 full-suite pass**. The developer then independently ran the entire Playwright suite with competing workloads stopped and confirmed **56/56 passed**. The developer noted older/slower hardware and two concurrent Vite servers during earlier intermittent failures; resource contention is plausible, not a proven root cause. No production regression confirmed. **8A8 is fully accepted and closed.**

**Boundary:** This closes **8A8 automated regression testing**, not 8A9 final real-device/manual acceptance, production build or full Step 8A completion. 8A9 is next; 8B and Steps 9–10 follow. The source-code slices 8A7-A/B/C were reviewed separately.

#### GARDEN-UI-8A9 — Final Garden creation acceptance

**Accepted November 23, 2026.** The developer reported that the production build completed successfully, deployed the build to the production-like test server [`garden.solace.network`](https://garden.solace.network), and passed **desktop browser**, **Galaxy S22**, and **installed-PWA** manual acceptance; no blocking behavior was observed. This follows the accepted 8A8 clean **56/56 Playwright** verification and 8A7 implementation reviews. The developer captured additional screenshots and notes for later UI review; their details are not yet triaged and should not be invented here.

**Outcome:** **8A9 accepted; entire Step 8A Garden creation redesign (8A1–8A9) closed.** Remaining post-8F UI work: Step 8B, Step 9, Step 10. Original feature milestone 8G is not yet complete.

#### GARDEN-UI-8B1 — Garden Draft Persistence and Creation Lifecycle

**8B1 accepted November 24, 2026.** Implementation [`c5f2006`](https://github.com/solacenetwork/solace-garden/commit/c5f200635485659fa9624a2f3df47ec3f41e9d64); corrective implementation [`5e9d0c5`](https://github.com/solacenetwork/solace-garden/commit/5e9d0c502d9904d1ab2fae98a696b25a5cd41a90). Quick Start now participates in shared Garden draft persistence and atomic consumption; all three editors establish drafts only after meaningful data changes (including explicit Template application). First-save URL replacement preserves the mounted editor; failed autosaves retain the latest snapshot for retry and failed discard leaves persistence usable. Developer confirmed all corrective and remaining functional manual checks passed, including reduced-height desktop and Galaxy S22 editing continuity, explicit resume, fresh flows, Template workflows and draft management. Codex reported 628/628 full Vitest (65 files), 88/88 focused (8 files), successful production PWA build and diff check; no Playwright run or changes in this slice. Test commands were not independently rerun by the documentation editor. Abrupt termination can recover only committed autosaves. No alpha migration or schema version change. **Next: 8B2.**

## Future archive entries

When additional milestones are accepted, copy the factual acceptance outcome, verified tests, implementation commits, caveats and original milestone ID here; link the concise roadmap status to the entry. Use the current GitHub documentation as the implementation contract and do not confuse earlier test counts with the latest suite.
