# Goals for SOLACE Garden

Garden should remain simple and useful for ordinary gardeners while allowing specialized functionality to be added without unnecessarily expanding the core application.

This is a **living goals document**. Sections marked *To discuss* are not yet approved MVP requirements. Implementation details belong in `TECH_SPEC.md`, and delivery milestones belong in `ROADMAP.md`.

---

## 1. Core Purpose

SOLACE Garden is a garden-management application focused primarily on food plants. It should serve gardeners with a wide range of growing spaces, from a single container on an apartment porch or balcony to a multi-acre outdoor garden.

Its purpose is to help gardeners **plan, organize, document, maintain, and evaluate** their gardens during a growing season and across successive years.

The application should remain practical and approachable without requiring specialized equipment, advanced technical knowledge, or participation in optional community features.

## 2. MVP

The MVP should support a coherent garden-management workflow while keeping individual features as simple as possible. A feature's historical presence in the JavaScript or PHP prototypes does not automatically make its full historical implementation a v1 requirement.

### 2.1 Garden Creation and Management

- Users can create and manage gardens representing individual growing seasons or garden projects.
- Each garden has its own identity, information, and lifecycle; historical activity remains associated with that garden record.
- The model should accommodate gardens whose layout stays the same across years as well as gardens whose size or configuration changes significantly.
- Users can create a garden from scratch or start from a saved garden template.
- **Default to a guided Create Garden wizard**, with a **Quick Start** shortcut and an **Advanced** single-page form using the same fields, validation and creation behavior. Switching between Wizard and Advanced must preserve entered values.
- The wizard guides the gardener through **starting from scratch or a saved template**, **garden name/location/type**, and **review/create** (three short steps are the V1 target).
- **Quick Start** requires only a garden name; use the built-in **Default** location and **In-Ground** type, set **Planned** status, and leave optional planting/start dates, plants, layouts and other details blank. Create a valid garden immediately, not a temporary draft; gardeners complete it later.
- **Advanced** exposes the same configuration on one form, including optional details. All paths create a new record and navigate to its garden detail page for subsequent editing and plant additions.

**Scope boundary:** We are not requiring a single permanent physical-garden record containing every growing season. Reusable templates provide continuity without merging separate seasons' histories.

### 2.2 Garden Templates

Garden v1 will support **independently named, reusable garden templates**.

A user may create a new garden from scratch or select an existing template in the Create Garden wizard. A template provides a starting configuration for a new garden; it is not itself a historical garden record.

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

- Every garden belongs to exactly one physical **Location** and has exactly one **Garden Type**. Locations are reusable across independent garden projects and years.
- Seed the initial Location named **Default**, used by Quick Start and initially selected for new gardens. Gardeners can create and rename additional locations in v1. The built-in Default cannot be renamed or deleted in v1.
- An **unused custom location** can be deleted after confirmation; a location referenced by **any garden**, including completed/archived gardens, cannot be deleted until those gardens have been reassigned. Editable gardens may have their location reassigned.
- Allow an optional manually entered USDA hardiness zone on each location, with a link to the official USDA zone lookup. No location permission or automatic geolocation is required in v1.
- Seed Garden Types: **In-Ground, Raised Bed, Container, Greenhouse, Hydroponic, Other**. Custom type creation/editing is deferred.
- Seeded Garden Types **cannot be deleted** in v1, even if unused. Custom types are deferred; in any future type-management workflow, referenced types (including those used by historical gardens) remain protected. A garden's type may be reassigned only while that garden is editable.

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

For v1, provide a **simple way to attach or display an existing garden layout**, such as an uploaded image or sketch, without recreating the historical drawing editor.

Interactive scaled maps, drag-and-drop placement, and calculations of available growing space are post-MVP capabilities.

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

- **To-Do:** add, edit, complete/uncomplete, remove, and reorder items.
- **To-Buy:** the same basic checklist operations for purchases shared across gardens.
- **Notes:** add, edit, and remove simple text notes; no task-completion workflow required.
- Group these tools within Garden rather than maintaining three standalone list applications.
- Include lists and notes in the application-wide backup; no separate list-specific export/import controls.

The interface should be quick and uncomplicated, not a project-management system. The planned implementation is a shared Preact/Bootstrap component with local IndexedDB persistence (Dexie is a candidate) and optional SortableJS reordering; final library choices belong in `TECH_SPEC.md`. Gardener-level ownership is a product concept, not a decision about future cross-device synchronization.

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
- A garden is a distinct planting project or group of plants for a particular growing cycle, **not a permanent physical location**. A new planting cycle creates a separate garden record and history; gardeners are not required to enter a formal season identifier or use a dedicated “New Season” action.
- To reuse a physical layout or configuration, the gardener uses the existing **Create New Garden** workflow and can select a previously saved garden template (see [Garden Templates](#22-garden-templates)). Historical activity is not copied into the new record.
- The gardener controls how long a growing cycle lasts; perennial or overwintering projects need not end at the calendar-year boundary.

**Technical-spec detail:** exact confirmation dialogs, read-only enforcement, and status transition handling belong in `TECH_SPEC.md`.

### 2.10 Search

Garden v1 will provide **one application-wide search with filters** for locally managed Garden records, covering both Current and Previous Gardens.

- Provide a single, consistent search entry point rather than separate search interfaces for each Garden section.
- Search across garden names and plant-group entries, including repeated plant varieties in different gardens and historical records.
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

### 2.14 Portable Backup and Restore

- Export all locally managed Garden data and associated media as a **portable, versioned ZIP package**.
- Restore from a ZIP package with validation and appropriate safeguards against accidental replacement or data loss. **V1 restore replaces rather than merges** local data, only after explicit confirmation.
- Import into a **separate staging IndexedDB database**, validate it fully, then switch the application's active-database pointer; leave the previous database available temporarily for rollback after the restored app starts successfully.
- Before staging, perform a **browser-storage preflight** using available-quota estimates and the uncompressed size statistics recorded in the backup manifest, plus a safety allowance. Reject known-insufficient restores; estimates cannot guarantee sufficient disk space and quota/write failures must leave the existing database untouched.
- Let the gardener save the package wherever they wish (such as a USB drive or a folder synchronized with Google Drive, Dropbox, OneDrive, or Nextcloud).
- Do not require a cloud account, SOLACE server, or provider-specific integration for v1 backup and recovery.
- Make clear that browser storage is not guaranteed permanent and that exported backups must be kept somewhere safe.

The archive includes metadata and cross-references for intentionally deleted photos but omits deleted image blobs. **JSZip is the preferred V1 candidate** for ZIP packing/unpacking; actual performance and memory use on phones must be tested. The manifest must contain a separately versioned format, data/media uncompressed byte counts and record counts. Detailed archive layout, restore validation, and large-media limits belong in `TECH_SPEC.md`.

## 3. Post-MVP

These are **future directions, not v1 commitments**; version numbers are illustrative targets rather than finalized delivery milestones.

- **Interactive Garden Map (possible v2/v3):** scaled growing areas and containers; drag plants from a floating PlantDB selector; evaluate plant footprints and available space; reject placements that do not fit, with a clear explanation.
- **Plant-compatibility guidance (possible v4):** advisory information about neighboring plants, supported by PlantDB references and appropriate caution about varying horticultural evidence.
- **Cloud backup (possible v2/v3):** user-configured backup destinations and automatic transfer of portable packages to supported services.
- **Connected Garden/archive (possible v3):** one Garden application available from the website and installable as a PWA; full historical access when connected, a smaller offline working set, and optional remote archival of older photographs.
- **Historical media retention:** potentially retain one or two seasons of locally stored display-size photos while keeping searchable older text records and representative thumbnails; older galleries could be fetched on demand.
- **Later hosting options:** SOLACE household devices (SHD) and SOS, potentially with household disks or Nextcloud, as alternatives to centralized storage.
- **Journal/public features:** opt-in publishing, RSS, video/media embeds, and community functionality if justified.

## 4. Initial Data Handling

**Approved v1 direction:** Garden should work local-first, including offline access to locally held records, Journal content, lists, and imported media. Browser-managed storage (likely IndexedDB) will hold application data. A portable ZIP export/restore provides user-controlled backup without mandatory hosting or cloud accounts.

Importing a photo into Garden creates a resized/optimized copy; it does not modify the original. Storage budgets, persistence requests, and device/browser limits require validation in `TECH_SPEC.md`. Ordinary gardening notes do not require a special application-level encryption feature for v1; handle user content privately by default and explain the limits of browser storage and unencrypted exported packages.

**Still to specify:** final schemas, numeric storage budget defaults/limits, image-format and dimension benchmarks, precise media processing configuration, and complete restore validation/recovery implementation.

## 5. Future Data Handling

**Architectural direction, not a settled synchronization design:** Garden is one web application at `garden.solace.network` that compatible browsers may install as a PWA **in v1**, with local-first, offline-capable data handling. The PWA itself does not require connected storage or synchronization. In future versions, online and offline experiences may expose different amounts of historical data depending on connectivity and available storage, without requiring separate unrelated applications.

Future users may choose backup destinations, the amount of historical media retained locally, and whether/how to synchronize with a central server or household-hosted SHD/SOS system. Structured historical data may remain locally searchable while older photos are archived remotely and fetched when connected.

**To discuss later:** sync mechanisms, conflict resolution, offline selection/retention policies, archival verification, and provider integrations. None are v1 prerequisites.
