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
- Garden creation should be approachable rather than requiring all optional tools and settings to be configured at once.

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

**Deferred detail:** Exactly which configuration fields are retained in templates, and how template editing and deletion work, will be defined in `TECH_SPEC.md`.

### 2.3 Plant Research (PlantDB)

PlantDB remains an independent project. Garden v1 will integrate a **simple plant selector** into garden creation and provide access to full reference records in PlantDB.

- Search or browse representative plant names (for example, “Potatoes”).
- Provide a simple selection workflow for adding PlantDB plants to a garden (a one-click, one-pick approach is a v1 candidate); retain the corresponding PlantDB identifier when available. Gardeners must be able to add the same plant more than once as independent plant-group entries.
- Keep detailed botanical and growing information in PlantDB, accessible through a link to the full record (potentially in a separate tab).
- Do not duplicate the PlantDB research interface inside Garden.

**Deferred detail:** The exact add/remove interaction, including how repeated selections are presented, remains a UI design decision. The catalog delivery method (published data or API), exact record structure, and how unavailable/custom plant records are handled belong in `TECH_SPEC.md`. Drag-and-drop from a plant toolbar belongs to later interactive-map work.

### 2.4 Garden Maps

For v1, provide a **simple way to attach or display an existing garden layout**, such as an uploaded image or sketch, without recreating the historical drawing editor.

Interactive scaled maps, drag-and-drop placement, and calculations of available growing space are post-MVP capabilities.

### 2.5 Growing Season Tracking

Garden v1 tracks **independent plant-group entries**, rather than requiring a separate record for every individual plant.

- A gardener can add the same plant (for example, “Roma Tomatoes”) more than once when creating or editing a garden. Each entry is a distinct group, even when the entries reference the same PlantDB plant record.
- Each group maintains its own values, including quantity, planting date, and growing indicators, so staggered or succession plantings can be tracked separately.
- Growing indicators are a **standard predefined list in v1**, shared across plant groups and controlled manually by the gardener using independent checkboxes.
- Multiple indicators can be active at the same time; they are not exclusive stages of a required linear progression.
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

Garden v1 includes a **free-form personal Journal**, like a simple blog, independent of structured garden/plant tracking:

- Create, save, view, edit, and delete dated entries with titles.
- Use a mobile-friendly WYSIWYG editor with ordinary rich-text formatting, links, and inserted photographs.
- Browse entries chronologically.
- Reference photographs from Garden's shared media collection rather than introducing a separate Journal photo store.
- Make saved entries available offline and include them in application-wide backup and restore.

There is **no Draft/Publish distinction in v1**: Save and subsequent Edit are sufficient for a single-user, nonpublic Journal. Do not require plant-group associations, automatically change growth indicators, or implement public sharing, RSS, comments, or publishing workflows. TinyMCE, Quill, and other editors can be evaluated in `TECH_SPEC.md`.

### 2.8 Photos and Gallery

Garden v1 will use **one local media collection** with context-specific views:

- Import photographs from device files, photo pickers, or available camera interfaces.
- Create optimized, resized copies for Garden (roughly 1600–2400 pixels on the longest edge is a candidate range); **do not alter originals** in the user's device photo library.
- Store photo data and metadata locally, with a bounded photo-storage budget and clear warnings/handling when capacity is approached. Exact limits depend on device/browser testing.
- Allow Gallery photographs to exist **without a garden association**, including general gardening photos used in Journal entries. Photos may optionally be associated with a garden; show the main gallery grouped by year, garden-specific galleries within each garden, and representative thumbnails in garden summaries.
- Allow Journal entries to reuse photographs from the shared collection without unnecessary duplicate image storage.
- Include associated photos in complete ZIP backup and restore.

The initial Gallery does not require separate free-form albums, advanced tagging, or a full media-management suite. Uppy is a candidate for file picking, import queues, and progress; IndexedDB/Dexie are candidate local storage tools. Network resumable uploads and server archival are **not v1 requirements**.

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
- Each harvest record contains a **date**, **quantity**, and **unit of measurement**, and belongs to one specific plant-group entry.
- Plant groups that reference the same PlantDB variety still have separate harvest histories and totals.
- Show a chronological record of harvests for a plant group and automatically calculate its total harvested quantity **for compatible units**.
- Harvest records remain part of their garden's historical data, including after the garden is completed, closed, or archived; existing read-only rules apply.
- This approach preserves the information needed for later comparisons and analytics without adding per-plant tracking to the MVP.

**Technical-spec detail:** available units, unit conversions (if any), quantity precision, entry editing/deletion, and how totals spanning incompatible units are displayed belong in `TECH_SPEC.md`. Do not sum different units without a defined conversion rule.

**Post-MVP potential:** comparisons of yield across plant groups, gardens, or growing cycles; harvest trends and other analysis built from dated records. These are not v1 requirements.

### 2.12 Calendar and Reminders

Garden v1 will provide a **simple personal calendar for manually entered gardening events and reminders**.

- Gardeners can create and view dated calendar events, such as watering, weeding, planting, or pest-control activities.
- A gardener may set a reminder for an event and receive an alert when supported by the device and browser.
- Gardeners can dismiss or clear reminders and delete events they no longer need.
- Keep the experience simple; do not require automatic scheduling, recurrence rules, or calendar-based progression of plant-group indicators.
- V1 does not require automatically displaying planting dates, harvests, or other Garden records on the calendar.
- Calendar event and reminder data are part of the local-first application data and portable application-wide backup.

**Technical-spec detail:** event fields, reminder times, notification permissions, what happens when the app is closed or offline, and alert reliability must be investigated in `TECH_SPEC.md`. In particular, do not promise background alerts when the browser/platform cannot reliably deliver them without a server or push service.

**Post-MVP (possible v3/v4):** richer integration with garden and harvest records, external calendar interoperability, and optional calendar publishing or sharing. These are future directions, not v1 commitments.

### 2.13 Navigation and Creation

- Keep the interface uncluttered by grouping related tools instead of giving every feature its own top-level button.
- Provide a prominent **Create New** split-button control in the upper-right area: the primary action creates a garden; the dropdown offers other relevant creation actions.
- Keep garden-specific actions, such as Add Plant or Save as Template, within the relevant garden context.
- Offer clear access to Current and Previous Gardens, with responsive desktop and mobile layouts.

The exact menu contents and responsive interactions belong in the technical specification.

### 2.14 Portable Backup and Restore

- Export all locally managed Garden data and associated media as a **portable, versioned ZIP package**.
- Restore from a ZIP package with validation and appropriate safeguards against accidental replacement or data loss.
- Let the gardener save the package wherever they wish (such as a USB drive or a folder synchronized with Google Drive, Dropbox, OneDrive, or Nextcloud).
- Do not require a cloud account, SOLACE server, or provider-specific integration for v1 backup and recovery.
- Make clear that browser storage is not guaranteed permanent and that exported backups must be kept somewhere safe.

The archive layout, restore conflict policy, and performance limits for large media collections belong in `TECH_SPEC.md`.

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

**Still to specify:** exact schemas, storage quotas, media processing, backup file format, and restoration safeguards.

## 5. Future Data Handling

**Architectural direction, not a settled synchronization design:** Garden is one web application at `garden.solace.network` that compatible browsers may install as a PWA **in v1**, with local-first, offline-capable data handling. The PWA itself does not require connected storage or synchronization. In future versions, online and offline experiences may expose different amounts of historical data depending on connectivity and available storage, without requiring separate unrelated applications.

Future users may choose backup destinations, the amount of historical media retained locally, and whether/how to synchronize with a central server or household-hosted SHD/SOS system. Structured historical data may remain locally searchable while older photos are archived remotely and fetched when connected.

**To discuss later:** sync mechanisms, conflict resolution, offline selection/retention policies, archival verification, and provider integrations. None are v1 prerequisites.
