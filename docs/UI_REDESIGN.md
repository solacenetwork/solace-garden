# SOLACE Garden — UI Redesign Plan

**Status:** Consolidated working design specification — synthesis underway; detailed layouts still require approval.  
**Started:** November 14, 2026  
**Development position:** Post-8F UI review, before Milestone 8G.

## 1. Purpose and scope

Improve SOLACE Garden's navigation, layout, terminology, and common workflows before continuing V1 feature development. Milestones 8E (Gardens) and 8F (Templates) passed their functional acceptance tests, but repeated real-device use exposed confusing organization, redundant entry points, and presentation friction.

This document is the **single consolidated design specification** for the UI redesign. It synthesizes prior discussions, historical interfaces, Markdown planning, and real-device test reports. When complete it must describe Simple and Standard Mode layouts, navigation destinations, interactions, responsive states, and acceptance tests clearly enough to produce scoped Codex prompts. It is not another raw notes dump.

- [UI_REVIEW_NOTES.md](UI_REVIEW_NOTES.md) remains the source of observations and possible remedies.
- The November 10–14, 2026 structured observation collector export (`submissions.json`, supplied for review) contains 11 repeatable reports: five tablet, six laptop; no report was explicitly classified as a functional defect, and severity was recorded as zero for all reports (do not interpret zero as confirmed low severity).
- [PARKING_LOT.md](PARKING_LOT.md) retains speculative/deferred alternatives.
- [GOALS.md](GOALS.md), [TECH_SPEC.md](TECH_SPEC.md), [ROADMAP.md](ROADMAP.md), and [UI_CONVENTIONS.md](UI_CONVENTIONS.md) constrain approved behavior. After decisions here are accepted, reconcile any changed requirements with those documents rather than quietly overriding them.

**Statuses used below:** `Existing/accepted` = behavior or architecture already implemented/accepted; `Historical reference` = a useful earlier pattern, not a requirement; `Proposed` = candidate for approval; `Open` = requires a decision; `Deferred` = outside this redesign unless explicitly promoted.

## 2. Evidence synthesis and decision provenance

### 2.1 Sources and their status

| Source | Contribution | Authority |
| --- | --- | --- |
| November 10 conversation, “The original navigation model” | Sidebar for main areas, persistent toolbar tools, optional More menu | Previously agreed **organizational direction**; precise controls still need confirmation |
| [Historical screenshots](pics/) | Top toolbar, left sidebar, Add New popup, PlantDB-local browser | Historical reference, **not** a visual specification |
| [UI_REVIEW_NOTES.md](UI_REVIEW_NOTES.md) | Observed friction and “Ideas to evaluate” | Observation is evidence; suggested fixes are candidates |
| November 10–14 `submissions.json` | Eleven repeatable observations: 5 tablet, 6 laptop | Direct tester feedback; severity 0 is not evidence of low impact |
| [PARKING_LOT.md](PARKING_LOT.md) Future UI Review/Tweaks | Alternatives for Welcome, Notes, Gardens hub, Wizard, cards, navigation | Parked concepts, not automatic requirements |
| [GOALS.md](GOALS.md), [TECH_SPEC.md](TECH_SPEC.md), [ROADMAP.md](ROADMAP.md), [UI_CONVENTIONS.md](UI_CONVENTIONS.md) | Accepted functionality, constraints, sequence, interaction standards | Preserve unless explicitly changed by an approved redesign decision |

**Decision statuses:** (1) Accepted existing behavior; (2) Previously agreed design direction; (3) Favored but unapproved proposal; (4) Open; (5) Deferred. Record rationale and evidence when promoting a proposal to a decision. If a new decision changes existing GOALS/TECH_SPEC/ROADMAP language, reconcile those documents explicitly.

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

**Established direction:** retain Preact + `preact-iso`, Bootstrap 6, shared Simple/Standard modes and existing routes/data services; decouple routes from link placement; use a compact main navigation plus global shortcuts and contextual navigation; preserve the historical layout *principle* without recreating its appearance.

**Favored, not yet final:** primary sidebar ordered **Gardens → Journal → Gallery → PlantDB** (approved), with no separate Home item; global toolbar tools **Tasks → Notes → Wish List → Calendar** (approved order); a More menu for **Help, About, and Settings (approved)**, with Welcome linked from Help; global Add New in the top navbar (now approved); Templates under Gardens; Locations under Settings. The earlier conversation's wording supports the direction, but not a fully approved ordering, icon set, or breakpoint behavior.

**Approved direction:** the logo-linked Home route presents an **overview dashboard**, not the Gardens hub. **Still open:** the precise Home cards, order, and Simple/Standard layouts; responsive toolbar overflow priority (membership/order of the four app-wide tools is approved); whether global Add New includes New Journal Entry; Search availability before the later Search feature milestone; contextual navigation type per page; complete Simple Mode first-screen layout; Garden hub tabs/rails/list; creation entry page and Wizard step sequence.

**Approved November 14:** Restore the historical **Show Welcome at startup** checkbox, enabled by default on new installations. Normal launches display `/welcome` while enabled and the Home overview (`/`) when disabled. Use existing local UI settings, respect deep links, and do not mix this behavior with the obsolete one-time `welcomeSeen` rule. This replaces the earlier startup contract in [GOALS.md](GOALS.md) §2.13b and [ROADMAP.md](ROADMAP.md); the **Welcome carousel's purpose is approved**: a quick overview of main app features, an introduction to Gardens, and a clear **Create Your First Garden** call to action. Exact number of slides, artwork, content, and interaction details remain to design.

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

**Proposed model to evaluate:**
1. **Global toolbar:** small set of frequently used tools/actions available from every major view.
2. **Primary navigation:** small set of main application areas; Gardens is prominent.
3. **Contextual navigation:** subviews, filters, and management actions owned by the active area (e.g., Gardens categories/Templates or PlantDB browsing). This may be tabs, inline controls, accordion, or a local panel; it does not always require a third sidebar.
4. **More/support menu:** lower-frequency informational/support destinations. **Settings belongs exclusively in the one More menu**; it is not a standalone header gear or a Standard sidebar item.

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

**Not yet decided:** Exact icon artwork and what is always visible versus placed in overflow, the remaining contents of More, and precise breakpoint/layout behavior. Do not treat the earlier candidate toolbar membership as approved.

**Acceptance implications:** Test header availability and access to every approved action in Simple and Standard Mode, including manual mode override on narrow and wide viewports; check touch targets, keyboard/focus, overflow menu usability, and no disruption to unsaved editor data.

## 5. Current implementation and proposed route/navigation separation

The current [src/index.jsx](../src/index.jsx) already uses `preact-iso` and renders `applicationRoutes` from [src/navigation.js](../src/navigation.js). `navigation.js` currently mixes path/view definitions with `section` (Simple Home), `navigationGroup` (Standard sidebar/Home), labels, icons, and workspace-derived lists. [StandardNavigation.jsx](../src/components/StandardNavigation.jsx) and [Home/index.jsx](../src/pages/Home/index.jsx) expose that catalog directly.

**Proposed direction:** Keep `preact-iso`, stable route IDs, existing paths, and route resolution, but separate **route definitions** from **navigation/presentation configuration**. `index.jsx` can continue to render an explicit route registry; there is no need to move every `<Route>` declaration inline, and no new router is required.

A route answers **what page exists**; navigation configuration answers **where a link/action appears**; a page answers **what contextual controls it needs**.

Avoid a new broad “workspace manager” or elaborate route-kind hierarchy. Retain only metadata that demonstrably serves navigation, context, return paths, or accessibility. Check whether `findRoute()` special cases and `workspaceRoutes` still have genuine consumers before refactoring them. Preserve parameterized Notes/Gardens routes and their ordering, Settings return behavior, deep links, and existing tests.

The Standard Mode “About this workspace” panel should not be shown indiscriminately on Settings, Templates, Help, etc. Reassess its purpose rather than blindly adapting every route to it.

## 6. Navigation destination map — draft, not approved

| Destination / action | Candidate placement | Keep URL / behavior | Open question |
| --- | --- | --- | --- |
| Home | **SOLACE navbar logo only (approved)**; no additional Home button or sidebar item | `/` | Overview dashboard; exact cards/layout remain open |
| Gardens | **Primary sidebar position 1 (approved)**; first Simple Home card candidate | `/gardens` | Hub layout and categories |
| Current / Planned / Drafts / Previous | Within Gardens | Existing Gardens service/records | Tabs, rails, filtered routes, or hybrid |
| Templates | Under Gardens, not global top-level | `/templates` | Contextual menu vs hub link |
| PlantDB / Plants | **Primary sidebar position 4 / last (approved)** | `/plants` currently | Distinguish reference PlantDB from garden plant groups as features arrive |
| Harvest | Garden activity; possibly lower Simple Home placement | `/harvest` | Exact entry point |
| Gallery / Photos | **Primary sidebar position 3 (approved)** | `/photos` | Global versus Garden scope |
| Journal | **Primary sidebar position 2 (approved)**; not a permanent global toolbar shortcut | `/journal` | “New Journal Entry” in global Add New is a candidate, not yet approved |
| Calendar | **Fourth app-wide toolbar tool (approved)** | `/calendar` | Placement in Simple Home still to be decided |
| Notes | **Second app-wide toolbar tool (approved)**, complete page | `/notes` and editor routes | Grouped Notes navigation within page |
| Tasks / Wish List | **First and third app-wide toolbar tools respectively (approved)** | `/tasks`, `/wishlist` | Combined `/lists` candidate; distinct views remain accessible |
| Search | **Global top navbar (approved): inline query on wide screens; icon-triggered panel below navbar on narrow screens** | `/search` | Target result URL `/search?q=...`; actual search engine remains later milestone |
| Locations | Settings → Geographic Locations | `/locations` | No need for top-level sidebar link |
| Settings | **Single navbar More menu only (approved)**; no dedicated gear icon or sidebar entry | `/settings` with return context | Preserve Close/return to originating context; direct URL still works |
| Help / About | **Single navbar More menu (approved)** | `/help`, `/about` | Keep ordinary routes and navigation |
| Welcome | **Link from Help page (approved)**, not a More entry | `/welcome` (planned) | Existing first-run behavior remains; optional carousel is a separate parked proposal |
| Global Add New | **Top navbar (approved)**, responsive in both modes | Routes and services remain authoritative | Menu choices, ordering, availability, dirty-state handling remain open |

This table records **candidates**, not a mandate to show all listed items at once. On narrow screens, toolbar actions can collapse into accessible menus without removing functionality.

## 7. Redesign workstreams

### A. Application shell and global navigation

**Evidence:** Tablet landscape navigation requires scrolling through too many equal-priority buttons; “workspace” wording is overused; Settings access from sidebar behaves awkwardly with its return/Close action; header logo/settings spacing is overly inset.

**Evaluate:** slim Standard sidebar; persistent top toolbar; More menu; global Add New; search affordance; `.container` versus `.container-fluid` for header (retain deliberate responsive padding); active location and keyboard/focus semantics. Decide exactly where every destination goes before changing source.

**Open:** which tools deserve persistent top-level emphasis (Journal remains a primary workspace, not a permanent toolbar tool); whether Add New offers New Journal Entry; how Simple Home relates to Standard Home; and the exact Welcome carousel composition. Welcome's startup checkbox and carousel purpose are approved.

### Approved Home overview and historical first-run entry

**Home is a dashboard, not a sidebar item or a shortcut to Gardens.** The navbar logo navigates to the Home overview at `/`. The historical Home screen gave an at-a-glance view of **Current Gardens, Tasks, Wish List, Gallery, and Previous Gardens**. Preserve those five categories as the *starting content inventory* for redesign; exact card layout, information density, relative ordering, and differences between Simple and Standard Mode remain to be designed. Use concise summaries and direct links to the corresponding workspaces; do not duplicate entire workspaces in the dashboard.

**Approved startup sequence (restored from the historical UI):** A fresh installation shows the full-page `/welcome` with **Show Welcome at startup** checked by default. While checked, normal launches continue to show Welcome; unchecking switches later normal launches to the Home dashboard at `/`. Skip Introduction / Go to Gardens never silently changes the checkbox. Deep links bypass Welcome and are preserved. Welcome remains revisitable via Help regardless of preference. Store the explicit setting with existing local UI preferences; no alpha data migration or one-time `welcomeSeen` mechanism. **Approved carousel direction:** On Welcome, use a short, skippable Bootstrap 6 carousel to briefly introduce major features, explain what a Garden is/why to create one, and finish with an obvious **Create Your First Garden** action leading into the **existing Garden creation Wizard** (not a second onboarding flow). Preserve Skip Introduction / Go to Gardens, the Show Welcome at startup preference, and normal navigation. Final slide count, copy, images, ordering, and whether the CTA appears throughout or on the final slide remain open.

**Design questions still open:** How much of each dashboard summary to show, where to place actions to continue a draft, how empty states behave, and the exact carousel slide content and interaction details. Home remains accessible through the logo regardless of Welcome settings.

### Home dashboard filmstrip — favored design direction (November 14, 2026)

The original Home concept is a **Netflix-style dashboard of independent horizontal card rails**, not a static grid of overview panels. The starting five rails are **Current Gardens, Tasks, Wish List, Gallery, Previous Gardens**, in that order. On a narrow phone, show approximately **two useful-sized cards** with optional next-card peek; at wider widths progressively show more, potentially **up to six** if content remains readable. These are adaptive targets, not fixed widths or a mandate to squeeze six cards into every desktop window.

**Preferred implementation:** Test the pinned **Bootstrap 6 Carousel** before introducing SwiperJS. Its updated CSS scroll-snap engine supports native touch dragging/momentum, keyboard scrolling, multiple simultaneously visible items, optional peeking, variable slide widths, and CSS variables `--bs-carousel-items`, `--bs-carousel-items-gap`, and `--bs-carousel-items-peek`. See [official Bootstrap 6 Carousel docs](https://getbootstrap.com/docs/6.0/components/carousel/). A separate rail per category with an obvious **View all** link and optional previous/next controls is the working model. Disable autoplay; favor `data-bs-ends="stop"` so users aren't surprised by looping. Test actual touch/swipe responsiveness and Preact lifecycle against the project's pinned alpha, not only the latest docs.

**Still to design:** card imagery vs text/data summaries for each rail; exact card widths, dynamic empty states, current versus prior Garden ordering, whether draft Gardens need a separate rail or actionable resume cue, rail overflow/arrow behavior, and the differences between Simple and Standard Mode. Avoid installing SwiperJS before testing whether Bootstrap 6 satisfies these requirements. This is a design proposal to validate with visual mockups and real devices before authorizing implementation.

### B. Gardens hub, discovery, and lifecycle

**Evidence:** Unfinished drafts can dominate the page; a new Garden may be hard to find; draft is not Planned; long names distort cards.

**Evaluate:** a central `/gardens` hub with clear Current, Draft, Planned, Previous groupings; perhaps horizontal card rails with View all links, tabs, or a hybrid. Make Current and newly created Gardens easy to find. Consider a contextual Templates entry, Garden-specific actions, and a clear Create Garden action. A “What do you want to do?” selector is parked as an alternative, not assumed required.

**Open:** grouping order, definitions of Current versus Active, number of cards shown per device, whether dedicated filtered routes are worth adding, and title clamping versus a proposed ~200-character input limit.

### C. Quick Start, Wizard, Advanced, and drafts

**Evidence:** Quick Start name field beside Wizard/Advanced links implies a continuous form even though they are three separate creation flows. Wizard Details resembles the Advanced form; validation errors may appear below the viewport.

**Evaluate:** three visibly distinct entry choices (possibly cards), with no implication that typed Quick Start input carries into another method unless explicitly designed. Guided Wizard uses smaller named steps and reusable controls; Advanced remains consolidated. Clearly label unnamed drafts. Ensure invalid fields/errors are visible immediately.

**Preserve:** existing draft IDs, autosave, no overwrite of existing drafts by incidental prefill, atomic create/cleanup, and independent saved Garden status.

**Open:** creation choice screen, optional new-draft prefill, actual Wizard steps, and step-resume metadata. Do not add steps requiring unimplemented PlantDB/appearance features simply to fill a Wizard.

### D. Templates and Notes

**Templates:** make Save as Template versus Apply Template discoverable; suppress creation-form Template wording if there are no Templates (except a draft with missing applied source); display effective Default Location when a Template's saved Location is deleted; keep immutable Template source record; move raw UUIDs to optional troubleshooting details. Editing Templates is not yet approved.

**Notes:** evaluate Garden-grouped Bootstrap 6 accordion, Unassigned Notes, live filtering, and linked-Garden indicators; keep existing independent Note records and Garden associations. No folder/file-manager model or drag/drop reassociation.

### E. Lists and Search

**Lists:** consider a combined `/lists` dashboard for Tasks and Wish List with separate Add controls; keep current `/tasks` and `/wishlist` access and underlying shared data.

**Search:** approved responsive navbar input (wide) or icon-triggered panel (narrow) with a shared submit action targeting `/search?q=...`; defer actual cross-feature search behavior to its scheduled milestone unless scope is explicitly changed. Query parameters should be treated as input, not authority to perform writes.

### F. Responsive polish and UI feedback

Remove scaffolding copy (“Simple Mode preview,” “workspace placeholders,” etc.) before V1 release. Review card ordering (Gardens first candidate; Tasks then Wish List), header alignment, logo treatments, responsive sidebar collapse, touch targets, keyboard navigation, focus and accessible labels. Follow [UI_CONVENTIONS.md](UI_CONVENTIONS.md) for native links/buttons, Bootstrap 6 Dialog/Drawer, explicit Save/Close semantics, and recoverable feedback. Test real devices and both interface mode overrides, not just viewport simulations.

## 8. Design decisions to settle before Codex implementation

- [x] Use only the navbar SOLACE logo to navigate Home (`/`); no separate Home button or sidebar item.
- [x] Approve the logo-linked Home (`/`) as an overview dashboard: Current Gardens, Tasks, Wish List, Gallery, Previous Gardens (historical content inventory).
- [ ] Validate the favored **Netflix-style horizontal rails** Home design (Current Gardens, Tasks, Wish List, Gallery, Previous Gardens): approximately 2 cards on phones and up to 6 on wide screens, without unreadable cards.
- [ ] Design Home card contents, empty states, and responsive differences for Simple and Standard Mode; test Bootstrap 6 Carousel touch and scroll-snap on the pinned alpha before considering SwiperJS.
- [x] Restore the **Show Welcome at startup** checkbox, enabled by default, replacing the old one-time V1 rule; reconcile GOALS.md, ROADMAP.md, and PARKING_LOT.md.
- [x] Approve the Welcome carousel's goal: quick main-feature overview, introduction to Gardens, and **Create Your First Garden** CTA to the existing creation workflow.
- [ ] Design and approve the carousel slides, copy, CTA placement, and accessible controls.
- [x] Approve primary sidebar destinations and order: **Gardens, Journal, Gallery, PlantDB** (PlantDB last).
- [x] Approve top-navbar placement and responsive presentation for global Search: inline input on wide screens; icon-triggered below-navbar field on narrow screens.
- [x] Approve icon-only brand on narrow screens, with full wordmark on wider screens (threshold still open).
- [x] Keep Add New (+) and Search directly visible at narrow widths, with **one** More navbar item collecting overflow/support destinations.
- [x] Approve the four app-wide tools and their order: **Tasks, Notes, Wish List, Calendar**.
- [ ] Specify exact navbar icon choices and overflow behavior while keeping this relative order.
- [x] Place Settings exclusively in the single navbar More menu; remove standalone gear and sidebar Settings entry in the redesign.
- [x] Place Help and About in the single navbar More menu; link to Welcome from Help, not from More.
- [ ] Finalize remaining responsive overflow membership.
- [x] Place global Add New (+) in the top navbar in both modes.
- [ ] Define global Add New contents and whether it replaces or complements page-specific Create actions.
- [x] Agree that the persistent top navbar exists in both Simple and Standard Mode, with different responsive presentations.
- [ ] Define responsive collapse behavior for portrait tablet, landscape tablet, narrow phone, and desktop; preserve manually selected mode.
- [ ] Choose the Gardens hub/category navigation model and Templates entry point.
- [ ] Choose Garden creation entry presentation and Wizard refactor boundaries.
- [ ] Decide how Lists and Notes are presented without expanding the current data model.
- [ ] Define what is in scope for this pre-8G redesign versus deferred until the corresponding V1 feature exists.
- [ ] Prepare wireframes or annotated layouts for key pages/states, then explicitly approve them.

## 9. Proposed implementation slices (not scheduled or authorized)

1. **Architecture-only refactor:** separate route definitions from navigation configuration; no deliberate visual or behavioral change. Update route/nav tests.
2. **Shared shell/navigation:** Header, global action menu, More/support access, Standard sidebar, responsive states; keep deep links and Settings return behavior.
3. **Home and Gardens hub:** simplify both modes; implement approved Garden grouping and discovery.
4. **Creation flow presentation:** choice page and approved Wizard steps/validation visibility while preserving drafts/atomic operations.
5. **Contextual refinements:** Templates, Notes, Lists entry points and related cards/empty states; leave feature implementation for later milestones when appropriate.
6. **Integrated acceptance:** device testing and regression checks, resolve findings, then continue with 8G.

Before each slice, create a narrowly scoped Codex prompt with exact files/behavior, exclusions, tests, and manual acceptance criteria. Keep observation reports separate from implementation instructions.

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

| Date | Status | Decision / question |
| --- | --- | --- |
| 2026-11-14 | **Favored design** | Home uses independent Netflix-style horizontal rails for the five overview categories, adapting roughly 2–6 visible cards by width. Prefer testing Bootstrap 6 Carousel scroll-snap/touch rather than adding SwiperJS without need. Exact visuals and behavior remain open. |
| 2026-11-14 | **Approved direction** | Welcome uses a short, skippable feature-introduction carousel culminating in **Create Your First Garden**, routed to the existing Garden creation Wizard. Slide content/count and controls remain to be designed. |
| 2026-11-14 | **Approved** | Restore Welcome's **Show Welcome at startup** checkbox, initially on. Normal launches show Welcome while enabled and Home when disabled; direct links are unaffected. The carousel remains a candidate. |
| 2026-11-14 | **Approved direction** | Home (`/`) is an overview dashboard with Current Gardens, Tasks, Wish List, Gallery, and Previous Gardens. Welcome startup preference is separately approved; precise dashboard composition remains open. |
| 2026-11-14 | **Approved** | Home is accessed exclusively through the SOLACE logo in the navbar; no standalone Home button. Primary sidebar order is Gardens, Journal, Gallery, PlantDB, with PlantDB last. |
| 2026-11-14 | **Approved** | The four app-wide navbar tools appear in this order: Tasks, Notes, Wish List, Calendar. Their responsive overflow behavior remains to be designed. |
| 2026-11-14 | **Approved** | Help and About belong in the single navbar More menu; Welcome is accessible from Help rather than appearing in More. Preserve existing first-run Welcome requirements unless separately revised. |
| 2026-11-14 | **Approved** | Settings appears exclusively inside the one navbar More menu, with no permanent gear icon or Standard sidebar entry; preserve the Settings route and return/Close behavior. |
| 2026-11-14 | **Approved** | Search uses an inline navbar input on wide screens and an icon-triggered search panel below the navbar on narrow screens; Enter/Search targets `/search?q=...` once results exist. |
| 2026-11-14 | **Approved** | Use only one navbar More menu; on narrow screens keep Add New and Search visible while lower-priority tools move into that menu as needed. Exact menu mechanism and membership remain open. |
| 2026-11-14 | **Approved** | Global Search belongs in the persistent navbar; small-screen branding uses icon only instead of the full wordmark. Bootstrap 6 Nav overflow is favored pending pinned-version testing. |
| 2026-11-14 | **Approved** | Global Add New (+) belongs in the persistent top navbar, not the sidebar; its submenu contents remain open. |
| 2026-11-14 | **Approved direction** | Journal stays in primary workspace navigation, not as a permanent top-navbar tool. “New Journal Entry” in Add New remains a candidate. |
| 2026-11-14 | **Approved** | Keep the top navbar in both Simple and Standard Mode, adapting its presentation responsively; membership and breakpoints remain open. |
| 2026-11-14 | Proposed | Separate routing from navigation placement; keep `preact-iso` and current functional services. |
| 2026-11-14 | Proposed | Use historical three-layer concept: global toolbar, concise main navigation, contextual navigation; More for secondary/support links. |
| 2026-11-14 | Open | dashboard and Welcome carousel composition, responsive toolbar presentation, Add New submenu contents, and screen-specific layouts. |
| 2026-11-14 | Open | Gardens hub, creation methods, grouped Notes, Lists overview, and future Search entry behavior. |

**Next design session:** Agree on a destination map for Standard Mode and Simple Mode, then translate it into annotated shell layouts. Do not treat this working proposal as an approved Codex prompt.
