# Goals for SOLACE Garden

Garden should remain simple and useful for ordinary gardeners while allowing specialized functionality to be added without unnecessarily expanding the core application.

This is a **living goals document**. Sections marked *To discuss* are not yet approved MVP requirements. Implementation details belong in `TECH_SPEC.md`, and delivery milestones belong in `ROADMAP.md`.

---

## 1. Core Purpose

SOLACE Garden is a garden-management application focused primarily on food plants. It should serve gardeners with a wide range of growing spaces, from a single container on an apartment porch or balcony to a multi-acre outdoor garden.

Its purpose is to help gardeners **plan, organize, document, maintain, and evaluate** their gardens during a growing season and across successive years.

The application should remain practical and approachable without requiring specialized equipment, advanced technical knowledge, or participation in optional community features.

### Guiding principle: growing-space and planting lifecycles

Garden should support very different growing rhythms without assuming that a physical space, its current plants, and a calendar-year season all begin or end together.

- **Growing spaces can outlive many plantings.** A raised bed, container, windowsill tray or in-ground plot may be used repeatedly over years; the physical setup need not be recreated for every planting or season.
- **Plant lifetimes vary greatly.** A fruit orchard may retain individual trees for decades, perennial crops can span many years, seasonal vegetables are replanted periodically, and microgreens may be harvested and replanted in days or weeks.
- **Preserve continuity and history.** Recording a harvest, finishing a plant group, or beginning a new planting cycle should not by itself erase or reset an existing growing space or force long-lived plants to be reassigned. Gardeners may also change a physical space or replace an individual plant when needed.
- **Do not impose one annual cycle on everyone.** Support seasonal growing as well as continuous, overlapping, perennial, and short repeat plantings. The gardener controls when a Garden or plant group is finished according to its normal lifecycle.

**Scope:** These are product goals, not a decision to add a dedicated growing-space or planting-cycle entity in V1. V1 continues to use independent Gardens and plant groups, reusable Garden Templates, and an optionally uploaded map image. Reusable *physical-space* maps with season-specific assignments remain a future feature (see `PARKING_LOT.md`).

## 2. MVP

The MVP should support a coherent garden-management workflow while keeping individual features as simple as possible. A feature's historical presence in the JavaScript or PHP prototypes does not automatically make its full historical implementation a v1 requirement.

### 2.1 Garden Creation and Management

- Users can create and manage gardens representing individual growing seasons or garden projects.
- Each garden has its own identity, information, and lifecycle; historical activity remains associated with that garden record.
- The model should accommodate gardens whose layout stays the same across years as well as gardens whose size or configuration changes significantly. A gardener can set up a growing area once, save its reusable configuration as a Garden Template, and start later growing projects from that template instead of repeatedly entering the same information.
- Users can create a garden from scratch or start from a saved garden template.
- **Default to a guided Create Garden wizard**, with a **Quick Start** shortcut and an **Advanced** single-page form using the same fields, validation and creation behavior. Switching between Wizard and Advanced must preserve entered values.
- The wizard guides the gardener through **starting from scratch or a saved template**, **garden name/location/type**, and **review/create** (three short steps are the V1 target).
- **Quick Start** requires only a garden name; use the built-in **Default** location and preselect **In-Ground** in the Garden Type selections, set **Planned** status, and leave optional planting/start dates, plants, layouts and other details blank. Create a valid garden immediately, not a temporary draft; gardeners complete it later.
- **Advanced** exposes the same configuration on one form, including optional details. All paths create a new record and navigate to its garden detail page for subsequent editing and plant additions.

**Scope boundary:** V1 does not require one permanent physical-space record containing every growing cycle. A reusable Garden Template captures the setup; each newly created Garden has independent identity and history. Gardeners can also add successive independent plant groups within an ongoing Garden when that better represents the project (for example, repeated microgreens batches); neither every harvest nor every new plant group forces a new Garden. The gardener determines when to start another Garden or complete an existing one.

### 2.2 Garden Templates

Garden v1 will support **independently named, reusable garden templates**.

A user may create a new garden from scratch or select an existing template in the Create Garden wizard. A template provides a starting configuration for a new garden; it is not itself a historical garden record. **Define the setup once, then reuse it** for later crops or growing projects—for example, the same windowsill microgreens tray, raised bed, or in-ground area—without copying the previous plants and harvest history. V1 templates are reusable Garden *configuration snapshots*, not permanent physical growing-space records; a richer physical layout-template model remains a future Maps idea.

Users should be able to:

- Save an existing garden configuration as a named template.
- Select a saved template while creating a new garden.
- Start from scratch without using a template.
- Modify a garden created from a template without changing the original template.
- Reuse the same template for multiple gardens or growing seasons.
- Maintain templates independently of gardens created from them.

Journal entries, harvest records, completed tasks, and other historical activity should **not** be copied into a new garden when applying a template.

**V1 template scope:** Save as Template creates a **new named template**, not an overwrite. Copy a **suggested garden name** (editable on creation), **description, location, garden type, and layout media reference**. Never copy plant groups, phases, harvesting history, Journal or Calendar records, completed tasks, historical dates, or status. Every new garden gets its own ID, **Planned** status and blank dates. **Permanently deleting a template after confirmation is allowed even when gardens were created from it**; existing gardens are independent, and deletion must not remove shared Gallery photos. Editing/overwriting templates and template version history are deferred.

### 2.2a Locations and Garden Types

**Location is geographic:** A Location means a geographic property or growing site (e.g. home in Graham, NC, versus a community garden), **not** an individual bed, container, crop, or garden on the same property. One location may contain many independent gardens with different names and type selections. Every garden references exactly one `locationId`; the Wizard and Advanced creation forms present a Location selector.

- Seed a stable built-in Location whose initial name is **Default**. It is selected for Quick Start and initially selected in new-garden forms. **The gardener may rename and edit this record**, including its optional hardiness zone, but its name cannot be blank and **the built-in record may never be deleted**. Protection is based on its stable ID/system flag, not whether its current name is “Default”. Show **Default (Location)** only when the label needs disambiguation; that is not an immutable stored name.
- Additional named geographic Locations are supported in V1 (e.g. **Community Garden**), with create/rename/edit workflows. An unused custom Location can be deleted after confirmation; a Location referenced by any garden, including completed/archived gardens, cannot be deleted until those gardens are reassigned. Only editable gardens can be reassigned.
- Allow an optional **manually entered USDA Hardiness Zone** on each Location, with a link to the official lookup. An address or GPS coordinates are **not required**; no geolocation permission, automatic zone lookup or network-dependent location features in V1.
- **Garden Types are independent descriptive classifications, not exclusive categories or an enforced hierarchy.** A garden stores an array of stable predefined type identifiers (`typeIds`) and may combine types such as **Outdoor + Raised Bed + Container** or **Indoor + Outdoor**. They describe the Garden's cultivation context; selecting **Raised Bed** does not create an individual bed, assign dimensions, or create a plant destination. Specific physical growing spaces, such as “Raised Bed A” or “Windowsill Tray,” are distinct from Garden Type identifiers. The gardener is responsible for choosing appropriate combinations; no consistency checker or cross-type warnings are needed.
- Seed the existing **In-Ground, Raised Bed, Container, Greenhouse, Hydroponic, Other** types plus **Indoor** and **Outdoor**. The types remain fixed and undeletable in V1. Present them in a responsive **grid of independent toggle buttons** with clearly visible on/off states (accessible as multi-select controls); reuse the selection UI in Wizard and Advanced.
- Only allow valid seeded type IDs in V1. Garden Type selections can be edited when the garden is editable; archived/closed gardens follow normal unlocking rules. **Custom user-defined types are deferred to V2/V3**, potentially held in a separate user-type store but presented alongside system types.
- Quick Start retains its automatic built-in Location association and **In-Ground** preselection. An empty `typeIds: []` is **valid** in Wizard, Advanced and garden editing; the types are optional classifications. Store an empty array rather than `null`. Quick Start still initially preselects In-Ground.

**Future, optional V3/V4 direction:** If gardeners voluntarily provide address/coordinates, separately permissioned online features might offer localized weather, frost alerts, maps or estimated sunlight. Storing geographic details locally does **not** authorize transmission or public sharing. Any such use requires informed, explicit consent, and advanced sunlight estimates may need garden-specific shade/exposure details.

### 2.3 Plant Research (PlantDB)

PlantDB remains an independent project. Garden v1 will integrate a **simple plant selector** into garden creation and provide access to full reference records in PlantDB.

- Search or browse representative plant names (for example, “Potatoes”).
- Provide a simple selection workflow for adding PlantDB plants to a garden (a one-click, one-pick approach is a v1 candidate); retain the corresponding PlantDB identifier when available. Gardeners must be able to add the same plant more than once as independent plant-group entries.
- Keep detailed botanical and growing information in PlantDB, accessible through a link to the full record (potentially in a separate tab).
- Do not duplicate the PlantDB research interface inside Garden.
- **PlantDB's backend master database (for example MariaDB) publishes versioned JSON reference data** to `garden.solace.network/assets/data/`. The PWA ships/caches the current lightweight catalog for offline plant selection and checks for compatible published updates when online; Garden never directly queries the backend database. Keep reference data separate from gardener-owned records.
- Published data has independent **schema compatibility** and **dataset publication** versions. An update must be fetched/validated fully before replacing the last working offline catalog; it must **never automatically overwrite a gardener's plant groups, observations, or historical records**.

**Technical detail:** The exact add/remove interaction, repeated-selection presentation, published JSON manifest/record schema, cache/update validation, and any user-created/unavailable plant flow require implementation validation in `TECH_SPEC.md`. Drag-and-drop from a plant toolbar belongs to later interactive-map work.

### 2.4 Garden Maps

For V1, allow a gardener to attach and display an externally created **JPG or PNG** garden map (for example, a photograph of a paper sketch or a drawing made in GIMP). It is reference media only: Garden does not interpret shapes, recognize growing spaces, or link positions within the image to plant groups.

A potential V2/V3 interactive editor would separately define reusable physical growing spaces and visually assign plants to them using simple labeled, colored rectangles/squares. These represent a garden plan **not to scale**. Measured-space calculations, collision rules, and enforced planting capacity are *not* part of that initial editor concept; see `PARKING_LOT.md`.

### 2.5 Growing Season Tracking

Garden v1 tracks **independent plant-group entries**, rather than requiring a separate record for every individual plant.

- A gardener can add the same plant (for example, “Roma Tomatoes”) more than once when creating or editing a garden. Each entry is a distinct group, even when the entries reference the same PlantDB plant record.
- Each group maintains its own values, including **plant count**, optional planting date, and growing indicators, so staggered or succession plantings can be tracked separately. Quantity in v1 means number of plants, not rows, area, or seeds.
- Growing indicators are a **standard predefined list in v1**, shared across plant groups and controlled manually by the gardener using independent checkboxes.
- Multiple indicators can be active at the same time; they are not exclusive stages of a required linear progression.
- Each of the ten indicators supports **independent optional start and end dates**. Each date field has a **Today** shortcut, which fills only that field using the user's local date. A phase end date cannot be earlier than its start date; overlaps across different phases are allowed.
- Checking an indicator does not automatically fill dates, and entering dates does not automatically activate/advance indicators. Phase-to-phase suggestions or date copying are deferred (possibly v3).
- Indicators do not advance automatically based on dates or PlantDB reference information. Marking a plant group **Finished** does not change the overall garden lifecycle status (see [Current and Previous Gardens](#29-current-and-previous-gardens)).

**Initial v1 growing indicators (adjustable as requirements evolve):**

1. Seeds Started
2. Germinating
3. Seedling
4. Transplanted / Planted
5. Vegetative Growth
6. Flowering
7. Fruit Production
8. Harvesting
9. Dormant
10. Finished

**Post-MVP directions (tentative):**

- **Possible v2/v3:** Let gardeners customize growing-indicator labels rather than relying exclusively on the fixed list.
- **Possible v4:** Let gardeners organize multiple independent plant entries under gardener-defined grouping labels. This is distinct from the individual plant-group entries required in v1 and is not an MVP requirement.

**Technical-spec detail:** exact plant-group fields and identities, indicator storage, checkbox presentation, and any future grouping structure belong in `TECH_SPEC.md`.

### 2.6 Lists and Notes

Garden v1 will provide lightweight **gardener-wide**, rather than per-garden, lists that remain available across growing seasons:

- **Tasks:** add, edit, complete/uncomplete, remove, and reorder items.
- **Wish List:** a single gardener-wide purchasing checklist for products needed across all gardens (small supplies or major equipment); add, edit, mark purchased/unpurchased, remove, and reorder items. Optional quantity, notes and a user-provided product URL; no retailer API, price tracking, scraping or checkout in v1.
- **Notes:** add, edit, and remove simple text notes; no task-completion workflow required. An unlinked **Note** is a standalone record; a **Linked Note** is the same type of record with an optional garden reference.
- Notes, Tasks and Wish List records belong to the gardener's local collection, not to individual gardens; all may optionally reference one garden via nullable `gardenId`. The default view includes all items regardless of association. Garden completion, closure, archiving and reopening do not remove or unlink them; permanently deleting a garden clears those references while preserving the items.
- Group these tools within Garden rather than maintaining three standalone list applications. Keep **Tasks** as the existing navigation destination; Wish List can be a separate section/tab within it.
- Include lists and notes in the application-wide backup; no separate list-specific export/import controls.

The interface should be quick and uncomplicated, not a project-management system. The planned implementation is a shared Preact/Bootstrap component with local IndexedDB persistence (Dexie is a candidate) and optional SortableJS reordering; final library choices belong in `TECH_SPEC.md`. Gardener-level ownership is a product concept, not a decision about future cross-device synchronization.

**Future Wish List possibilities (not v1):** V2 may add user-defined tags and tag filtering. In V3/V4 or later, optionally publish selected Wish List items through `garden.solace.network` for gift purchasing, with explicit opt-in and privacy safeguards; the user-provided product URL is not a retailer integration.

### 2.7 Garden Journal

Garden v1 includes a **free-form, private personal Journal**, like a simple blog, independent of structured garden/plant tracking:

- Create, save, view, edit, and delete dated entries with titles. Entry date is editable and separate from the creation timestamp.
- Use **Tiptap** as the selected lightweight WYSIWYG editing engine, with **our own Preact/Bootstrap 6 interface**, not an off-the-shelf blog UI. Keep formatting simple: bold, italic, headings, lists, links, and inserted Gallery photographs.
- Store Journal content as **structured JSON**, with an explicit document-format version and references to shared Gallery media IDs, not transient blob URLs or duplicate image storage.
- Insert photos from the shared Gallery or import new ones using the shared media workflow. Photographs support **optional captions and alt text**; a caption may be suggested as initial alt text, but the two values remain independently editable.
- Browse entries **newest first** using reusable preview cards with date, title, excerpt, and optional photo. Support text-only entries, grid/list views, optional **year/month archive filters**, and a simple Load More or pagination control.
- **Responsive layout:** desktop archive sidebar alongside a card grid; tablet filters above cards; mobile stacks content vertically, using a single-column list and a compact year/month selector. Journal editing uses a dedicated page, not a popup.
- **Manual Save only**, with no autosave or drafts. Disable Save when no valid new/changed content needs saving; keep Save available until Dexie confirms success. An undo that returns content to the saved state should also clear the dirty state.
- Warn on unsaved changes using native JavaScript confirmation when navigating within the app, and `beforeunload` where supported when closing or refreshing; confirming departure discards the unsaved changes. Browser/mobile restrictions mean unload warnings cannot be guaranteed.
- Use **Tiptap's built-in multi-level Undo/Redo** while editing; do not build a separate history engine. Editing history need not survive closing the entry.
- Deleting a Journal entry requires confirmation and **permanently removes that entry in v1**, without a trash/recovery feature. **Never delete shared Gallery photographs** merely because their Journal entry was deleted. Deleted Gallery photographs instead show the established placeholder while retaining their media references.
- Make saved entries available offline and include them in application-wide ZIP backup and restore.

There is **no Draft/Publish distinction in v1**. Do not require plant-group associations, automatically change growing phases, or implement public sharing, RSS, comments, or publishing workflows. **Autosave, deleted-entry recovery, and entry version history** may be considered for v2/v3; they are not MVP features. Exact Tiptap extension configuration, reference rendering, sanitization, and dirty-state implementation belong in `TECH_SPEC.md`.

### 2.8 Photos and Gallery

Garden v1 will use **one local media collection** with context-specific views:

- Import photographs from device files, photo pickers, or available camera interfaces.
- Create optimized, resized copies for Garden (roughly 1600–2400 pixels on the longest edge is a candidate range); **do not alter originals** in the user's device photo library.
- Store only **optimized display images and thumbnails**, never full-resolution originals, and leave the device originals untouched. Provide a **gardener-configurable total media-storage budget in v1**, initially **250 MB**. Proposed optimization defaults: **1920px maximum display dimension, 256px thumbnails, WebP preferred with compatibility fallback, and approximately 80% compression quality**. Verify actual sizes, image support, and browser quotas through testing; these starting values may need tuning.
- Allow Gallery photographs to exist **without a garden association**, including general gardening photos used in Journal entries. A single photo may be linked to **multiple gardens** without duplicating image data; show the main Gallery grouped by capture year, garden-specific views, and representative thumbnails in garden summaries.
- Every photo supports **optional title, description, and tags**. Derive Gallery year from original photo timestamp (prefer capture EXIF, fall back to source-file modification time, then import date); allow manual date correction.
- Removing a photo from a garden only unlinks that association. On confirmed permanent deletion from Gallery, remove image blobs but **preserve media metadata and references as a tombstone**; linked views use a bundled placeholder instead of broken images.
- Allow Journal entries to reuse photographs from the shared collection without unnecessary duplicate image storage.
- Include associated photos in complete ZIP backup and restore.

The initial Gallery does not require separate free-form albums or a full media-management suite. **FilePond** is the preferred import/resize candidate, **lightGallery** the viewing candidate, and **Dexie** the selected local database; library integrations still require proof-of-concept testing. Future versions may provide missing-image identification and re-upload-based restoration, potentially assisted by image fingerprints, with user confirmation. Network uploads and server archival are **not v1 requirements**.

### 2.9 Current and Previous Gardens

Garden v1 will provide **four gardener-selected statuses** for each garden:

| Status | Meaning | Location |
|---|---|---|
| Planned | The garden is being prepared; planting has not begun. | Current Gardens |
| Active | The garden is being cultivated or maintained. | Current Gardens |
| Completed | The garden's planting project or growing cycle has ended. | Previous Gardens |
| Archived | The garden is retained as a read-only historical record. | Previous Gardens |

- The gardener manually chooses a garden's status using a select list. Dates and calendar-year changes must not automatically complete or archive a garden.
- When selecting **Completed**, offer to **Close Garden** with the explanation that it can be reopened later for edits. The gardener may instead keep the completed garden editable to finish recording information.
- Closing a garden makes it read-only without deleting its records; reopening restores edit access.
- Selecting **Archived** automatically closes the garden and makes it read-only. An explicit **Unarchive Garden** action unlocks it and returns the status to **Completed**, preserving the garden's data.
- Current Gardens contains Planned and Active gardens; Previous Gardens contains Completed and Archived gardens, including closed records that remain viewable.
- A garden is a distinct planting project or group of plants, **not a permanent physical location**. When the gardener chooses to start a new Garden for another crop or season, it receives its own record and history; gardeners are not required to enter a formal season identifier or use a dedicated “New Season” action. Not every planting or harvest is a new Garden: repeated or overlapping plant groups can be managed within an existing ongoing Garden. Long-lived projects such as orchards can remain active across years.
- To reuse a physical layout or configuration, the gardener uses the existing **Create New Garden** workflow and can select a previously saved garden template (see [Garden Templates](#22-garden-templates)). Historical activity is not copied into the new record.
- The gardener controls how long a growing cycle lasts; perennial or overwintering projects need not end at the calendar-year boundary.
- Each Garden record has an optional embedded **Garden Notes** (`notes`, initially `null`): plain-text, brief observations or a running summary of the Garden across its lifetime, independent of the Notes workspace and Linked Notes. Limit it to **1,000 characters**, show a remaining-character countdown, and offer optional editing during Close Garden as well as during ordinary editable garden management. Preserve it through completion, closure, archiving and reopening; include it in archived-garden search results. Do not automatically copy it into a template or a newly created Garden.

**Technical-spec detail:** exact confirmation dialogs, read-only enforcement, and status transition handling belong in `TECH_SPEC.md`.

### 2.10 Search

Garden v1 will provide **one application-wide search with filters** for locally managed Garden records, covering both Current and Previous Gardens.

- Provide a single, consistent search entry point rather than separate search interfaces for each Garden section.
- Search across garden names, embedded **Garden Notes**, and plant-group entries, including repeated plant varieties in different gardens and historical records. Include standalone **Notes** and **Linked Notes** in the Lists/Notes search scope and distinguish their result types; archived gardens remain searchable.
- Provide a search-field dropdown to choose the search scope. **Garden data is the default**, with optional scopes for **Lists**, **Calendar**, and **Journal**. The exact dropdown presentation is a UI design detail.
- Within Garden results, offer simple filters where useful (for example, by garden or garden status).
- Results should clearly identify the associated garden and record so the gardener can navigate directly to it.
- **Exclude PlantDB reference content from Garden-wide search.** PlantDB is a separate project with its own search interface. Garden's plant-group entries may be found by their names, but searching botanical reference records belongs to PlantDB.
- Search should work on locally available Garden data, consistent with the local-first MVP.

**Technical-spec detail:** the exact searchable fields within each scope, treatment of multiple list types, filter behavior, indexing approach, and behavior for future remotely archived data belong in `TECH_SPEC.md`. No advanced ranking or sophisticated full-text search engine is required by this goals statement.

### 2.11 Harvest Tracking

Garden v1 will record **individual harvest events associated with plant-group entries**, not with individual plants.

- A gardener may add multiple dated harvest records to a plant group during its growing cycle.
- Each harvest has a **required date** and belongs to one specific plant group. It records an optional **whole-number item count**, optional **weight**, or both; **at least one** of count/weight is required. Weight has an explicit unit; volume is not supported in v1.
- Plant groups that reference the same PlantDB variety still have separate harvest histories and totals.
- Show a chronological record of harvests for a plant group and calculate separate totals for **item counts** and **compatible weights**. Do not infer missing weights from item counts.
- Harvest records remain part of their garden's historical data, including after the garden is completed, closed, or archived; existing read-only rules apply.
- This approach preserves the information needed for later comparisons and analytics without adding per-plant tracking to the MVP.

**Gardener-wide Settings:** Measurement system is **Imperial by default**, with **Metric** as an option. Imperial offers ounces/pounds; Metric offers grams/kilograms. Each harvest retains its actual unit regardless of later settings changes; compatible weights may be converted for display/totals. Exact formatting and precision belong in `TECH_SPEC.md`.

**V2:** Add optional **volume** harvest measurement (cups, quarts, gallons, liters, and agricultural units such as bushels/pecks). Volume and weight are different dimensions; no crop-independent conversion between them.

**Post-MVP potential:** comparisons of yield across plant groups, gardens, or growing cycles; harvest trends and other analysis built from dated records. These are not v1 requirements.

### 2.12 Calendar and Reminders

Garden v1 will provide a **local-first personal calendar** for manually entered gardening events and optional reminders.

- Use **FullCalendar** (installed/bundled locally, not a CDN) for responsive calendar presentation and date selection; use the **RRule plugin** for recurring events.
- Gardeners can create, view, edit, and delete one-time events for activities such as watering, weeding, planting, or pest checks. **Date required; start time optional**, allowing all-day or timed events.
- Support recurring **daily, weekly, monthly, and yearly** schedules. In v1 editing a recurring event changes its **entire series**; per-occurrence overrides/exclusions and sophisticated recurrence management are deferred.
- Each event may optionally have a reminder **at its scheduled start time only**; no advance-notice offsets in v1. For an **all-day event**, use a gardener-wide **All-day event reminder time**, default **9:00 AM**, adjustable in settings. Changing this setting affects future all-day reminder timing without rewriting events.
- Provide **in-app reminders by default** (an indicator/alert while Garden is open). A gardener-wide **Allow browser notifications** toggle defaults **off**. Turning it on initiates a user-gesture-based browser permission request; if permission is granted and notifications are supported, use a native browser notification **instead of** a duplicate in-app popup. If unavailable, denied, disabled, or delivery fails, fall back to an in-app reminder while the app runs.
- Turning off the toggle stops Garden from issuing browser notifications and returns to in-app alerts; **the app cannot revoke browser-granted permission**, which must be managed in browser/site settings.
- Be transparent that reminders **only fire while the PWA is running** in v1. No push, background alarm guarantee, service-based workaround, or server required. **Missed reminders are simply ignored when Garden reopens**: no retroactive catch-up queue or overdue alerts. Future occurrences of recurring events still notify normally. Gardeners can dismiss/clear due reminders, with occurrence-aware deduplication.
- Offer a gardener-wide **12-hour / 24-hour clock display preference**, defaulting to **12-hour**. This changes presentation only; internally store local times consistently (such as `HH:mm`).
- **Use the device's system clock and local time zone** for all calendar and reminder calculations. Do not introduce NTP, external time verification, clock correction, or server time dependencies. Incorrect device time is outside Garden's responsibility; recurring local wall times should remain stable across daylight-saving changes.
- No automatic scheduling or calendar-driven progression of plant-group indicators. V1 does not require automatically populating events from planting dates, harvests, or other records.
- Event data, recurrence definitions, notification preferences, and reminder state are part of local application data and portable application-wide ZIP backup/restore.

**Technical details:** The app schedules/checks due occurrences while active; FullCalendar/RRule display recurrence but **do not independently schedule or deliver notifications**. Native Notification API delivery is platform-dependent (service-worker `showNotification()` where appropriate); background delivery is not promised. See `TECH_SPEC.md`.

**Post-MVP:** advance/custom reminder offsets, richer occurrence exceptions, background push/delivery when closed, integration with garden and harvest records, external calendar interoperability, and optional calendar publishing/sharing.

### 2.13 Navigation and Creation

- Keep the interface uncluttered by grouping related tools instead of giving every feature its own top-level button.
- Provide a prominent **Create New** split-button control in the upper-right area: the primary action creates a garden; the dropdown offers other relevant creation actions.
- Keep garden-specific actions, such as Add Plant or Save as Template, within the relevant garden context.
- Offer clear access to Current and Previous Gardens, with responsive desktop and mobile layouts.

The exact menu contents and responsive interactions belong in the technical specification.

### 2.13a Simple and Standard Interface Modes

Garden V1 should be **mobile-first and desktop-complete**, suited to quick observation/data entry outside and more detailed review and planning indoors. Two presentations access **the same data, features, and business rules**:

- **Simple Mode:** Prioritize direct, touch-friendly entry and immediate reference, using large main-screen action buttons rather than requiring a hamburger menu for frequent tasks. Initial primary destinations are **Plants, Harvest, Photos, Tasks, Calendar, and Notes**. Calendar and Notes are full view/add/edit workspaces, not just one-click creation shortcuts; exact home-screen layout remains subject to UI validation.
- **Standard Mode:** Provide fuller navigation and more detailed planning, organization, review, and management interfaces. Garden/template creation, layout work, detailed Journal editing, Gallery metadata/bulk organization, and historical garden administration are primarily Standard Mode activities, **not prohibited on a mobile device**.
- **Automatic (default):** Use responsive viewport width to choose Simple Mode for smaller layouts and Standard Mode for larger layouts. Provide an explicit override at all sizes through Settings with **exactly one selected radio button** from **Automatic**, **Simple Mode**, and **Standard Mode**. The chosen preference persists locally; the specific automatic breakpoint remains to be tested.
- **Responsive layout remains active within either selected mode.** A manually selected Standard Mode stays Standard even on a phone; a manually selected Simple Mode stays Simple on a desktop. Settings must remain reachable from both modes. Browser “Show desktop site” is not a reliable replacement for this control.
- **Outdoor operation:** Make key touch targets generous and high-contrast for wet/dirty hands and compatible touchscreen gloves. For fullscreen data-entry dialogs, use a conspicuous upper-right **X** with a generous touch area; closing discards nothing silently if there are unsaved edits. Use clear Save/Done actions and local-save feedback.
- **Focused plant updates:** Simple Mode's **Update Plants** leads to the current garden's plant-group list. Tapping a group immediately opens a fullscreen indicator editor (no extra Continue step). Grow indicators remain independently toggleable; Save returns to the **same plant-group list**, keeping filter and scroll context, so another group can be updated. The upper-left application logo provides a direct route to the Simple Mode home screen.
- **Supporting information:** Historical desktop Infobox/mobile Infobar ideas are **optional design candidates**, not required permanent panels. Present contextual data only where it improves a task.

The precise Standard Mode navigation, automatic breakpoint, Simple Mode home layout, and whether/where contextual panels appear are still open **Milestone 1 UI design decisions**. A gardener may always choose Standard Mode to use its full interface on a landscape tablet or phone.

### 2.13b First-run Welcome (confirmed V1)

- Provide an **informational Welcome page** at `/welcome`, shown automatically once when the app first launches at its normal starting route on a browser/device with no `welcomeSeen` flag.
- Briefly explain Garden's purpose, how to begin using Create Garden **once implemented** (do not advertise unavailable workflows), local-only data storage and backup responsibility, beta status during beta releases, and links to documentation and GitHub issues for bugs or suggestions.
- Welcome is **not** an onboarding wizard or prerequisite for creating a garden. Normal navigation remains available; no required acknowledgment, dismissal, or Get Started button.
- Persist `welcomeSeen` when Welcome is first successfully displayed, **not** when a button is clicked or when the user navigates away. Future launches skip automatic Welcome regardless of app version.
- Do not interrupt direct/deep links to other routes. Allow users to revisit Welcome via Help/About without resetting the flag.
- Keep Welcome content informational; the separately planned Wizard, Quick Start, and Advanced garden-creation flows are not yet implemented and must not be presented as currently usable.
- **V1 optional in-app installation:** Help/About offers **Install SOLACE Garden** when `beforeinstallprompt` is available, with a brief explanation/link from Welcome. This is a user-initiated native prompt, not a requirement to proceed. Provide manual installation guidance when appropriate rather than a nonfunctional button; do not depend on Chrome's toolbar icon. Detect standalone mode and `appinstalled`, but do not rely on a permanent localStorage flag as proof of current installation. Keep installation distinct from the existing **Update now/Later** flow.

### 2.14 Portable Backup and Restore

- Export all locally managed Garden data and associated media as a **portable, versioned ZIP package**.
- Restore from a ZIP package with validation and appropriate safeguards against accidental replacement or data loss. **V1 restore replaces rather than merges** local data, only after explicit confirmation.
- Offer a **standalone, read-only Validate Backup operation** that accepts a SOLACE Garden ZIP without restoring it and returns a clear **valid / invalid** result. Make the same validation engine available to import, export verification and tests; a detailed report should explain errors and non-fatal warnings rather than hiding the reason for failure.
- Treat **backup validity** (supported format, safe archive structure, valid records, relationships and media integrity) separately from **restore feasibility** on the current device (free storage, runtime support and ability to complete staging). A valid backup does not guarantee that this device can restore it.
- Import into a **separate staging IndexedDB database**, validate it fully, then switch the application's active-database pointer; leave the previous database available temporarily for rollback after the restored app starts successfully.
- Before staging, perform a **browser-storage preflight** using available-quota estimates and the uncompressed size statistics recorded in the backup manifest, plus a safety allowance. Reject known-insufficient restores; estimates cannot guarantee sufficient disk space and quota/write failures must leave the existing database untouched.
- Let the gardener save the package wherever they wish (such as a USB drive or a folder synchronized with Google Drive, Dropbox, OneDrive, or Nextcloud).
- Do not require a cloud account, SOLACE server, or provider-specific integration for v1 backup and recovery.
- Make clear that browser storage is not guaranteed permanent and that exported backups must be kept somewhere safe.

The archive includes metadata and cross-references for intentionally deleted photos but omits deleted image blobs. **JSZip is the preferred V1 candidate** for ZIP packing/unpacking; actual performance and memory use on phones must be tested. The manifest must contain a separately versioned format, data/media uncompressed byte counts and record counts. Detailed archive layout, restore validation, and large-media limits belong in `TECH_SPEC.md`.

### 2.15 Gardener Settings and location management

Settings is the gardener-facing home for **Location**, the selected Location's optional **USDA Hardiness Zone**, **measurement units** (Imperial/Metric), **theme** (Light/Dark/Automatic), and the already implemented **interface mode** (Automatic/Simple/Standard). Locations and hardiness zones remain location records; editing a zone through Settings must not turn it into one global value. Location administration may retain a dedicated workspace reached from Settings. Location management in Settings concerns **geographic sites**, not bed positions; the Create Garden forms offer a Location selector, while Quick Start uses the protected built-in Location. No extra global preferred-Location setting is required in V1. Theme implementation details remain to be finalized; no GPS/automatic zone lookup is implied.

## 3. Post-MVP

These are **future directions, not v1 commitments**; version numbers are illustrative targets rather than finalized delivery milestones.

- **Interactive Garden Maps (possible V2/V3):** initial setup defines reusable physical growing spaces (individual beds, containers, plots), which gardeners can reuse for many seasons or plantings. A simple Mondrian-inspired, not-to-scale visual editor may let gardeners assign and rearrange labeled plant-group rectangles in those spaces while retaining the independent lifetimes of permanent/perennial plants and rapidly replaced crops. Scale-aware fit/spacing enforcement is explicitly deferred; any much later AI-assisted advice would require separate measurements and reliable reference data.
- **Plant-compatibility guidance (possible v4):** advisory information about neighboring plants, supported by PlantDB references and appropriate caution about varying horticultural evidence.
- **Cloud backup (possible v2/v3):** user-configured backup destinations and automatic transfer of portable packages to supported services.
- **Connected Garden/archive (possible v3):** one Garden application available from the website and installable as a PWA; full historical access when connected, a smaller offline working set, and optional remote archival of older photographs.
- **Historical media retention:** potentially retain one or two seasons of locally stored display-size photos while keeping searchable older text records and representative thumbnails; older galleries could be fetched on demand.
- **Later hosting options:** SOLACE household devices (SHD) and SOS, potentially with household disks or Nextcloud, as alternatives to centralized storage.
- **Journal/public features:** opt-in publishing, RSS, video/media embeds, and community functionality if justified.

### Household ownership and future online identity (long-term direction)

SOLACE Garden is intended to be a **shared household gardening application**. When integrated with SOLACE identity services, one HID owns the complete Garden dataset. Authorized household members use the same Gardens and may edit records without Garden requiring individual gardener profiles, per-MID ownership, or tracking who performed routine gardening actions. Household membership—not the member's physical proximity to the garden—determines eligibility for future authenticated remote access.

This does **not** add an account or HID requirement to the V1 standalone PWA. V2's priority is hosted/authenticated access; later two-way sync must define conflict handling before implementation. Optional **post-V2** public plant/journal publishing, graduated location privacy, and invited **read-only** sharing belong to the [Parking Lot](PARKING_LOT.md) until scoped. Household identity linking and permissions are governed by the organization-level [Identity and Governance](https://github.com/solacenetwork/.github/blob/main/docs/IDENTITY_AND_GOVERNANCE.md) document. Keep private physical location data and public presentation choices separate.

## 4. Initial Data Handling

**Approved v1 direction:** Garden should work local-first, including offline access to locally held records, Journal content, lists, and imported media. Browser-managed storage (likely IndexedDB) will hold application data. A portable ZIP export/restore provides user-controlled backup without mandatory hosting or cloud accounts.

Importing a photo into Garden creates a resized/optimized copy; it does not modify the original. Storage budgets, persistence requests, and device/browser limits require validation in `TECH_SPEC.md`. Ordinary gardening notes do not require a special application-level encryption feature for v1; handle user content privately by default and explain the limits of browser storage and unencrypted exported packages.

**Still to specify:** final schemas, numeric storage budget defaults/limits, image-format and dimension benchmarks, precise media processing configuration, and complete restore validation/recovery implementation.

### Database schema stability and release policy (approved)

- **Alpha development (before the first data-preserving public release):** Keep the initial Garden data schema at Dexie version 1 while the model is being built. Disposable alpha databases may be deleted and recreated rather than migrated, with clear warning that development data is not guaranteed to survive. Reset the `solace-config` active-database pointer and the UUID-named data database together through an explicit development-only procedure; never silently reset a user's database on an ordinary startup or failed open.
- **At the first supported public beta/stable V1 release:** Establish a documented, supported persistent schema and a commitment to preserve gardener data across updates. The exact beta/stable release boundary must be declared before distributing builds that users are expected to retain data in.
- **Within a major application release series (e.g. 1.x):** Prefer schema-compatible feature and maintenance releases. Do not routinely bump Dexie schema versions or introduce breaking structural changes in minor/patch releases. An exceptional migration for a critical data-integrity/security defect is permitted, with explicit testing and release notes.
- **Planned major-version changes (e.g. 2.0.0-beta):** Schedule breaking schema changes as a dedicated workstream on a separate development branch. Define migration paths from supported older schemas, test them against realistic backups, and preserve existing user records. A major version is a migration window, **not** permission to erase production data.
- **Independent version numbers:** Application semver, Dexie schema versions (including the separate `solace-config` schema), and portable ZIP/data-format versions are distinct. They need not share the same numbers or advance together.
- **PWA compatibility:** Test service-worker activation, old open tabs, offline clients returning after long periods, IndexedDB `versionchange`/blocked upgrades, and backup/restore before shipping a breaking migration. Workbox caching does not itself migrate or protect IndexedDB data.

This is a release-planning rule, not a requirement to build migrations during disposable alpha development.

## 5. Future Data Handling

**Architectural direction, not a settled synchronization design:** Garden is one web application at `garden.solace.network` that compatible browsers may install as a PWA **in v1**, with local-first, offline-capable data handling. The PWA itself does not require connected storage or synchronization. In future versions, online and offline experiences may expose different amounts of historical data depending on connectivity and available storage, without requiring separate unrelated applications.

Future users may choose backup destinations, the amount of historical media retained locally, and whether/how to synchronize with a central server or household-hosted SHD/SOS system. Structured historical data may remain locally searchable while older photos are archived remotely and fetched when connected.

**To discuss later:** sync mechanisms, conflict resolution, offline selection/retention policies, archival verification, and provider integrations. None are v1 prerequisites.


## 6. Storage independence and optional synchronization (November 2026 decisions)

**V1 remains an account-free, fully local, offline-first PWA.** A phone or tablet can serve as the gardener's only device, with Simple Mode on small screens and Standard Mode available by explicit selection. A larger tablet or folding phone can offer more workspace. There is **no required Laravel service, account, cloud storage, or cross-device sync in V1**. Complete ZIP backup/replace-restore remains available for USB drives, personal cloud drives, and deliberate transfer to another browser/device; it is not merge-based sync.

**Storage-independent architecture is a V1 design requirement.** Garden components and domain services must use storage-neutral data contracts/repository boundaries rather than directly depending on Dexie APIs. **Dexie/IndexedDB is the sole V1 implementation**, not a permanent requirement for every runtime. Future implementations may include a Laravel HTTP API, native SQLite, or file-based interchange where the environment supports them. Storage-independent behavior does not imply identical latency, transactions, offline support, or capabilities across those backends.

**Configuration and recovery bootstrap (V1 decision):** Use a small, device-local IndexedDB control database named `solace-config` to resolve the currently active Garden data database. The Garden PWA first opens/initializes this control store, then opens the selected Dexie data database through storage-neutral repositories/services. Physical database names can change across validated restores; IndexedDB databases cannot be renamed. An imported ZIP is staged in a separate database, validated, explicitly approved for replacement, then activated by switching the durable control-store pointer; retain the prior database temporarily for rollback and recover safely after interruption. This design is a V1 foundation; full ZIP restore remains a later V1 milestone.

**Portable backup settings:** Use **`solace.config.json`** inside the Garden ZIP for portable gardener preferences (where appropriate), not for installation-specific database names, active/previous pointers, restore progress, storage-provider routing, filesystem paths or credentials. Portable configuration must be validated on import and must never overwrite the local control database wholesale. Keep personal preferences separate from installation/deployment storage configuration. With no optional provider overrides, default to local Dexie/IndexedDB and synchronization disabled. An unknown requested driver must fail clearly, never silently substitute an empty data store. V1 ships only Dexie; future adapters are not being implemented now.

**Post-V1 planning disclaimer:** **Only V1 is the current implementation commitment.** Every V2/V3/V4 and later idea below is an optional, revisable direction, not a guaranteed feature, release, schedule or deliverable. Design V1 to be complete and useful without requiring any future version.

**Long-term progression (possibilities, subject to re-planning):**

- **V2:** Create necessary hosted Laravel/MariaDB account and Garden services; support optional free SOLACE Garden accounts, one-way local-to-server upload, and authenticated online viewing. The local device remains the editable source of truth at this stage; do not advertise this as two-way sync.
- **V3:** Add genuine bidirectional synchronization across authorized devices, with revision/change tracking, deletion propagation, conflict policies, interrupted-transfer recovery, and media reconciliation.
- **V4:** Explore optional third-party cloud destinations (e.g. Dropbox, OneDrive, Google Drive) through appropriate OAuth/provider integrations. Distinguish backup storage from live synchronization before specifying behavior.
- **V5/V6:** Support SOS/SHD household-hosted synchronization. A pared-down local Laravel/PHP/MariaDB service primarily serves **one HID and authorized MIDs**, not the complete multi-household registration, identity, and governance responsibilities of central `solace-main`. Where possible, share stable Garden data contracts/APIs, not necessarily entire server deployments. Optional central sync is a future policy/design decision.
- **V7/V8:** Explore **generic SOLACE Sync**, potentially a Tauri desktop utility with SQLite and native filesystem storage, for portable transfers across multiple SOLACE applications, devices, and SOS. Not a Garden V1 dependency and not Garden-specific business-logic reconciliation.

**Data ownership:** Accounts and hosted services add convenience, not a prerequisite for gardening. Keep portable backups even after sync exists. Future ad-supported free hosted tiers, premium ad removal, and higher hosted-storage quotas are **commercial possibilities to evaluate**, not V1 functionality or committed prices/limits.

**Interoperability:** Stable IDs, portable/versioned ZIP schemas, media IDs/checksums where useful, and deliberate separation of storage versus synchronization should allow future providers to evolve without rewriting Garden's presentation layer. Laravel API, SQLite or other storage adapters are only speculative post-V1 possibilities (potentially V3/V4 or later), not part of V1 or a guaranteed release. Neither native filesystem access nor swapping the provider URL automatically solves conflicting edits or identity/authorization.
