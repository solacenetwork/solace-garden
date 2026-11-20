# SOLACE Garden — UI Redesign Plan

**Status:** Authoritative UI decision record — approved direction consolidated; detailed layouts and responsive states remain open.  
**Started:** November 14, 2026  
**Development position (November 16, 2026):** UI redesign Steps 1–5 and supplemental Steps 4.5A/B accepted. Step 5.5 local Playwright foundation accepted with 57/57 tests passing on the developer's desktop (49.6 seconds); see [TESTING_NOTES.md](TESTING_NOTES.md). Steps 6A–B Hub structure, navigation, and Garden cards are implemented for review but not accepted; Steps 6C–D, 6.5, and 7–10 remain ahead of Milestone 8G.

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
| Everyday shortcuts require extra navigation | Search page before query; Tasks and Wish List dispersed | Consider header Search; defer a shared Lists overview to V2 |
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
- **Small screens — Simple Mode automatic presentation (below `md`):** persistent top navbar, no permanently visible sidebar, and a two-column card presentation for primary navigation. Gardens spans the full row; Tasks/Journal, Calendar/Notes, and Wishlist/Plant DB form three paired rows. At `md` and above, manual Simple uses three columns below the full-width Gardens card.
- **Breakpoint tokens:** use Bootstrap 6's default responsive breakpoints, not custom one-off pixel thresholds: `sm` = 576px, `md` = 768px, and `lg` = 1024px. The `sm` token is available for card/grid refinements; the shell's main presentation transitions are below `md`, `md`–below `lg`, and `lg`+.
- The sketches describe the intended **Automatic** responsive presentations, not a restriction on mode choice. The existing Settings page (`src/pages/Settings/index.jsx`) already provides Automatic, Simple, and Standard choices; both manual modes are explicitly described as applying at every screen size. Preserve this selector and its behavior—do not add a second mode selector or disable Standard Mode on phones. In Automatic mode, the existing resolver (`src/services/interfaceMode.js`) selects Simple below the `md` threshold (currently `(max-width: 47.999rem)`) and Standard at/above it. If Standard is manually selected on a phone, it remains Standard and its shell must adapt using the small-screen (`sm`) responsive layout rather than switching modes.
- **Provisional dimensions to validate:** collapsed iconbar width **60px**; expanded navigation sidebar/panel width **300px**. Treat these as design starting points, not final constraints. Confirm whether the 300px panel is measured independently of the persistent 60px iconbar when producing the annotated layout.
- Sidebar expansion must be explicitly activated and usable by touch and keyboard; do not rely on hover. The overlay must not reflow or resize the underlying workspace.
- **Existing component:** `src/components/AppDrawer.jsx` already implements a Bootstrap 6 bottom-positioned contextual-information Drawer, including trigger focus restoration and lifecycle cleanup. Its current props are `id`, `title`, `triggerLabel`, and `children`; it does **not** currently accept a placement/position prop. The rendered `<dialog>` hard-codes `class="drawer drawer-bottom app-drawer"`. Bootstrap's Drawer supports positional classes, so the wrapper could be generalized with a `placement` prop (defaulting to `bottom`) or the navigation shell could use a dedicated Drawer component. Do not assume the existing wrapper is already position-configurable. Its current trigger/content purpose is also contextual information rather than primary navigation. For the medium-screen navigation overlay, use a left/start placement (`drawer-start` in LTR) and reuse the lifecycle/focus patterns where appropriate.
- **Approved accessibility/dismissal behavior:** Follow Bootstrap 6 Drawer and native `<dialog>` behavior rather than creating custom focus management. The navigation overlay is modal while open: use the native dialog's modal focus handling/trap and backdrop; Escape and backdrop activation dismiss it; provide an accessible name via `aria-labelledby` and an explicitly labelled close control; move focus into the drawer when opened and restore it to the invoking control when closed. Keep keyboard operation, visible focus, adequately sized touch targets, and Bootstrap's reduced-motion behavior. Do not disable Escape/backdrop dismissal without a documented accessibility or workflow reason.

**Still open:** exact shell icon artwork; final confirmation of the 60px iconbar and 300px panel dimensions (including their combined footprint); priority of the four tools when space is constrained; how deliberate More destinations combine with Bootstrap 6 Nav overflow; Add New menu entries/order and their relationship to page-specific Create actions; header container/padding; and remaining device-specific layouts. The existing Settings selector remains available at every width, including Standard Mode on narrow phones. Journal remains a primary navigation destination, not a permanent toolbar tool. Welcome design details are in Section 7A.

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

**Evidence:** Drafts dominate the existing Gardens page; newly created Gardens can be hard to find; people confuse drafts with saved Planned Gardens. The priority is fast access to **Current Gardens**.

**Established distinction:** A **Garden Draft** is an unfinished autosaved proposal, not a saved Garden. A **Planned Garden** is a saved Garden with Planned lifecycle status. Autosaving or leaving a draft never creates a Garden. Explicit completion does. Drafts do not appear on Home or inside saved Garden collections. Preserve current data and lifecycle behavior.

**November 16 Step 6 design hypothesis (prototype and manually test before accepting):**
- Header actions, left to right: **Locations → Templates → Create Garden**. Make Create Garden visually prominent; the other two are secondary contextual shortcuts. Keep Locations available through Settings and preserve both `/locations` and `/templates` URLs; remove floating/indented links from Standard sidebar navigation.
- Hub section order: **Draft Gardens horizontal filmstrip → Current Gardens → Planned Gardens → Previous Gardens**. Current Gardens must remain quickly accessible; Current, Planned and Previous are proposed vertical lists.
- The compact Draft Gardens filmstrip horizontally scrolls through **all unfinished drafts**, with only a few visible at a time. A **View All** link opens a dedicated **`/gardens/drafts`** page displaying a vertical list of draft cards. Register this route before `/gardens/:id`.
- Draft cards resume the correct existing Wizard or Advanced editor; preserve draft IDs, autosave, recovery, selected mode, and safe create/discard. Evaluate accessible horizontal scrolling with Bootstrap 6 before considering other libraries.
- Contextual explanation for Help and the UI: **“A draft is a Garden you're still creating. A planned Garden is one you've already created but haven't started yet.”** Draft and existing-Garden editors need unambiguous text labels; optional visual color cues belong in Step 10.

**Superseded earlier V1 constraint:** The proposed `/gardens/drafts` View All page replaces the older statement that no dedicated Drafts route should be added. A visibility preference for hiding the filmstrip remains deferred and is **not** part of Step 6.

**Step 6B card decision (implemented for review November 16, 2026):** Hub cards use the prototype's vertical, image-first structure with flexible 18rem minimum height and a consistent 8.5rem contained illustration area. Saved cards show title, optional subtitle, and optional start date; Location and lifecycle badges remain off the card. Drafts share the structure while keeping resume and discard as separate controls. Presentation-only SVG defaults are Wheelbarrow for Draft, Flowers for Current, Tools for Planned, and Veggies for Previous; asset paths are not persisted.

**Still open:** Draft metadata and empty-state refinement, top-action responsive layout, accessibility, Current vs Active contract semantics, and real-device acceptance. No thumbnail/media support is required. Icon/color identity selection is explicitly deferred to Step 6.5. These are **proposals**, not accepted UI.

### C. Quick Start, Wizard, Advanced, and drafts

**Evidence:** Quick Start alongside Wizard and Advanced looks like one continuous form, though the choices currently start independent workflows. Wizard Details resembles Advanced; validation may appear below the viewport.

**November 16 Step 7 creation hypothesis (prototype before accepting):** Make Quick Start the **first step of the Wizard**, rather than presenting three parallel choices. Keep **Advanced** as a separate consolidated editor. The first Wizard step collects minimal valid Garden details (candidate: name and location), then offers:
- **Save & Finish:** explicitly creates a saved Garden with defaults, as the quick path, **only on the first step**.
- **Add More Details:** enters the guided remaining Wizard steps **without creating** a Garden.
- **Finish Later:** exits with the autosaved **draft**, not a saved Garden; visually subordinate to the two main choices.

After the first step, the Wizard must proceed through named steps and create only at a final explicit save/confirmation; **no quick-create Save & Finish button on intermediate steps**. Avoid repeating the Gardens Hub's **Create Garden** wording inside the Wizard. Advanced remains distinct.

**Preserve:** existing draft IDs, autosave, recovery, mode selection, dirty-form safeguards, no incidental overwrites, atomic creation/discard, and draft-versus-Planned separation. Do not write alpha backward-compatibility or migration code solely for disposable old records.

**Still open:** Entry screen, minimum valid fields and defaults, precise Wizard steps and final save text, resume-step metadata, validation focus behavior, and mobile layouts. Do not invent feature steps for functionality not yet implemented. See [PARKING_LOT.md](PARKING_LOT.md) for exploratory alternatives.

### D. Templates and Notes

**Templates:** make Save as Template versus Apply Template discoverable; suppress creation-form Template wording if there are no Templates (except a draft with missing applied source); display effective Default Location when a Template's saved Location is deleted; keep immutable Template source record; move raw UUIDs to optional troubleshooting details. Editing Templates is not yet approved.

**Notes:** evaluate Garden-grouped Bootstrap 6 accordion, Unassigned Notes, live filtering, and linked-Garden indicators; keep existing independent Note records and Garden associations. No folder/file-manager model or drag/drop reassociation.

### E. Lists and Search

**Lists (V1):** Keep Tasks and Wish List as separate accessible destinations at `/tasks` and `/wishlist`, with their existing full-page editing workflows and underlying data. A combined `/lists` overview is **deferred to V2 consideration**; see [PARKING_LOT.md](PARKING_LOT.md).

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
- [x] Simple Mode uses seven cards in order: Gardens, Tasks, Journal, Calendar, Notes, Wishlist, Plant DB. Gardens is full-width; the remaining cards use two columns below `md` and three columns at/above `md`, including manual Simple on wide screens.
- [ ] Specify the navigation Drawer implementation details and acceptance tests: trigger/close control placement, focus destination after selecting a navigation link, responsive dismissal when crossing breakpoints, and verification of Bootstrap's native modal/focus behavior on supported browsers.
- [ ] Add New menu contents, ordering, and relationship to page-specific Create actions (including whether New Journal Entry belongs there).
- [ ] Home card dimensions, field mapping/missing values, preview row labels/dates/sort fallback, Gallery image sizing/metadata, and Simple/Standard density differences.
- [ ] Validate Bootstrap 6 Carousel touch/scroll-snap behavior for Home and Draft Gardens rails on real devices; confirm card widths, visible count, scroll affordances, and keyboard access.
- [ ] Gardens hub order and presentation for Current, Planned, Previous; meaning of Current versus Active; Draft rail placement; Templates/Create Garden entry points; need for any filtered routes.
- [ ] Garden card long-title clamp and whether to enforce a generous name-length limit.
- [ ] Welcome slide count, copy, artwork, CTA placement, and accessible responsive controls.
- [ ] Quick Start/Wizard/Advanced choice screen, safe carry-forward behavior, actual Wizard steps, validation visibility, and resume-step behavior.
- [ ] Templates and Notes contextual UI; grouped Notes/search/linked-Garden indicators. A combined Lists overview is deferred to V2 consideration.
- [ ] Help/About content and contextual navigation treatment; Harvest placement; Search's harmless interim state until the search feature exists.
- [ ] Define the boundary between this pre-8G UI redesign and UI work deferred until the relevant V1 feature exists.
- [ ] Prepare and approve annotated layouts for the shell, Home, Gardens, Welcome, and Garden creation before implementation prompts are written.

## 9. Implementation punch list — proposed sequence

**Plan:** ten separately reviewable main steps, with a proposed local Playwright testing checkpoint between Steps 5 and 6. Step 1 is an architecture/inventory pass with no intended visual change; Steps 2–8 implement the redesign in focused slices; Step 9 is integrated responsive/regression acceptance; Step 10 is a focused post-review UI polish pass based on observed usability issues, with targeted regression verification before sign-off. Supplemental Steps 4.5A/B covered Carousel research and implementation. Do not combine these into one broad Codex task. Each step gets its own prompt, tests, review, and manual acceptance before proceeding.

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

**Implementation status (November 15, 2026):** Step 3B shared Header is complete (`7de7ea3`). Step 3C implements the fixed 300px desktop sidebar at 1024px+, the fixed 60px iconbar at 768–1023px, and a 300px total-width start AppDrawer overlay covering the iconbar without workspace reflow. Both expanded presentations use Gardens (with nested Templates), Journal, Gallery, PlantDB; the iconbar contains only the four primary destinations. Breakpoint changes unmount the navigation Drawer and provide visible focus fallbacks. The global About this workspace disclosure is removed. Below 768px, manual Standard retains its temporary full-width collapsible navigation; the final phone Standard presentation remains Step 3D. Legacy Home, Simple Mode, interface preferences, shared Header and Information Drawer remain unchanged.

**Step 3D implementation status (November 15, 2026):** Compact phone Standard navigation is implemented below 768px: a Navigation button and noninteractive current-destination label in a normal-flow strip beneath the existing Header, above full-width routed content. Phone and medium use the same 300px start AppDrawer and shared navigation links. Crossing their boundary closes/remounts the Drawer with a visible focus fallback; desktop retains its expanded sidebar. Automatic and manual mode preferences remain unchanged. This completes Standard Mode responsive navigation; Simple Mode and Home redesign remain separate future work.

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

**Implementation status (November 15, 2026):** Complete. Simple Mode renders exactly seven registry-backed native-link cards in the approved order: Gardens, Tasks, Journal, Calendar, Notes, Wishlist, Plant DB. Gardens is the featured full-width card. Below `md`, the other cards form three paired rows; at `md` and above they form two rows of three within a centered width. The presentation-only Wishlist and Plant DB labels leave canonical route labels unchanged. The legacy Simple workspace directory and preview scaffolding are removed. Standard Home, shared Header, Standard navigation, routes, interface-mode resolution, and storage are unchanged.

- `simpleCardIds` owns placement only; each card resolves its existing path and icon with `findRouteById()`.
- All cards are native links with visible icon and text, full-surface targets, visible focus, responsive spacing, and reduced-motion handling.
- Manual Simple uses the same responsive grid at every viewport width. Automatic and manual Standard behavior remain independent.
- The cards remain a focused component so Step 5 can position them alongside the later data-backed Home overview without changing their navigation contract.

**Acceptance:** Simple Mode is coherent at narrow and wide sizes; every card leads to the correct existing destination/action; changing mode does not change data or lose work.

### Step 4.5A — Bootstrap 6 card Carousel proof of concept

**Implementation status (November 15, 2026):** The isolated development-only `/dev/carousel` experiment is implemented and documented in [CAROUSEL_POC.md](CAROUSEL_POC.md). It evaluates static Garden, Gallery, and zero-to-three-card collections with the pinned Bootstrap 6.0.0-alpha.1 scroll-snap Carousel. Automated component/lifecycle tests, a headless Chromium responsive matrix, and physical-phone touch acceptance passed. The production route registry, navigation, storage startup, production bundles, and PWA precache exclude the development harness and sample data.

### Step 4.5B — Reusable Preact CardCarousel

**Implementation status (November 15, 2026):** The generic production `CardCarousel` is implemented with a children-based API, accessible label, optional explicit ID/class, stable generated instance identity, explicit Bootstrap construction/disposal, local overflow observation, and local recreation for actual child membership/order mutations. Container-query defaults carry the accepted two-to-six-card responsive behavior into constrained content areas as well as full-width pages. The `/dev/carousel` harness now exercises the production component with static, short, dynamic, and constrained collections. Step 5 now consumes two independent production instances without changing the component; physical-device regression testing remains with the developer.

### Step 5 — Home dashboard

**Purpose:** Implement the approved Home overview in both modes, with appropriate presentation density.

**Implementation/acceptance status (November 15, 2026):** Accepted following the gardener's manual browser/device testing, reported working properly. This is gardener-reported acceptance; no separate Playwright suite has yet rerun it. Simple Mode retains the accepted seven navigation cards first and adds the shared dashboard below a restrained divider; Standard Mode removes its workspace directory and shows the same dashboard directly. `HomeDashboard` performs one Garden service read plus independent Task and Wish List service reads on every mount, suppresses outdated async results on unmount, and provides section-specific Retry actions. No Home interaction writes data.

- Saved Gardens are sorted newest-valid-`updatedAt` first with an ascending ID tie-breaker, then classified mutually exclusively: open Planned/Active Gardens are Current; closed, Completed, or Archived Gardens are Previous. Drafts are not returned by the Garden service and unmatched lifecycle records are not promoted into either group.
- Current and Previous use separate `CardCarousel` instances and record-specific `GardenPreviewCard` children. Cards link with the stored Garden ID, show optional subtitle/start date without placeholders for missing text, format date-only values without local-time shifts, use a neutral non-photo visual, and add Closed/Completed/Archived labels to Previous cards.
- Tasks and Wish List each call the existing List service with their real kind, sort copies by `createdAt` descending with an ID tie-breaker, limit to five, and render compact read-only rows. Completion and purchased states are informational; empty actions target the verified `#lists-quick-text` fragment on the existing pages.
- Gallery remains the fourth section and honestly reports that it is unavailable. Its known `/photos` link is labelled as a placeholder; no media repository, fake records, stock photos, or Gallery carousel were added.
- Every section remains visible across loading, empty, error, and ready states. Garden, Task, and Wish List failures are isolated by source; the Gallery availability state is static. The accepted container-query carousel sizing continues to provide roughly two through six cards according to actual rail width.

- Implement the five approved sections in order: Current Gardens, Tasks, Wish List, Gallery, Previous Gardens.
- Garden and Gallery content uses horizontal visual rails; Tasks and Wish List show up to five most recently added items as read-only previews.
- Keep drafts off Home. Editing remains on the relevant full page.
- Implement the approved Garden card fields, recent-image ordering, Previous Garden statuses, View all links, and per-section empty states.
- Validate Bootstrap 6 Carousel touch/scroll behavior and responsive card counts before considering another library.
- Reuse existing data services; do not duplicate editing or persistence logic in Home.

**Acceptance:** Correct records and ordering appear; previews remain read-only; empty/loading/error states are distinct; rails work with touch, keyboard, and responsive layouts; no draft appears on Home.

### Step 5.5 — Local Playwright browser-testing foundation (accepted)

**Status (November 16, 2026):** Accepted by the developer after a complete local run on `oakisland` (LMDE 7): **57/57 Playwright browser tests passed in 49.6 seconds**. The pinned Playwright `1.65.1` harness starts/reuses Vite, restores a populated synthetic IndexedDB fixture in isolated Chromium contexts, supports focused test groups and produces local HTML reports and failure evidence. The fixture capture/restore scripts remain available. The suites currently cover startup and populated pages (5 cases), viewport scrolling in both presentation modes (40), Note editor scrolling/keyboard access (8), and Task/Wish List delete confirmation/persistence (4).

**Testing records:** [TESTING_NOTES.md](TESTING_NOTES.md) documents the accepted baseline, inventory, limitations, unresolved device-specific reports and future coverage. [tests/README.md](../tests/README.md) provides commands for local execution. The purpose is to offload routine browser testing from Codex; GitHub Actions integration remains deferred.

**Acceptance boundary:** This confirms the local Playwright foundation, **not** complete app behavior or resolution of the laptop's manually observed scrolling and deletion problems. The laptop reports remain open until reproduced/resolved on the affected machine. The earlier proposed empty-state test is **not yet implemented** and remains a possible additional coverage item. Valid operational data still needs protection; obsolete alpha fixture compatibility is not required.

**Next:** Review Steps 6A–B and complete their independent browser/device acceptance before proceeding to Step 6C.

### Step 6 — Gardens hub and draft discovery

**Implementation status (accepted November 2026):** Steps 6A–6D are complete and accepted. Step 6A established the four Hub categories and header actions, removed the nested Standard-navigation Templates entry, and preserved direct routes. Step 6B established image-first saved and Draft Garden cards with distinct fallback illustrations and separate Draft resume/discard actions. Step 6C delivered the Draft filmstrip and dedicated `/gardens/drafts` page. Step 6D confirmed draft editor preference persistence (the initially suspected regression was caused by modified-date reordering, not lost preferences), responsive/browser behavior, and manual acceptance. The Chromium laptop viewport clipping issue was resolved and retested. Final reported verification: 470 passing Vitest tests, 59 passing Playwright end-to-end tests, and a successful production build. The accepted standalone saved-Garden card arrangement remains functional; collection-level presentation refinement is separately planned in Step 6.6.

**Purpose:** Make saved Gardens and unfinished creation sessions easy to distinguish and find.

- Prototype Drafts → Current → Planned → Previous, prioritizing Current access and confirming Current/Active semantics.
- Add a compact horizontal draft rail with View All to a vertical `/gardens/drafts` list, registered before `/gardens/:id`; resume drafts in their correct editors.
- Prototype header actions **Locations → Templates → Create Garden**, remove detached sidebar sub-links, and preserve Settings and direct-route access.
- Explain draft versus saved Planned Garden, including unnamed drafts; autosave never creates a Garden.
- Validate card details (title, existing subtitle, optional start date, image area with distinct Draft and saved-Garden fallback treatments), long titles, responsive layouts and accessibility on real devices before acceptance. Actual Garden icon/color selection belongs to Step 6.5, not Step 6.
- Preserve existing draft IDs, autosave, recovery, mode selection, and atomic create/discard behavior. No obsolete alpha-data compatibility or migration work.

**Acceptance:** Users can distinguish saved Gardens from drafts, find each Garden category, and resume every draft in its correct editor; existing Garden lifecycle and draft persistence tests pass.

### Step 6.5 — Garden visual identity (new scoped checkpoint; planned November 16, 2026)

**Purpose:** Give each saved Garden a compact, recognizable identity without expanding the Step 6 Hub redesign or waiting for Gallery media support.

- Introduce a reusable **circular Garden identity badge**: the user's selected color is the outer ring, the chosen icon sits inside a neutral, contrasting center. Use it on Garden cards and compact Garden references where useful, while ensuring names/accessible labels remain available.
- Add optional icon and color selection and persistence for saved Gardens using the existing `icon` and `color` record fields. Support editing an existing Garden and create reusable controls for Step 7 Wizard/Advanced integration.
- Use neutral fallbacks for fields still set to `null`; do not assign placeholder art to records. The Step 6 card layout may reserve space for a future badge but must not depend on Step 6.5.
- Keep individual Garden identity separate from the proposed Step 10 brown/beige draft-versus-green saved-Garden editor styling.
- **Out of scope:** Gallery functionality, `thumbnailMediaId` assignment, media storage, and the application-wide button palette. Gallery-linked thumbnails remain future work.
- Preserve operational data integrity; no legacy alpha-data migrations, and no Dexie schema version bump solely for record-property changes when store/index definitions remain unchanged.

**Acceptance:** Persist chosen icon/color across reload and edits; distinguish identically named Gardens; check null/default rendering, accessibility and contrast, compact lists and card layouts, both interface modes, and existing Garden lifecycle tests before Step 7.

### Step 6.6 — Expandable Garden collections (approved V1 direction; not yet integrated)

**Status (November 19, 2026):** The development-only `/dev/hubtest` prototype, commit [`a2f8972`](https://github.com/solacenetwork/solace-garden/commit/a2f897234087f9524aec160386c02834acad475c), was manually tested on desktop and mobile and accepted as the direction for V1 collection presentation. Production integration has **not** started. Preserve the prototype as a reference until integration is accepted.

**Purpose:** Give gardeners a compact, quick-scroll view of saved Gardens and an in-place way to browse the complete collection, without changing individual Garden cards.

- For **Current, Planned, and Previous Gardens**, default to the existing horizontally scrollable `CardCarousel` filmstrip.
- Provide a **View All** control on each collection that swaps the filmstrip for a responsive multi-column grid of the **same cards**, in place on the Gardens Hub. Hide/unmount the filmstrip while expanded.
- Provide **Collapse** to replace the grid with the filmstrip again; restore the ordinary compact view rather than navigating to a separate page.
- Keep expansion state **temporary and component-local** for V1; no IndexedDB, localStorage, account preference, or saved expansion state.
- Reuse a single Garden card renderer and existing production data/actions across both presentations. Preserve links, lifecycle behavior, empty states, and card identity; do not duplicate card markup or build a generalized widget framework.
- Preserve keyboard focus and accessible View All/Collapse controls, touch scrolling, responsive layouts, and both Simple and Standard interface modes.
- **Draft Gardens are excluded from this initial scope.** Keep their existing filmstrip, resume/discard controls, and dedicated `/gardens/drafts` page unless a later design decision changes them.
- **Separation of concerns:** Step 6.5 defines individual Garden icon/color identity and card-level presentation. Step 6.6 defines collection layout and browsing behavior. Neither depends on rewriting the other.
- Future per-filmstrip sorting and manual card arrangement/Edit Mode remain deferred V2/V3 candidates in `PARKING_LOT.md`; do not pull them into V1.

**Acceptance:** With real Garden records, View All expands the relevant saved-Garden section in place, Collapse restores a functioning filmstrip, Garden actions and lifecycle remain intact, and responsive/touch/keyboard behavior works on desktop and mobile in both interface modes. Existing unit, end-to-end, and production-build checks remain green.

### Step 7 — Welcome and Garden creation presentation

**Purpose:** Complete the first-run introduction and make Garden creation choices understandable.

- Design and implement the approved Welcome startup preference and short, skippable Bootstrap 6 feature/Gardens carousel.
- Preserve direct/deep links, Help access to Welcome, and the existing startup preference behavior.
- Prototype Quick Start as the first Wizard step: **Save & Finish** (quick-create on first step only), **Add More Details** (guided steps), **Finish Later** (preserved draft); keep Advanced separate. Reuse the Step 6.5 icon/color controls in optional detailed editing without making them Quick Start requirements.
- Finalize Wizard steps, explicit final creation, validation visibility, resume behavior, and narrow-screen presentation.
- **Approved initial lifecycle selection (November 19, 2026):** Let the user choose the Garden's lifecycle status **before creation**. Wizard: add a guided step using approachable Planned vs Active options (for example, “I'm planning this Garden” / “I've already started this Garden”), defaulting to Planned. Advanced: use the existing lifecycle status select control and expose **all currently supported lifecycle/status choices and applicable Closed state**, not just Planned and Active. This enables direct entry of completed/closed/archived historical Gardens from notebooks. Persist the chosen state in the initial Garden creation operation; do not require creating as Planned and editing afterward. Keep Draft distinct from every official Garden status. Both methods create the same underlying Garden records.
- Preserve existing draft recovery and editor workflows; do not create a second onboarding wizard or add steps for features that do not exist.

**Acceptance:** First-run and returning-user behavior is correct; Welcome can be revisited; users understand the creation choices; Wizard/Advanced drafts survive reload and mode changes; create/discard safeguards remain intact.

### Step 8 — Contextual and secondary page refinements

**Purpose:** Finish the remaining page-level navigation and presentation work without expanding feature scope.

- Refine Templates entry points and management presentation.
- Refine Notes navigation, grouped browsing/search, and linked-Garden context where supported by current functionality.
- Confirm Tasks and Wish List retain separate, accessible full-page editing destinations. Do not add a combined Lists overview in V1.
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

**Acceptance:** All approved layouts and navigation paths pass manual and automated checks; existing accepted workflows remain intact. Record any focused UI polish findings for Step 10 before final redesign sign-off.

### Step 10 — UI polish and usability corrections

**Status (updated November 16, 2026):** Planned. The original nine observations remain a focused correction list, with two additional visual-design hypotheses below; no implementation or acceptance is claimed. Handle after the remaining page redesign and integrated review. Preserve existing routes, working features, and data integrity; verify changes with focused automated tests and real-device acceptance.

1. **Desktop navbar tooltips:** Add meaningful `title` attributes to navbar controls/items so mouse hovering identifies actions. Preserve existing accessible names; a title tooltip is not a replacement for accessibility labeling.
2. **Add New naming:** Rename the `Create Garden` entry in the global Add New menu to **New Garden** for consistency. Do not automatically rename the page-specific Create Garden action.
3. **Search placeholder:** Change the field placeholder to **Type your search query**; avoid confusing the application name Garden with Garden records.
4. **Navbar order:** Place **Add New (+)** first, immediately before Search. Preserve the existing relative order of the other navbar items.
5. **Search panel:** Remove the redundant magnifying-glass icon inside the expanded search panel. Keep the navbar Search icon; label the panel's submit button **Go**. Typing a query and selecting Go submits the existing search action, without introducing new search-backend functionality.
6. **Calendar information trigger:** On `/calendar`, remove the overflowing **Info** text from the existing bottom-drawer trigger and show only the circled-information icon. Give the icon-only control a meaningful accessible name and desktop tooltip; preserve bottom-drawer behavior.
7. **Templates navigation (addressed in Step 6A):** The indented **Templates** entry beneath **Gardens** was removed when the **Locations → Templates → Create Garden** Hub actions were added. `/templates` and `/locations` remain directly routable, and Locations remains available through Settings. No second Step 10 implementation is needed.
8. **Medium iconbar layout:** Move the iconbar expand/collapse trigger below the primary workspace icons, with visible separation between the destination icons and this control. Preserve the existing responsive overlay behavior.
9. **Medium navigation icon states:** Replace the collapsed iconbar's hamburger trigger with Bootstrap Icon **`arrow-right-square-fill`** (expand/open). In the expanded navigation panel, replace the lower **Close** text/button presentation with **`arrow-left-square-fill`** (collapse/close), keeping appropriate accessible names and tooltips. Retain the existing upper-right **X** dismissal button and add `title="Close"` to it. Do not introduce workspace reflow or change drawer dismissal/focus behavior.
10. **Draft-versus-Garden visual treatment (new hypothesis):** Explore warm brown/beige earth tones for unfinished Garden Draft cards/forms/headers, and green for editing existing saved Gardens. Include visible text labels (“Garden Draft” and “Editing Garden”) and never rely on color alone. Use the same meaning in Simple and Standard modes; test subtle borders versus prominent headers before selecting shades.
11. **SOLACE Garden button palette (new hypothesis):** Review the default Bootstrap-blue primary buttons in favor of cohesive gardening-inspired colors, retaining action hierarchy, contrast, focus visibility, and accessible states. Exact colors remain unapproved.
12. **Remove Active Dot:** on the buttons in the sidebar in Standard View, the selected button is highlighted green. But, there's also a darker green dot to the right of the button to indicate that it is active. I don't like this dot. Maybe we use something different (e.g. a border outline around the active button or different color?)
13. **Garden card identity badge scale and placement (Step 6.5 manual-review finding, November 19, 2026):** The current colored-ring/icon badge on saved Garden cards is too visually dominant and competes with the lifecycle illustration. Evaluate a smaller, consistently sized badge positioned in the upper-right corner of each card, using the user's comparison screenshots as the visual direction. Preserve the existing ring/icon identity, readability, contrast, and illustration; verify placement across Current, Planned, and Previous cards and responsive widths. This is a visual polish proposal only; do not alter Step 6.5 identity selection or persistence behavior.
14. **Garden Identity custom color picker (Step 6.5 usability finding, November 19, 2026):** Replace manual hexadecimal entry for custom colors with the native color picker styled using Bootstrap 6 (`input type="color"` / `form-control-color`). The user chooses and previews colors visually; do not display hexadecimal text in the UI. Continue storing the chosen six-digit hex value internally in the existing Garden `color` field, with `null` as the no-custom-color/default ring value. Do not add a separate Clear action: the existing Reset Color behavior will clear the pending selection, and only Save Identity persists it. Preserve curated palette choices, unified saving, and Cancel semantics.
15. **Explicit Garden Identity Reset labels (Step 6.5 usability finding, November 19, 2026):** Rename the modal's generic **Reset** action contextually to **Reset Color** on the Color tab and **Reset Icon** on the Icon tab. Each resets only its respective pending property to `null`; the other pending property remains unchanged. Neither Reset action persists until **Save Identity** is clicked. Preserve Cancel/dismissal behavior.

**Acceptance:** Verify navbar order and tooltip behavior on desktop and narrow layouts; Add New and Search terminology; Search Go submission; Calendar bottom-drawer icon sizing; Templates navigation and deep links; medium iconbar spacing, icon state, keyboard/focus and overlay dismissal; and no feature regression. Re-run affected automated tests and focused manual phone/tablet/desktop checks before final redesign sign-off.

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
