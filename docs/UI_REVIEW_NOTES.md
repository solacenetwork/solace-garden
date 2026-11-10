# SOLACE Garden — UI Review Notes

This is a working review of the SOLACE Garden interface based on repeated, real-world use on phones, tablets, and desktops. The goal is to identify confusing workflows, unnecessary steps, unclear wording, and responsive/accessibility issues **before** deciding on implementation changes.

**Status:** Collecting observations after completion of Milestone 8F. No redesign or technical solution is approved merely because it appears here.

## How to use this document

- Add observations as they happen; polished descriptions are not required. Include the page, device/mode, what you tried, what happened, and what you expected when useful.
- Separate **observed friction** from **possible solutions**. An idea is a candidate to evaluate, not an implementation instruction.
- Record recurring friction even when all functionality technically passes. Functional defects should be identified separately so they can be prioritized.
- Keep broader speculative features in [PARKING_LOT.md](PARKING_LOT.md); the review can link to them without committing to implement them now.
- Test both **Simple** and **Standard** modes, narrow and wide screens, touch and keyboard where practical. Look for problems after repeated everyday use, not just the first successful click.
- Follow the SOLACE alpha data policy: test data is disposable; don't add migrations or legacy handling solely to retain obsolete alpha records. Preserve valid current data during normal operations.

## High Level Observations

The categories below collect issues and ideas previously discussed during Garden development and acceptance. They are starting points for the hands-on review, **not** final design requirements.

### 1. Gardens navigation and organization

**Observed friction**
- Unfinished drafts can dominate the top of the Gardens page, making a newly created Garden difficult to find, especially when drafts and Gardens have similar names.
- A **draft** is an unfinished creation session; **Planned** is the status of a real Garden. This distinction needs to remain obvious.
- Existing lifecycle controls and Garden actions work but can feel crowded and awkward.

**Ideas to evaluate**
- Rework `/gardens` as a central hub with clear Current / Drafts / Planned / Previous groups, possibly horizontal card rails and **View all** links; evaluate tabs or dedicated listing routes as alternatives.
- Consider a task-oriented “I want to…” action selector if it genuinely reduces navigation effort. Avoid duplicating underlying workflows.
- Make newly created Gardens easy to find; don't assume visually similar names imply the same record.

### 2. Garden creation: Quick Start, Wizard, Advanced, drafts

**Observed friction**
- Entering a name in Quick Start and then choosing Wizard/Advanced currently loses that typed name because the workflows are separate; the controls can imply continuity.
- The label **Untitled Garden** on an unfinished draft can sound like an actual unnamed Garden.
- Wizard currently puts most editable fields on one Details screen, making it feel too similar to Advanced rather than like a guided sequence.
- Form validation feedback can appear below the visible screen after submission (e.g., end date before start date), so a user may not see what went wrong.

**Ideas to evaluate**
- Clarify the different creation methods, or carry validated initial Quick Start input into a **new** draft without overwriting an existing draft. URL prefill is a parked possibility, not approved behavior.
- Explore smaller, named Wizard steps with modular Preact components; keep Advanced as the consolidated form and preserve draft/autosave/atomic creation.
- Make invalid fields and their errors discoverable immediately, including on small screens.

### 3. Garden Templates

**Observed friction**
- **Save as Template** lives on an existing Garden's detail page; Wizard/Advanced use **Apply Template**. A user searching in the creation form or `/templates` may not discover where Templates are created.
- When there are no saved Templates, the creation screens display unnecessary Template explanations and controls (“No saved Garden Templates yet,” “Start clean or copy reusable details from a saved Garden Template”).
- `/templates` currently says **Saved Location unavailable** after a saved custom Location is deleted, while applying the Template correctly uses Default Location.
- Full Template UUIDs displayed prominently on cards add clutter for ordinary gardeners.

**Ideas / agreed review directions**
- Revisit wording and navigation between saving, applying and managing Templates.
- Keep Template-specific introductory wording, controls, and links **inside** the existing `GardenTemplateSelection` Preact component. The parent creation view can decide whether to render it; distinguish loading from confirmed-empty state.
- When no Templates exist, keep normal Garden creation uncluttered. Exception: an unfinished draft whose applied source Template was deleted still needs an unavailable-source explanation.
- On Template cards, show the **effective Default Location name** when the saved Location no longer exists (including if Default was renamed), without silently modifying the immutable Template record. Retain the existing explanation when applying a Template.
- Add a Help FAQ such as **“Why does my Template change Locations?”** to explain the fallback rather than placing a long warning on every card.
- Consider moving raw Template UUIDs into optional details for troubleshooting, rather than the default presentation.
- Whether Templates should ever be editable is a **separate, undecided design decision**; don't assume an Edit button is approved.

### 4. Notes navigation and Garden relationships

**Observed friction**
- The main Notes list does not visibly distinguish Notes linked to a Garden from unassigned Notes.

**Ideas to evaluate**
- Try a **Bootstrap 6 accordion** grouped by associated Garden plus an **Unassigned Notes** section, with live type-to-search filtering. This is a navigational grouping of independent Note records, **not** a filesystem or folder structure.
- Consider a small linked-Garden indicator on Note cards; a click/tap- and keyboard-accessible detail/popover could show the Garden name and a link to it.
- Check behavior with many Notes and duplicate/long Garden names. No drag/drop reassociation is proposed.

### 5. Navigation and page organization

**Observed friction**
- Too many pages and controls can appear equally prominent, although not every page is a place where the gardener works.
- Existing navigation/text sometimes treats Help, About, Welcome and Settings as if they were gardening workspaces.

**Ideas to evaluate**
- Distinguish **workspace**, **utility**, and **information/support** pages. Potential route metadata: `kind: 'workspace' | 'utility' | 'information'`; final taxonomy and navigation placement remain undecided.
- Review Simple Mode’s “More places to explore,” Standard Mode’s “Other Links” and workspace-specific headings/context.
- Treat Welcome as a lightweight, once-shown informational page, not a mandatory onboarding wizard or primary workspace; review its page wiring and later revisit access.
- Consider where Help, About, Settings, Search and Templates should live without forcing every route into primary navigation.

**Historical UI reference and navigation ideas (November 2026; evaluation only)**
- The earlier vanilla-JS Garden put **workspaces** in a compact left sidebar, while the top toolbar exposed **persistent, app-wide tools** (including list/Notes/Journal/Calendar shortcuts) from any workspace. That division kept the left navigation shorter and reduced scrolling. In the current Garden, Tasks, Notes, and Wish List are relevant examples of app-wide tools even if their full views remain workspace routes.
- Consider a **More / ellipsis menu** for standalone Help, About, Settings, and Welcome destinations rather than giving all of them permanent toolbar positions. App-wide access is a **navigation placement**, not necessarily a route type or a new data model.
- Evaluate a global **Add New** shortcut for common actions and contextual lists/search/navigation inside an active workspace, without duplicating services or assuming each tool must appear as a separate full page.
- Preserve a recognizable application shell and consistent movement between workspaces while avoiding the old heavy borders, bright boxed controls, and simulated desktop window chrome. The older SOLACE Menu's responsive large tiles are a layout reference, not a mandate to recreate the old styling.
- Compare these possibilities with actual phone, tablet, and desktop observation reports before choosing a redesign. Preserve existing Simple/Standard modes and shared routes; no new shell framework is approved.
- **Image references:** Historical screenshots and later comparison images may be placed in `docs/pics/` (user-managed). Treat them as development/design reference assets, not runtime PWA content. Before the V1 production release, review and remove development-only screenshots/reference assets from the production distribution; retain or archive planning history separately as appropriate. Do not have application builds package `docs/pics/`.

### 6. Cards, lists, and information display

**Observed friction**
- Very long Garden names stretch cards and make grids uneven.
- Some lists/cards display technical or secondary details more prominently than a casual user needs.

**Ideas to evaluate**
- Explore roughly a **200-character maximum** Garden name (not yet agreed), consistently validated across entry paths if adopted.
- Independently consider a two-line clamp for Garden card titles while preserving full names on detail pages and for accessibility.
- Review information hierarchy, consistent actions, and whether raw IDs belong in optional details.

### 7. Workflow efficiency and contextual actions

**Observed friction**
- The interface can feel cluttered with buttons, menus, and repeated ways to reach an action.
- Actions are sometimes easier to find on a separate management page than at the point where a gardener expects them.

**Questions to test**
- After repeating a task many times, which clicks or page changes feel unnecessary?
- Are actions labeled according to the user's task rather than internal implementation details?
- Can we simplify context-specific controls without hiding essential operations or reducing accessibility?

### 8. Mobile, tablet, and desktop usability

**Observed friction**
- Garden is intended for phone/tablet use outdoors and desktop review later; some layouts or controls that work on desktop may be inconvenient on a small touch screen.
- Header logo and Settings spacing appears unnecessarily inset; investigate the current `.container` layout versus `.container-fluid`.
- A single logo layout may not serve all breakpoints well.

**Ideas to evaluate**
- Test Simple and Standard modes repeatedly on real devices, including scrolling, dialogs, focus, keyboard access, touch-target size, and visibility of validation feedback.
- Consider distinct responsive logo treatments using Bootstrap display utilities rather than squeezing one layout across all widths.
- If evaluating horizontal Garden rails, make mobile presentation meaningfully usable (not merely smaller desktop cards), with clear swipe/scroll affordances.
- Favor Bootstrap 6 and existing Preact components where practical; no new UI library is presumed.

## Comprehensive Testing Notes

Add observations here during hands-on use. Keep rough notes until it's time to review and prioritize. Duplicate reports are useful when they show recurring friction.

### Suggested observation template (copy as needed)

**Date / device / mode:**  
**Page or workflow:**  
**What I did:**  
**What happened:**  
**What I expected / why it felt awkward:**  
**Type:** Functional defect / Workflow friction / Visual or responsive issue / Future idea  
**Possible improvement (optional):**  
**Repeatability / severity (optional):**  

### Field notes

<!-- Add new observations below, in any order. Don't worry about fixing or categorizing them immediately. -->

## Review and prioritization (later)

After collecting real-use observations, we can group duplicates, distinguish actual bugs from UX refinements and deferred enhancements, assess frequency/impact, choose cohesive design changes, and only then produce scoped implementation prompts. This document does **not** reopen accepted milestones or authorize changes to the data model.
