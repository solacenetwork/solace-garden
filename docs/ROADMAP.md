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

- [ ] Build a running Preact + Bootstrap shell with SOLACE Garden branding, provisional header/Home area, primary content region, and a temporary page layout.
- [ ] Use representative placeholder content and basic mobile/tablet/desktop styling, without requiring a database or feature implementation.
- [ ] Keep mockup styling easy to adjust based on testing; document substantive changes to navigation or mode behavior.

**Done when:** The app opens as a recognizable Garden UI on a narrow phone viewport and a desktop, even though feature pages are not functional.

### Milestone 3 — Library integration and smoke tests

- [ ] Verify installed library versions and that the selected dependencies compile/load with the Preact/Vite scaffold: Dexie and dexie-react-hooks, FullCalendar/RRule, Tiptap, FilePond and its needed plugins, lightGallery, JSZip, SortableJS, and PWA tooling.
- [ ] Add a minimal import/render/use smoke test or isolated demo for potentially difficult integrations; document any incompatibility rather than adding large feature code now.
- [ ] Prefer route-level or feature-level lazy loading for large libraries; **verification that a dependency works does not require loading all of them on every page**.

**Done when:** Relevant imports and basic demonstrations work, with no unresolved scaffold-blocking compatibility issues. This is not a requirement to implement Calendar, Journal, Gallery, or ZIP processing yet.

### Milestone 4 — Router, route catalog, and Home navigation

- [ ] Establish a single route map and placeholder pages for Home, Gardens, Plants/Update Plants, Harvest, Photos/Gallery, Tasks, Calendar, Notes, Journal, Settings, and appropriate supporting sections (Templates, Locations, Search, etc.).
- [ ] Make navigation links/buttons lead to their intended placeholders, with working back/forward navigation, meaningful unknown-route fallback, and a Home action/logo available in the interface.
- [ ] Share routes and application destinations across Simple and Standard presentations, rather than duplicating pages.

**Done when:** All planned top-level destinations are reachable, and Home and browser navigation behave correctly without real garden data.

### Milestone 5 — Simple Mode layout first

- [ ] Build the favored six large touch-oriented home actions: Plants/Update Plants, Harvest, Photos, Tasks, Calendar, Notes; route all to placeholder workspaces.
- [ ] Implement Automatic / Simple / Standard as one exclusive radio-button preference group, defaulting to Automatic; persist the explicit preference, and test viewport-based selection and overrides.
- [ ] Develop the phone-size shell, Home/logo behavior, legible buttons, accessible touch targets, and placeholders for full-screen plant-group editing; keep unsaved-form protections for actual editing slices.
- [ ] Ensure Simple Mode works on tablets/desktop when explicitly selected; leave exact breakpoint and final layout tuning open to prototype testing.

**Done when:** The Simple Mode landing screen and its six navigation paths work end to end with placeholders and the user can select the interface mode.

### Milestone 6 — Standard Mode layout

- [ ] Build a desktop-oriented Standard shell with primary navigation and workspace structure, reusing the same routes and future services as Simple Mode.
- [ ] Test narrower viewports when Standard Mode is selected manually; don't disable functionality based on display size.
- [ ] Prototype contextual information placement without committing to the old Infobox/Infobar design.

**Done when:** Both modes have usable navigation and share destinations; switching modes doesn't unexpectedly lose route context.

### Milestone 7 — Reusable UI building blocks

- [ ] Build components as real use cases emerge: responsive fullscreen modal conventions, accessible forms/date controls, cards, search/filter controls, photo selectors and Journal preview/editor pieces.
- [ ] Prototype optional `AppDrawer` using Bootstrap offcanvas, fixed Info tab, event-driven tab visibility, safe-area-aware `dvh` sizing, and secondary-content-only behavior.
- [ ] Define common loading/empty/error/save/dirty-state patterns and ensure the shared mode presentation doesn't duplicate business logic.

**Done when:** At least the components needed for the first real pages are reusable and documented, without attempting an entire abstract design system first.

### Milestone 8 — V1 storage foundations and implementation order

- [ ] Implement a single storage-neutral repository/service contract and Dexie adapter, with optional provider config defaulting to Dexie/IndexedDB and synchronization disabled. Keep app preferences separate from storage/provider configuration.
- [ ] Establish record schemas/UUIDs and core integrity rules, plus a few adapter/service tests, before wiring complex page behavior.
- [ ] Replace placeholder pages in **dependency-aware vertical slices**. Proposed order below; adjust based on integration tests and UX feedback.

| Proposed slice | Features | Approximate difficulty | Dependency / rationale |
|---|---|---|---|
| 1 | Notes, To-Do and To-Buy lists | Low | Simple CRUD, settings and reusable form patterns |
| 2 | Locations, seeded Garden Types, Gardens and Templates | Medium | Foundational garden IDs, wizard/Quick Start/Advanced, protected records |
| 3 | PlantDB static selector, plant groups and manual phases | Medium | Depends on gardens; exercises primary outdoor update flow |
| 4 | Harvest entry/history and basic search | Medium | Depends on plant groups; meaningful garden workflows |
| 5 | Gallery import/optimization/media references | High | Shared media foundation used by Journal and garden layouts |
| 6 | Journal with Tiptap and shared Gallery images | High | Structured rich text, image associations, dirty-state handling |
| 7 | Calendar and reminders | Medium–High | FullCalendar/RRule, local timing and recurrence behavior |
| 8 | ZIP export and safe replace-only restore | Very High | Requires mature records/media schema, validation, staging and recovery |
| 9 | Integration, offline packaging, accessibility and polish | Cross-cutting | End-to-end reliability across the completed workflows |

**Complexity notes:** Gallery and Journal are major integration risks; ZIP validation and crash-safe restore may be the highest reliability risk. Calendar recurrence/notifications also need early isolated tests even if full Calendar is implemented later. Garden creation should precede plant groups and harvests; Gallery should precede Journal image integration. Basic ZIP format design may begin early, even though full restore is a later slice.

**Done when:** Each completed slice works from UI through domain service and Dexie, persists across reloads, and has relevant tests. Do not wait for every other page before exercising the first vertical slice.

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

## V1 UI detail — New interaction candidate (November 2026)

- **Contextual drawer:** Prototype a reusable Bootstrap bottom offcanvas (`.offcanvas-bottom`) for secondary information, with a small accessible fixed Info/arrow tab while closed and a full-width panel when open. Approx. 40–50% viewport height is a starting point; evaluate `dvh` with `vh` fallback and mobile safe-area spacing. It is optional, not a replacement for fullscreen modal editing. Hide/show the trigger as offcanvas opens/closes.
- **Simple Mode:** The favored six central actions are **Plants/Update Plants, Harvest, Photos, Tasks, Calendar, Notes**. Calendar and Notes open complete usable workspaces, not only quick-add shortcuts. Plant group selection opens the fullscreen phase editor immediately and returns to the same filtered/scrolled group list after Save. The upper-left logo returns Home subject to unsaved-form safeguards. Existing decisions in TECH_SPEC §5.1 remain authoritative; final wireframes, action labeling and automatic breakpoint remain open.

## V1 architecture milestone — Storage abstraction and ZIP portability

**V1 acceptance objectives (implementation pending):**

- [ ] Create storage-neutral repository/domain service contracts and one Dexie implementation. Keep raw Dexie table calls out of presentation components.
- [ ] Default to Dexie/IndexedDB without a storage configuration file; synchronization remains disabled. Validate optional provider settings centrally; separate provider configuration from gardener preferences. Do not ship or require other backends in V1.
- [ ] Preserve portable schema versions, stable record UUIDs, media references, and device-independent ZIP exports. Existing restore remains **staged, validated, and replace-only**, not diff/merge.
- [ ] Test fully offline PWA use, multi-device independence, ZIP portability, storage quota and media limits. Explicitly explain that using a different browser/device does not expose the phone's records until a manual restore or a future sync service.
- [ ] Ensure storage configuration and authentication secrets do not leak into portable backups; future provider swaps must never silently overwrite local data.

These objectives supplement the existing V1 feature plan. They **do not introduce accounts, hosted infrastructure, Tauri, or live sync** into the current MVP.

## Long-term version roadmap (proposed sequence, not release commitments)

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
