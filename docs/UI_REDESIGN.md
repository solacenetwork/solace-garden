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

**Favored, not yet final:** main sidebar centered on Gardens, PlantDB, Gallery; global access to Tasks, Notes, Wish List, Calendar; a More menu for Help/About/Welcome and potentially Settings; global Add New; Templates under Gardens; Locations under Settings. The earlier conversation's wording supports the direction, but not a fully approved ordering, icon set, or breakpoint behavior.

**Still open:** Home dashboard versus Gardens as startup view; precise toolbar membership and overflow; Settings gear versus More; Journal placement; Search field versus icon on phones; contextual navigation type per page; complete Simple Mode first-screen layout; Garden hub tabs/rails/list; creation entry page and Wizard step sequence.

**Conflict to settle rather than silently rewrite:** the existing GOALS/TECH_SPEC first-run Welcome behavior is an informational page shown once; PARKING_LOT explores an optional carousel and show-at-startup preference. The current requirement remains in force until deliberately revised.

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
4. **More/support menu:** lower-frequency informational/support destinations. Whether Settings stays as a dedicated gear icon or joins More remains open.

A full Notes page or Calendar page may still be reached from the global toolbar. Navigation placement is not a constraint on page capability.

## 5. Current implementation and proposed route/navigation separation

The current [src/index.jsx](../src/index.jsx) already uses `preact-iso` and renders `applicationRoutes` from [src/navigation.js](../src/navigation.js). `navigation.js` currently mixes path/view definitions with `section` (Simple Home), `navigationGroup` (Standard sidebar/Home), labels, icons, and workspace-derived lists. [StandardNavigation.jsx](../src/components/StandardNavigation.jsx) and [Home/index.jsx](../src/pages/Home/index.jsx) expose that catalog directly.

**Proposed direction:** Keep `preact-iso`, stable route IDs, existing paths, and route resolution, but separate **route definitions** from **navigation/presentation configuration**. `index.jsx` can continue to render an explicit route registry; there is no need to move every `<Route>` declaration inline, and no new router is required.

A route answers **what page exists**; navigation configuration answers **where a link/action appears**; a page answers **what contextual controls it needs**.

Avoid a new broad “workspace manager” or elaborate route-kind hierarchy. Retain only metadata that demonstrably serves navigation, context, return paths, or accessibility. Check whether `findRoute()` special cases and `workspaceRoutes` still have genuine consumers before refactoring them. Preserve parameterized Notes/Gardens routes and their ordering, Settings return behavior, deep links, and existing tests.

The Standard Mode “About this workspace” panel should not be shown indiscriminately on Settings, Templates, Help, etc. Reassess its purpose rather than blindly adapting every route to it.

## 6. Navigation destination map — draft, not approved

| Destination / action | Candidate placement | Keep URL / behavior | Open question |
| --- | --- | --- | --- |
| Home | Application logo / Home access, perhaps dashboard | `/` | Dashboard versus opening directly to Gardens |
| Gardens | Prominent primary navigation; first Simple Home card | `/gardens` | Hub layout and categories |
| Current / Planned / Drafts / Previous | Within Gardens | Existing Gardens service/records | Tabs, rails, filtered routes, or hybrid |
| Templates | Under Gardens, not global top-level | `/templates` | Contextual menu vs hub link |
| PlantDB / Plants | Primary destination or context-sensitive garden activity | `/plants` currently | Distinguish reference PlantDB from garden plant groups as features arrive |
| Harvest | Garden activity; possibly lower Simple Home placement | `/harvest` | Exact entry point |
| Gallery / Photos | Primary or garden contextual destination | `/photos` | Global versus Garden scope |
| Journal | Primary area **or** global toolbar tool | `/journal` | Historical top bar included Journal |
| Calendar | Global toolbar candidate | `/calendar` | Placement in Simple Home |
| Notes | Global toolbar candidate, complete page | `/notes` and editor routes | Grouped Notes navigation within page |
| Tasks / Wish List | Global toolbar or a shared Lists overview | `/tasks`, `/wishlist` | Combined `/lists` candidate; distinct views remain accessible |
| Search | Global header search candidate | `/search` | Search results as `/search?q=...` when search exists |
| Locations | Settings → Geographic Locations | `/locations` | No need for top-level sidebar link |
| Settings | Header gear **or** More menu | `/settings` with return context | Avoid confusing simultaneous sidebar + gear access |
| Help / About / Welcome | More/support; Welcome revisitable | Existing/planned routes | First-run Welcome behavior vs parked optional carousel |
| Global Add New | Header action menu candidate | Routes and services remain authoritative | Choices, ordering, availability, dirty-state handling |

This table records **candidates**, not a mandate to show all listed items at once. On narrow screens, toolbar actions can collapse into accessible menus without removing functionality.

## 7. Redesign workstreams

### A. Application shell and global navigation

**Evidence:** Tablet landscape navigation requires scrolling through too many equal-priority buttons; “workspace” wording is overused; Settings access from sidebar behaves awkwardly with its return/Close action; header logo/settings spacing is overly inset.

**Evaluate:** slim Standard sidebar; persistent top toolbar; More menu; global Add New; search affordance; `.container` versus `.container-fluid` for header (retain deliberate responsive padding); active location and keyboard/focus semantics. Decide exactly where every destination goes before changing source.

**Open:** which four or fewer tools deserve persistent top-level emphasis; dedicated Settings gear versus More; how Simple Home relates to Standard Home; whether Welcome appears automatically under the existing V1 rule or an approved revision.

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

**Search:** evaluate header search field/action that navigates to `/search?q=...`; defer actual cross-feature search behavior to its scheduled milestone unless scope is explicitly changed. Query parameters should be treated as input, not authority to perform writes.

### F. Responsive polish and UI feedback

Remove scaffolding copy (“Simple Mode preview,” “workspace placeholders,” etc.) before V1 release. Review card ordering (Gardens first candidate; Tasks then Wish List), header alignment, logo treatments, responsive sidebar collapse, touch targets, keyboard navigation, focus and accessible labels. Follow [UI_CONVENTIONS.md](UI_CONVENTIONS.md) for native links/buttons, Bootstrap 6 Dialog/Drawer, explicit Save/Close semantics, and recoverable feedback. Test real devices and both interface mode overrides, not just viewport simulations.

## 8. Design decisions to settle before Codex implementation

- [ ] Choose default landing experience: Home dashboard or Gardens hub; specify Simple and Standard behavior.
- [ ] Approve the final desktop sidebar destinations and order.
- [ ] Approve the final toolbar tools/actions and their ordering.
- [ ] Decide Settings gear versus More, and Help/About/Welcome placement.
- [ ] Define global Add New contents and whether it replaces or complements page-specific Create actions.
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
| 2026-11-14 | Proposed | Separate routing from navigation placement; keep `preact-iso` and current functional services. |
| 2026-11-14 | Proposed | Use historical three-layer concept: global toolbar, concise main navigation, contextual navigation; More for secondary/support links. |
| 2026-11-14 | Open | Home versus Gardens default, toolbar membership, Settings placement, global Add New, and screen-specific layouts. |
| 2026-11-14 | Open | Gardens hub, creation methods, grouped Notes, Lists overview, and future Search entry behavior. |

**Next design session:** Agree on a destination map for Standard Mode and Simple Mode, then translate it into annotated shell layouts. Do not treat this working proposal as an approved Codex prompt.
