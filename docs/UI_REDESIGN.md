# SOLACE Garden — UI Redesign Plan

**Status:** Authoritative UI decision record — approved direction consolidated; detailed layouts and responsive states remain open.  
**Started:** November 14, 2026  
**Development position:** Post-8F UI review, before Milestone 8G.

## 1. Purpose and scope

Improve SOLACE Garden's navigation, layout, terminology, and common workflows before continuing V1 feature development. Milestones 8E (Gardens) and 8F (Templates) passed their functional acceptance tests, but repeated real-device use exposed confusing organization, redundant entry points, and presentation friction.

This document is the **single consolidated design specification** for the UI redesign. It synthesizes prior discussions, historical interfaces, Markdown planning, and real-device test reports. When complete it must describe Simple and Standard Mode layouts, navigation destinations, interactions, responsive states, and acceptance tests clearly enough to produce scoped Codex prompts. It is not another raw notes dump.

- **This document is authoritative for SOLACE Garden UI redesign decisions:** approved navigation placement, page composition, interaction patterns, responsive behavior, and remaining design questions.
- [UI_REVIEW_NOTES.md](UI_REVIEW_NOTES.md) is the evidence/observation record; observations and suggested remedies do not override decisions here.
- The November 10–14, 2026 structured observation collector export (`submissions.json`) contains 11 repeatable reports: five tablet and six laptop. No report was explicitly classified as a functional defect; recorded severity zero must not be interpreted as confirmed low impact.
- [PARKING_LOT.md](PARKING_LOT.md) retains deferred alternatives and future ideas only. It is not a second source of current UI decisions.
- [GOALS.md](GOALS.md), [TECH_SPEC.md](TECH_SPEC.md), and [UI_CONVENTIONS.md](UI_CONVENTIONS.md) remain authoritative for product goals, data contracts, and implementation conventions. [ROADMAP.md](ROADMAP.md) remains authoritative for delivery sequence. Where older UI wording conflicts with a decision recorded here, update the summary documents to match this design record; do not silently change data or technical contracts.

**Statuses used below:** `Approved` = explicit design decision; `Existing/accepted` = implemented behavior to preserve; `Open` = a design choice still required; `Preferred implementation approach` = direction to test against the pinned stack; `Deferred` = intentionally outside current V1 redesign scope.

## 2. Evidence synthesis and decision provenance

### 2.1 Sources and their status

| Source | Contribution | Authority |
| --- | --- | --- |
| November 10 conversation, “The original navigation model” | Sidebar for main areas, persistent toolbar tools, More menu | Source of the organizational direction; the current approved placements are recorded in Sections 6–8 |
| [Historical screenshots](pics/) | Top toolbar, left sidebar, Add New popup, PlantDB-local browser | Historical reference, **not** a visual specification |
| [UI_REVIEW_NOTES.md](UI_REVIEW_NOTES.md) | Observed friction and “Ideas to evaluate” | Observation is evidence; suggested fixes are candidates |
| November 10–14 `submissions.json` | Eleven repeatable observations: 5 tablet, 6 laptop | Direct tester feedback; severity 0 is not evidence of low impact |
| [PARKING_LOT.md](PARKING_LOT.md) | Earlier alternatives for Welcome, Notes, Gardens hub, Wizard, cards, navigation | Retains only deferred alternatives and future ideas; current decisions are summarized here |
| [GOALS.md](GOALS.md), [TECH_SPEC.md](TECH_SPEC.md), [ROADMAP.md](ROADMAP.md), [UI_CONVENTIONS.md](UI_CONVENTIONS.md) | Product requirements, data/technical contracts, delivery sequence, interaction standards | Remain authoritative in their respective domains; UI presentation decisions are consolidated here |

**Decision statuses:** `Approved` = explicit design decision; `Existing/accepted` = behavior already implemented and to preserve; `Open` = a design choice still required; `Preferred implementation approach` = direction to test against the pinned stack; `Deferred` = intentionally outside the current V1 redesign.

### 2.2 Consolidated findings

| Repeated issue | Evidence | Design implication |
| --- | --- | --- |
| Too many equally prominent navigation entries | Tablet landscape sidebar scrolling; “everything is a workspace”; Settings both sidebar and gear | Distinguish primary destinations, global tools, contextual links, and support |
| Navigation reflects implementation rather than gardener expectations | Templates as top-level vs Gardens; Locations top-level vs Settings; placeholder Home wording | Organize by user task and relationship, preserving existing direct URLs |
| Garden creation methods appear sequential but are independent | Laptop `/gardens/new`; earlier lost Quick Start name on Wizard/Advanced | Make the three creation choices genuinely distinct, or explicitly define safe carry-forward behavior |
| Garden overview conflates unfinished work and saved Garden lifecycle | Drafts appearing above new Gardens; duplicate names | Clear Draft versus Planned/Active/Previous grouping and discovery |
| Everyday shortcuts require extra navigation | Search page before query; Tasks and Wish List dispersed | Consider header Search and shared Lists overview without inventing new data models |
| Secondary identifiers/feedback distract or hide outcomes | Template UUID cards; long Garden names; validation below fold | Improve information hierarchy and immediate, accessible feedback |
| Tablet and desktop presentation need purposeful adaptation | Inset header, too many sidebar buttons, legacy fixed styling | Design breakpoint-specific layout within both selectable modes |

### 2.3 Previously established vs genuinely open

**Approved direction:** Keep Preact + `preact-iso`, Bootstrap 6, the existing routes and data services, and both selectable interface modes. The navbar is persistent in both modes. Home is reached only through the SOLACE logo; primary navigation is **Gardens → Journal → Gallery → PlantDB** (PlantDB last); the app-wide tools are **Tasks → Notes → Wish List → Calendar**; Search and Add New are in the top navbar; and one More menu contains Help, About, and Settings. Welcome is linked from Help. Detailed placements and remaining behaviors are consolidated in Sections 5–8 below.

**Approved Home direction:** `/` is an overview dashboard with Current Gardens, Tasks, Wish List, Gallery, and Previous Gardens. Garden and Gallery content uses horizontal visual rails; Tasks and Wish List use short, read-only previews of the five most recently added items. Unfinished Garden drafts do not appear on Home.

**Approved Welcome direction:** A fresh installation defaults **Show Welcome at startup** to checked. Normal launches show the full-page `/welcome` while enabled and Home (`/`) when disabled; direct/deep links are preserved. Welcome is revisitable from Help. Its short, skippable Bootstrap 6 carousel introduces the app and Gardens and leads to **Create Your First Garden** in the existing Wizard. Slide count, copy, imagery, and controls remain open.

**Still open:** detailed responsive shell layouts within the agreed Bootstrap breakpoints; exact icons and available-width overflow priorities; Add New menu contents; Simple/Standard page composition; card details; Gardens hub grouping and routes; creation choice and Wizard design; and remaining Templates, Notes, Lists, Help/About, and contextual-page presentation.

---

## 3. Design principles

1. **Pages/routes and navigation placement are separate.** A URL can remain bookmarkable even if its link is reached through a submenu or contextual page. Not every route needs a primary navigation button.
2. **Workspaces are a user-facing concept, not a routing requirement.** Do not require every destination to be classified as a workspace or replace the old taxonomy with another mandatory taxonomy full of exceptions.
3. **Distinguish global tools, primary destinations, and context-specific navigation.** Avoid a flat menu in which every function has equal visual prominence.
4. **Keep both Simple and Standard modes.** They share routes, data, and business rules; either may be manually selected at any viewport width. Responsive layout applies within each selected mode.
5. **Make repeated tasks efficient.** A gardener should be able to return to the working context, easily find a newly created Garden, and act without redundant page transitions.
6. **Use Bootstrap 6 and existing Preact components where possible.** Do not introduce a new shell or routing library simply for visual organization.
7. **Preserve operational data integrity.** Keep accepted draft/autosave, dirty-form safeguards, atomic Garden creation, Template behavior, offline/PWA startup, and underlying Dexie services. Alpha test records are disposable if an intentional contract change truly requires a reset; do not add backward-compatibility machinery for obsolete alpha data.
8. **Do not reproduce the old appearance.** Learn from the historical interface's organization, not its heavy borders, bright boxed controls, faux desktop chrome, or narrow touch targets.
9. **Differentiate evidence from decisions.** Observations and screenshots suggest options; an idea here is not a Codex instruction until explicitly approved.

## 4. Historical JavaScript UI reference

The earlier vanilla-JavaScript Garden screenshots in [pics/](pics/) show a useful organization:

- A **persistent top bar** offered To-Get List, To-Do List, Notes, Journal, Calendar, About, Settings, and Help. The later discussion proposed moving infrequently used Help/About/Settings/Welcome into a **More (…)** menu rather than retaining every top-bar button.
- A **compact left navigation** offered Add New, Search, Current, Previous, Maps, Gallery, and Plant DB.
- **Add New** opened a global action menu for a Note, To-Get Item, To-Do Item, Journal Entry, Garden, and Map.
- The **PlantDB view** preserved the global chrome while introducing a plant-specific search and selection list beside the main content, demonstrating contextual navigation.
- Historical SOLACE Menu screenshots also provide responsive large-tile references, not a mandate to reuse the old styling.

Reference images: [main UI](pics/js-app-garden-ui.png), [Add New](pics/js-app-garden-menu.png), [PlantDB](pics/js-app-garden-plantdb.png), [large menu](pics/js-app-solace-menu-large.png), [small menu](pics/js-app-solace-menu-small.png). These are **development references**, not assets to package in the PWA.

**Navigation model carried forward from the historical UI and approved in the current redesign:**
1. **Global toolbar:** frequently used tools/actions available from major views.
2. **Primary navigation:** a concise set of main application destinations; approved order is Gardens, Journal, Gallery, PlantDB.
3. **Contextual navigation:** subviews, filters, and management actions owned by the active area (e.g. Garden categories/Templates or PlantDB browsing). The exact component may be tabs, inline controls, accordion, or a local panel; a third sidebar is not assumed.
4. **More/support menu:** one More entry contains Help, About, Settings, and global tools overflowed at narrow widths. Settings is not a standalone header gear or Standard sidebar item.

The detailed placement map and remaining responsive questions are in Section 6; this historical section explains the organizing principle, not a separate alternative proposal.

A full Notes page or Calendar page may still be reached from the global toolbar. Navigation placement is not a constraint on page capability.

### Approved navbar additions and responsive branding (November 14, 2026)

**Approved:**
- **Search** is a global top-navbar entry point, reachable from any major view in both interface modes. The approved responsive search pattern and planned query-to-results behavior are detailed below. The underlying cross-feature search engine belongs to its later scheduled milestone.
- On **small/narrow screens**, hide the long **“SOLACE Garden” text SVG/wordmark** and retain the recognizable **logo icon** as the brand/home affordance. Wider presentations may show the full wordmark. Choose the actual threshold after measuring the available header space; keep an accessible app name on the icon-only link.
- **Bootstrap 6 Nav overflow (Priority+)** is the favored responsive solution for handling navbar items that no longer fit. See [Bootstrap 6 Nav overflow](https://getbootstrap.com/docs/6.0/components/nav-overflow/). The component moves overflowed navigation items into a generated **More** menu based on *container width*, with `.nav-overflow` and `data-bs-toggle="nav-overflow"`. Confirm behavior against the exact pinned Bootstrap 6 alpha package before implementing.

**Approved:** Show **exactly one More menu item** in the navbar. It must serve both as access to lower-priority global tools that do not fit and to supporting destinations such as Help/About (approved), with Welcome linked from Help. Do not render a separate overflow More alongside another support More. Assess whether the pinned Bootstrap 6 Nav overflow supports combining deliberate menu items with dynamically overflowed actions; if not, implement one coordinated menu without duplicate More triggers. The exact technical approach is still open. Bootstrap 6's [Menu component](https://getbootstrap.com/docs/6.0/components/menus/) and [Nav overflow](https://getbootstrap.com/docs/6.0/components/nav-overflow/) have different APIs.

**Approved visibility priority:** Keep **Add New (+)** and **Search** directly visible in the narrow-screen navbar; other global tools may move into the **single More** menu as width requires. **Still open:** Search's interim behavior until its results feature exists; priority/order of other tools; remaining overflow membership; brand breakpoint.

### Approved responsive search presentation (November 14, 2026)

**Decision:** Use **one global Search feature** in the persistent navbar with two responsive presentations, in both interface modes:

- **Wide screens:** Show a directly usable inline text query field in the navbar.
- **Narrow screens:** Show a persistent Search icon next to the other high-priority actions. Activating it reveals a **full-width search field in a panel immediately below the navbar** (not a tiny floating menu or a permanently squeezed input).
- Narrow-screen branding uses the logo without the long text wordmark, freeing horizontal space. Keep the **Add New (+)**, **Search**, and the **single More** trigger accessible.
- Submitting with Enter or an explicit Search button should use the same query workflow and display results through `/search?q=...`. This is an approved **target interaction**, not a claim that cross-feature Search is already built. Keep implementation aligned with the later Search milestone.
- The narrow panel must be dismissible via Close and Escape, with sensible keyboard focus and touch targets. Opening and closing it must not navigate away, silently discard edits, or interfere with the current page.
- Do not add live/type-ahead suggestions as part of this UI redesign. They can be evaluated after basic offline Search works.

**Implementation details still to verify:** Use available navbar width rather than assuming all tablets can display an input; choose the responsive threshold against actual toolbar contents and tested devices. Prefer Bootstrap 6 and a small shared Preact component. Define exact focus restoration, panel dismissal, and the harmless interim UI before the scheduled Search feature is implemented. The responsive Search control is the **same action** in either presentation, not two separate search services.

### Approved shell behavior — persistent navbar (November 14, 2026)

**Decision:** The application top navbar remains available in **both Simple Mode and Standard Mode**, with responsive presentations appropriate to screen size. Switching modes does not remove the navbar or deny access to its actions. An explicitly selected mode remains selected even as the viewport changes; responsive arrangement continues within that mode.

**Intent:** Preserve the persistent, app-wide access pattern from the historical JavaScript UI. On wider screens the toolbar may show more directly accessible tools; on narrow phones it may compact or use an accessible overflow menu rather than shrinking controls or hiding functionality.

**Approved addition:** The global **Add New (+)** action belongs in the top navbar in both modes, using the approved responsive navbar presentation. It is an action menu, not a primary workspace or sidebar destination. Its menu entries and interactions remain to be designed.

**Approved Home access:** The SOLACE logo is the sole Home navigation affordance in the navbar on both wide and narrow screens. There is **no separate Home button or sidebar entry**. The `/` route is the **Home overview dashboard**; exact responsive composition remains to be designed.

**Still open:** exact icon artwork and labels, width thresholds, overflow priority among the four global tools, the precise More menu composition/implementation, and the Simple/Standard responsive layouts. The approved membership and ordering are recorded in Section 6; do not reopen them while resolving presentation details.

**Acceptance implications:** Test header availability and access to every approved action in Simple and Standard Mode, including manual mode override on narrow and wide viewports; check touch targets, keyboard/focus, overflow menu usability, and no disruption to unsaved editor data.

## 5. Current implementation and agreed route/navigation separation

The current [src/index.jsx](../src/index.jsx) already uses `preact-iso` and renders `applicationRoutes` from [src/navigation.js](../src/navigation.js). `navigation.js` currently mixes path/view definitions with `section` (Simple Home), `navigationGroup` (Standard sidebar/Home), labels, icons, and workspace-derived lists. [StandardNavigation.jsx](../src/components/StandardNavigation.jsx) and [Home/index.jsx](../src/pages/Home/index.jsx) expose that catalog directly.

**Agreed architecture direction:** Keep `preact-iso`, stable route IDs, existing paths, and route resolution, while separating **route definitions** from **navigation/presentation configuration**. `index.jsx` can continue to render an explicit route registry; there is no need to move every `<Route>` declaration inline, and no new router is required. The exact refactor scope should be confirmed against current consumers and tests before implementation.

A route answers **what page exists**; navigation configuration answers **where a link/action appears**; a page answers **what contextual controls it needs**.

Avoid a new broad “workspace manager” or elaborate route-kind hierarchy. Retain only metadata that demonstrably serves navigation, context, return paths, or accessibility. Check whether `findRoute()` special cases and `workspaceRoutes` still have genuine consumers before refactoring them. Preserve parameterized Notes/Gardens routes and their ordering, Settings return behavior, deep links, and existing tests.

The Standard Mode “About this workspace” panel should not be shown indiscriminately on Settings, Templates, Help, etc. Reassess its purpose rather than blindly adapting every route to it.

## 6. Navigation destination map — approved placement and remaining details

This is the authoritative placement map. An approved placement does not mean its detailed visual treatment, icon, responsive breakpoint, or underlying feature implementation is complete.

| Destination / action | Approved access / placement | Route or behavior | Remaining detail |
| --- | --- | --- | --- |
| Home | SOLACE logo only; no separate Home button or sidebar entry | `/` | Exact dashboard layout is in Section 7A. |
| Gardens | Primary navigation position 1 | `/gardens` | Simple Mode presentation and hub/category layout remain open. |
| Current / Planned / Drafts / Previous | Within Gardens; Drafts are creation sessions, not saved Gardens | Existing Garden records and draft services | Other category presentation, ordering, filters, and dedicated routes remain open. V1 Draft rail is in Section 7B. |
| Templates | Under Gardens; not a global primary destination | `/templates` | Hub link versus contextual Gardens menu remains open. |
| Journal | Primary navigation position 2; not a permanent global toolbar tool | `/journal` | Whether Add New includes New Journal Entry remains open. |
| Gallery / Photos | Primary navigation position 3 | `/photos` | Garden-specific versus global browsing details depend on Gallery design. |
| PlantDB / Plants | Primary navigation position 4 (last) | `/plants` | Distinguish catalog/reference browsing from Garden plant groups as those features develop. |
| Tasks | App-wide navbar tool position 1 | `/tasks` | Responsive overflow and exact icon remain open. |
| Notes | App-wide navbar tool position 2 | `/notes` and editor routes | Grouped Notes navigation remains open. |
| Wish List | App-wide navbar tool position 3 | `/wishlist` | Responsive overflow and exact icon remain open. |
| Calendar | App-wide navbar tool position 4 | `/calendar` | Simple Mode placement and responsive overflow remain open. |
| Search | Global top navbar | Wide: inline query field. Narrow: icon opens full-width panel below navbar. Target results route `/search?q=...`. | Search engine is a later feature; interim behavior and responsive threshold remain open. |
| Add New (+) | Global top navbar in both modes | Opens a global action menu | Menu entries/order and relationship to page-specific Create actions remain open. |
| More | Exactly one More item in navbar | Contains Help, About, Settings, and any global tools overflowed at narrower widths | Technical integration of intentional menu items with Bootstrap 6 overflow remains to validate. |
| Help / About | Inside the single More menu | `/help`, `/about` | Page content and layout remain open. |
| Settings | Inside the single More menu only; no separate gear or sidebar item | `/settings`; preserve return-to-origin/Close behavior and direct URL | Exact More menu presentation remains open. |
| Welcome | Link from Help; not a separate primary or More destination | `/welcome`; startup behavior in Section 7A | Carousel slide design remains open. |
| Locations | Settings → Geographic Locations | `/locations` | Settings/context presentation remains open. |
| Harvest | Garden-related activity | `/harvest` | Exact navigation entry point remains open. |

**Primary navigation order:** Gardens → Journal → Gallery → PlantDB. **Global tool order:** Tasks → Notes → Wish List → Calendar. Keep the top navbar in both Simple and Standard Mode. At narrow widths, Add New and Search remain directly visible and exactly one More trigger remains; lower-priority tools may overflow into it. On narrow screens, show the logo without the full “SOLACE Garden” wordmark. The actual width threshold and precise overflow behavior must be tested on the pinned Bootstrap 6 alpha and real devices.

## 7. Redesign workstreams

### A. Application shell and global navigation

**Approved structure:** persistent top navbar in both Simple and Standard Mode; SOLACE logo as the only Home link; primary navigation order Gardens → Journal → Gallery → PlantDB; global tools order Tasks → Notes → Wish List → Calendar; global Search and Add New in the navbar; one More item containing Help, About, Settings, and any tools overflowed at narrow widths. Keep Add New and Search visible on narrow screens. Hide the full wordmark on narrow screens and retain the logo. See the authoritative destination map in Section 6.

**Approved responsive shell direction (based on the three layout sketches):**

- **Large screens — Standard Mode presentation (`lg` and up):** persistent top navbar, full expanded left sidebar, and the regular workspace occupying the remaining content area.
- **Medium screens — Standard Mode presentation (`md` to below `lg`):** persistent top navbar and a narrow, persistent vertical iconbar. An explicit expand control opens the full navigation sidebar as an **overlay above the workspace**; it does not push the workspace aside or change its width. The iconbar remains the collapsed state when the full sidebar is closed.
- **Small screens — Simple Mode automatic presentation (below `md`):** persistent top navbar, no permanently visible sidebar, and a card-based presentation for primary navigation/actions. The supplied sketch illustrates a two-column card area with wider, full-row cards where appropriate; exact card contents and grouping remain to be designed.
- **Breakpoint tokens:** use Bootstrap 6's default responsive breakpoints, not custom one-off pixel thresholds: `sm` = 576px, `md` = 768px, and `lg` = 1024px. The `sm` token is available for card/grid refinements; the shell's main presentation transitions are below `md`, `md`–below `lg`, and `lg`+.
- The sketches describe the intended **Automatic** responsive presentations, not a restriction on mode choice. The existing Settings page (`src/pages/Settings/index.jsx`) already provides Automatic, Simple, and Standard choices; both manual modes are explicitly described as applying at every screen size. Preserve this selector and its behavior—do not add a second mode selector or disable Standard Mode on phones. In Automatic mode, the existing resolver (`src/services/interfaceMode.js`) selects Simple below the `md` threshold (currently `(max-width: 47.999rem)`) and Standard at/above it. If Standard is manually selected on a phone, it remains Standard and its shell must adapt using the small-screen (`sm`) responsive layout rather than switching modes.
- **Provisional dimensions to validate:** collapsed iconbar width **60px**; expanded navigation sidebar/panel width **300px**. Treat these as design starting points, not final constraints. Confirm whether the 300px panel is measured independently of the persistent 60px iconbar when producing the annotated layout.
- Sidebar expansion must be explicitly activated and usable by touch and keyboard; do not rely on hover. The overlay must not reflow or resize the underlying workspace.
- **Existing component:** `src/components/AppDrawer.jsx` already implements a Bootstrap 6 bottom-positioned contextual-information Drawer, including trigger focus restoration and lifecycle cleanup. Its current props are `id`, `title`, `triggerLabel`, and `children`; it does **not** currently accept a placement/position prop. The rendered `<dialog>` hard-codes `class="drawer drawer-bottom app-drawer"`. Bootstrap's Drawer supports positional classes, so the wrapper could be generalized with a `placement` prop (defaulting to `bottom`) or the navigation shell could use a dedicated Drawer component. Do not assume the existing wrapper is already position-configurable. Its current trigger/content purpose is also contextual information rather than primary navigation. For the medium-screen navigation overlay, use a left/start placement (`drawer-start` in LTR) and reuse the lifecycle/focus patterns where appropriate.
- **Approved accessibility/dismissal behavior:** Follow Bootstrap 6 Drawer and native `<dialog>` behavior rather than creating custom focus management. The navigation overlay is modal while open: use the native dialog's modal focus handling/trap and backdrop; Escape and backdrop activation dismiss it; provide an accessible name via `aria-labelledby` and an explicitly labelled close control; move focus into the drawer when opened and restore it to the invoking control when closed. Keep keyboard operation, visible focus, adequately sized touch targets, and Bootstrap's reduced-motion behavior. Do not disable Escape/backdrop dismissal without a documented accessibility or workflow reason.

**Still open:** exact icons and labels; final confirmation of the 60px iconbar and 300px panel dimensions (including their combined footprint); Simple Mode card contents, grouping and arrangement; the detailed small-screen Standard Mode layout and manually selected Simple Mode on a large screen; remaining Drawer implementation details (including focus destination after navigation and behavior when crossing breakpoints); priority of the four tools when space is constrained; how deliberate More destinations combine with Bootstrap 6 Nav overflow; Add New menu entries/order and their relationship to page-specific Create actions; header container/padding; and exact device-specific layouts. The existing Settings selector remains available at every width, including Standard Mode on narrow phones. Journal remains a primary navigation destination, not a permanent toolbar tool. Welcome design details are in Section 7A.

### Welcome page and startup behavior — approved direction, details open

The Welcome requirements are separate from the Home dashboard specification below. A fresh installation defaults **Show Welcome at startup** to checked. While checked, normal launches show the full-page `/welcome`; when unchecked, normal launches go to Home (`/`). Direct/deep links to other destinations are preserved. Skipping or choosing Go to Gardens does not silently change the preference. Welcome remains available from Help regardless of the preference. Store the explicit setting in existing local UI preferences; do not revive the obsolete one-time `welcomeSeen` rule or add alpha compatibility work.

**Approved presentation direction:** Use a short, skippable **Bootstrap 6 carousel** to introduce the main app features, explain the purpose of Gardens, and lead to **Create Your First Garden** in the existing Garden creation Wizard. This is an introduction, not a second onboarding wizard or a gate to normal use. Keep visible Skip Introduction / Go to Gardens access. The Welcome page also carries the beta/local-storage/backup guidance required by GOALS.md and ROADMAP.md.

**Still open:** exact slide count and sequence; copy; illustrations/screenshots; CTA placement (final slide or throughout); control styling; and touch, keyboard, screen-reader, and responsive details. The checkbox/default, full-page route, startup behavior, deep-link exception, Help link, and carousel purpose are approved.

### Home dashboard — approved structure, visual design to finalize (November 14, 2026)

**Home at `/` is a dashboard of real data, not a menu of category tiles. Unfinished Garden drafts are explicitly excluded from Home; they belong on `/gardens`.** Keep five overview sections in their already agreed order: **Current Gardens, Tasks, Wish List, Gallery, Previous Gardens**. Each section has a clear **View all** path to its corresponding workspace. Do not duplicate data or editing logic in Home.

**Garden filmstrips (approved):**
- **Current Gardens:** horizontal cards showing **Title, Subtitle, Start Date**; eventually an optional **thumbnail** when available. Do not make thumbnails or new media storage prerequisites for V1.
- **Previous Gardens:** horizontal cards using the same basic Garden information. Include Gardens whose lifecycle status is **Closed, Completed, or Archived**. Verify precise status field/value names against the current Garden data contract before coding; these are the user's intended visible categories, not permission to invent extra states.
- Each Garden card opens that Garden's appropriate detail view; the section's View all opens the Gardens view (filtered where relevant).

**Gallery filmstrip (approved):** A horizontal rail of the **most recently added images**, newest first, each opening the corresponding photo/viewer when implemented. View all opens Gallery. It is about **date added**, not necessarily when the photo was taken; use the existing supported metadata when the Gallery feature is built.

**Tasks and Wish List (approved):** Unlike the visual filmstrips, show each as a **short, read-only list of the five most recently added items** (or fewer when fewer exist), in a **Nextcloud dashboard-style activity preview**, not a duplicate list-management screen. Each section has **View all** linking to `/tasks` or `/wishlist`, where users edit, complete, or otherwise modify records. No inline checkbox toggles, item editor, or hidden writes on Home. Use existing record timestamps where supported; verify actual field names and decide a stable fallback for items lacking an addition timestamp before implementation. Whether a preview row is linked and its exact display fields remain to design.

**Approved Home empty states:** A section with no records should show a compact, friendly explanation **in place of an empty rail/list**, not a blank gap or a misleading loading indicator. Keep the corresponding section heading and navigation coherent. Suggested V1 copy/actions:

| Section | When empty | Action |
| --- | --- | --- |
| Current Gardens | “Your Gardens will appear here.” / “Create your first Garden to start organizing your growing season.” | **Create Your First Garden** → existing Garden creation entry |
| Tasks | “No tasks yet.” | **Add a Task** → Tasks creation flow |
| Wish List | “Your Wish List is empty.” | **Add an Item** → Wish List creation flow |
| Gallery | “No photos added yet.” | **Open Gallery** (when feature available) |
| Previous Gardens | “No previous Gardens yet.” | No additional CTA needed |

Keep these states simple and usable in both modes. A user may have Previous Gardens but no Current Gardens, or vice versa; show empty states **per section**, based on actual records/status. For not-yet-implemented Gallery or other features, do **not** offer a dead action; match the implemented routes and feature readiness. Loading, unavailable storage, and errors must be distinguishable from a genuinely empty dataset. CTA buttons route into existing flows rather than creating new duplicate editors. Copy can be refined for consistency and accessibility during implementation.

**Responsive behavior:** Use separate, independently swipeable **Bootstrap 6 Carousel** rails for the Garden and Gallery categories, aiming for roughly **two usable cards on narrow phones and up to six on wider screens**, without squeezing content. Prefer testing the pinned Bootstrap 6 Carousel (scroll snap, touch and multi-item behavior) before installing SwiperJS; see [Bootstrap 6 Carousel docs](https://getbootstrap.com/docs/6.0/components/carousel/). Disable autoplay and avoid surprise looping. Lists should reflow naturally instead of forcing Tasks and Wish List into carousel controls.

**Open details:** exact Garden field mapping and missing-value presentation; Garden status grouping and ordering; card dimensions and thumbnail treatment; item labels/date presentation and the stable sort fallback for five-item previews; Gallery metadata/readiness; final empty-state wording; and the exact Simple/Standard Mode composition. The mixed-rail-and-list structure, five-most-recent-item read-only previews, section order, and full-page editing boundary are **approved**. The horizontal rails target roughly two usable cards on narrow phones and up to six on wider screens; validate the pinned Bootstrap 6 Carousel's touch/scroll-snap behavior before considering another library. No autoplay or surprise looping.

### B. Gardens hub, discovery, and lifecycle

**Evidence:** Unfinished drafts can dominate the page; a new Garden may be hard to find; draft is not Planned; long names distort cards.

**Approved separation:** Garden drafts **never appear on the Home dashboard** or inside Current/Planned/Previous Gardens collections. They are unfinished creation sessions, not existing Gardens.

**Approved V1 direction:** On `/gardens`, show unfinished Garden creation drafts in a **dedicated horizontal Draft Gardens filmstrip**, rather than a vertically stacked list. Include all drafts in the horizontally scrollable rail; do not arbitrarily limit the collection to five. Each card identifies the draft and offers **Continue/Resume** into its existing Wizard or Advanced editor. The intent is to reduce the rail's vertical footprint while keeping every draft discoverable. This changes presentation only: preserve existing draft IDs, autosave, recovery, mode selection, and atomic create/discard behavior. Use the pinned Bootstrap 6 Carousel if its touch/scroll behavior meets requirements; do not add SwiperJS without a demonstrated need.

**Still open:** where the rail sits relative to Current/Planned/Previous; exact card metadata and actions; empty-state treatment; and how the other Garden categories are browsed.

**Deferred (possibly V2):** A **Show drafts on Garden dashboard** checkbox could show the Draft Gardens filmstrip on `/gardens` when checked or replace it with a **Drafts** button to a proposed `/drafts` page when unchecked. Drafts remain intact and resumable in either case; they never appear on Home. **Do not implement the toggle or new route in V1.** See [PARKING_LOT.md](PARKING_LOT.md) for unresolved details.

**Open:** order and presentation of Current, Planned, and Previous groups; whether Current means Active only; whether other groups use rails, tabs, lists, or a hybrid; whether filtered routes are useful; where Templates and Create Garden actions appear; and Garden card title clamping/maximum-length policy. **Planned is a saved Garden status, not a draft.** The old “What do you want to do?” selector and visibility preference remain alternatives in PARKING_LOT.md, not V1 requirements.

### C. Quick Start, Wizard, Advanced, and drafts

**Evidence:** Quick Start name field beside Wizard/Advanced links implies a continuous form even though they are three separate creation flows. Wizard Details resembles the Advanced form; validation errors may appear below the viewport.

**Evaluate:** three visibly distinct entry choices (possibly cards), with no implication that typed Quick Start input carries into another method unless explicitly designed. Guided Wizard uses smaller named steps and reusable controls; Advanced remains consolidated. Clearly label unnamed drafts. Ensure invalid fields/errors are visible immediately.

**Preserve:** existing draft IDs, autosave, no overwrite of existing drafts by incidental prefill, atomic create/cleanup, and independent saved Garden status.

**Open:** creation choice screen, optional new-draft prefill, actual Wizard steps, and step-resume metadata. Do not add steps requiring unimplemented PlantDB/appearance features simply to fill a Wizard. The modular step-registry concept and earlier prototype references remain in [PARKING_LOT.md](PARKING_LOT.md) as implementation/design options, not an approved exact step contract.

### D. Templates and Notes

**Templates:** make Save as Template versus Apply Template discoverable; suppress creation-form Template wording if there are no Templates (except a draft with missing applied source); display effective Default Location when a Template's saved Location is deleted; keep immutable Template source record; move raw UUIDs to optional troubleshooting details. Editing Templates is not yet approved.

**Notes:** evaluate Garden-grouped Bootstrap 6 accordion, Unassigned Notes, live filtering, and linked-Garden indicators; keep existing independent Note records and Garden associations. No folder/file-manager model or drag/drop reassociation.

### E. Lists and Search

**Lists:** consider a combined `/lists` dashboard for Tasks and Wish List with separate Add controls; keep current `/tasks` and `/wishlist` access and underlying shared data.

**Search:** approved responsive navbar input (wide) or icon-triggered panel (narrow) with a shared submit action targeting `/search?q=...`; defer actual cross-feature search behavior to its scheduled milestone unless scope is explicitly changed. Query parameters should be treated as input, not authority to perform writes.

### F. Responsive polish and UI feedback

Remove scaffolding copy (“Simple Mode preview,” “workspace placeholders,” etc.) before V1 release. Review card ordering (Gardens first candidate; Tasks then Wish List), header alignment, logo treatments, responsive sidebar collapse, touch targets, keyboard navigation, focus and accessible labels. Follow [UI_CONVENTIONS.md](UI_CONVENTIONS.md) for native links/buttons, Bootstrap 6 Dialog/Drawer, explicit Save/Close semantics, and recoverable feedback. Test real devices and both interface mode overrides, not just viewport simulations.

## 8. Consolidated decision status before Codex implementation

### Approved decisions

- [x] Shared Preact + `preact-iso` application, Bootstrap 6, existing routes/data services, and both selectable Simple/Standard modes remain the foundation.
- [x] Persistent navbar in both modes; SOLACE logo is the sole Home link; no separate Home button or sidebar entry.
- [x] Typical responsive shell presentations from the three sketches are approved: large Standard Mode with expanded sidebar; medium Standard Mode with collapsed iconbar and an explicitly opened overlay sidebar that does not push/reflow the workspace; small Simple Mode with card-based navigation/actions and no persistent sidebar.
- [x] Preserve manual Simple/Standard selection at every viewport width; the sketches describe the intended Automatic presentations, not device restrictions.
- [x] Primary navigation order: **Gardens → Journal → Gallery → PlantDB** (PlantDB last).
- [x] Global tool order: **Tasks → Notes → Wish List → Calendar**; Journal is not a permanent toolbar tool.
- [x] Exactly one navbar More item contains Help, About, Settings, and any global tools overflowed at narrow widths. Welcome is linked from Help, not directly from More.
- [x] Settings has no separate gear or sidebar item; preserve its route and return/Close behavior.
- [x] Add New (+) and Search are global navbar actions in both modes. At narrow widths keep Add New and Search visible; use one More trigger for overflow/support destinations.
- [x] Wide Search uses an inline query field; narrow Search uses an icon that opens a full-width panel immediately below the navbar. The target results URL is `/search?q=...`; the cross-feature engine remains a later feature.
- [x] Hide the full “SOLACE Garden” wordmark on narrow screens and retain the logo icon; exact breakpoint remains open.
- [x] Home (`/`) is an overview dashboard with five sections, in order: **Current Gardens, Tasks, Wish List, Gallery, Previous Gardens**.
- [x] Home uses real data and View all links, not category-only tiles. Garden cards show Title, Subtitle, Start Date, with thumbnail support later; Previous includes Closed, Completed, Archived.
- [x] Gallery preview is a horizontal rail of most recently added images, newest first.
- [x] Tasks and Wish List show five most recently added items (or fewer) as read-only, Nextcloud-style previews; editing remains on `/tasks` and `/wishlist`.
- [x] Home empty states are concise, per-section, and distinct from loading/errors; use useful actions where appropriate, with no forced CTA for Previous Gardens.
- [x] No unfinished drafts on Home. V1 `/gardens` uses a compact horizontal Draft Gardens rail containing all drafts and Continue/Resume actions; exact rail placement and card details remain open.
- [x] Show Welcome at startup defaults on for new installations; full-page Welcome, direct links preserved, Welcome reachable from Help, and startup preference stored in existing local UI settings.
- [x] Welcome carousel purpose: short, skippable Bootstrap 6 feature overview, introduce Gardens, and lead to Create Your First Garden in the existing Wizard.

### Still open for design

- [ ] Navbar iconography, available-width thresholds for wordmark/search/nav overflow (using Bootstrap breakpoint tokens), overflow priorities, and the pinned Bootstrap 6 Nav overflow/More integration.
- [x] Use Bootstrap 6 default breakpoints: `sm` 576px, `md` 768px, `lg` 1024px; shell presentations are below `md` (automatic Simple), `md` to below `lg` (Standard iconbar with overlay expansion), and `lg`+ (Standard expanded sidebar).
- [ ] Validate proposed 60px iconbar and 300px expanded sidebar/panel widths, including their relationship/combined footprint.
- [ ] Finalize Simple Mode card contents and grouping; define the Standard Mode small-screen (`sm`) layout and the selected-mode responsive treatment at other viewport sizes. Preserve the existing Settings mode selector and allow Standard Mode on phones.
- [ ] Specify the navigation Drawer implementation details and acceptance tests: trigger/close control placement, focus destination after selecting a navigation link, responsive dismissal when crossing breakpoints, and verification of Bootstrap's native modal/focus behavior on supported browsers.
- [ ] Add New menu contents, ordering, and relationship to page-specific Create actions (including whether New Journal Entry belongs there).
- [ ] Home card dimensions, field mapping/missing values, preview row labels/dates/sort fallback, Gallery image sizing/metadata, and Simple/Standard density differences.
- [ ] Validate Bootstrap 6 Carousel touch/scroll-snap behavior for Home and Draft Gardens rails on real devices; confirm card widths, visible count, scroll affordances, and keyboard access.
- [ ] Gardens hub order and presentation for Current, Planned, Previous; meaning of Current versus Active; Draft rail placement; Templates/Create Garden entry points; need for any filtered routes.
- [ ] Garden card long-title clamp and whether to enforce a generous name-length limit.
- [ ] Welcome slide count, copy, artwork, CTA placement, and accessible responsive controls.
- [ ] Quick Start/Wizard/Advanced choice screen, safe carry-forward behavior, actual Wizard steps, validation visibility, and resume-step behavior.
- [ ] Templates and Notes contextual UI; grouped Notes/search/linked-Garden indicators; whether a combined Lists overview is worthwhile.
- [ ] Help/About content and contextual navigation treatment; Harvest placement; Search's harmless interim state until the search feature exists.
- [ ] Define the boundary between this pre-8G UI redesign and UI work deferred until the relevant V1 feature exists.
- [ ] Prepare and approve annotated layouts for the shell, Home, Gardens, Welcome, and Garden creation before implementation prompts are written.

## 9. Implementation punch list — proposed sequence

**Plan:** nine separately reviewable steps. Step 1 is an architecture/inventory pass with no intended visual change; Steps 2–8 implement the redesign in focused slices; Step 9 is integrated acceptance. Do not combine these into one broad Codex task. Each step gets its own prompt, tests, review, and manual acceptance before proceeding.

### Step 1 — Existing-code audit and route/navigation separation

**Purpose:** Understand and prepare the infrastructure we already have; do not redesign the visible interface yet.

- Audit the current shell and dependencies: `AppShell` in `src/index.jsx`, `Header`, `StandardNavigation`, `navigation.js`, `InterfaceModeContext`, `interfaceMode.js`, shared CSS, and existing tests.
- Record which existing components/styles can be retained, extended, or retired. Avoid replacing working components just because the visual design is changing.
- Separate route matching/definitions from visible navigation configuration. Today `navigation.js` combines route records, navigation groups, and route presentation metadata; change this only as much as needed to support the approved information architecture.
- Preserve all existing paths, deep links, route matching, Garden/Note editor routes, unknown-route handling, and Settings return-to-origin behavior.
- Remove the assumption that every route must belong to a user-facing “workspace” group. Navigation placement is a separate concern from route existence.
- Add/update unit tests for route resolution and navigation configuration.

**Acceptance:** No intentional visual change; all existing URLs and route behavior continue to work; tests cover route matching and Settings return behavior; a clear route-to-navigation map exists for the next step.

### Step 2 — Generalize the existing AppDrawer

**Purpose:** Extend the component already in the repository rather than build a second drawer system.

- Add a placement API supporting `top`, `end`, `bottom`, and `start`; preserve `bottom` as the default so the existing contextual-information drawer remains unchanged for current callers.
- Use shared base styling plus four placement modifiers. Keep placement-specific geometry in CSS: width/height, edge attachment, inner-facing border radius, transition direction, scrolling, and safe-area handling.
- Separate the reusable dialog/drawer lifecycle from the current fixed information trigger so a caller such as Standard Navigation can provide its own trigger and drawer content. Keep the existing information-trigger experience working.
- Reuse Bootstrap 6 Drawer and the current lifecycle/focus-restoration patterns. Avoid duplicating Bootstrap's dialog/focus behavior or adding another drawer dependency.
- Keep the navigation drawer modal while open, with labelled close control, Escape/backdrop dismissal, keyboard operation, visible focus, and focus restoration. Define what happens when a navigation link is selected and when the viewport crosses a shell breakpoint.
- Add component tests where practical and a manual placement matrix for all four directions; verify the existing bottom drawer at phone and desktop sizes.

**Acceptance:** All four placements render and dismiss correctly; bottom remains the default and existing behavior is preserved; focus and keyboard behavior work; no duplicate or conflicting Bootstrap instances/listeners.

### Step 3 — Standard Mode shell and navigation

**Purpose:** Implement the approved Standard Mode application shell using the existing Header and StandardNavigation as starting points.

- Build the persistent top navbar and its approved destinations/actions: logo/Home, primary navigation, global tools, Search, Add New, and one More menu.
- Implement the large-screen layout (`lg` and up): expanded sidebar, provisionally 300px wide.
- Implement the medium layout (`md` to below `lg`): persistent 60px iconbar; explicit control opens a provisionally 300px `start` Drawer overlay. The workspace must not move or resize.
- Preserve the existing Settings mode selector and allow manually selected Standard Mode on phones. Before coding that phone layout, approve a compact Standard Mode wireframe; do not silently switch the selected mode to Simple.
- Apply the agreed narrow-screen wordmark behavior and keep Add New, Search, and exactly one More trigger visible.
- Implement active-route indication, accessible names for icon-only controls, touch targets, keyboard navigation, and focus behavior.
- Do not implement new Search functionality or unrelated feature logic as part of the shell.

**Acceptance:** Approved destinations are reachable; route/deep-link and Settings-return behavior remain intact; large/medium/phone Standard Mode layouts work at the selected breakpoints; the medium Drawer overlays without reflow; navigation is usable with keyboard and touch.

### Step 4 — Simple Mode card-based navigation

**Purpose:** Give Simple Mode its own focused presentation without changing routes, data, or feature behavior.

- First approve the Simple Mode card inventory, labels, grouping, order, and representative phone/tablet/desktop arrangements. These details are still TBD; do not invent the final card set in the implementation prompt.
- Implement the approved cards using existing route destinations and actions.
- Adapt the card grid to available width, including manually selected Simple Mode on large screens.
- Preserve the existing Automatic/Simple/Standard preference and resolver; do not add another selector.
- Check card semantics, accessible names, focus states, and touch target sizing.

**Acceptance:** Simple Mode is coherent at narrow and wide sizes; every card leads to the correct existing destination/action; changing mode does not change data or lose work.

### Step 5 — Home dashboard

**Purpose:** Implement the approved Home overview in both modes, with appropriate presentation density.

- Implement the five approved sections in order: Current Gardens, Tasks, Wish List, Gallery, Previous Gardens.
- Garden and Gallery content uses horizontal visual rails; Tasks and Wish List show up to five most recently added items as read-only previews.
- Keep drafts off Home. Editing remains on the relevant full page.
- Implement the approved Garden card fields, recent-image ordering, Previous Garden statuses, View all links, and per-section empty states.
- Validate Bootstrap 6 Carousel touch/scroll behavior and responsive card counts before considering another library.
- Reuse existing data services; do not duplicate editing or persistence logic in Home.

**Acceptance:** Correct records and ordering appear; previews remain read-only; empty/loading/error states are distinct; rails work with touch, keyboard, and responsive layouts; no draft appears on Home.

### Step 6 — Gardens hub and draft discovery

**Purpose:** Make saved Gardens and unfinished creation sessions easy to distinguish and find.

- Finalize the Gardens hub grouping/order for Current, Planned, and Previous; confirm the exact meaning of Current versus Active against the existing Garden status contract.
- Implement the approved horizontal Draft Gardens rail on `/gardens`, containing all unfinished drafts with Continue/Resume actions.
- Keep draft creation sessions distinct from saved Gardens, including saved Gardens with Planned status. Make unnamed drafts recognizable.
- Finalize Garden card details, long-title treatment, Create Garden entry point, and Templates access.
- Preserve existing draft IDs, autosave, recovery, mode selection, and atomic create/discard behavior. No obsolete alpha-data compatibility or migration work.

**Acceptance:** Users can distinguish saved Gardens from drafts, find each Garden category, and resume every draft in its correct editor; existing Garden lifecycle and draft persistence tests pass.

### Step 7 — Welcome and Garden creation presentation

**Purpose:** Complete the first-run introduction and make Garden creation choices understandable.

- Design and implement the approved Welcome startup preference and short, skippable Bootstrap 6 feature/Gardens carousel.
- Preserve direct/deep links, Help access to Welcome, and the existing startup preference behavior.
- Finalize the Quick Start/Wizard/Advanced choice presentation so the choices are clearly distinct and any carried-forward values are explicit and safe.
- Finalize Wizard steps, validation visibility, resume behavior, and narrow-screen presentation.
- Preserve existing draft recovery and editor workflows; do not create a second onboarding wizard or add steps for features that do not exist.

**Acceptance:** First-run and returning-user behavior is correct; Welcome can be revisited; users understand the creation choices; Wizard/Advanced drafts survive reload and mode changes; create/discard safeguards remain intact.

### Step 8 — Contextual and secondary page refinements

**Purpose:** Finish the remaining page-level navigation and presentation work without expanding feature scope.

- Refine Templates entry points and management presentation.
- Refine Notes navigation, grouped browsing/search, and linked-Garden context where supported by current functionality.
- Confirm Tasks/Wish List full-page editing boundaries and any Lists overview entry point.
- Design Help/About, Settings access through More, Locations under Settings, and contextual Harvest access.
- Keep unfinished Search behavior harmless until the Search feature is implemented.
- Defer feature functionality that is not part of the approved V1 redesign.

**Acceptance:** Every approved destination has a clear entry and return path; no obsolete duplicate Settings entry remains; existing page workflows continue to work.

### Step 9 — Integrated responsive and regression acceptance

- Test Automatic, Simple, and Standard preferences at phone, tablet portrait/landscape, and desktop sizes, including manually selected modes at non-default widths.
- Test all four AppDrawer placements and the Standard navigation overlay, including keyboard, Escape, backdrop, focus entry/return, and breakpoint changes.
- Re-run existing unit, component, and integration tests; add coverage for new navigation behavior.
- Re-test Garden/Template creation, draft recovery, Notes, Lists, Settings return paths, and all important deep links.
- Verify installed PWA startup, offline use, refresh/update behavior, and no accidental data loss.
- Resolve review findings and update `UI_REVIEW_NOTES.md`, `UI_CONVENTIONS.md`, and this document as appropriate before resuming feature milestone 8G.

**Acceptance:** All approved layouts and navigation paths pass manual and automated checks; existing accepted workflows remain intact; no redesign regression blocks continuing V1 development.

---

**Codex workflow:** Before each step, prepare one narrowly scoped prompt listing exact files to inspect/change, intended behavior, explicit exclusions, tests, and manual acceptance criteria. Codex should inspect the current implementation before proposing edits. Keep each step independently reviewable and committed. Do not issue the next step's implementation prompt until the current step passes acceptance.

## 10. Acceptance criteria to expand when design is approved

- All existing accepted Garden and Template flows still work, including draft recovery, deletion safeguards, Template fallback, reload, and normal persistence.
- `/`, `/gardens`, `/templates`, `/locations`, `/settings`, and existing Garden/Notes deep links resolve correctly; unknown routes retain a useful fallback.
- Every intended destination is reachable from the approved navigation without exposing every route as a top-level link.
- Navigation semantics remain understandable and consistent between Simple and Standard modes; changing interface mode does not change the underlying records or unexpectedly lose form state.
- Responsive layouts work on tested phone/tablet portrait and landscape/desktop sizes; touch targets and keyboard access follow UI conventions.
- Global/near-global controls do not bypass dirty-form guards or trigger accidental writes.
- Installed offline PWA startup, normal navigation, and non-disruptive update behavior remain intact.
- No migration/backward-compatibility work is introduced merely to preserve obsolete alpha test data.

## 11. Decision log

This log summarizes the approved decisions. Sections 6–8 are the detailed source of truth for placement, rationale, and unresolved design details.

| Date | Status | Decision |
| --- | --- | --- |
| 2026-11-14 | **Approved** | Keep the persistent navbar in both modes; logo-only Home access; primary navigation order Gardens, Journal, Gallery, PlantDB; global tools order Tasks, Notes, Wish List, Calendar. |
| 2026-11-14 | **Approved** | One More menu contains Help, About, Settings, and tools overflowed at narrow widths. Add New and Search stay visible on narrow screens. Settings has no separate gear/sidebar entry. |
| 2026-11-14 | **Approved** | Search is inline in the wide navbar and opens a full-width below-navbar panel from an icon on narrow screens; results target `/search?q=...` when the later Search feature exists. |
| 2026-11-14 | **Approved** | Narrow-screen branding shows the logo without the full wordmark. Global Add New is in the navbar in both modes; its menu contents remain open. |
| 2026-11-14 | **Approved** | Responsive shell direction: large Standard Mode uses an expanded sidebar; medium Standard Mode uses a collapsed iconbar with an explicitly opened overlay sidebar that does not push the workspace; small-screen automatic presentation uses Simple Mode cards without a persistent sidebar. Use Bootstrap 6 `sm` (576px), `md` (768px), and `lg` (1024px) breakpoints. Proposed 60px iconbar and 300px expanded panel widths require validation. Preserve the existing Settings mode selector: manual Standard Mode remains available on phones and must use a compact `sm` layout. |
| 2026-11-14 | **Approved** | Home is a real-data dashboard: Current Gardens, Tasks, Wish List, Gallery, Previous Gardens. Garden and Gallery rails; five-item read-only Tasks/Wish List previews; per-section empty states; no drafts on Home. |
| 2026-11-14 | **Approved** | Garden cards show Title, Subtitle, Start Date; thumbnail support may be added later. Previous Gardens includes Closed, Completed, Archived. Gallery shows most recently added images. |
| 2026-11-14 | **Approved** | On `/gardens`, show all unfinished drafts in a compact horizontal rail with Continue/Resume actions. Other Garden group layout/order remains open. |
| 2026-11-14 | **Approved** | Welcome startup preference defaults on for new installations; full-page Welcome, direct links preserved, Help revisit, and a short skippable feature/Gardens carousel leading to the existing Wizard. Carousel slide details remain open. |
| 2026-11-14 | **Agreed direction** | Retain Preact + `preact-iso` and separate route existence from navigation placement; avoid a new routing framework or a mandatory “workspace” taxonomy. Implementation/refactor scope remains to be validated. |

**Next design session:** Finalize the application shell and responsive layouts first. Then complete the Home/Gardens, Welcome, and creation wireframes. Do not issue broad Codex implementation prompts until the relevant page/state layout and acceptance criteria are approved.
