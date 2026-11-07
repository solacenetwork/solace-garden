# Parking Lot

New ideas that don't belong in technical specifications or the roadmap can be documented here so they aren't forgotten.

After the current A–F implementation work, we could do a documentation cleanup alongside the UI sweep:
1. Keep ROADMAP focused on committed V1 milestones and a concise future-direction summary.
2. Move detailed speculative features and unresolved research into the appropriate parking lot.
3. Preserve relevant technical reasoning and links so information isn't lost.
4. Avoid treating tentative version numbers as commitments.


## Long-term idea (tentative V4/V5): Configurable dashboard preview widgets

**Status:** Speculative concept only; **not committed for V1, the post-8F UI Tweaks pass, or any particular future release**. V4/V5 is an illustrative horizon, not a schedule or roadmap promise. Inspired loosely by WordPress blocks, but **do not build a WordPress-like editor or arbitrary page builder**.

**Concept:** Give gardeners a curated menu of small, representational **widgets/blocks** that preview existing app features and link into the corresponding full-feature screens. A gardener could choose which widgets appear on a home/dashboard page and arrange their order. One person might display only one Current Gardens widget; another might enable the entire available set. This accommodates minimalists, action-oriented users, and gardeners who want a comprehensive dashboard without creating separate underlying workflows.

**Illustrative preview widgets (not committed features):** Current Gardens, Planned Gardens, Unfinished Garden Drafts, Tasks, Recent Journal Entries, Calendar/upcoming activities, and Quick Actions. Each widget shows a limited, purposeful subset (e.g. a few records plus **View All**), not an entire copy of its destination page. Widgets should route to the established full views and share their underlying data/services.

**Bounded customization, not free-form editing:**
- The application defines the **allowed widget types** and their presentations; users select which to display, hide, and reorder.
- Pages may have **constrained regions/slots** (e.g. main content and sidebar); only supported categories/types of widgets can appear in a given region, much like WordPress block-area restrictions.
- Initial customization could be just an available-widgets list with visibility controls and **Move Up / Move Down** ordering, with optional drag-to-reorder only if helpful and accessible. A full spatial layout editor, custom markup, arbitrary widget scripts, and per-widget visual builders are outside this idea.
- A sensible default layout works without customization. The user's selected layout could be saved with local UI preferences in the offline-first app; exact preference contract, persistence/versioning, fallback for missing/renamed widgets, and any multi-device sync remain future design questions.
- Keep **widget choice/order** separate from **widget content configuration**. First explore visibility and order; do not assume users need customizable internals, sizes, or data queries.

**Architectural note for today:** Continue favoring reusable Preact display components and independent view/service layers where practical, but **do not prematurely build a widget registry, configuration framework, or editor into V1**. The immediate post-8F Gardens hub/filmstrip idea (documented separately below) can remain fixed and simple; it is not automatically a V4/V5 block system.

**Revisit only if user demand or future design work justifies it.**

## Future UI Tweaks pass (after 8F): Gardens hub, browsing and creation UX

**Status:** Brainstorming from hands-on 8E4 browser testing (November 7, 2026). **No route, UI, workflow, or milestone changes approved yet.** All six 8E4 functional checks passed; confusing presentation and expectations are deferred for the post-8F UI Tweaks pass. Revisit the **whole `/gardens` experience together**, rather than patching individual symptoms before its overall structure is chosen.

### Observed user-confusion cases

- **Quick Start → Advanced/Wizard:** A gardener types a name into Quick Start, then clicks **Advanced Form** assuming it continues the same creation process; Advanced opens with a blank name because it creates a separate draft. All three controls appear together, suggesting continuity that does not exist. Consider carrying the typed name into a newly initialized Wizard/Advanced draft (e.g. an optional `?name=My%20Test%20Garden` prefill), without creating a Garden or retroactively turning Quick Start into a persistent draft. Parse/validate untrusted query text only on **new draft initialization**; never overwrite an already-existing UUID draft. See the separate parked URL-prefill idea below. Alternatively, rethink how creation methods are selected and grouped.
- **Blank name / “Untitled Garden”:** Quick Start correctly requires a Garden name, whereas an Advanced draft may save with an empty name, then show up as **“Untitled Garden”** in Unfinished Gardens. Both are technically correct but can imply that actual nameless Gardens are allowed. Consider clearer **“Unnamed draft”** labeling and visible distinction between an unfinished draft (no Garden exists) and an actual Garden with status **Planned**.
- **Finding a newly created Garden:** Two unfinished drafts named “Test” appeared above Current Gardens. A new Quick Start Garden also named “Test” correctly appeared in Current Gardens farther down the page, but the user initially expected three “Test” items together. This is an information hierarchy/discoverability issue, not a data-integrity issue. Avoid assuming draft and created-Garden records belong in the same list. Distinguish **Draft**, **Planned**, **Active**, and **Completed/Archived** lifecycle concepts clearly.

### Navigation and layout candidates (all undecided)

- **Tabs candidate:** Bootstrap 6 tabs for Current / Drafts / Previous, perhaps with visible counts, could keep Current immediately visible while drafts remain one tap away. Tradeoff: inactive tabs hide content.
- **Distinct category routes candidate:** Dedicated listing URLs such as `/current` (Active), `/planned` (created but not active), `/drafts` (unfinished creation sessions), and `/previous` (Completed/Archived), alongside `/gardens` as a central management/discovery hub. Earlier prototypes used `/current`, `/previous` and a separate new-Garden wizard; they are **historical ideas**, not authoritative routing requirements. Route names, exact status filters, and navigation destinations remain open. **Planned is not Draft.** Routes do **not** all need primary-navigation buttons.
- **Garden hub / filmstrip candidate:** Keep **one primary navigation entry, “Gardens” → `/gardens`**. The hub could feature an upper-right prominent **plus** action for Quick Start (opening the creation workflow, not silently creating a record), then horizontal, Netflix-like card/thumbnail rails for **Current Gardens**, **Draft Gardens**, **Planned Gardens**, **Previous Gardens**. Each section displays a few scrollable previews and a **View all** link to its dedicated listing route. Evaluate how this works with many Gardens, missing thumbnails (use placeholders/icons), clear scroll affordances on phones, keyboard/touch access, and smaller screens. Both hub rails and full-list routes should use the same authoritative data and services.
- **“I want to…” action selector candidate:** An action-oriented select control at the top of the hub could offer **user intentions** such as “Create a Garden,” “Continue an unfinished Garden,” “Find an earlier Garden,” or “Manage Gardens,” rather than exposing internal route names. It offers a quick task path alongside full-list browsing and visual exploration. **Multiple entry points are intentional** because some users are action-oriented, some want a complete list, and others want to browse thumbnails. Share underlying workflows rather than building duplicate functionality.
- **Optional visibility preference:** An eventual Settings checkbox, e.g. **“Show action menu on Garden page”**, could hide the “I want to…” selector for those who prefer the other navigation styles. Candidate default **shown**; let the user choose rather than auto-hiding based on experience. Use existing local UI preference conventions if implemented; hiding the selector must not remove access to any operation.

### Principles and open questions

- Test the actual **user's mental model**, not merely internal record correctness. If controls look like consecutive parts of one action, people will expect entered values to follow them.
- Preserve the distinction between a **draft creation session** and a **saved Garden**. A created Garden's **Planned** status is not an incomplete draft. Existing duplicate Garden names and distinct UUIDs remain valid.
- Keep creation, lifecycle, navigation, and display layers separate; avoid coupling the hub presentation to internal services or changing the 8E4 atomic-draft guarantees merely to alter the UI.
- Decide later whether the hub, tabs, or route-focused UI (or a hybrid) best serves everyday outdoor use and desktop management. Also decide how new Planned Gardens are discoverable, whether “Current” means **Active only**, and how visible draft counts/links should be.
- **Timing:** Revisit after 8F during UI Tweaks. Do not amend 8E4 acceptance, implement speculative routes/preferences, or silently move them into committed ROADMAP scope now.

## Future UI Tweaks pass (after 8F): Modular, smaller-step Garden Wizard

**Status:** Deferred UI/architecture refinement to revisit **after 8F** during the planned UI Tweaks pass. **Do not alter the current 8E4 implementation or hold up 8E4 acceptance for this.** The existing three-stage Bootstrap 6 Stepper Wizard and Advanced form are functional first implementations; the Wizard's current Start screen has little to configure, while Details presents almost the entire Advanced form on one screen. The desired long-term difference is that **Wizard offers a guided succession of manageable decisions, while Advanced displays all fields together**.

**Historical concept (illustrative, not a fixed six-step contract):** (1) Name and subtitle; (2) Icon, color and thumbnail; (3) Garden Type(s); (4) Plant choices; (5) Other information (contents not yet defined, potentially Location, dates and description); (6) Review. The exact number, grouping, sequence, labels and fields can change as Garden evolves. Appearance fields are reserved but UI isn't implemented; plant selection and Gallery thumbnails depend on later functionality. Don't prematurely require those steps or bypass existing create-first/add-plants-afterward boundaries.

**Design goal:** Make adding, removing, reordering, or changing Wizard screens require **minimal changes to its orchestration**, rather than continually rewriting one monolithic JSX component. Prefer separate, descriptively named components (e.g. `src/components/wizard/steps/IdentityStep.jsx`, `GardenTypesStep.jsx`, `AppearanceStep.jsx`, `PlantSelectionStep.jsx`, `DetailsStep.jsx`, `ReviewStep.jsx`) rather than `step1.jsx`, `step2.jsx`, etc., because order can change. A small step registry could define stable step IDs, labels, components, and optional per-step validation; the Wizard shell and Bootstrap 6 Stepper derive their sequence and progress indicators from that registry. This is a design direction, **not** an agreed exact folder structure or an instruction to build generic frameworks now.

**Keep responsibilities distinct:** The reusable Garden draft/autosave service and UUID should be independent of screens and their order; Preact owns step navigation, per-step validation and rendering; existing Garden service remains authoritative for final validation and atomic creation/draft cleanup. Shared controls such as `GardenTypeSelector` belong outside individual Wizard steps so Advanced creation and future Garden editing reuse them. Reorganizing existing fields should be easy; genuinely adding persistent fields still requires explicit changes to Garden/draft contracts and validation, and may require planned schema work. Consider recording a stable **current-step ID** in draft metadata so a resumed Wizard can reopen the last stage; currently the 8E4 implementation restores field data but starts at Stage 1. Avoid hard-coded numeric step identities.

**Earlier prototypes for review:** The user has an older JavaScript wizard prototype (`wizard.zip`, supplied during November 7, 2026 discussion) with separate `index.html` template screens, `thewiz.js` navigation, and `steps.js` step behavior and localStorage-based resume. The archived PHP placeholder uses a URL `?step=N` switch: [garden-archive/new-garden.php](https://github.com/solacenetwork/garden-archive/blob/main/app/garden/new-garden.php). Treat both as historical design references, not code or data contracts to port verbatim; current Preact/Dexie architecture supersedes their storage and Garden identity assumptions.

**Timing:** Discuss and scope the UX/component refactor after 8F. No new milestone, schema changes, or 8E4 code changes are authorized by this parked idea.

## Future idea: Prefill Garden creation forms from URLs

**Status:** Parked enhancement; not part of the committed V1 milestones or 8E4 implementation.

A bookmarkable creation route such as `/gardens/new` could eventually accept optional URL query parameters to **prefill** the creation form. For example, `/gardens/new?name=My%20New%20Garden` might suggest the Garden name. This could support links from other SOLACE Garden features or external tools without requiring new navigation routes.

**Important distinction:** Opening the link must never automatically create a Garden. The gardener should review the prefilled values and explicitly confirm creation using the existing validated creation service. Treat URL parameters as untrusted input, not as authority to override defaults or bypass validation. Exact supported parameters, encoding, interaction with Quick Start/Wizard/Advanced and security/privacy details remain undecided. Do not implement this yet.

## Future idea: Garden Maps — visual plant-group layouts (not to scale)

**Status:** V1 uses an uploaded image as a garden map; an in-app layout editor is a tentative V2/V3 direction, not a committed milestone. This refines an earlier Garden Archive / Fabric.js prototype.

### Version boundary

- **V1 — Image upload only:** The gardener draws a plan externally (on paper and photographs/scans it, or in MS Paint, GIMP, or another drawing app), then uploads a **JPG or PNG** as the Garden's reference map. Garden displays and retains the image. It does **not** interpret its shapes, associate drawn areas with plant groups, or require any built-in drawing tool. This is the current approach, not merely a placeholder for the future editor.
- **V2/V3 — Possible in-app visual layouts:** Explore an optional, easy-to-use editor that arranges colored labeled rectangles/squares representing plant groups. A Mondrian-style **conceptual representation**, not a measured blueprint. Version placement is tentative.
- **Much later, if useful:** Optional AI-assisted spacing/dimension advice with independently supplied measurements and suitable reference data; not a dependency for the visual layout editor.

### Purpose

Give a gardener a simple visual representation of **which plant groups belong in an actual Garden and how the gardener imagines arranging them**. Preserve the useful “drag plants into the garden” interaction from the older Garden Maps experiments without building a CAD tool or making horticultural spacing promises.

### Two-layer concept: stable spaces and seasonal planting assignments

The original Maps vision has **two distinct parts**, which should not be collapsed into a single drawing or saved plant list:

1. **Define reusable physical growing spaces:** The gardener describes and optionally illustrates long-lived spaces, such as three 8 × 4-foot raised beds, large/medium containers, or a 20 × 30-foot in-ground bed. A named layout/template captures these areas and their optional dimensions. Such a template can be reused for years and edited when the physical setup changes.
2. **Assign plants by growing season:** The frequent operation is selecting/assigning plant groups into those predefined spaces for a specific season or crop cycle. A subsequent season can use the same physical layout with entirely different plant-group assignments; past plans should remain distinguishable from the current plan.

**Important domain distinction:** A Geographic Location is a physical site, a Garden Type describes a Garden, an actual Garden has its own lifecycle, and a *growing space in a reusable map layout* would be a further concept, not automatically identical to any of them. Do not silently repurpose the existing V1 Garden Templates model as a permanent physical-layout schema. Determine precise relationships, ownership and historical behavior when designing the future feature.

**Version scope:** V1 still means a gardener-supplied JPG/PNG reference map, with no built-in growing-space editor or per-space placement engine. V2/V3 could explore drawing/editing reusable spaces and overlaying season-specific plant assignments with colored labeled tiles. Dimensions may be stored as user annotations but should **not** drive automatic capacity/spacing calculations. AI or rigorous spacing assistance remains a separate, much later possibility.

### Lifecycle boundary cases for future Maps design

A reusable physical-space definition is created initially and normally changes only when the gardener changes the actual setup. Plant assignments have **independent lifetimes** and must not all be cleared by a new year or planting plan:

- **Orchard / permanent in-ground area:** The same planting areas and long-lived trees can remain associated for decades. New years primarily add observations, maintenance, harvests and history. A tree can still die, be removed or replaced without erasing the earlier record.
- **Perennial bed:** Plants such as asparagus or berries remain across years rather than being automatically replaced each season.
- **Seasonal vegetable beds:** The physical bed stays the same, while the chosen plant groups may change each spring, summer or fall.
- **Microgreens in a windowsill pot/tray:** The same small container might host many brief sow–harvest–replant cycles in a single year. A new crop does not require redefining the container.

**Design consequence:** Keep the lifetime of a growing space separate from the lifetime of plant groups and the dates/activity of particular plantings. A planting or harvest is not inherently a new physical space, nor is the calendar year necessarily a planting boundary. V1 need not implement a separate planting-cycle table; resolve representation and history rules when the later Maps/space-assignment workflow is designed.

### Possible V2/V3 concept and interaction

- **Discover → collect → assign:** Browse/search the published PlantDB catalog, research plants, and add candidates to a temporary **Potential Plants** basket/palette. When ready, assign candidates to an actual Garden, creating independent Garden plant groups. A plant may be assigned more than once, including to separate groups within the same Garden or to multiple Gardens.
- **Visual Garden area:** Display the selected Garden as a simple rectangular workspace with **colored rectangles/squares representing its plant groups**, inspired by Piet Mondrian-style CSS layouts. Labels identify the actual plant groups. Tiles may be moved, resized, recolored, and rearranged to create a readable, *representational* layout.
- **Two areas on larger screens:** Potential Plants / unplaced plant groups on one side; the selected Garden's visual area on the other. Drag-and-drop is a candidate, with explicit **Add/Move to Garden** controls as a touch/keyboard-accessible alternative. On small screens, use sequential selection and placement instead of requiring precise dragging.
- **Not required for basic gardening:** The ordinary Garden and plant-group lists remain fully functional without a map; the layout is an optional visualization, not the authoritative record of which plants are being grown.
- **Identity:** Each tile references a persistent **plant-group ID**. Plant groups reference PlantDB records by stable plant ID. Assign to a **Garden ID**, not to a Garden Type (Raised Bed, Container, etc. are classifications, potentially multiple per Garden). Duplicated plant selections produce independent plant groups, not duplicate catalog records.
- **Potential list lifecycle undecided:** Start by exploring an in-session selection basket; a gardener-wide shortlist that survives sessions is a distinct, future data-design decision, not something to assume or implement implicitly.

### Implementation direction to evaluate for V2/V3

- Prefer lightweight HTML/CSS Grid or SVG with a small arrangement editor before committing to Fabric.js. The old prototype had separate **Freehand Drawing Mode** and **Plant Picker Mode**, but the third-iteration concept needs only simple labeled rectangular tiles, not freehand drawing.
- A future layout record could contain references to plant-group UUIDs, tile order/position/size and display colors; keep diagram data separate from PlantDB and plant-group growing history. Exact storage schema, resizing, dragging, persistence and responsive controls need their own design/prototype.
- The map **is explicitly not to scale**. Tile size communicates a gardener's conceptual arrangement, not square footage, mature plant dimensions, guaranteed capacity, or recommended spacing. Avoid treating tile geometry as measured real-world data.

### Outside this initial concept

- No required drawing of beds to measured dimensions, predefined scale-accurate pot/container objects, automatic collision/fit checking, plant-density calculations or hard blocking of placement.
- The original scale-aware plan would have combined drawn garden dimensions with PlantDB plant dimensions (e.g., rejecting two large zucchini in a small radish area). That was judged too ambitious and exception-prone and is **superseded as the near-term Maps direction**.
- In a much later version, optional AI-assisted planning might advise on space, dimensions and spacing **only with appropriate measurements and validated reference information**, clearly as suggestions rather than treating a not-to-scale diagram as physical evidence.

### Design references

- Earlier Garden Archive Fabric.js prototype: canvas with separate drawing and plant-picker toolbars, example vegetable selector, shape controls, and a simple PNG export experiment. Keep as historical reference rather than code to port directly.
- Mondrian-like rectangular CSS compositions: https://www.mondriangenerator.io/ and https://getmondrian.com/
- **Scope boundary:** Garden V1 uses the gardener's uploaded JPG/PNG map as reference media and implements PlantDB lookup/selection and real plant-group creation in 8G/8H. It does not implement an interactive Maps editor. Avoid speculative diagram/geometry fields in V1 storage.

## Future idea: Subscribe to Garden Tasks via iCalendar (VTODO)

**Status:** Proposed optional V2 online integration; parked for future design, not committed implementation. V1 remains local-first/offline and does not require an account or feed endpoint.

### Purpose

Allow gardeners to subscribe to their Garden tasks from compatible external task/calendar applications using the open iCalendar (`.ics`) format and `VTODO` components (RFC 5545), rather than requiring a proprietary Garden client.

### Possible feed

Illustrative URL: `https://garden.solace.network/u/10120203/tasks.ics` (**example only**, not an existing endpoint or a recommended public identifier). The actual feed should use authentication or an unguessable, revocable subscription token; a predictable user ID alone must not expose private task information.

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SOLACE Network//Garden Tasks//EN
BEGIN:VTODO
UID:garden-task-001@garden.solace.network
DTSTAMP:20261106T170000Z
SUMMARY:Water tomato plants
DUE;VALUE=DATE:20261110
PRIORITY:5
STATUS:NEEDS-ACTION
END:VTODO
END:VCALENDAR
```

### Initial V2 scope to explore

- **Read-only, one-way publication** of tasks synchronized to Garden's optional online service. Garden remains the authoritative task editor; subscribing applications do not write back to Garden.
- Generate the feed from existing task data rather than designing V1 IndexedDB records around iCalendar fields. Preserve stable task IDs mapped to stable `UID` values so changes do not create duplicate tasks.
- Map task title, description, due date/time, priority, status and completion metadata where available; distinguish all-day due dates (`DUE;VALUE=DATE`) from timestamped due dates. Use valid `DTSTAMP` and update metadata (`LAST-MODIFIED` and/or `SEQUENCE`) as appropriate.
- Decide how completed/deleted tasks remain visible or disappear from subscription snapshots; ensure changes can be recognized by clients. Keep token rotation/revocation and feed caching in mind.
- Test real client behavior: `VTODO` subscription support is **not universal** (some calendar clients import/display `VEVENT` events but not tasks). A separate optional `VEVENT` calendar feed could be evaluated for wider compatibility; do not misrepresent it as equivalent to editable tasks.
- Consider CalDAV (RFC 4791) only if future requirements warrant **two-way** task editing/sync. It is not needed for a simple read-only `.ics` feed.

**Standards/reference:** https://www.rfc-editor.org/rfc/rfc5545 (iCalendar); https://www.rfc-editor.org/rfc/rfc4791 (CalDAV). Review newer iCalendar task extensions if relevant at implementation time.

**Version boundary:** This is a candidate V2 online service, not a V1 feature, database migration requirement, or commitment to full cloud/task synchronization.
