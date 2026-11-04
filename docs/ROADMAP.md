# SOLACE Garden — Roadmap

**Status:** Working draft — V1 UI and architecture planning in progress  
**Date:** 2026-11-03  
**References:** [GOALS.md](GOALS.md), [TECH_SPEC.md](TECH_SPEC.md)

This roadmap tracks implementation planning for SOLACE Garden V1. **Milestone 1 is defined first; later milestones will be planned after UI decisions are finalized.** Previous Garden implementations are references, not designs we must reproduce.

## Milestone 1 — Finalize UI Choices

**Status:** In discussion (not yet complete)  
**Objective:** Agree on the navigation, responsive behavior, primary screens, and reusable interaction patterns *before* building major V1 features. Produce enough direction for consistent implementation, without requiring pixel-perfect designs for every dialog.

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

**Scope guard:** This milestone is **planning and UI validation**, not implementation of all features or a commitment to duplicate every screen. The detailed Garden feature implementation milestones will be added after Milestone 1 is sufficiently resolved.

## Subsequent milestones

**To be defined** after the UI discussion, using the existing Goals and Technical Specification as the requirements baseline.


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
