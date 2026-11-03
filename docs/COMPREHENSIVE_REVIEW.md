# Comprehensive Review: SOLACE Garden

This is a historical audit, not a design exercise.

The purpose of this document is to examine previous implementations of SOLACE Garden, identify the features and concepts developed over time, document their implementation status, and preserve the original design intentions.

This review will provide the historical foundation for:

1. `GOALS.md` — Define Garden's purpose, MVP requirements, and future features.
2. `TECH_SPEC.md` — Establish the technical architecture based on the approved goals.
3. `ROADMAP.md` — Organize implementation into development milestones.

Historical functionality should not automatically become a requirement for the new application.

**Guiding principle:** Understand the problem each historical feature was intended to solve, rather than automatically preserving its original implementation.

---

## 1. Historical Sources

The comprehensive review will examine the following sources:

| Source | Description | Review Status |
|---|---|---|
| Original PHP Garden application | Historical PHP implementation and user interfaces in `garden-archive` | In progress |
| MariaDB database | Historical SOLACE schema and Garden data structures | In progress |
| PlantDB | Historical reference application and separate database; detailed review deferred to its own project | Initial inventory |
| JavaScript Garden applications | Four historical JavaScript snapshots contained in `javascript-sites.zip` | In progress |
| Paper notebooks | Handwritten feature ideas, sketches, and planning notes | Pending |
| Previous SOLACE conversations | Historical discussions, proposed features, and design decisions | In progress |

### Historical repositories and sources

- [SOLACE Garden archive](https://github.com/solacenetwork/garden-archive) — Archived PHP application and associated historical code.
- `javascript-sites.zip` — Locally supplied archive containing four JavaScript versions and additional prototypes.
- [SOLACE Garden documentation](https://github.com/solacenetwork/solace-garden/tree/main/docs) — Current project planning documents.

The PHP archive describes itself as a historical prototype originally developed between 2016 and 2020. The repository also contains later-dated files and SQL snapshots from March 2024. The historical versions should not be assumed to follow the numbering or chronology of the ZIP folders.

### Evidence requirements

Features will be classified according to the available evidence.

The existence of a button, screen, route, database column, or source file does not necessarily establish that a feature was functional.

Where implementation cannot be verified, the feature will remain classified as **Unknown** or **Proposed**, or **Partial** when incomplete implementation is directly evident.

Source-code inspection and successful runtime testing should be distinguished.

---

## 2. Implementation Status

| **Classification** | **Meaning** |
|---|---|
| Implemented | Exists in code and appears functional |
| Partial | Some implementation exists, but functionality is incomplete |
| Broken | Implemented, but not working correctly |
| Proposed | Documented or discussed, but never implemented |
| Unknown | Needs further inspection or testing |

For every identified feature, record where possible:

- Purpose and original design intention
- User interface and navigation
- Implementation location and relevant source files
- Data structures and dependencies
- Data storage and retrieval behavior
- Known limitations and incomplete functionality
- Differences between historical versions
- Questions requiring additional inspection

This will help avoid accidentally discarding useful work or carrying forward features simply because they existed.

---

## 3. Future Disposition

After completing the historical inventory, each feature may be assigned one of the following dispositions.

| **Disposition** | **Meaning** |
|---|---|
| Retain | Carry the feature forward substantially as designed |
| Redesign | Preserve the underlying purpose but change its implementation or interface |
| Combine | Merge overlapping functionality into a more coherent feature |
| Defer | Consider for development after the MVP |
| Retire | Do not carry the feature into the new application |
| Undecided | Requires further evaluation |

Implementation status and future disposition are independent classifications.

For example, a fully implemented historical feature might be retired, while a feature that was only proposed might become an MVP requirement.

Future dispositions should generally remain **Undecided** until the comprehensive review provides sufficient evidence.

This document may record explicit project decisions, but it should not independently establish new MVP or implementation requirements.

---

## 4. Historical Application Versions

### 4.1 Pre-Laravel PHP application

**Repository:** `solacenetwork/garden-archive`

The archived application includes an early SOLACE Network website and applications such as Garden and Directory.

Garden is primarily located under:

`app/garden/`

The application uses PHP, JavaScript, Bootstrap, MariaDB, JSON, and browser storage in different portions of its implementation.

Identified components include Garden management, PlantDB, Journal, Lists, Calendar, Maps, Gallery, Backup/Restore, and experimental plugin management.

A substantial amount of the code contains demonstrations, placeholder records, experimental interfaces, and incomplete persistence operations.

### 4.2 JavaScript application snapshots

Four historical JavaScript versions were identified in the supplied ZIP archive.

| Archive version | Garden location | Internal Garden version |
|---|---|---|
| v1 | `v1/app/core/garden/` | 1.6.1-alpha |
| v2 | `v2/app/core/garden/` | 1.5.6-alpha |
| v3 | `v3/app/garden/` | 1.5.3-alpha |
| v4 | `v4/app/core/garden/` | 1.6.1-alpha |

The archive directory names do not directly establish release chronology.

The v1 and v4 Garden trees are closely related snapshots, with substantially identical file structures and most files sharing identical contents.

The v3 archive also contains development prototypes outside the main Garden directory.

### 4.3 SOLACE App Engine integration

Several JavaScript versions were organized within a larger SOLACE application framework, including the SOLACE Menu and SOLACE App Engine (SAE).

Observed historical approaches included:

- Garden-specific navigation and routing
- SAE-managed routing
- Shared JavaScript libraries for navigation and other services
- Garden-specific and shared storage utilities
- Separate feature directories and UI components

The application architecture changed across versions even when the visible Garden functionality remained similar.

**Implementation status:** Partial / requires further examination.

**Future disposition:** Undecided.

---

## 5. Consolidated Feature Inventory

The initial comparison of the PHP and JavaScript applications identified a largely consistent set of Garden features.

The table below records the presence of navigation, routes, or related interface code. It does **not** indicate that a feature was fully implemented.

| Historical feature | PHP | JS v1 | JS v2 | JS v3 | JS v4 |
|---|---|---|---|---|---|
| Home | Yes | Yes | Yes | Yes | Yes |
| Search Gardens | Yes | Yes | Yes | Yes | Yes |
| Create Garden | Yes | Yes | Yes | Yes | Yes |
| Current Gardens | Yes | Yes | Yes | Yes | Yes |
| Previous Gardens | Yes | Yes | Yes | Yes | Yes |
| Garden Maps | Yes | Yes | Yes | Yes | Yes |
| Photo Gallery | Yes | Yes | Yes | Yes | Yes |
| Plant Database | Yes | Yes | Yes | Yes | Yes |
| To-Get List | Yes | Yes | Yes | Yes | Yes |
| To-Do List | Yes | Yes | Yes | Yes | Yes |
| Notes | Yes | Yes | Yes | Yes | Yes |
| Calendar | Yes | Yes | Yes | Yes | Yes |
| Journal | Yes | Yes | Yes | Yes | Yes |
| Backup / Import | Yes | Yes | Yes | Yes | Yes |
| Settings | Yes | Yes | Yes | Yes | Yes |
| Help / About | Yes | Yes | Yes | Yes | Yes |
| Share | Not established | Yes | Yes | Yes | Yes |
| Plugin / Extras UI | Yes | Not established | Not established | Not established | Not established |
| Connectivity Indicator | Yes | Yes | Yes | Yes | Yes |

**Note:** The JavaScript implementations contain plugin directories despite the lack of a verified functioning plugin-management interface.

### 5.1 Common feature categories

The identified functionality can be grouped for historical inventory purposes.

| Category | Historical features |
|---|---|
| Garden Records | Create Garden, View Garden, Edit Garden, Current Gardens, Previous Gardens, Search |
| Garden Organization | Garden Groups, Containers, Growing Types, Garden Maps |
| Plant Reference | PlantDB access and plant selection |
| Tasks and Lists | To-Do Lists, To-Get Lists |
| Notes and Records | Notes, Journal, Calendar |
| Media | Photo Gallery, Garden Images |
| Data Utilities | Backup, Restore, Import, Export, Share |
| Application Interface | Home, Settings, Help, About, navigation |
| Connectivity | Online/offline indicator and related support |
| Extensions | Plugin directories and experimental management interface |

These are historical inventory categories, not proposed application modules or MVP requirements.

### 5.2 Shared Add New interface

The JavaScript implementations provided a shared interface for creating different kinds of records.

Identified actions included:

- New Garden
- New Map
- New Note
- New To-Get Item
- New To-Do Item
- New Journal Entry

The source demonstrates an intention to provide common creation workflows for multiple record types.

Actual creation and persistence behavior must still be evaluated individually.

---

## 6. Historical Feature: Garden Creation and Management

### 6.1 Original intent

The application was intended to manage multiple gardens or growing areas rather than treating an entire property as a single undifferentiated garden.

Examples included:

- Raised beds
- In-ground gardens
- Container gardens
- Flower beds
- Fruit trees
- Other specialized growing areas

Individual gardens could have their own names, descriptions, images, plant inventories, and organizational information.

### 6.2 PHP implementation

Relevant source files:

- `app/garden/current.php`
- `app/garden/previous.php`
- `app/garden/new-garden.php`
- `app/garden/view-garden.php`
- `app/garden/edit-garden.php`
- `app/garden/manage-groups.php`

**Current Gardens**

The application includes cards representing different garden types, with navigation to View and Edit pages.

The examined records are hardcoded demonstrations rather than verified database-driven garden records.

**Previous Gardens**

A separate page exists for historical or inactive gardens.

The examined page contains a placeholder message and a button for creating a new garden.

**Create Garden**

The PHP version contains a three-step wizard.

The examined wizard displays placeholder content. The Finish button does not demonstrate a completed persistence operation.

**View Garden**

The view page contains a relatively detailed interface showing intended functionality such as:

- Garden name and ID
- Main image
- Icon and color
- Garden group membership
- Other gardens within the group
- Description
- Garden image gallery
- Plant list
- Plant addition and changes

Much of the displayed information is hardcoded or demonstrative.

**Edit Garden**

A separate page exists, but the examined implementation is a placeholder that displays the requested garden ID.

**Manage Groups**

A dedicated page exists, but the examined implementation contains placeholder content.

**Historical implementation status:** Partial.

**Future disposition:** Undecided.

### 6.3 JavaScript garden-creation wizard

The JavaScript implementations contain a more developed garden-creation workflow.

Relevant historical files include:

- `lib/wizard/steps.js`
- `lib/wizard/thewiz.js`
- Garden route definitions
- Garden JSON sample data

The wizard provides multiple form steps, validation, and temporary browser storage for preserving progress.

Identified fields and concepts include:

| Field / Concept | Historical evidence |
|---|---|
| Garden type | Required field |
| Short name | Required field |
| Long name | Required field |
| Start date | Required field |
| Tags | Optional field |
| Garden ID | Generated ten-digit identifier |
| RSS feed | Optional checkbox |
| Color | User-selectable |
| Icon | User-selectable |
| Garden map | Anticipated in later wizard step |

Additional creation interfaces included Quick Start and All In One approaches.

However, later wizard steps contain test behavior, incomplete map integration, and an empty final save function.

Local storage of wizard progress does not demonstrate durable creation of a garden record.

**Historical implementation status:** Partial.

**Future disposition:** Undecided.

### 6.4 Garden record data

The JavaScript archive includes sample JSON records such as `garden_full.json`.

Identified data concepts include:

- Garden identity
- Names and descriptions
- Active status
- Creation and modification timestamps
- Garden type
- Plant records
- Plant quantities
- Planting dates
- Gallery references
- Map references
- Tags
- Color
- Feature settings

These sample records demonstrate the intended data model, but not necessarily a working database or completed persistence system.

### 6.5 Garden Groups and Containers

Garden group management appears in the PHP user interface.

JavaScript sample files include container and container-group data.

These suggest an intended distinction between individual gardens, containers, and collections or groups.

The precise relationships among these concepts have not yet been fully established.

**Historical implementation status:** Partial / Unknown.

**Future disposition:** Undecided.

---

## 7. Historical Feature: Plant Database (PlantDB)

### 7.1 Historical implementation

PlantDB was included within the historical Garden application.

The PHP archive contains:

- Plant-reference interfaces
- Plant search and detail pages
- Plant categories
- Administrative functions for adding, editing, and deleting records
- Plant images
- JSON import/export utilities
- A separate PlantDB database snapshot

The separate SQL snapshot contains `basic` and `detailed` tables.

An export utility generates a `plants.json` file from database records, demonstrating an attempt to separate reference-data management from data consumed by the application interface.

The JavaScript versions also contain PlantDB-related interfaces and navigation.

### 7.2 Project separation decision

**PlantDB will be separated from SOLACE Garden and treated as an independent project.**

PlantDB has its own unresolved architectural questions and requires a separate review.

Garden should not be responsible for defining the internal architecture of PlantDB.

### 7.3 Garden v1 MVP requirement

**Garden v1 MVP will provide access to PlantDB.**

The integration mechanism is **TBD**.

Possible mechanisms will be evaluated later; no decision has been made regarding application linking, APIs, embedded interfaces, locally distributed reference data, or synchronization.

Garden's technical specification should define its integration requirements only after the PlantDB architecture and Garden goals are sufficiently established.

The historical PlantDB code and datasets remain relevant to understanding Garden's original functionality.

**Historical implementation status:** Substantial implementation exists; detailed functional verification deferred to the PlantDB project.

**Future disposition:** Separate project; Garden MVP access required, mechanism undecided.

---

## 8. Historical Feature: Lists and Notes

### 8.1 Original intent

The application provided several quick-access personal information tools:

- To-Do Lists
- To-Get Lists
- Notes

These were separate user-facing features, but shared an underlying list-management implementation.

### 8.2 PHP implementation

Relevant files include:

- `app/garden/list/index.html`
- `app/garden/list/assets/list.js`
- `app/garden/list/getlist.php`
- `app/garden/list/savelist.php`

The List Manager JavaScript is labeled version `1.1.4-beta`.

The same list application could be configured with different titles, storage keys, and visual styling.

Its JavaScript retrieves items from browser `localStorage`.

Separate PHP endpoints contain database read/write operations for lists.

Valid server-side list types are identified as:

- `todo`
- `toget`
- `notes`

The complete integration between the browser-local data and MariaDB endpoints remains to be verified.

### 8.3 Historical SQL storage

The SOLACE SQL snapshot contains a table named `garden` with these fields:

| Field | Type |
|---|---|
| `mid` | tinytext |
| `gid` | int |
| `todo` | JSON |
| `toget` | JSON |
| `notes` | JSON |

The examined table primarily describes list storage associated with a member record. It does not constitute a complete relational model for individual gardens, beds, or plants.

This is distinct from the garden metadata represented in the JavaScript JSON samples.

### 8.4 Historical assessment and standalone-app provenance

The list tools illustrate a shared implementation used for several distinct user-facing purposes. The developer identified the PHP Garden List Manager as an adaptation of the separate [kendawson-online/todo](https://github.com/kendawson-online/todo) application, reused inside Garden rather than originally designed as a Garden subsystem.

The standalone application's `showList(config)` accepts a storage `key`, `listname`, and `locale`; the PHP Garden variant also accepts styling options. The Garden list picker passes configurations that keep the lists separate in browser storage:

| Garden list | Configured `localStorage` key |
|---|---|
| To-Do | `garden_todo` |
| To-Get | `garden_toget` |
| Notes | `garden_notes` |

The standalone app's per-list JSON export/import explains why the archived Garden UI includes separate backup controls; it does **not** establish the existence of a unified Garden backup solution. The original design treated Notes as a list-oriented tool, while the Journal was implemented separately. Source inspection demonstrates local list CRUD and reordering behavior, but not complete PHP database integration or runtime acceptance tests.

**Historical implementation status:** Partial pending integration verification.

**Current disposition:** Redesign/Combine — preserve lightweight gardener-wide lists and notes, but use a shared Garden component and application-wide backup. The approved requirements are in [GOALS.md](GOALS.md#26-lists-and-notes); the historical source is not the implementation prescription.

---

## 9. Historical Feature: Garden Journal

### 9.1 Original intent

Garden included a journal for recording gardening activities and observations.

### 9.2 PHP implementation

Relevant files include:

- `app/garden/journal/index.php`
- `app/garden/journal/new.php`
- `app/garden/journal/feed.php`
- `app/garden/journal/search.php`
- `app/garden/journal/formHandler.php`
- `app/garden/journal/imgUploader.php`

The archive also contains a `journal` database table.

The user interface includes journal-entry presentation, creation, searching, and image-related functionality.

However, the examined `formHandler.php` processes submitted values by displaying them rather than demonstrating a completed database-save operation.

Other Journal source files require additional examination before the overall feature can be classified as functional.

### 9.3 JavaScript implementation

The JavaScript versions contain Journal routes and supporting libraries.

A complete assessment of entry creation, persistence, retrieval, searching, and editing remains pending.

**Historical implementation status:** Partial / Unknown.

**Current disposition:** Redesign — retain a free-form Journal with WYSIWYG editing, photographs, and Save/Edit for v1, but do not carry over the unfinished Draft/Publish workflow. See [GOALS.md](GOALS.md#27-garden-journal). The distinction between historical implementation and approved new requirements is intentional.

---

## 10. Historical Feature: Calendar

Garden navigation consistently included a Calendar feature.

The PHP archive contains a separate Calendar directory and page.

The JavaScript versions also reference Calendar functionality.

The underlying calendar data structures and their integration with garden records, journal entries, and lists require further inspection.

**Historical implementation status:** Unknown.

**Future disposition:** Undecided.

---

## 11. Historical Feature: Garden Maps

### 11.1 Original intent

Garden included tools for creating and viewing maps of garden layouts.

### 11.2 PHP implementation

Relevant files include:

- `app/garden/maps.php`
- `app/garden/draw/index.html`
- `app/garden/view-garden.php`

The Maps page includes a Create A New Garden Map button that opens a drawing interface within a modal.

The archive contains graphical assets for basic shapes, including circles and rectangles.

The relationship between generated maps and persisted garden records has not been established.

### 11.3 JavaScript implementation

The JavaScript versions include map-related routes, supporting libraries, and sample map references.

The garden-creation wizard anticipates map integration, but the examined step does not implement a completed map-selection or persistence workflow.

**Historical implementation status:** Partial.

**Future disposition:** Undecided.

---

## 12. Historical Feature: Photo Gallery

The PHP Gallery page describes the intended first-version model of photographs associated with specific gardens and organized by year; standalone freely organized galleries were a later idea. It displays demonstration images, not proof of a completed photo persistence system.

The PHP archive includes:

- Gallery pages
- Image gallery display templates
- JavaScript for image presentation
- Demonstration images
- Garden-specific image references

Garden detail pages also include controls for adding and editing images.

The presence of these controls does not establish that uploads, image-to-garden associations, or gallery persistence were completed.

The JavaScript versions preserve Gallery as a visible feature.

**Historical implementation status:** Partial pending functional verification.

**Current disposition:** Redesign/Combine — one shared Garden media collection, with year-level, garden-level, and Journal-specific views; this is a new v1 decision, not a claim that the historical Gallery implemented it. See [GOALS.md](GOALS.md#28-photos-and-gallery).

---

## 13. Historical Feature: Backup and Restore

### 13.1 PHP implementation

Relevant files include:

- `app/garden/backup.php`
- `app/garden/assets/solace_backup_sample-030724.json`

The interface includes Backup and Restore actions.

The examined Backup button downloads a bundled sample JSON file rather than exporting current user records.

The Restore interface allows a JSON file to be selected, but the Import action displays a not-implemented alert.

This is evidence of the intended workflow, not a complete backup-and-restore implementation.

### 13.2 JavaScript implementation

The JavaScript versions contain import, backup, and related data-handling interfaces.

Their actual persistence and data-recovery behavior requires further inspection.

**Historical implementation status:** Partial.

**Current disposition:** Redesign — the approved v1 goal is a portable application-wide ZIP export and restore, including photographs, rather than copying the archive's sample-JSON behavior or standalone list backups. See [GOALS.md](GOALS.md#214-portable-backup-and-restore). Future cloud/household synchronization remains undecided.

---

## 14. Historical Feature: Online/Offline Status Indicator

**Original implementation:** A small status indicator dot in the lower-right corner of the Garden application, carried forward into subsequent application iterations.

**Original intent:** Communicate online/offline connectivity status to the user.

### 14.1 Historical code evidence

The PHP archive includes:

- Green and red status-indicator graphics
- JavaScript connectivity-checking routines
- A PHP connectivity-check endpoint
- A service worker with selected cached assets

The service worker's examined cache list primarily contains user-interface assets and graphics.

This does not establish that garden records could be read, created, updated, or synchronized offline.

### 14.2 Original SOLACE context

The status indicator also reflected broader interest in SOLACE Network connectivity.

The original concern was not simply whether a browser reported an internet connection, but whether SOLACE services could remain available when conventional internet access was unavailable.

Garden data availability and underlying network reachability are separate questions.

### 14.3 Observed concern

The indicator provides limited practical value by itself. It does not establish how application data is stored, retrieved, or synchronized when network connectivity is unavailable.

**Underlying requirement:** Determine how Garden handles reading, creating, updating, and preserving user data during connectivity interruptions.

### 14.4 Questions for the Goals document

- Which Garden features should work offline?
- Where should data be saved during offline operation?
- What happens to changes awaiting synchronization?
- How should the application handle synchronization failures or conflicts?
- What feedback does the user actually need?

**Historical implementation status:** Partial.

**Future disposition:** Undecided. Do not automatically carry the indicator forward simply because it appeared in previous versions.

---

## 15. Historical Feature: Directory-Based Garden Plugins

### 15.1 Original concept

One historical implementation organized optional functionality into subdirectories under a Garden plugins directory.

The presence of a plugin directory was intended to indicate that the plugin was installed.

There was no complete plugin management system in that original directory-based approach.

### 15.2 JavaScript source evidence

The supplied JavaScript ZIP confirms that `v1/app/core/garden/plugins/` contains the following directories:

- `companions/`
- `hydroponics/`
- `irrigation/`
- `lightmanager/`
- `pestcontrol/`
- `seedmanager/`

The same named directories appear in the other JavaScript snapshots.

The examined plugin directories do not contain functioning plugin implementation files.

They establish that the architecture and feature categories were planned, but not that the plugins were working.

### 15.3 Original plugin concepts

- Plant Database (previously considered default-installed)
- Companion Plants
- Hydroponics
- Irrigation
- Light Manager
- Pest Control
- Seed Manager

PlantDB is now being treated as a separate project, rather than assuming it must remain a Garden plugin.

### 15.4 Third-party extensibility

An additional design objective was to allow other developers to write specialized Garden extensions without modifying the core application.

Examples discussed include:

- Tractor and agricultural equipment maintenance
- Harvest tracking and yield analysis
- Crop curing, drying, and processing
- Specialized cultivation and agricultural workflows

These are examples of potential extensions, not verified historical implementations.

### 15.5 PHP plugin interface prototype

The PHP archive contains an `extras.php` interface with:

- Installed-plugin listings
- Installation-related checkboxes
- Show/Hide Plugins Menu functionality
- A simulated uninstallation progress bar
- Browser `localStorage` controlling menu visibility

The interface uses placeholder plugins and explicitly simulated behavior.

It is not evidence of a functioning third-party plugin installation system.

### 15.6 Proposed plugin navigation

A Plugins dropdown was discussed as a way to access installed extensions without expanding Garden's main navigation indefinitely.

The existence of this idea does not establish that automatic plugin discovery or menu generation was functional.

### 15.7 Historical architectural principle

Garden was intended to provide common gardening functionality while allowing specialized tools to remain separate.

The historical attempts at modular organization and third-party extensibility should be preserved as design context.

**Historical implementation status:** Partial / Proposed, depending on the specific feature.

**Future disposition:** Undecided.

A modern plugin API, management system, and extension model have not been established as Garden MVP requirements.

---

## 16. Historical Data Handling

### 16.1 PHP application data sources

The PHP archive contains two SQL snapshots:

- `solace-db_2024-03-27.sql`
- `plantdb-db_2024-03-27-mariadb.sql`

The SOLACE database includes records for members and several early SOLACE applications.

The PlantDB database contains plant-reference structures and is handled separately in this review.

### 16.2 JavaScript application data sources

The JavaScript archive contains sample files including:

| File | Historical subject |
|---|---|
| `garden_full.json` | Garden metadata, plants, maps, gallery references, and other fields |
| `garden_calendar.json` | Calendar-related data |
| `list_todo.json` | To-Do items |
| `list_toget.json` | To-Get items |
| `list_notes.json` | Notes |
| `container.json` | Container data |
| `container_group.json` | Container-group data |

These files provide evidence of intended data structures.

They do not independently demonstrate complete CRUD operations or synchronization.

### 16.3 Historical storage mechanisms

The examined versions contain evidence of several different storage mechanisms:

- MariaDB
- JSON documents and sample datasets
- Browser `localStorage`
- Service-worker asset caching
- PHP database access endpoints

A complete storage and retrieval map has not yet been established.

In particular, it remains necessary to determine how browser-local data and server-side records interacted, and whether any historical version supported a reliable synchronization mechanism.

### 16.4 Historical architectural question

The review must distinguish among:

1. Data intended for reference or shared consumption
2. Personal Garden records
3. Temporary interface and wizard state
4. Offline-cached content
5. Backup and export data

No new storage architecture has been selected as part of this historical review.

---

## 17. Additional Historical Features Requiring Review

The following features have been identified but have not yet received adequate source-code examination.

| Feature | Known evidence | Implementation status | Future disposition |
|---|---|---|---|
| Garden Search | Navigation and PHP search pages | Unknown | Undecided |
| Settings | Shared menus and settings interfaces | Unknown | Undecided |
| Help | Help pages and navigation | Unknown | Undecided |
| About | About pages and navigation | Unknown | Undecided |
| Share | JavaScript navigation references | Unknown | Undecided |
| Quick Start | Alternate garden creation interface | Partial | Undecided |
| All In One | Alternate garden creation interface | Partial | Undecided |
| Gallery image upload | Buttons and media-related PHP files | Unknown | Undecided |
| Data import/export | Interfaces and supporting files | Partial / Unknown | Undecided |
| Application session integration | PHP session references and SAE-related libraries | Partial / Unknown | Undecided |

The separate JavaScript prototypes under `v3/dev/prototypes/` also require inspection.

---

## 18. Preliminary Cross-Version Findings

The initial review has identified several recurring patterns.

### 18.1 Consistent user-facing features

The core set of Garden navigation options changed relatively little across the examined versions.

Garden creation, garden records, maps, gallery, lists, journal, calendar, and PlantDB access appeared repeatedly.

### 18.2 Changing application architecture

The underlying implementation changed more significantly than the visible feature set.

Different versions experimented with PHP pages, standalone JavaScript libraries, SAE integration, JSON data structures, browser storage, and modular feature directories.

### 18.3 Extensive prototyping

Many screens and controls represent intended functionality rather than completed workflows.

This is especially evident in Garden creation, editing, backup/restore, and plugin management.

### 18.4 Historical separation of reference and personal data

PlantDB had a separate database and administration workflow.

Personal Garden tools used other structures, including member-associated JSON fields and browser storage.

The new project separation for PlantDB is consistent with this historical distinction, although its future architecture remains undecided.

### 18.5 Shared implementations beneath separate UI features

Notes, To-Do Lists, and To-Get Lists shared a list-management implementation in the PHP archive.

This should be documented without assuming that the new application must combine their user-facing functionality.

---

## 18A. Follow-Up Functional Audit: Personal Data and Utilities

This section records a subsequent **static source-code inspection** of the PHP archive and JavaScript snapshots. It extends, rather than replaces, the earlier preliminary classifications. No successful end-to-end browser testing has been reported.

### 18A.1 PHP To-Do, To-Get, and Notes storage

- The configurable List Manager in `app/garden/list/assets/list.js` reads and writes records through browser `localStorage`. The same code supports different list configurations and JSON backup/restore operations.
- `app/garden/list/getlist.php` and `savelist.php` separately contain MariaDB JSON-column retrieval and update logic for `todo`, `toget`, and `notes`.
- No calls to these PHP endpoints were found in the examined `list.js`. Their mere coexistence does not establish synchronization between browser data and MariaDB.
- The PHP retrieval endpoint constructs SQL using supplied list type and member ID; the save endpoint parameterizes the values but incorporates the selected column name into SQL. This is a historical implementation/security observation, not a request to repair the archive.

**Classification:** Partial overall; concrete local-list CRUD and file import/export logic exists. **Future disposition:** Undecided.

### 18A.2 JavaScript Lists across snapshots

- The v1/v4 list implementation uses direct `localStorage` operations for creating, reading, changing, and deleting list data.
- v2 divides list functionality across additional JavaScript files and includes an explicitly named item-edit function.
- The list implementations contain actual CRUD logic, but complete browser workflows have not been acceptance-tested.
- Some source comments anticipate moving storage behind an SAE service rather than writing directly to `localStorage`.

**Classification:** Partial pending runtime verification. **Future disposition:** Undecided.

### 18A.3 Journal storage and the IndexedDB experiment

- The PHP Journal includes a rich-text entry form, example archives, search UI, and a separate image-upload handler. Its examined form handler echoes submitted content rather than inserting a Journal record; the search query is commented out and example results remain.
- JavaScript Journal files use **JsStore/IndexedDB** with a `MyJournal` database and `Entries` table, but the examined database routines are partly demonstrations.
- The examined insertion routine uses a sample entry, initialization can invoke insertion again, reading targets a fixed record, and an update routine references `Product` rather than `Entries`. These are evidence of an incomplete data experiment, not a verified production Journal lifecycle.
- The v3 Journal implementation is under `app/garden/core/journal/`, rather than the `lib/journal/` path used in other snapshots. A changed location is not evidence that the feature was removed.
- The PHP `journal/imgUploader.php` contains upload-handling logic using a session member ID; authorization checks and association with saved entries require further investigation.

**Classification:** Partial/prototype. **Future disposition:** Undecided.

### 18A.4 Calendar

- PHP `app/garden/calendar/index.html` uses FullCalendar and displays date-click alerts. No completed event-save or database retrieval workflow was demonstrated in this page.
- JavaScript navigation and a `garden_calendar.json` sample show continuing interest in Calendar, but do not establish persistent event management.

**Classification:** Partial demonstration in PHP; JavaScript functionality remains Unknown/Partial. **Future disposition:** Undecided.

### 18A.5 Maps and drawing

- PHP `app/garden/maps.php` opens the `draw/` interface.
- `app/garden/draw/index.html` uses a Fabric.js canvas with shape and color tools. `saveCanvas()` exports a PNG image to the browser's download mechanism; this is a genuine coded output path, not a verified record-save operation.
- No completed editable-map persistence or map-to-garden association has been established.
- JavaScript Map libraries show template-oriented experiments (container, raised-bed, in-ground, hydroponic, custom), alongside unfinished-action handlers.

**Classification:** Partial. **Future disposition:** Undecided.

### 18A.6 Photo Gallery and images

- PHP `app/garden/gallery.php` explicitly describes a first-version idea: images attached to gardens and organized by year. It describes independently organized, tagged “freeform” galleries as a possible later direction.
- `gallery-images.php` uses fixed demonstration images. The gallery code contains a TODO for database-driven information.
- A separate Journal image uploader should not be counted as a completed Garden Gallery upload pipeline.
- JavaScript gallery routes or sample references are not proof of upload, association, or retrieval.

**Classification:** Partial/demonstration. **Future disposition:** Undecided.

### 18A.7 Search, settings, backups, and other utilities

| Utility | Further source finding | Historical status |
|---|---|---|
| Garden Search | PHP search interface and result page contain example text and pagination; working stored-record search not established | Partial |
| Settings | PHP menu contains controls for user, backup reminders, network mode, public feed, and public Journal; persistence and effect of each control not verified | Partial |
| Garden Backup | PHP button downloads a bundled sample JSON, not a generated current-user backup | Partial |
| Garden Restore | PHP import button displays an explicit not-implemented alert | Partial |
| List Backup/Restore | Local list JavaScript includes JSON export/import handling using `localStorage` | Partial; actual workflow untested |
| Help/About | Dedicated pages and navigation exist; these are informational pages, not evidence of other functional workflows | Present in source |
| Sharing | JavaScript UI/route evidence exists; completed user workflow not established | Unknown |
| Authentication/member identity | PHP session references coexist with a hardcoded development MID; member-to-record authorization remains to be traced | Partial |

### 18A.8 Revised historical storage map

| Storage mechanism | Observed historical usage | What has **not** been established |
|---|---|---|
| MariaDB | SOLACE member/application schemas, list JSON endpoints, Journal table | Complete Garden record CRUD or working list synchronization |
| `localStorage` | Lists, wizard progress, personalization, application settings/state | Robust multi-device sync or recovery |
| IndexedDB / JsStore | Journal database experiment | Full UI-to-database Journal workflow |
| JSON assets | Example gardens, containers, lists, calendars, plant data, sample backups | Automatically synchronized user records |
| Service worker / cache | Selected interface assets | Full offline Garden record lifecycle |
| Downloaded files | List backups and PNG map export paths | A unified Garden backup and restore system |

**Finding:** Several storage strategies were explored independently. No verified end-to-end synchronization architecture has been established from the examined code.

---

## 18B. Historical SOLACE App Engine (SAE): Context and Project Boundary

**Evidence type:** Primarily developer recollection and design explanation, supplemented by SAE-related files in the supplied JavaScript archive. The class-style example below was shared as an illustration; its source file has **not** been supplied or independently inspected.

### 18B.1 Original SAE purpose

SAE was envisioned as a **general-purpose SOLACE application runtime and template display system**, not as a Garden-specific library.

The intended shared capabilities were:

- Reusable layouts, templates, and UI components
- Application rendering and navigation
- Storage access via an application-facing API, potentially choosing between storage backends
- Internet/online connectivity awareness
- A common platform for independently developed SOLACE applications

The first two intended official applications were **SOLACE Menu** and **Garden**. Additional placeholder/demo applications were intended as developer references to show how third parties could build their own SOLACE applications.

### 18B.2 Application handoff

The intended workflow was for SAE/SOLACE Menu to launch an application and hand over UI control; closing the application would return control to SAE. The Menu itself could also be treated as an app using the underlying runtime.

This describes the **intended developer and user experience**, not a verified completed application lifecycle.

### 18B.3 Illustrative historical API concept

The developer described a class-style experiment resembling:

```javascript
const newApp = newSolace();
newApp.title = "My New App";
newApp.mode = "foobar";
newApp.storage = "indexed";
newApp.template = "sidebar";
newApp.render();
```

The exact class implementation has not been reviewed. Do not treat this snippet as an established API contract.

### 18B.4 Development context

The early SAE and Garden JavaScript experiments were written in **vanilla JavaScript**, before the developer adopted frameworks such as Preact and tools such as Vite. They were deliberately used to learn browser and DOM behavior, rendering, routing, event handling, and browser storage directly. Learning the underlying JavaScript/DOM model before relying on frameworks was an explicit goal.

The developer was also learning GitHub workflows at the time. Over approximately two years, these projects served both as SOLACE product prototypes and as hands-on educational/architectural experiments.

Because code was written experimentally rather than against a finalized specification, competing or incomplete approaches in the archive should not automatically be interpreted as rejected product requirements or failed finalized designs.

### 18B.5 Transition to the later PHP approach

By the later PHP Garden iteration, the developer had **largely set SAE aside**, focusing instead on PHP and database interactions. That transition explains some architectural differences among the historical sources; it does not establish that the idea of shared services was judged invalid.

### 18B.6 Shared SOLACE services: current discussion, not a historical implementation claim

The current architectural discussion considers a **SOLACE Server** that holds account and identity information and exposes common authenticated APIs used by Garden and other applications. Potentially shared concerns include identity, authorization, access to remote services, data transport, and synchronization facilities.

Under that possible separation, Garden would still own the meaning and structure of garden-specific data, while shared SOLACE facilities would avoid duplication of account and integration machinery across apps.

This **common service API** idea is distinct from requiring applications to run inside the original SAE display/runtime system. Its transport, API contracts, data ownership, sync behavior, and deployment have not been specified or approved here.

**Boundary decision:** SAE and the proposed shared-services platform should be evaluated as broader SOLACE infrastructure subjects, not treated as mandatory Garden v1 components merely because Garden was used to prototype them.

**Historical implementation status:** Partial/experimental. **Future disposition:** Undecided.

## 18C. Historical Notebook Findings — November 2026 Review

This section records Garden-related concepts recovered from handwritten SOLACE development notebooks dating back to approximately 2016, together with clarifications and extensions discussed during the November 2026 review.

**Evidence distinction:** Original notebook concepts, developer recollections, surviving source-code evidence, and newly proposed enhancements must remain distinguishable. Exact notebook dates and page references will be added as material becomes available in [solace-dev-notes](https://github.com/solacenetwork/solace-dev-notes).

Unless otherwise stated, future feature dispositions remain **Undecided**.

### 18C.1 Garden Activity Feeds and RSS

**Historical concept:** Garden activity could be published or consumed through feeds organized by gardener and by individual garden.

Two broad feed categories were envisioned:

**Human-readable Journal feeds**
- Journal entries containing prose, photographs, observations, and gardening progress.
- A gardener-level feed combining journal activity across multiple gardens.
- Optional public publishing so other gardeners could subscribe and follow the gardener's progress.
- Private by default unless the gardener enables sharing.

**Structured garden data feeds**
- Individual feeds associated with gardens such as containers, raised beds, or in-ground gardens.
- Timestamped sensor readings, pest observations, and other operational data.
- Potential aggregation across multiple gardens.
- Machine-readable information that other software could consume.

Individual garden data feeds were not necessarily required to remain private. Their intended audiences were primarily software and data consumers, but sharing could also support scientific research.

Regional and national aggregation was envisioned as a potential contribution to SOLACE Network's scientific research mission, including future AI-assisted analysis of accumulated environmental observations.

**Historical code connection:** The PHP Journal includes an RSS feed-generation experiment, but a complete Garden feed publication system has not been verified.

**Implementation status:** Proposed, with partial historical RSS experimentation.

### 18C.2 Garden Sensor Data and Logs

**Historical concept:** Gardens could record environmental and operational information from sensors.

Examples discussed include water-related measurements, sunlight measurements, and other timestamped observations.

The intent extended beyond displaying readings. Collected data could be consumed by other applications and potentially contributed to larger scientific datasets.

Sensor data collection, storage, feed formats, and aggregation were not verified as completed functionality in the examined Garden applications.

**Implementation status:** Proposed.

### 18C.3 Public Gardener Profiles

**Newly discussed enhancement:** Gardeners who choose to share their work could maintain an optional public-facing profile.

Possible profile information includes:

- Display name and optional biography.
- Links to personal websites.
- Links to YouTube channels and social media profiles.
- Links to publicly shared gardening activities and Journal feeds.
- Information about the gardener's publicly shared gardens.

The public profile should be distinguished from the underlying SOLACE account and identity records.

**Implementation status:** Proposed during the 2026 review; historical implementation not verified.

### 18C.4 External Media in Journal Entries

**Newly discussed enhancement:** Garden Journal entries could include references to externally hosted media, including embedded YouTube videos.

The objective is to support richer gardening documentation without requiring SOLACE Garden to provide its own video hosting infrastructure.

Media could be displayed within Journal entries where embedding is permitted, while feed consumers could use the original URL where embedded playback is unsupported.

**Implementation status:** Proposed during the 2026 review; historical implementation not verified.

### 18C.5 Garden Calendar Events and Reminders

**Clarified historical intention:** The Calendar was envisioned as a functional, gardening-specific scheduling system rather than a demonstration calendar interface.

Intended capabilities included:

- Creating and managing gardening events.
- Scheduling gardening activities.
- Reminders associated with upcoming activities.
- Maintaining a garden-focused calendar distinct from a general-purpose personal or family calendar.

**Newly discussed interoperability option:** Garden calendar information could potentially be exported or published through the iCalendar (`.ics`) format for use with external calendar applications such as Nextcloud.

Downloading an `.ics` file and publishing a subscribable calendar feed are separate possible capabilities; neither implementation has been selected.

**Historical code connection:** The PHP Calendar uses FullCalendar but does not demonstrate completed event management or persistence.

**Implementation status:** Partial UI prototype; events and reminders not verified.

### 18C.6 Local Farmers' Markets

**Historical notebook finding:** Local farmers' markets were identified as a Garden-related feature concept.

The intended functionality, data model, and relationship to other Garden capabilities remain to be recovered from the notebooks.

**Implementation status:** Proposed / insufficient detail.

**Future disposition:** Undecided.

### 18C.7 PlantDB — Historical Integration and Contribution Workflow

The notebooks describe a broader PlantDB concept than the administrative screens found in the PHP implementation.

The intended workflow included:

1. A centrally maintained PlantDB containing an initial reference dataset.
2. Published JSON data consumed by Garden and potentially other applications.
3. Local plant records created by individual gardeners.
4. Optional submission of local additions to the central collection.
5. A moderation queue for proposed additions.
6. Moderator review before promotion into the authoritative dataset.
7. Republication of approved plant data to consumers.

This explains why direct administrative editing in the PHP prototype should not be interpreted as the complete intended architecture.

**Project boundary:** PlantDB now has its own repository at [solace-plantdb](https://github.com/solacenetwork/solace-plantdb). Its detailed architecture and moderation design belong there.

Garden's historical involvement included consuming published plant reference data and potentially supporting locally created plant records and voluntary contributions.

**Implementation status:** Partial historical administrative functionality; complete contribution and moderation workflow not verified.

**Future disposition:** Separate PlantDB project confirmed. Garden v1 access to PlantDB confirmed; integration mechanism undecided.

### 18C.8 Gardening as Community Outreach

**Historical context:** Gardening was part of the broader SOLACE vision from an early stage, informed by the developer's personal gardening experience beginning in 2007.

Early notebook concepts included **Education, Gardening, and Cooking** as subjects for local classes and community engagement.

An introductory gardening class could provide immediate practical value while introducing participants to SOLACE through instructional materials and shared interests.

This establishes that Garden had a potential community-outreach role in addition to its software functionality.

Detailed outreach and marketing strategy belongs in broader SOLACE Network documentation rather than Garden's technical specification.

### 18C.9 Historical Source Preservation

The original handwritten notes are being preserved in a separate repository:

[solace-dev-notes](https://github.com/solacenetwork/solace-dev-notes)

The archive is intended to retain notebook images, approximate dates, page ordering, and historical source material.

As notebook images become available, the findings in this section should be supplemented with source references and corrected where the original documents provide greater precision.

The notes may also contain SOLACE OS, SAE, identity, networking, and messaging concepts that belong in separate project-level historical reviews rather than this Garden-specific inventory.

---

## 18D. Photographed Garden Notebook Audit — First-Pass Findings

**Sources:** Twenty-one photographs across five notebook folders in [solace-dev-notes/notebooks](https://github.com/solacenetwork/solace-dev-notes/tree/main/notebooks), supplied together as `images.zip` for visual inspection. The photographed pages contain Garden-specific notes and interface sketches alongside some broader SOLACE context.

**Evidence standard:** This is a first-pass topical inspection of handwritten notes, **not** a verbatim transcription or runtime verification. The `20261102_...` image filenames represent the **photograph dates**, not the dates when notes were written. Historical dates, uncertain handwriting, and original page ordering should be checked and recorded more precisely when possible.

### 18D.1 Structured harvest records

A photographed notebook page (`notebook-05/20261102_152015.jpg`) describes a **Harvest** record with fields for:

- Photo
- Weight
- Length
- Notes
- Harvest date
- Plant name
- Plant ID

The sketch indicates that harvests could be structured records tied to specific plants, rather than existing only as free-form journal text. The source does **not** establish a completed harvest editor, persistence, or measurement conventions.

**Implementation status:** Proposed in notebook; code-level implementation not verified. **Future disposition:** Undecided.

### 18D.2 Container and container-group details

The page `notebook-02/20261102_150958.jpg` adds detail to the previously documented container/group concept. It sketches container selections and group-level or container-level information, including dimensions and soil-related attributes.

This supplements Section 6.5; it does not prove that the PHP or JavaScript applications supported editing or persisting these fields.

**Implementation status:** Proposed data/UI design; historical sample data exists, operational workflow unverified. **Future disposition:** Undecided.

### 18D.3 Garden creation and core record model

The `notebook-02/20261102_151059.jpg` page depicts a staged **Add New Garden** flow involving naming, type/options, color/icon choices, maps, and related selections. This helps explain the development of the multi-step Garden wizard already identified in JavaScript.

The `notebook-05/20261102_152015.jpg` page and other Garden sketches include record-level concepts such as identifiers, dates, plants, tags, pictures, notes, lists, favorites, status, and related data.

These field sketches should be compared with the `garden_full.json` sample and any real database schema **without assuming identical definitions or that every sketched field was implemented**.

**Implementation status:** Historical data-model and interface proposals, with partial wizard code and sample JSON in the JavaScript archive. **Future disposition:** Undecided.

### 18D.4 Editable Garden map intentions

Map sketches, including `notebook-05/20261102_151959.jpg` and `notebook-05/20261102_152015.jpg`, indicate interest in editable layouts with shape controls, dimensions, names, and visibility/show-hide options.

This extends the intent described in Section 11 and 18A.5. The PHP drawing prototype has a PNG-export path; that must not be mistaken for durable, editable Garden-map record storage.

**Implementation status:** Proposed editor capabilities, with partial drawing/export prototype. **Future disposition:** Undecided.

### 18D.5 Gallery and image-handling intentions

Several sketches reference Garden pictures, maps, galleries, image associations, and browser-local or JSON-related storage. These reinforce that Gallery was meant to interact with Garden records rather than function only as a standalone collection of sample photographs.

Exact metadata fields and a complete image upload/association workflow remain unverified in code.

**Implementation status:** Historical proposal and partial demonstration interface. **Future disposition:** Undecided.

### 18D.6 Sharing and community fields

Notebook data-model sketches refer to sharing and community-oriented concepts including comments, ratings, and favorites. It is not yet clear which entities these attributes would apply to, nor whether they were implemented in any Garden version.

Treat these as **tentative historical feature concepts**, not as confirmed working social functionality or approved MVP requirements.

**Implementation status:** Proposed / uncertain details. **Future disposition:** Undecided.

### 18D.7 Historical UI evolution

Photographed pages contain Garden navigation and workflow alternatives, including lists, action controls, application handoff, New Garden/New Map entry points, and map/gallery-related screens. Relevant pages include:

- `notebook-03/20261102_151443.jpg`
- `notebook-04/20261102_151841.jpg`
- `notebook-04/20261102_151915.jpg`
- `notebook-04/20261102_151926.jpg`
- `notebook-05/20261102_151938.jpg`

The notebooks can support a later side-by-side comparison of early sketches, JavaScript interfaces, and the later PHP interface. Many differences appear to involve presentation and workflow rather than entirely new core feature categories; that is a preliminary interpretation, not a completed UI comparison.

### 18D.8 Architecture references and project boundaries

The photographs also include diagrams of IndexedDB/JsStore, JSON export, local application state, Garden/PlantDB relationships, and broader SOLACE/SAE infrastructure (notably in notebooks 01–03). These provide historical context but do not demonstrate successful synchronization or a fully realized shared runtime.

Detailed PlantDB records belong in [solace-plantdb](https://github.com/solacenetwork/solace-plantdb); broader SOLACE infrastructure belongs to a separate historical review. This Garden audit records only the relevant dependencies and intentions.

### 18D.9 Outstanding notebook verification

- Confirm historical dates from notebook covers or dated pages; do not use camera filename timestamps as source dates.
- Add exact notebook page references where possible.
- Resolve uncertain handwritten terms against the original photographs, not by guessing.
- Check the structured Harvest model and community-related fields against archived code.
- Compare representative UI sketches with the different JavaScript interfaces and the PHP UI.
- Preserve the original photographs as primary sources; treat this section as an interpretive index.

**First-pass conclusion:** The photographed material largely corroborates the established Garden feature inventory. Its strongest additional value is in original data-model detail, interface intentions, structured harvesting, and distinctions between personal Garden information and shared SOLACE infrastructure.

---

## 19. Remaining Audit Work

### 19.1 Complete PHP Garden functional review (remaining verification)

- Garden search
- Detailed Journal workflows
- List Manager storage and database interactions
- Calendar functionality
- Map drawing and persistence
- Gallery and image upload workflows
- Shared settings and navigation
- Authentication and member association
- Data import/export and backup utilities

### 19.2 Complete JavaScript functional review (remaining verification)

- Trace major buttons and routes into their implementations
- Compare the actual functions across all four versions
- Inspect local data storage and retrieval
- Examine incomplete CRUD workflows
- Inspect SAE integration and dependencies
- Review `v3` development prototypes
- Identify duplicated and superseded implementations
- Document differences between feature mockups and operational functionality

### 19.3 Review offline paper notebooks (first-pass photo review completed)

- Record handwritten feature concepts
- Preserve sketches and interface ideas
- Identify features absent from the code
- Separate historical proposals from implemented behavior
- Add findings to the historical inventory

### 19.4 Review previous SOLACE discussions

- Identify Garden-related proposals
- Preserve historical reasoning and examples
- Mark ideas that were discussed but never implemented
- Avoid treating brainstormed features as completed work

### 19.5 Finalize the comprehensive review

Once all historical sources have been examined:

- Consolidate duplicate feature descriptions
- Confirm or revise implementation classifications
- Add source references for important findings
- Identify unresolved historical questions
- Ensure the inventory distinguishes functionality from experiments
- Prepare the completed review as input to `GOALS.md`

---

## 20. Review Status and Next Steps

**Current status: In progress.**

The PHP and JavaScript applications have received navigation comparisons, focused garden-management inspections, and follow-up static-code examinations of lists, Journal, Calendar, Maps, Gallery, storage mechanisms, and utilities. SAE's original intent has been clarified through developer recollection. A first-pass visual review of 21 photographed notebook pages has added historical data-model and interface findings (Section 18D). Cross-version integration questions, exact notebook dating, and runtime testing remain open.

This document does not yet represent a complete functional audit.

The next development-planning stage should begin only after sufficient historical evidence has been collected.

### Documentation sequence

1. Complete `COMPREHENSIVE_REVIEW.md`.
2. Define Garden MVP and post-MVP goals in `GOALS.md`.
3. Develop the architecture in `TECH_SPEC.md`.
4. Establish implementation milestones in `ROADMAP.md`.

**Confirmed product boundary:** PlantDB is a separate project. Garden v1 MVP must provide access to PlantDB, with the integration mechanism to be determined later.

All other future feature dispositions remain open unless explicitly decided and recorded.

The goal is not to reproduce the historical Garden implementations unchanged. It is to understand what they contained, what they attempted to accomplish, and what they can teach us before defining the next version of SOLACE Garden.
