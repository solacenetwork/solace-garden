# SOLACE Garden — Technical Specification

**Status:** Working draft 0.5 — decisions confirmed through 2026-11-03; remaining implementation choices labeled as proposals.  
**Date:** 2026-11-03  
**Sources:** [GOALS.md](GOALS.md) (approved MVP direction), [COMPREHENSIVE_REVIEW.md](COMPREHENSIVE_REVIEW.md) (historical evidence), and current code in this repository.

> This document distinguishes **confirmed decisions** from **proposals**. Historical implementations are references, not architectural constraints.

## 1. Scope and principles

### Confirmed product requirements

- SOLACE Garden v1 is one locally usable, installable PWA focused on managing food gardens.
- Garden records represent distinct projects/growing cycles, **not permanent physical places**.
- The user's browser holds the working data, including imported optimized media, Journal, lists, and calendar records. No required account, remote database, or synchronization.
- Each garden has independent plant groups and harvest events. Shared tools can exist without a garden association.
- Full backup/restore is a portable, versioned ZIP containing local data and media.
- PlantDB is a separate project. Garden consumes/selects reference plants, not the full PlantDB research workflow.

### Engineering principles (proposed)

1. Keep **domain data independent of Preact, Bootstrap, and specific editors**.
2. Use stable IDs and explicit relationships; never rely on a plant name or a garden title as a unique identifier.
3. Avoid silently deleting historical data; enforce lifecycle rules in a data/service layer as well as in the UI.
4. Treat browser storage as useful but **not guaranteed permanent**; make export and validation core workflows.
5. Design for future sync without building a sync engine in v1.
6. Store timestamps and date-only values differently, avoiding timezone shifts in harvest/planting dates.

## 2. Selected scaffold and status

| Technology | Initial status | Notes |
| --- | --- | --- |
| Preact 11 | Selected / smoke tested | UI and hooks |
| Vite 8 | Selected / smoke tested | Dev/build tooling |
| Bootstrap 6.0.0-alpha.1 | Selected / smoke tested | Pin exact prerelease; audit breaking changes before upgrades |
| Dexie 4 | Selected / smoke tested | IndexedDB access |
| dexie-react-hooks | Selected / smoke tested | Reactive queries through Preact compatibility |
| preact-iso | In scaffold | Routing |
| Service-worker/PWA plugin | To select | Necessary for offline application shell; not yet verified |
| FilePond + image plugins | Preferred candidate; proof of concept needed | Local file import, resized display+thumbnail variants without server upload; verify Preact integration |
| lightGallery | Preferred candidate; proof of concept needed | Gallery/lightbox viewing; GPLv3 compatible with this project's license |
| JSZip | Preferred candidate; benchmark needed | Local ZIP backup/import; in-memory operation may be problematic for very large collections |
| Tiptap 3 open-source core | **Selected for Journal v1**; integration testing pending | Vanilla JavaScript editor engine within custom Preact/Bootstrap UI; structured JSON and custom media node; no React wrapper required |
| FullCalendar + RRule plugin | **Selected for Calendar v1**; integration testing pending | Install locally with npm/Vite (no CDN); monthly calendar UI, event/recurrence display and date selection; Preact owns forms/state |
| Browser Notification API + service-worker display when supported | **Selected for optional v1 notifications**; platform testing pending | User permission required; reminders scheduled only while app is active; no push/background guarantee |
| Test tooling | To evaluate | Confirm offline compatibility and accessibility |

The temporary `items` store in `src/db.js` is a proof of concept, **not the intended production schema**. The test demonstrated data persistence across a complete browser and Vite restart. Offline loading, large media, and restoration remain untested.

## 3. Data model overview (decided behavior; field/index details provisional)

Use stable UUIDs for user-created records; use stable seeded identifiers for system location/type presets. UTC ISO timestamps are for audit fields; user-entered gardening dates are local `YYYY-MM-DD` date-only strings. Dexie/IndexedDB has no built-in foreign keys; application services enforce integrity.

### 3.1 Locations, garden types, gardens, and templates

| Store | Fields (proposed) | V1 rules (confirmed) |
| --- | --- | --- |
| `locations` | `id`, `name`, `hardinessZone?`, `latitude?`, `longitude?`, `isSystemDefault`, timestamps | Seed non-deletable, non-renamable **Default** location; custom locations can be created/renamed and deleted after confirmation **only if no garden refers to them**, including historical gardens. Optional manually entered USDA zone (1a–13b) and lookup link; no GPS/automatic lookup. |
| `gardenTypes` | `id`, `name`, `description?`, `isSystem`, `sortOrder` | Seed In-Ground, Raised Bed, Container, Greenhouse, Hydroponic, Other; all **seeded types are protected against deletion even when unused**. One type per garden; editable gardens can change type. Custom type creation/editing deferred. |
| `gardens` | `id`, `name`, `description?`, `locationId`, `gardenTypeId`, `status`, `isClosed`, `layoutMediaId?`, optional dates, timestamps | Every garden has exactly one location and one type; each garden is an independent planting project, not a permanent place. Status Planned/Active/Completed/Archived. |
| `gardenTemplates` | `id`, `name`, `configuration`, timestamps | Save as Template **always creates a NEW named snapshot in v1**. Creating a garden from a template copies reusable configuration such as suggested name/description, location ID, garden type ID, and layout media ID; never plants or historical state. |

**Locations:** Default is a protected system record and is the initially selected location. Custom locations are selectable, creatable and renamable; deleting an unused custom location requires confirmation and a transactional check across **all** gardens, including completed, closed and archived. Referenced locations must be reassigned first; closed/archived gardens must follow the existing reopen/unarchive rules before changes. Automatic geolocation/zone lookup is deferred. Locations are reusable across garden years.

**Garden type protection:** Seeded Garden Types are immutable as to existence and **cannot be deleted even if unused** in v1. Custom type management is deferred. Editable gardens may change their type; changing references in closed/archived gardens requires following normal lifecycle unlocking rules. Revalidate references transactionally.

**Garden lifecycle:** Statuses are explicitly chosen by the gardener; finishing a plant group never changes garden status. Completed prompts optional Close Garden, but may remain editable; Archived is automatically closed/read-only; Unarchive returns to Completed/editable. Read-only enforcement must cover dependent garden data.

**Templates:** V1 template configuration contains **suggested garden name, description, locationId, gardenTypeId, and layoutMediaId** only; the suggested name is editable when creating a garden. Applying a template creates an independent garden with a new ID, Planned status, blank start/planting dates, no plant groups/indicators/harvests/Journal/Calendar/task history. No live link or future propagation from template to created gardens. **Delete a template permanently after confirmation even when existing gardens originated from it**; deletion affects only the template record, not those gardens or any shared Gallery media. A template referenced by the create form must be revalidated on save; resolve missing/deleted media via existing placeholders. Template editing/overwriting deferred; potential later template snapshot versions remain future work.

**Garden creation workflows (confirmed V1):** The default Create Garden UI is a short **three-stage wizard**: (1) scratch or saved template, (2) name, Location and Garden Type, (3) review/create. **Quick Start** provides immediate creation with **garden name as the only required input**, default Location = protected `Default`, default Type = `In-Ground`, status = `Planned`, no planting/start date and no plant groups/layout/other optional data. A Quick Start garden is a normal persistent garden, not a draft, and may be completed later. **Advanced** exposes the wizard's full configuration (including optional description, dates and layout reference) in a single form. Wizard and Advanced share the **same in-memory state**, validators and creation service so switching views doesn't discard entered data; each flow creates a garden through the same validated Dexie transaction and navigates to the new garden detail view. Template selection prefills editable name/description/location/type/layout values; optional plants are added after creation. Auto-generated UUID and timestamps are never user inputs. Historical `garden_quickstart.json` / `garden_full.json` are conceptual references, not current storage schemas.

### 3.2 Plant groups and harvests

| Store | Fields (proposed) | Confirmed rules |
| --- | --- | --- |
| `plantGroups` | `id`, `gardenId`, `plantDbId?`, `displayName`, `quantity?`, `plantingDate?`, `phases`, `notes?`, timestamps | `quantity` denotes **count of plants** in v1. Repeated PlantDB varieties are independent planting groups; never share status/history merely because IDs match. |
| `harvests` | `id`, `plantGroupId`, `date`, `itemCount?`, `weight?`, `weightUnit?`, `notes?`, timestamps | Date required; whole-number count and/or positive weight required; unit required if weight present; no volume in v1. |

**Ten plant phases:** Seeds Started, Germinating, Seedling, Transplanted / Planted, Vegetative Growth, Flowering, Fruit Production, Harvesting, Dormant, Finished. Each phase has `active: boolean`, optional `startDate` and `endDate` (date-only strings). Store as keyed objects under `phases`. Each phase's end cannot precede its start; different phases may overlap, and multiple active booleans may be true. All activation and date entry remain manual; both start and end fields have an independently applied **Today** shortcut, using the user's local date. No implicit date fill, phase transitions, or advancement. Smarter transition suggestions deferred (possibly v3).

**Harvest units:** Gardener-wide `settings.measurementSystem` is `imperial` by default; can select `metric`. Imperial weight selection: oz/lb; Metric: g/kg. Store the **actual unit on every record**; changing preference does not reinterpret saved values. Derive count totals and compatible weight totals separately, with explicit conversions; never infer absent weights. V2 planned: volume and volume units (cups, quarts, gallons, milliliters, liters, bushels, pecks); do not convert volume to weight without commodity-specific information.

**PlantDB:** Preserve **string** reference IDs (the archived five-character zero-padded `pid` is a concrete example) and a `displayName` snapshot to remain legible if the external catalog later changes or is unavailable. A separate PlantDB backend (e.g. MariaDB) is authoritative; its admin publishing operation writes versioned **static JSON** to `https://garden.solace.network/assets/data/`. Garden consumes this published catalog, **not a live database API**. Publish a lightweight version/compatibility manifest (for example `schemaVersion`, `dataVersion`, `catalog` filename) and an immutable/versioned catalog JSON. The current compatible catalog must be included in the PWA's offline precache/download; verify initial caching before claiming offline readiness. When online, check the manifest and download/validate a newer compatible JSON before switching the active cached catalog; keep the last good version on error. Service worker controls network caching while application logic checks schema compatibility and dataset integrity. **Reference catalog data is separate from gardener-owned Dexie records**, and catalog updates never rewrite saved plant groups, phases, harvests, or user edits. Detailed PlantDB records remain in the separate research interface. Handling user-defined/unmatched plants and exact publication filenames remain integration details to validate.

### 3.3 Gardener-wide records

| Store | Key fields | Rules |
| --- | --- | --- |
| `journalEntries` | `id`, `title`, `entryDate`, `content`, `contentFormatVersion`, `createdAt`, `updatedAt` | Dated personal Tiptap/ProseMirror structured JSON with shared media IDs. Entry date is user-selected and independent of audit times. No publication/draft distinction. |
| `listItems` | `id`, `kind`, `text`, `completed`, `sortOrder`, timestamps | `kind` todo/tobuy, gardener-wide. |
| `notes` | `id`, `text`, timestamps | Gardener-wide quick notes. |
| `calendarEvents` | `id`, `title`, `eventDate`, `startTime?`, `description?`, `allDay`, `recurrenceRule?`, `reminderEnabled`, timestamps | Manually created one-off or recurring events; local calendar dates/times, optional at-time reminder, entire-series edits in v1. Recurrence is stored as a rule, not pre-expanded occurrences. |
| `settings` | `key`, `value` | Measurement system; **250 MB default** configurable total media-storage budget; calendar all-day reminder time (`09:00` default), clock format (`12` default), browser notifications toggle (`false` default); potentially preferred location. |

### 3.3a Journal editor, media references and lifecycle (confirmed V1 behavior)

**Editor engine and UI:** Use **Tiptap 3 open-source core** through its vanilla JavaScript API, integrated into a **custom Preact/Bootstrap 6 Journal UI**. Tiptap owns editing operations, selection, structured JSON, and built-in multi-level **Undo/Redo**; Preact owns the toolbar, page, cards, and dialogs. No React UI dependency or full word-processing features. Limit V1 formatting to paragraphs/headings, bold/italic, bulleted/numbered lists, links, and Gallery photos. Editor configuration and extension choices require a small implementation proof of concept.

**Document persistence:** Store `editor.getJSON()` (ProseMirror-style document JSON) in `journalEntries.content`, with `contentFormatVersion` to support later migrations. Never persist object URLs, copied Gallery blobs, or unsanitized arbitrary HTML as the authoritative entry content. A custom `gardenImage` node carries stable `mediaId` and optional independently editable `caption` and `alt` attributes. Suggest caption text as initial alt text if useful, but don't permanently equate a visual caption with accessible description. Resolve the media ID at render time through the shared media service; missing/deleted blobs display the bundled placeholder without erasing references. Reused images do not create separate media copies.

**Entry lifecycle:** Creating a new entry requires valid title/content; the date is editable and stored separately from `createdAt`. Saving is an **explicit** action with no autosave, Draft, or Publish states. Save is disabled for no changes/invalid content; dirty-state comparison should account for title, entry date, structured JSON and image attributes, including when Undo returns content to its last saved state. Only clear dirty state and disable Save after Dexie confirms a successful write; on save error preserve edits for retry. Built-in multi-level Undo/Redo applies within a single editing session; reset editor history when opening another entry. Do not implement persistent edit history in v1.

**Unsaved changes:** On in-app navigation, show a native `window.confirm()` prompt if dirty; accept = discard and navigate, cancel = stay. For tab refresh/close, use `beforeunload` only while dirty and where supported; browser/mobile platforms may suppress the prompt, so don't promise loss prevention.

**Deletion:** Require explicit confirmation; remove the Journal record permanently from the active Dexie dataset in v1. **Never delete a referenced Gallery media record or blob** solely because the Journal entry was deleted. The entry's embedded references disappear with the entry; garden and other Journal references are unaffected. This is different from Gallery deletion, which retains media tombstones. Previously exported ZIP backups may still include a deleted entry. Journal trash/restore, autosave, and entry versioning are possible v2/v3 additions, not v1 work.

**Journal browsing:** Default newest first by `entryDate` (stable secondary order for equal dates). Custom reusable `JournalPage`, `JournalArchive`, `JournalCard`, `JournalList`, `JournalEntry`, `JournalEditor`, `JournalToolbar`, and `JournalImage` components are provisional file/component names. Cards show date, title, excerpt and optional photo; text-only cards remain visually coherent. Allow grid/list views, optional year/month filters and a Load More/pagination mechanism. Desktop (roughly >=992px): archive sidebar + two-column card grid; tablet: archive filters above cards; mobile (roughly <768px): stacked controls and single-column cards with compact year/month selector. Final CSS breakpoints/interaction details can be refined during implementation. Avoid a separate popup Journal/navigation system.

**Source reference:** Historical PHP Journal under `garden-archive/app/garden/journal/` is a UI/feature reference, not code to port. Untitled UI's blog layouts are design inspiration only; don't copy proprietary components or add React/Tailwind.

### 3.3b Calendar, recurrence, notifications and clock (confirmed V1 behavior)

**Presentation and persistence:** Use **FullCalendar** with **RRule** installed through npm and bundled by Vite for offline operation; no runtime CDN. Render a month-view calendar (mobile-responsive) and use custom Preact/Bootstrap event forms and date-click interactions. Events are private, gardener-wide, created manually; date required, optional start time and description; an omitted time means an **all-day** event. FullCalendar is a calendar UI/recurrence-expansion layer, not the database or alarm scheduler. Keep business rules and persistence independent of the UI library.

**Recurrence:** One-time events plus daily/weekly/monthly/yearly recurring series using RRule. Persist a stable series ID and recurrence definition; generate/display occurrences for the requested view rather than storing each as a separate event. **Editing or deleting a recurring event affects the whole series** in v1. Per-occurrence edits, exclusions, skipping, and individual completion history are outside v1. Specify a sensible finite/unbounded-series representation and inclusive/exclusive boundaries when implementing; test DST and month-end recurrence.

**Reminders:** `reminderEnabled` is an optional event-level choice. Deliver **at the event's start time only** (no lead-time offsets). A timed event uses its stored local start time; an all-day event uses a gardener-wide `calendar.allDayReminderTime` setting defaulting to `09:00`, evaluated at occurrence time rather than copied into individual events. Changing the setting affects subsequent reminders. Maintain lightweight occurrence-aware delivery/dismissal state keyed by event/series ID plus occurrence date/time (separate Dexie store or equivalent; exact indexing TBD) so an open tab/restart doesn't repeatedly alert for the same due instance. **Missed occurrences are discarded** when Garden is reopened; never enqueue catch-up or overdue reminders. The next future recurrence remains eligible. Multi-tab deduplication requires testing.

**Notification channel selection:** In-app notification indicator/alert is the V1 default. `notifications.allowBrowser` setting defaults `false`. Only when the user enables it from an explicit interaction should the app call `Notification.requestPermission()`; browser permission is also separately checked. If enabled, permitted, and supported, display **one browser notification in place of** the in-app popup; if denied/unavailable/not delivered, show the in-app alternative where possible. On mobile, prefer a registered service worker's `showNotification()` when supported rather than assuming `new Notification()` works. No push subscription or background scheduling. Turning the toggle off immediately stops application-issued browser notifications and reverts to in-app reminders; **JavaScript cannot revoke previously granted browser/site permission**. Explain how to revoke it through browser settings if desired. Permission state and app preference are distinct; don't infer the toggle is true just because permission is granted.

**Running-PWA limitation:** The reminder checker runs **only while SOLACE Garden is active**; native notifications still need a living app context to schedule them. Warn users in settings/event UI that reminders are not guaranteed after closing/suspending the PWA and may be delayed by browser throttling. Offline event display and in-app checking work without a network, subject to local browser limitations.

**Device-local timekeeping:** The system clock and local time zone reported by the browser are authoritative for v1. No NTP/external service, user-adjustable app clock, or incorrect-clock compensation. Store date-only strings (`YYYY-MM-DD`) and local wall-clock times (`HH:mm`) rather than interpreting them as UTC timestamps or fixed offsets; derive actual instants in the local time zone for matching reminders and recurrence. Retain 9 AM local time through DST changes. `calendar.clockFormat` (`12` by default, or `24`) affects formatting of FullCalendar, details and reminder messages **only**, never event instants. Native HTML time inputs might follow device locale instead of the app's clock-format preference.

**V1 tests:** Confirm daily/weekly/monthly/yearly recurrence and whole-series editing/deletion, local start-time and all-day 09:00 behavior, clock format display, DST/zone changes, browser permission states, enable/disable fallback, single-channel delivery, occurrence deduplication, offline while open, suspended/closed-browser limitations, and ZIP backup/restore of rules/settings/reminder state.

### 3.4 Shared media and reference protection

| Store | Key fields (proposed) | Rules |
| --- | --- | --- |
| `media` | `id`, `kind`, `title?`, `description?`, `tags[]`, `originalFilename?`, `photoDate`, `year` (derived/indexed), `originalWidth?`, `originalHeight?`, `originalSize?`, `status`, `deletedAt?`, timestamps | Metadata and tombstones. **No single `gardenId`**; optional user fields. Preserve photo date/provenance after removal of binaries. |
| `gardenMedia` | `id` or composite `[gardenId+mediaId]`, `gardenId`, `mediaId` | **Many-to-many**: a single photograph can appear in multiple gardens without blob duplication. Unlinking removes only this association. |
| `mediaData` | `id`, `displayBlob`, `thumbBlob`, optional MIME/size info | Optimized image + thumbnail only. Never store the full-resolution original. |

**Import:** Select source file from device; FilePond (preferred) with preview/validate/resize/transform plugins produces both variants; receive processed files in an app media service and store in Dexie, without network upload. Test plugin variant output and Preact lifecycle. Preserve device originals untouched. Proposed targets (not yet agreed): 1920px longest edge display and 256px thumbnail; image format, quality and exact defaults remain benchmarks, not fixed requirements.

**Gallery organization:** Derive year from `photoDate`; prefer EXIF original capture timestamp, then source file's last-modified time, then import date. Allow manual correction. Title, description and tags optional. Group main Gallery by year; garden-specific queries use `gardenMedia`; Journal and garden layout/template can reference the same `media.id`. Avoid persisting temporary object URLs.

**Deletion v1:** Distinguish **unlink from garden** (delete one `gardenMedia` relationship) from **delete from Gallery** (warn about references and require confirmation; delete optimized blobs and retain media record with `status: 'deleted'`, deletion timestamp, and all garden/Journal/layout/template references). Present a bundled placeholder in any view of deleted/missing photos. Distinguish intentional deletion from accidental missing/corrupt blobs conceptually. Tombstones preserve the ID and metadata, allowing future restoration. Use transactions/services to keep metadata and binaries consistent.

**Future media restoration:** User reimports a candidate original; compare filename/date/dimensions/size and potentially perceptual fingerprints, then **confirm** before restoring blobs onto the existing media ID; all previous references reconnect without rebuilding associations. Automatic detection/repair and holistic missing-image recovery are **not v1**.

**Storage and optimization defaults (agreed V1 starting values):** Gardener-configurable total media budget **250 MB by default**; upper/lower bounds and increment to validate in UI testing. Display images: **1920px longest edge maximum**; thumbnails: **256px longest edge maximum**; **WebP preferred with compatibility fallback**, approximately **80% compression quality** as a starting point. Benchmark browser support, output format/quality, memory, image clarity and photo import performance before finalizing implementation constants. Track optimized display+thumbnail bytes, warn before/near budget, and handle quota failure; browser quota is independent of the user budget and can be smaller.

## 4. Candidate Dexie v1 indexes (proposed, not yet applied)

This outline shows **IndexedDB indexes only**. All other object properties can still be stored without listing them in `stores()`.

```js
// Proposal: do not replace the temporary test database yet.
db.version(1).stores({
  locations: 'id, name',
  gardenTypes: 'id, name, sortOrder',
  gardens: 'id, name, locationId, gardenTypeId, status, updatedAt',
  gardenTemplates: 'id, name, updatedAt',
  plantGroups: 'id, gardenId, plantDbId, displayName, plantingDate',
  harvests: 'id, plantGroupId, date',
  journalEntries: 'id, entryDate, updatedAt',
  listItems: 'id, kind, [kind+sortOrder]',
  notes: 'id, updatedAt',
  calendarEvents: 'id, eventDate, startTime, reminderEnabled',
  // Additional reminder-delivery/acknowledgment store may be needed for deduplication.
  media: 'id, kind, year, status, photoDate, createdAt',
  gardenMedia: 'id, gardenId, mediaId, &[gardenId+mediaId]',
  mediaData: 'id',
  settings: 'key'
});
```

The index choices should follow real UI queries and be reviewed before implementing. Dexie schema upgrades are numbered and additive: preserve old version declarations and add a new version for structural changes, with data migration when necessary. Never delete and recreate the user's real database as an upgrade strategy.

**Important:** The current proof-of-concept database already uses `SolaceGardenDB` version 1 with an `items` store. Before real user data exists, either choose a distinct production database name or make the first production schema version 2 and explicitly handle the temporary store. Do not assume defining another `version(1)` will upgrade existing installations.

## 5. Data access and UI boundaries (proposed)

- `db` module: Dexie instance and schema evolution only.
- Domain services/repositories: create/edit/delete operations, validation, template cloning, lifecycle enforcement, and reference cleanup.
- Preact pages/components: rendering and user interaction; use `useLiveQuery` for live reads and services for writes.
- Media service: import, optimize, create display object URLs, revoke them, maintain references, and delete safely.
- Backup service: export/import and archive validation without being coupled to UI components.

Avoid putting business rules solely in individual click handlers. Database foreign keys are not enforced automatically by IndexedDB; deletion and relationship integrity must be implemented and tested in application code.

## 6. Search (proposed)

One search entry point with scopes: Garden (default), Lists, Calendar, Journal. Search Plant Group names and Garden names locally, including completed/archived gardens. Garden status and specific garden are optional filters. Exclude PlantDB's botanical reference corpus.

For v1, a debounced query over relevant indexed/locally loaded data may suffice; measure performance before choosing a dedicated full-text engine. Search field sets, normalization, and limits remain TBD.

## 7. Backup and restore (confirmed V1 policy; implementation pending)

**Library:** JSZip is the preferred candidate for portable ZIP import/export; benchmark memory use with large collections, especially mobile devices. It does not expose uncompressed entry lengths through its supported public entry API, so record aggregate **uncompressed sizes in our own manifest**. Validate claimed sizes against trusted limits and actual content; do not trust manifest values blindly.

**Archive layout (proposed):**

```text
solace-garden-backup-YYYY-MM-DD.zip
  manifest.json
  data/locations.json
  data/gardenTypes.json
  data/gardens.json
  data/gardenTemplates.json
  data/plantGroups.json
  data/harvests.json
  data/journalEntries.json
  data/listItems.json
  data/notes.json
  data/calendarEvents.json
  data/media.json
  data/gardenMedia.json
  data/settings.json
  media/<media-id>-display.<ext>
  media/<media-id>-thumb.<ext>
```

The final manifest should carry `application`, `formatVersion` (independent of app/Dexie versions), app version, timestamp, record counts, `storage.dataBytes`, `storage.mediaBytes`, and `storage.totalBytes`. The listed media filenames are conceptual, not an authoritative finalized naming convention. Do not export redundant `mediaData` JSON when binary files are already exported. Deleted-photo tombstone records/references stay in JSON; deleted blobs are absent.

**V1 restore is replace-only, not merge.** Never replace existing records in place. Restore sequence:

1. Inspect ZIP manifest/version/structure, enforce archive path/count/size bounds, validate record schemas and ID integrity, and present a backup preview. Avoid blindly trusting archive content (including stored HTML).
2. Before writing a staging database, call `navigator.storage.estimate()` and compare **estimated extra storage requirement** (manifest uncompressed bytes plus conservative IndexedDB overhead) with `quota - usage`. Existing data is already counted in `usage`; do not double count it. Preflight estimates are advisory, not guaranteed available disk space. Enforce independent limits and catch `QuotaExceededError`.
3. Create a **separate staging IndexedDB database** using target schema, populate it from ZIP, and check referential integrity, records, media availability, and data readability. Preserve IDs and intentionally deleted tombstones.
4. Only after successful staging, explicitly confirm replacement and switch a durable **active-database pointer** to staging. IndexedDB does not support database renaming; do not attempt to rename. Coordinate other open tabs and recover cleanly from interrupted switch.
5. Restart/reopen on the staged database, verify successful loading, and **retain prior database temporarily** for rollback. Delete previous database only after successful activation/recovery verification.

If validation, quota, or restore fails, discard staging and leave the current active database unchanged. A crash during pointer switching must have a recovery path. Consider retaining user-controlled backup of old data before restore. No cloud account required.

**JSZip memory limitation:** ZIP generation/extraction may require considerable memory beyond archive size; benchmark with realistic photo counts and consider a streaming ZIP implementation if necessary before shipping V1. Compressed JPEG/WebP assets should generally use ZIP STORE/no redundant compression where appropriate.

## 8. Offline/PWA and storage reliability

- Installable PWA and service-worker caching of application shell/assets are v1 requirements; implementation tooling TBD.
- IndexedDB supports offline data access independently of the service worker. First install still requires obtaining the application files.
- Evaluate `navigator.storage.estimate()`, `navigator.storage.persist()`, browser quota failures, and large gallery imports.
- Clearly explain that browser profile deletion, private browsing, eviction, or device loss can remove local data; ZIP exports are essential.
- Test offline navigation, cold starts, updates, and preservation of existing records across application builds.

## 9. Security and content handling

- Sanitize or safely render user-authored rich text and restrict allowed links; do not trust imported backup HTML.
- Do not persist unsafe blob/object URLs. Revoke object URLs when no longer needed.
- Validate ZIP members against unsafe paths, excessive decompression sizes, and unsupported format versions.
- No application-level encryption requirement in v1. Exports are not implicitly encrypted.

## 10. Testing strategy

1. Unit-test domain rules: statuses/close/reopen, independent plant groups, indicator toggles, harvest totals by unit, template copying.
2. IndexedDB integration tests: migrations, invalid IDs, cascading-or-restricted deletes, media references, live queries.
3. End-to-end tests: create garden, add repeated plant variety, record multiple harvests, close/archive/reopen, create/edit Journal with Gallery photo and caption, save/reload JSON, Undo/Redo, unsaved-change confirmation, permanent Journal deletion without deleting shared photos, backup/restore.
4. Reliability tests: complete browser restart, offline PWA launch, storage quota failure, large media import/restore, backup version incompatibility.

## 11. Remaining questions and validation tasks

1. **Garden creation:** Implement shared wizard/Quick Start/Advanced form state, template prefill, transactional validation, and the protected location/type deletion rules. V1 template field-copy and deletion semantics are decided; test them.
2. **PlantDB:** Implement versioned JSON publish/manifest and offline precache/update verification against the existing PlantDB backend; verify catalog schema compatibility and how unavailable/custom plant records work.
3. **Gallery implementation:** Confirm FilePond no-network variant handling, lightGallery integration, image format/quality/target dimensions, thumbnail performance and metadata extraction.
4. **Storage budget:** Default is 250 MB; confirm configuration range/steps, threshold warnings, browser-specific quotas, and effectiveness of 1920px/256px/WebP ~80% image defaults.
5. **Journal:** Tiptap vanilla integration and custom node proof of concept; precise JSON schema/document migration, sanitization, dirty-state detection and accessible image/caption rendering.
6. **Calendar:** FullCalendar/RRule Preact proof of concept; date/time/recurrence boundaries, permission UX, notification fallbacks, occurrence-level deduplication and running-app reliability.
7. **Backup:** JSZip large-file/memory benchmarks, manifest schema/version migration, pointer durability, multi-tab coordination, rollback retention period and deletion timing.
8. **Search and tests:** Search scope/fields/performance, unit/e2e framework, service-worker/PWA offline behavior.
9. **Garden type/location lifecycle:** Enforce decided protected seeded records, custom-location deletion checks, editable-only reassignments, and historical foreign key invariants.
10. **Product UI:** Photo deletion confirmation design, replacement placeholder handling, layout/template linking and switching between Wizard/Advanced without losing form data.

## 12. Explicitly outside v1

Scaled interactive map editing, automated plant-stage progression, per-individual-plant records, advanced harvest analytics, public Journal/RSS, social accounts, remote synchronization, cloud backup, remote historical-photo archival, PlantDB moderation, and advanced recurring-event exceptions and background/push calendar notifications remain post-MVP unless GOALS.md is deliberately revised.
