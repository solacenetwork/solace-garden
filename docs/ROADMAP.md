# SOLACE Garden — Roadmap

**Status:** Working draft — V1 UI and architecture planning in progress  
**Date:** 2026-11-03  
**References:** [GOALS.md](GOALS.md), [TECH_SPEC.md](TECH_SPEC.md)

This roadmap tracks SOLACE Garden V1 implementation in small, testable slices, followed by the proposed longer-term version direction. **Build a navigable UI skeleton first; evolve it as we learn.** Later features should not require polishing every mockup up front. Previous Garden implementations are references, not designs we must reproduce.

## Step 0.5 — Equip Codex with Bootstrap 6 guidance

**Status:** Complete (2026-11-04). Bootstrap 6 remains an alpha dependency; verify against the exact installed package when implementing components.

- [x] Install and review **official Bootstrap agent skills** via `npx skills add twbs/bootstrap` as repository-local guidance in `.agents/skills/`. Commit the skills and `skills-lock.json` so they travel with the project.
- [x] Identify and review the official [Bootstrap llms.txt](https://getbootstrap.com/llms.txt) index, [llms-full.txt](https://getbootstrap.com/llms-full.txt) reference, and [Bootstrap 6 AI guide](https://getbootstrap.com/docs/6.0/getting-started/ai/) for Codex use. Prefer version-matched documentation over Bootstrap 5 examples.
- [x] Add `AGENTS.md` instructions requiring Bootstrap 6 conventions, consultation of the local skills, and validation against the installed `bootstrap@6.0.0-alpha.1` package.
- [x] Verify installed Bootstrap and Bootstrap Icons versions, confirm the Bootstrap CSS/JS imports build with Vite, and inspect the Bootstrap 6 **Drawer** implementation and documentation. Drawer replaces Offcanvas and uses native `<dialog>`; use the `Drawer` API for the future `AppDrawer`.
- [x] Validate the current scaffold with `npm run build` and `npm ls --depth=0` (both passed). A mounted, interactive Preact component smoke test is **not yet done**; complete it during Milestones 2–3 as part of UI/library integration.

**Ongoing maintenance:** Recheck the skills, documentation, and component APIs whenever the pinned Bootstrap 6 version changes (alpha, beta, or stable).

**Completion record:** Official skills, `skills-lock.json`, and `AGENTS.md` were committed in [c850ae8](https://github.com/solacenetwork/solace-garden/commit/c850ae819a01fe6e7edd20167806ff634b74a92e). Initial package checks and Drawer research are complete; actual interactive component testing remains part of the upcoming UI implementation.

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
- **Existing V1 creation behavior remains:** Create Garden wizard is the default creation flow, with Quick Start and Advanced single-page form alternatives; visual design is still to be decided.

### 1.2 UI questions to finalize

- [ ] **Automatic breakpoint:** Test responsive layouts and choose the threshold(s) for switching effective modes; do not assume browser desktop-site mode crosses a particular breakpoint.
- [ ] **Mode switch placement:** Determine how gardeners quickly find/change the preference outside Settings, if desired; define behavior on resize/rotation, including while editing an unsaved form.
- [ ] **Simple Mode scope:** Decide which quick actions are on its home view and which detailed screens remain accessible. Candidates: plant-phase updates, harvest entry, photo capture, task checkoff, calendar entry, and quick notes.
- [ ] **Landing experience:** Decide whether Garden opens on a dashboard, a garden, recent activity, or a mode-specific home; no choice has been made.
- [ ] **Navigation:** Decide desktop navigation (sidebar/top bar/hybrid), mobile navigation (bottom bar/offcanvas/etc.), and shared information architecture.
- [ ] **Core views:** Choose presentation patterns for garden overview/detail, plant groups, lists, Gallery, Journal, Calendar, Search, Settings, Templates and Locations.
- [ ] **Interaction details:** Confirm responsive cards vs tables, dialogs vs dedicated forms, accessible date/time pickers, camera import flow, clear cancel/save/undo behavior, empty states, and feedback for offline or storage errors.
- [ ] **Visual language:** Choose SOLACE Garden colors, typography, icon conventions, spacing, theme behavior, and component patterns consistent with Bootstrap.
- [ ] **Wireframes/prototypes:** Produce and review representative phone/tablet/desktop layouts for the primary workflows, including at least one Simple Mode data-entry flow and its Standard Mode counterpart.

### 1.3 Deliverables / definition of done

- [ ] Written UI decisions and a navigation map covering both modes and responsive behavior.
- [ ] Agreed default/override and radio-group Settings behavior, with selected breakpoint(s).
- [ ] Representative reviewed wireframes or lightweight prototypes for major views and common data-entry tasks.
- [ ] Reusable Preact + Bootstrap component and accessibility conventions, including shared service calls across modes.
- [ ] Remaining open items explicitly deferred so implementation can proceed without repeated UI redesign.

**Scope guard:** This milestone is **planning and UI validation**, not implementation of all features or a commitment to duplicate every screen. The mockup may intentionally change during later slices.

## V1 implementation sequence — UI-first iterative development

**Status:** Planned; checkpoints below are not marked complete by discussion alone. Move through these milestones in order where practical, while allowing small shared infrastructure and accessibility fixes as soon as they are needed. A usable shell and real device feedback matter more than finishing a static design before coding.

### Milestone 2 — UI mockup and application skeleton

**Status:** Complete (2026-11-04); provisional visual design accepted for continued development.

- [x] Build a running Preact + Bootstrap 6 shell with SOLACE Garden branding, provisional header/Home area, primary content region, and a temporary page layout.
- [x] Use representative placeholder content and basic mobile/tablet/desktop styling, without requiring a database or feature implementation.
- [x] Keep mockup styling easy to adjust based on testing; document substantive changes to navigation or mode behavior.

**Completion record:** Implemented in [fdfd878](https://github.com/solacenetwork/solace-garden/commit/fdfd878b1a80b3ad8624318c60508c5aeec0e01b). Repurposed the existing Preact header/home/404 scaffold, retained `preact-iso`, imported Bootstrap Icons, added six Simple Mode action links and placeholder pages, and removed unused demo code. Codex reported a passing production build and browser checks at 375 × 812 and 1440 × 1000. The user also tested the UI on desktop and on a Samsung Galaxy Tab in portrait orientation and accepted the layout for now. Colors and layout remain provisional; further design refinement is deferred.

**Done when:** The app opens as a recognizable Garden UI on a narrow mobile viewport and a desktop, even though feature pages are not functional. **Satisfied.**

### Milestone 3 — Library integration and smoke tests

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

### Milestone 4 — Router, route catalog, and Home navigation

**Status:** Complete (2026-11-04). The route infrastructure is shared; full Simple/Standard presentation behavior remains for Milestones 5–6.

- [x] Establish a single route map and placeholder pages for Home, Gardens, Plants/Update Plants, Harvest, Photos/Gallery, Tasks, Calendar, Notes, Journal, Settings, and appropriate supporting sections (Templates, Locations, Search, etc.).
- [x] Make navigation links/buttons lead to their intended placeholders, with working back/forward navigation, meaningful unknown-route fallback, and a Home action/logo available in the interface.
- [x] Share routes and application destinations across Simple and Standard presentations, rather than duplicating pages.

**Completion record:** Implemented in [8167a65](https://github.com/solacenetwork/solace-garden/commit/8167a65370d227293054b2e9033308a5048cbdbe). `src/navigation.js` now defines 13 routes (Home plus six primary and six secondary destinations), with derived navigation groups and catalog-driven placeholders. The six Simple Mode home actions were preserved, and a compact secondary workspace directory makes the remaining routes accessible. Codex reported successful tests of link navigation, Home/logo links, Back/Forward, direct URL loading, refresh, 404 handling, Bootstrap Icon rendering, and responsive layouts; `npm run build` passed. Production hosting will require SPA fallback to `index.html` for refreshed deep links.

**Done when:** All planned top-level destinations are reachable, and Home and browser navigation behave correctly without real garden data. **Satisfied.**

### Milestone 5 — Simple Mode layout first

**Status:** Complete (2026-11-05). Implementation: [1505cd6](https://github.com/solacenetwork/solace-garden/commit/1505cd6289992c0e200f42d5d0c96d6dc18eaac1). Browser acceptance testing passed.

- [x] Build the favored six large touch-oriented home actions: Plants/Update Plants, Harvest, Photos, Tasks, Calendar, Notes; route all to placeholder workspaces.
- [x] Implement Automatic / Simple / Standard as one exclusive radio-button preference group, defaulting to Automatic; persist the explicit preference, and test viewport-based selection and overrides.
- [x] Develop the phone-size shell, Home/logo behavior, legible buttons, accessible touch targets, and placeholders for full-screen plant-group editing; keep unsaved-form protections for actual editing slices.
- [x] Ensure Simple Mode works on tablets/desktop when explicitly selected; leave exact breakpoint and final layout tuning open to prototype testing.

**Completion record:** Added a shared Preact interface-mode context, isolated localStorage-backed preference persistence (default `auto`), and a provisional 48rem `matchMedia` breakpoint. Settings provides a three-option radio group; explicit mode selections persist across navigation and reload and are not overridden by viewport changes. Existing routes and six primary actions remain available. The Plants route now has a clearly labeled demonstration-only group selector and a Bootstrap 6 fullscreen-on-small-screens Dialog placeholder, with a Close/Cancel action but no Save or real data. Codex reported successful build and browser smoke tests with cleanup of test processes; user browser acceptance testing also passed.

**Deferred UI observations (not Milestone 5 blockers):** Hide the technical `(max-width: 47.999rem)` media-query text from end-user Settings messaging. For the shared header, use the upper-left SOLACE Garden logo/title as the Home link and an upper-right gear icon as the direct Settings link, removing the redundant Home control. Address these while refining the application shell (Milestone 6). Full Standard Mode and actual plant editing/persistence are separate future work.

**Done when:** The Simple Mode landing screen and its six navigation paths work end to end with placeholders and the user can select the interface mode. **Satisfied.**

### Milestone 6 — Standard Mode layout

**Status:** Complete (2026-11-05). Implementation: [80cf317](https://github.com/solacenetwork/solace-garden/commit/80cf317de091028f5370e462dc5821bee64ca5f4). User manual acceptance testing completed.

- [x] Build a desktop-oriented Standard shell with primary navigation and workspace structure, reusing the same routes and future services as Simple Mode.
- [x] Test narrower viewports when Standard Mode is selected manually; don't disable functionality based on display size.
- [x] Prototype contextual information placement without committing to the old Infobox/Infobar design.

**Completion record:** Added catalog-driven grouped Standard sidebar navigation, responsive compact navigation for narrow Standard Mode, a Standard Home workspace overview, and an optional collapsed “About this workspace” description. Simple Mode retains its six home actions, and both presentations share the same route catalog, Router, and page components. The Header now uses the SOLACE Garden brand as the Home link and a direct Settings gear; Settings explains Automatic mode in plain language. The Plants demonstration Dialog received a fix for quick-close requests during its opening transition. The coding assistant reported a successful build and browser checks of routes, mode overrides, responsive layouts, and dialog behavior. The user manually confirmed the main interactions and desktop keyboard navigation.

**Deferred observations (not blockers):** Settings currently requires browser Back or another navigation action to return to the originating workspace; Milestone 7 will add a Close control using validated short route identifiers (e.g. `/settings?ref=plants`), without a general navigation-history store. Native links/buttons do not require explicit `tabindex`; more comprehensive keyboard and mobile device tests remain useful. A wider Samsung tablet landscape check is pending; explicit Standard Mode on narrow phone screens correctly retains the compact layout. Placement/spacing and other UI polish are deferred until real workflows provide stronger requirements.

**Done when:** Both modes have usable navigation and share destinations; switching modes preserves application route state, while Settings return-to-origin is a separate planned navigation enhancement. **Satisfied.**

### Milestone 7 — Reusable UI building blocks

**Status:** Complete (2026-11-05). Implementation: [8ef556a](https://github.com/solacenetwork/solace-garden/commit/8ef556aff3ddca901d187551cc198aef75fc4412) (merge commit containing Milestone 7 changes). Manual acceptance completed on phone and desktop.

- [x] Establish focused, reusable conventions for Bootstrap 6 Dialogs, accessible navigation and icon controls, focus management, Close/Cancel, and future Save/dirty-state behavior. Document them in `docs/UI_CONVENTIONS.md` without building speculative components.
- [x] Add validated short route IDs for Settings return navigation (`/settings?ref=plants`, etc.), with a visible Close link and safe Home fallback for missing, invalid, or Settings references. Preserve normal history and mode changes without a navigation-history store.
- [x] Prototype optional `AppDrawer` using Bootstrap 6 Drawer on native `<dialog>` (not Bootstrap 5 Offcanvas). Limit its use to Calendar's secondary-context prototype, with event-driven trigger visibility, safe-area-aware dynamic viewport sizing, focus restoration, and unmount cleanup.
- [x] Document empty/loading/error and Save/dirty-state conventions for future data-backed features. Keep the Simple and Standard presentations on shared routes and components.
- [x] Review implementation and complete manual checks across phone and desktop, including Settings return paths, mode switching, repeated Dialog/Drawer operation, Escape/Close, focus behavior, responsive layout, and navigation away while the Drawer is open.

**Completion record:** Settings return links use stable catalog IDs and resolve unknown or untrusted references to Home. The Calendar-only Drawer prototype uses Bootstrap 6 lifecycle events and disposal; the Plants quick-close behavior was preserved and its installed Bootstrap 6 CSS variables corrected. Codex reported passing build, navigation assertions, and automated browser checks; the implementation was inspected on GitHub and the user subsequently reported all nine manual acceptance checks passing across phone and desktop.

**Deferred / observation:** One intermittent flicker on mobile Home/Settings was reported, but subsequent phone testing could not reproduce it; **resolved for now — unable to reproduce**, revisit if it returns. Camera/photo selectors, real date controls, search/filter controls, Journal components, shared feedback components, and data-backed Save/dirty guards remain deferred until their concrete feature milestones. Reassess Drawer sizing and placement with real content.

**Done when:** Current reusable patterns are implemented and documented, with the Settings-return flow and optional Drawer manually validated; feature-specific controls remain intentionally deferred. **Satisfied.**

### Milestone 8 — Dependency-ordered V1 feature delivery

**Planning status:** Sub-milestones 8A–8C are accepted; **8A Storage Foundations** was accepted November 5, 2026, **8B Notes (including the 8A2 draft-recovery follow-up)** was accepted November 6, 2026, and **8C Tasks and Wish List** was accepted November 6, 2026 after manual browser/PWA testing. **Milestone 8D is accepted: 8D1 Geographic Locations and 8D2 Garden Types are complete. 8E Gardens is next.** Review undefined details within later slices before coding. Further sub-milestones (starting at **8G — PlantDB**) will be specified separately after 8A–8F planning. Milestone 9 remains the final integrated readiness gate. Use 8A, 8B, ... 8Z, then 8A1/B1/... if needed; subdivide large deliverables when they cannot be independently tested.

| ID | Scope | Dependencies | Acceptance focus |
|---|---|---|---|
| **8A — Complete** | **Storage foundations**: create `solace-config` and a UUID-named Garden data database; one minimal control record, six 8B–8F data stores, shared Dexie infrastructure and storage-neutral repository conventions. No feature UI or business workflows. | Scaffold and UI conventions | Test fresh offline initialization, reload/restart pointer reuse, UUID naming, six tables, minimal persistence, schema version handling, and safe missing/broken-pointer failure |
| **8B — Complete** | **Notes**: gardener-wide CRUD, plain text and optional `gardenId`; unlinked **Note** and **Linked Note** are one record type. | 8A | Create/edit/delete, link/unlink, reload, validation and plain-language empty/error states |
| **8C — Complete** | **Tasks and Wish List**: one gardener-wide Tasks list plus purchasing Wish List, both optionally linked to a garden; Wish List has optional quantity/notes/product URL and purchased status. | 8A and reusable CRUD patterns from 8B | Add/edit/check/uncheck/reorder/delete, reload; no e-commerce, tags or public sharing in V1 |
| **8D — Complete** | **Geographic Locations and Garden Types**: built-in Default location is editable/renameable but non-deletable; custom geographic locations, optional manual zone, restricted custom-location deletion; eight seeded immutable type definitions with independent multi-select toggles. | 8A | Seed idempotently; validate nonblank protected Default name, optional geographic Locations and type IDs; prevent prohibited deletions; test responsive toggle-grid multi-selection |
| **8E** | **Gardens**: Wizard/Quick Start/Advanced; geographic Location selector and `typeIds` toggle grid; lifecycle/status rules, optional 1,000-character **Garden Notes**, historical search eligibility. | 8D; Notes/Tasks garden-link integrity rules from 8A–8C | New independent garden IDs, form-state preservation, persistence, safe status transitions, archival history, deletion/association integrity |
| **8F** | **Garden Templates**: named independent snapshots for suggested name, description, `locationId`, `typeIds` array, and optional layout media reference. No copied historical activity or Garden Notes. | 8E | Save as new template, create independent Planned garden, reuse/delete safely, handle absent media before Gallery is built |

**8E Gardens — provisional implementation plan (November 7, 2026):** The following eight slices are penciled in to organize implementation, not fixed commitments or an artificial milestone count. Revise, merge, split, or reorder slices when actual dependencies or complexity justify it. Milestone **8E remains open** until its final integrated acceptance. The Garden record contract and optional `startDate`/`endDate` semantics were agreed November 7, 2026 and are documented in TECH_SPEC.md; 8E1 is ready for implementation. Keep Template management in 8F; PlantDB/plant groups and complete cross-feature search remain in later milestones.

| Slice | Deliverable | Basic acceptance target |
|---|---|---|
| **8E1 — Accepted** | **Garden data foundation:** storage-neutral repository/service, immutable UUID, non-unique `name` and optional `subtitle`, nullable description/notes and reserved icon/color/thumbnail/layout media fields, optional Garden-project `startDate`/`endDate`, initial status/closure defaults, validation, and transactional Location/Garden Type reference integrity. Read/list/create/update only; lifecycle transitions in 8E6 and permanent deletion in 8E7. | Focused automated tests confirm duplicate names and subtitles remain separate by ID, valid records persist, dates and references validate, ordinary edits cannot bypass closure, and no schema change occurs. |
| **8E2** | **Gardens overview and detail:** replace the placeholder with Current/Previous Gardens and a bookmarkable detail page; empty, loading and error states. | Open and navigate saved Garden records, including reload and missing-record handling. |
| **8E3** | **Quick Start:** create a real Planned Garden from its name with the protected Default Location ID and In-Ground type ID; navigate to detail. | Create a Garden and confirm saved defaults after refresh. |
| **8E4** | **Wizard and Advanced creation:** three-step wizard and single-page Advanced form using shared state, Location selector, reusable Garden Type selector, validation, and one creation service; switching views preserves entries. First step supports scratch creation now; saved-template prefill arrives in 8F. | Both routes create equivalent records, preserve entered values and prevent invalid saves. |
| **8E5** | **Garden editing and embedded Garden Notes:** edit allowed Garden fields including Location, types and agreed dates; nullable plain-text `notes` up to 1,000 characters with countdown, distinct from Linked Notes. | Edits persist, invalid values are rejected, Notes retain their own semantics. |
| **8E6** | **Garden lifecycle:** manual Planned/Active/Completed/Archived statuses, optional Close, Reopen and Unarchive, read-only enforcement and Current/Previous classification; no automatic calendar-year transitions. | Required state changes work; closed and archived records cannot be edited until explicitly unlocked. |
| **8E7** | **Associations and permanent deletion:** link/unlink existing Notes, Tasks and Wish List items to Gardens; preserve them through status changes; after confirmation, atomically clear their `gardenId` when permanently deleting a Garden. Recheck protected Location references. | Associated independent records survive deletion without dangling references. |
| **8E8** | **Integrated 8E acceptance and polish:** end-to-end Garden workflows across Simple/Standard, desktop/mobile, reload and installed offline PWA; regressions for existing Notes, Lists, Locations and Garden Types. | Resolve issues and sign off 8E only after integrated browser/PWA acceptance. |

**8E1 focused acceptance (November 7, 2026):** Garden data foundation implemented in [commit `0a143ee`](https://github.com/solacenetwork/solace-garden/commit/0a143ee4bb92ae76218096509bd55799fc2eaf3c). Adds storage-neutral Garden create/list/get/update, normalization and nullable defaults, independent UUID identities even for duplicate name/subtitle labels, calendar-date validation, transactional Location/Garden Type references, safe record copies, and prevention of ordinary edits to closed/archived Gardens. No deletion or lifecycle mutation APIs, UI, or schema version changes were introduced. Codex reported **124 passing automated tests**, a successful production/PWA build, and clean `git diff --check`; reviewer inspected the committed source and tests but did not independently rerun commands. **8E1 accepted by focused code review and automated-test evidence, without a temporary browser UI.** Subsequent UI integration and complete end-to-end Garden acceptance remain scheduled for 8E2–8E8; umbrella 8E remains open.

**8E testing approach (agreed):** For **8E1–8E7**, use focused automated tests/build checks, review the committed code, and perform **basic functional acceptance** for the slice: does its main behavior work, persist where expected, and avoid an obvious regression? Do not require an exhaustive manual matrix, repeated clean PWA installations, or full end-to-end retesting at every intermediate checkpoint. Critical validation, storage safety, referential integrity and irreversible deletion rules should still have automated coverage in the owning slice; defer broader cross-feature, responsive, offline and lifecycle combinations to **8E8**. At **8E8**, conduct thorough end-to-end and regression tests across the integrated Garden feature **before** marking the umbrella milestone 8E accepted. A slice can be provisionally accepted without implying full 8E sign-off.

**8B / 8A2 acceptance (November 6, 2026):** The Notes implementation includes plain-text create/edit/delete, persistent recoverable drafts in a separate Dexie store, bookmarkable Note and new-draft URLs, explicit authoritative Save, draft restoration, Discard and normal browser Back/Forward navigation without a custom history guard. Draft recovery was implemented in [commit `ab3f3c2`](https://github.com/solacenetwork/solace-garden/commit/ab3f3c2756f5753b9698f6f21bca570468f9e108). Codex reported 46 passing automated tests plus successful build and diff checks. The user passed seven of eight draft-recovery browser acceptance scenarios on November 6 (including navigation, reload, Save, multiple drafts, Discard, immediate navigation and browser restart). The V1→V2 IndexedDB migration is covered by an automated test; manual migration verification is deferred. Garden association/link-unlink integration remains to be verified when Gardens are implemented in 8E; this does not reopen 8B. **8B accepted; proceed to 8C.**

**8C acceptance (November 6, 2026):** Tasks and Wish List were implemented with shared Preact list UI, independent persistent items, editing, completion/purchased status, deletion, ordering by drag-and-drop and keyboard-accessible Move Up/Down controls, and Wish List quantity/notes/URL validation. During manual testing, two bugs and one UX issue were corrected: controlled checkbox state on uncheck ([commit `58f66b4`](https://github.com/solacenetwork/solace-garden/commit/58f66b4e7f17a2d78fdc5f4e8bcddff0bfd01ab1)), browser form-history suggestions ([commit `1a22c13`](https://github.com/solacenetwork/solace-garden/commit/1a22c13a0b7874b8a85b88d2e3be863e07cfc859)), and incomplete public product URL acceptance ([commit `7743214`](https://github.com/solacenetwork/solace-garden/commit/7743214132c4e7cf6fb702b713578d6d1f698b70)). Codex reported **66 automated tests passing** and successful production build after the URL fix; GitHub diffs were reviewed. The gardener confirmed **all 11 manual acceptance tests passed**, including an installed PWA operating offline with Tasks, Wish List, Notes and recoverable drafts after reload. For deliberate reorder-failure testing, a temporary exception was injected into the Dexie repository; both Tasks and Wish List showed an error, restored the original display order, and retained that order after refresh. The temporary injection was removed and normal reordering retested; this is based on user manual verification, not an automated browser assertion. **8C accepted; proceed to 8D.**

**8D1 acceptance (November 6, 2026):** Geographic Locations implemented in [commit `36cac84`](https://github.com/solacenetwork/solace-garden/commit/36cac849bf8006a990faf8a4bdff86269fa28a9c): stable protected Default Location seeded idempotently at startup, editable names and manual USDA hardiness zones, custom Location CRUD, transactional deletion protection for any Garden reference (including archived/closed Gardens), Settings navigation, and responsive Locations UI. No IndexedDB schema version or store changes. Codex reported **76 automated tests passing across nine files**, successful `npm run build`, and clean `git diff --check`; committed changes were inspected on GitHub. The gardener independently confirmed **all 10 manual browser acceptance checks passed**, including default persistence after reload, editing and zone normalization/clearing/validation, custom creation/deletion and confirmation, protected Default, responsive Simple/Standard navigation, and offline PWA persistence. Referenced-Location deletion is covered by automated tests using Garden records; its normal UI workflow is deferred to 8E when Garden CRUD exists. **8D1 accepted; 8D remains open pending 8D2 Garden Types.**

**8D2 acceptance (November 7, 2026):** Garden Types implemented in [commit `d952bce`](https://github.com/solacenetwork/solace-garden/commit/d952bce609ec8740b5cb9a62093518b76976c8f1): eight fixed definitions with stable IDs, ordered and idempotent Dexie seeding, validation and non-destructive recovery, read-only repository/service interfaces, selection validation, and an accessible, controlled Preact checkbox-grid selector. A Vite-only development preview was provided; Codex reported verifying it is excluded from production. Codex reported **88 automated tests passing across 11 files**, successful `npm run build` and `git diff --check`; the committed changes were reviewed on GitHub. The gardener confirmed **all 10 manual acceptance tests passed**, covering eight definitions and order, zero/multiple selection and deselection, state labels, keyboard operation, disabled behavior, responsive layouts and reload/regression checks. Selection state in the preview is intentionally transient; actual Garden `typeIds` persistence is deferred to 8E. **8D2 accepted; with 8D1 already accepted, Milestone 8D is complete. Proceed to 8E Gardens.**

**8A decisions (finalized for implementation):** Use a fixed, device-local **`solace-config`** IndexedDB control database, with one main record (`id: 'main'`, `configVersion: 1`, `activeDatabase`, nullable `previousDatabase` and nullable `recoveryState`). Resolve the physical Garden database by pointer, naming it **`solace-garden-data-<uuid>`**, generated using `crypto.randomUUID()`; never assume a fixed physical name. Initialize offline on a demonstrably fresh installation and reuse the pointer on later launches. Missing/invalid control data, unknown previous databases, or failed opens must not trigger silent replacement/deletion; provide a simple actionable error/recovery screen, not a full repair utility. Avoid reliance on database enumeration alone to prove there is no stored data. The two databases have independently versioned schemas. Keep user preferences in the Garden data, not `solace-config`.

**8A schema and repositories:** Start the Garden schema at version 1 with exactly six stores: `notes`, `listItems` (Tasks and Wish List), `locations`, `gardenTypes`, `gardens`, and `gardenTemplates`. Establish primary keys and only sufficiently justified indexes; defer every other store and uncertain indexes. Use stable record UUIDs and reserved system preset IDs. Implement minimal, entity-specific repository boundaries with shared Dexie infrastructure, growing them only as the owning 8B–8F features are built. System preset seeding, feature CRUD/business rules and UI belong to the later slices; 8A can use isolated tests or a temporary harness with no permanent demo data.

**Deprecated smoke test:** Milestone 3 temporarily verified Dexie CRUD and reactive queries after library installation. Those test files were removed. Milestone 8A subsequently introduced the production IndexedDB control database and six-store Garden data schema. The old `SolaceGardenDB` version 1 `items` store is a **deprecated test detail**, not user data to migrate. The new UUID-named Garden data store starts at schema version 1, with normal migration policies for subsequent changes.

**8A verification and completion (November 5, 2026):** Two implementation parts plus focused corrections established the offline control/data bootstrap, native non-creating existence checks, non-destructive missing-control recovery, six-store schema, active-database connection lifecycle, a minimal Notes repository, shared validation/error conventions and Notes-only atomic transactions. Codex reported **24 Vitest tests passing**, successful `npm run build` and `git diff --check` after the final correction in [commit `3e1d20d`](https://github.com/solacenetwork/solace-garden/commit/3e1d20ddab1fc2f7d9e90efcf68c8bdbacdd799f). The reviewer inspected committed code; these command results were not independently rerun. Manual browser checks confirmed fresh initialization, unchanged pointer on reload, six stores, normal navigation, orphaned-data protection after deletion of `solace-config`, and recreation of both databases after clearing the disposable IndexedDB state. A transient-error Retry-button round-trip and broader cross-browser/storage-restriction scenarios remain follow-up regression coverage rather than 8A acceptance blockers. **8A accepted.**

**Shared record behavior:** Notes, Tasks and Wish List items belong to the gardener's local collection and optionally reference a garden; completion/archiving retains those links. Permanently deleting a garden atomically clears links to independent records, not the records themselves. The embedded Garden Notes is different: it is part of the Garden record and disappears if that garden is permanently deleted. Garden records stay searchable in archived state.

**Settings integration (planning, not new implementation):** Settings is the entry point for Location management, the selected Location's hardiness zone, Imperial/Metric units, Light/Dark/Automatic theme, and existing interface mode. Keep location zone on the Location record; keep user preferences distinct from deployment storage configuration. The initial system location name is **Default**, displayed as **Default (Location)** when disambiguation is useful; the gardener may rename/edit it but cannot delete it or leave its name blank. A Location is a geographic site, shared by many gardens; wizard/Advanced offer a selector and Quick Start uses the protected system location ID. No global preferred-location setting is required in V1. Theme defaults remain open. Future address/GPS-based features (weather, frost alerts, maps, sunlight estimates) are strictly opt-in and deferred to V3/V4; never transmit a location without explicit permission.

**Garden Type scope:** Treat types as independent, user-selected descriptions with no required hierarchy or mutual-exclusion rules; save an array of stable IDs. Seed In-Ground, Raised Bed, Container, Greenhouse, Hydroponic, Other, Indoor and Outdoor. **Empty `typeIds: []` is valid** in full forms and editing (not `null`); Quick Start selects In-Ground. Optional user-created type definitions are post-V1 (V2/V3), not part of 8D.

**Later Milestone 8 slices — pending separate planning (stop before PlantDB for now):**

| Candidate | Workstream / dependency |
|---|---|
| **8G** | PlantDB offline selection / versioned reference boundary (after garden creation) |
| **8H** | Plant groups and manual growing phases (Gardens + PlantDB) |
| **8I** | Harvest and history (plant groups) |
| **8J** | Media records, relationships, optimization and Gallery input/viewing (storage; before Journal) |
| **8K** | Journal with Tiptap and shared Gallery references (media first) |
| **8L** | Calendar / recurrence / reminders (garden references and event records) |
| **8M** | Cross-feature search and filtering, including Garden Notes, Notes and historical gardens |
| **8N** | ZIP export, standalone read-only **Validate Backup** operation (`validate` detailed report / `isValid` yes-no), and staged, validated replace-only restore (all persistent stores and media) |
| **8O** | Feature integration/accessibility/polish, ahead of Milestone 9 readiness |

**Post-V1 scope rule:** **Only V1 is the current implementation commitment.** All proposed V2 and later features—including potential Laravel API or SQLite data-source adapters around V3/V4—are optional, revisable directions, not guaranteed deliverables or schedules. Do not implement speculative adapters in Milestone 8A.

**Validation layering:** 8A introduces minimal storage-neutral shared record-validation conventions, without building a complete archive scanner. Implement per-entity validators as those features are delivered. In 8N, reuse those rules in a standalone read-only `BackupValidator.validate(file)` report and `BackupValidator.isValid(file)` boolean API, exposed through a **Validate Backup** UI action and shared by import/export checks. Validate ZIP safety/format, record schemas, cross-record references and media integrity; distinguish *archive validity* from device-specific restore feasibility. A validation scan must not write to IndexedDB or change the active pointer.

**Implementation guardrails:** Keep every sub-milestone independently reviewable, test UI → service → Dexie and persistence across reloads, and apply slice-appropriate basic functional acceptance; reserve exhaustive cross-feature/device end-to-end browser/PWA acceptance for each feature milestone's final integration gate (8E8 for Gardens). Calendar recurrence merits early isolated testing even though complete Calendar is later. Backup manifest/versioning principles begin in 8A, while full ZIP recovery waits until record/media schemas are mature. Garden creation must precede plant groups, media services must precede Journal image integration, and photo-selector/camera behavior belongs to its later media milestone.

**Done when:** Each accepted sub-milestone has scoped work, declared dependencies, passing tests, and a completion record. Do not treat the umbrella Milestone 8 as a single coding task.

### PWA infrastructure milestone — production acceptance pending

**Implementation status (2026-11-06):** The installable/offline application infrastructure is implemented with the existing `vite-plugin-pwa` dependency and Workbox `generateSW`. This milestone is **not fully accepted** until the production deployment is tested in supported desktop and Android browsers behind Hostinger HTTP Basic Authentication.

- [x] Generate and reference a root-scoped SOLACE Garden web app manifest with standalone display, the existing 192 × 192 and 512 × 512 icons, SOLACE theme/background colors, and the existing SVG favicon retained in `index.html`.
- [x] Generate a service worker that precaches the revisioned application shell, required branding/icon files, and both Bootstrap Icons font formats. Use `index.html` as the offline SPA navigation fallback.
- [x] Exclude PlantDB and temporary-media paths from this initial precache and configure no arbitrary API/runtime caches. PlantDB catalog/image caching remains part of its later feature milestone.
- [x] Register the service worker explicitly in Preact with prompt-based updates. Show a small accessible notice with **Update now** and **Later**; do not activate or reload for an update until the gardener accepts it.
- [x] Leave the Dexie schemas, `solace-config` pointer, UUID-named Garden database, and storage lifecycle unchanged.
- [x] Verify Desktop Chrome installation and standalone launch on the production origin (user-tested on Linux, 2026-11-06; desktop launcher confirmed).
- [ ] Verify Android Chrome installation and standalone launch on the production origin.
- [x] Verify offline startup after an authenticated visit, including a cold start after closing the browser, on tested desktop Chrome (2026-11-06). A Note was created and saved offline, survived navigation and reopening offline, and no errors were reported.
- [x] Verify offline navigation among existing client-side routes on tested desktop Chrome (2026-11-06).
- [ ] Deploy a new build and verify update detection, **Later** session continuity, and consent-based **Update now** reload behavior.
- [ ] Verify both IndexedDB databases and existing records remain unchanged across the application update.
- [ ] Verify manifest, service worker, precache installation, offline launch, and authentication behavior behind Hostinger HTTP Basic Authentication.

**Deployment limitation:** A first visit, service-worker installation, and cache population require a successful authenticated network response. Browsers can vary in how credentials and installed-PWA sessions interact with HTTP Basic Authentication, and the tested desktop Chrome installation successfully cold-started offline behind Hostinger Basic Authentication; other browsers and devices still need verification. Production `.htaccess` and `.htpasswd` remain host-managed and are not generated by the application build.

### Milestone 9 — Integrated offline V1 readiness

- [ ] Connect cross-feature relationships, navigation and empty/error paths; verify both presentation modes use the same data and business rules.
- [ ] Complete portable ZIP backup and staged, validated **replace-only** restore; test failures, quotas, media size, rollback and fresh-device import.
- [ ] Verify PWA installation/offline launch, local data persistence, bundled PlantDB availability, and operation without any account, remote API or sync connection.
- [ ] Review keyboard/touch accessibility, unsaved-change safeguards, and practical garden use before declaring MVP ready.

**Done when:** A gardener can install the PWA, manage gardens and their records offline, and manually export/restore a complete portable backup.

### Continuous workstream — Browser, device and regression testing

**Begin at Milestone 2 and repeat during every milestone; this is not a final-only step.**

- [ ] Test at small phone, large phone/foldable, tablet and desktop viewport sizes; include orientation changes, browser toolbar behavior, safe areas and `vh`/`dvh` where applicable.
- [ ] Test representative browsers and devices available to the project (including Android mobile browsers and desktop Chromium/Firefox where practical); document unsupported or untested combinations.
- [ ] Check Automatic and manual mode overrides, navigation, touch hit targets, keyboard accessibility, and dirty-form behavior after each relevant UI change.
- [ ] Test IndexedDB persistence, offline startup, library compatibility and regression coverage incrementally; add deeper Gallery, Calendar and backup stress tests when those features exist.
- [ ] Treat findings as reasons to revise mockups, component boundaries or implementation order rather than as blockers requiring the entire UI to be frozen.

### V1 first-run Welcome page — planned

**Status:** Agreed behavior; implementation and acceptance testing pending. Schedule within the V1 UI/navigation work before public beta; do not mark earlier milestones incomplete retroactively.

- [ ] Add a normal `/welcome` route with informational beta messaging, local-data/backup explanation, concise getting-started directions, and documentation/GitHub issue links. Do not present garden creation as already implemented.
- [ ] On a normal first launch with no `welcomeSeen` preference, show Welcome once and persist the flag after successful display, without requiring a button click.
- [ ] Preserve ordinary app navigation; do not override deep links or make Welcome a prerequisite for garden creation.
- [ ] Provide a Help/About path to reopen Welcome; reopening must not reset first-run state.
- [ ] **V1 in-app installation:** Add an optional Install SOLACE Garden action in Help/About, linked or explained briefly from Welcome. Follow the working `beforeinstallprompt` patterns in [SwatchTime](https://github.com/swatchtime/swatch-preact) and [Jesus Prayer](https://github.com/kendawson-online/jp), with a small Preact hook/service boundary. Capture the event, invoke its prompt on a deliberate click, handle accepted/dismissed results, and listen for `appinstalled`/standalone mode. Do not use a stale persisted installed flag as authoritative state; provide manual guidance if the prompt is unavailable, and keep this separate from Workbox updates.
- [ ] Test Chrome/Vivaldi install action (Vivaldi may not display a toolbar install icon), unavailable prompt, already-running-standalone case, accepted/dismissed prompt, and Help/About revisit.
- [ ] Test first launch, navigation away without clicking, refresh/restart, deep links, revisiting, and persistence across app updates. Test clearing site data separately as a new-install scenario.

## V1 UI detail — New interaction candidate (November 2026)

- **Contextual drawer:** Use the validated optional Bootstrap 6 bottom Drawer (`.drawer-bottom` on native `<dialog>`) for secondary information, with a small accessible fixed Info/arrow tab while closed and a full-width panel when open. Approx. 40–50% viewport height is a starting point; evaluate `dvh` with `vh` fallback and mobile safe-area spacing. It is optional, not a replacement for fullscreen modal editing. Hide/show the trigger as the Drawer opens/closes.
- **Simple Mode:** The favored six central actions are **Plants/Update Plants, Harvest, Photos, Tasks, Calendar, Notes**. Calendar and Notes open complete usable workspaces, not only quick-add shortcuts. Plant group selection opens the fullscreen phase editor immediately and returns to the same filtered/scrolled group list after Save. The upper-left logo returns Home subject to unsaved-form safeguards. Existing decisions in TECH_SPEC §5.1 remain authoritative; final wireframes, action labeling and automatic breakpoint remain open.

## V1 architecture milestone — Storage abstraction and ZIP portability

**V1 acceptance objectives (8A bootstrap completed; later V1 work remains):**

- [x] Initialize the device-local `solace-config` control database and resolve the active physical Garden database pointer before opening the V1 Dexie implementation. Keep storage-neutral repository boundaries and raw Dexie table calls out of presentation components. **8A accepted; additional entity repositories will be added with their features.**
- [ ] Default to Dexie/IndexedDB without a storage configuration file; synchronization remains disabled. Validate optional provider settings centrally; separate provider configuration from gardener preferences. Do not ship or require other backends in V1.
- [ ] Provide read-only, standalone backup validation with a yes/no API and actionable detailed error/warning report, reused by export verification and import, without touching existing data. Preserve portable schema versions, stable record UUIDs, media references, and device-independent ZIP exports. Include portable user settings in `solace.config.json` without active pointers, restore state, credentials or deployment routing. Full restore is **staged, validated, pointer-switched and replace-only**, not diff/merge or database renaming; retain old physical database temporarily for recovery.
- [ ] Test fully offline PWA use, multi-device independence, ZIP portability, storage quota and media limits. Explicitly explain that using a different browser/device does not expose the phone's records until a manual restore or a future sync service.
- [ ] Ensure storage configuration and authentication secrets do not leak into portable backups; future provider swaps must never silently overwrite local data.

These objectives supplement the existing V1 feature plan. They **do not introduce accounts, hosted infrastructure, Tauri, or live sync** into the current MVP.

## Database schema release gates — standing policy

- **Current alpha / V1 development:** Keep the Garden Dexie schema at version 1 while it is still being designed; explicitly reset disposable development databases and the `solace-config` pointer together when necessary. No alpha migration framework is required. Do not perform silent resets on ordinary startup.
- **Before data-preserving public beta/stable V1:** Declare the supported persistent schema and data-preservation boundary; document the reset/migration policy and test upgrades and backup recovery.
- **Routine 1.x maintenance/features:** Keep the supported schema compatible; do not introduce routine breaking schema bumps with minor releases. Critical fixes requiring a migration are exceptional and must be reviewed and tested.
- **Future major-version planning (e.g. 2.0.0-beta):** Open a dedicated branch/workstream for proposed structural changes; specify migration and rollback/recovery behavior, supported upgrade paths, backup/restore compatibility, and release notes. Merge only after tests with existing user data.
- **PWA update gate for schema-changing releases:** Test Workbox update detection/activation, offline old clients, multiple tabs and blocked IndexedDB upgrades. Do not equate cached app version with database schema version; ensure user data survives.

**Status:** Policy agreed; future major migration work is not scheduled or implemented. Application versions, Dexie schema versions, and portable backup-format versions remain independent. See `GOALS.md` for the governing policy.

## Long-term version roadmap (exploratory ideas, not guaranteed features or release commitments)

| Version | Focus | Scope boundary |
|---|---|---|
| **V1** | Offline-first Preact PWA, Dexie, Simple/Standard Mode, local ZIP export/replace-restore | No accounts, server, or cross-device sync |
| **V2** | Hosted Laravel/MariaDB accounts and Garden backend; one-way phone/PWA upload, authenticated online viewing | Local PWA remains source of truth; not two-way edit sync |
| **V3** | True bidirectional cloud synchronization | Revisions, deletions, conflicts, resumable/retry-safe transfers |
| **V4** | OAuth integrations for third-party cloud providers (Dropbox, OneDrive, Google Drive as candidates) | Decide backup vs sync semantics per provider |
| **V5/V6** | Household SOS/SHD synchronization via pared-down Laravel/PHP/MariaDB server | One HID and authorized sub-MIDs locally; optional central sync |
| **V7/V8** | Separate generic SOLACE Sync/Tauri initiative for cross-application/device interchange | SQLite/filesystem handling, pairing, manifests and shared transport; not Garden-only |

### Backend distinction for future phases

The network-wide **`solace-main`** backend manages SOLACE users, HIDs/MIDs and broader governance/membership. The future **SOS household Laravel** service is deliberately narrower: one HID and its authorized MIDs, local Garden/other app data and related synchronization. Share compatible app-level interchange/API contracts where practical **without assuming that a household must deploy the entire central server**.

### Deferred research / design decisions

- V2 account provisioning, upload ownership, hosted image quotas, optional free-tier advertising and premium storage/business model.
- V3 revision scheme, tombstones, conflict UX, cross-device identity, offline queues and media consistency.
- V4 cloud-provider OAuth permissions and whether connected storage supports backups, sync, or both.
- V5/V6 local trust/identity, LAN discovery and HTTPS/certificates, central + household topology and authoritative-record policies.
- V7/V8 reusable SOLACE Sync archive/manifest spec, Tauri/SQLite media design, transport security and app-owned merge behavior.
