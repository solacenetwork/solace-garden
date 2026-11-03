# SOLACE Garden — Technical Specification

**Status:** Working draft 0.1 — architectural proposals require review before implementation.  
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
| Rich-text editor, gallery/lightbox, ZIP utility, image-processing utility, tests | To evaluate | Do not select merely because the historical application used one |

The temporary `items` store in `src/db.js` is a proof of concept, **not the intended production schema**. The test demonstrated data persistence across a complete browser and Vite restart. Offline loading, large media, and restoration remain untested.

## 3. Data model overview (proposed)

Every durable record should have a stable identifier. Proposed default: `crypto.randomUUID()` generated when created. Use ISO-8601 UTC timestamps for audit times (`createdAt`, `updatedAt`) and local calendar-date strings (`YYYY-MM-DD`) for garden/harvest dates. Fields below are **starting contracts**, not final validations.

### 3.1 Garden-scoped entities

| Store | Key fields | Relationships and rules |
| --- | --- | --- |
| `gardens` | `id`, `name`, `status`, `isClosed`, `description?`, `layoutMediaId?`, `createdAt`, `updatedAt` | Status: Planned, Active, Completed, Archived. No required season identifier. Archived implies closed. A completed garden may remain editable. |
| `gardenTemplates` | `id`, `name`, `configuration`, `createdAt`, `updatedAt` | Independent snapshot of reusable garden configuration; does not share mutable records with gardens created from it. Exact snapshot contents TBD. |
| `plantGroups` | `id`, `gardenId`, `plantDbId?`, `displayName`, `quantity?`, `plantingDate?`, `indicators`, `notes?`, `createdAt`, `updatedAt` | Multiple records may have the same `gardenId` and `plantDbId`. Indicators are manually checked, nonexclusive values from the ten-label v1 set. No per-individual-plant records. |
| `harvests` | `id`, `plantGroupId`, `date`, `quantity`, `unit`, `notes?`, `createdAt`, `updatedAt` | Always belongs to one plant group; garden derived through plant group. Sum exact matching units only unless a conversion policy is explicitly defined. |

**Lifecycle invariants:** Status changes are explicit user actions, not date-based automation. Setting Completed prompts for optional close. Setting Archived closes the record. Unarchive returns it to Completed and editable. Read-only rules must prevent edits to garden-scoped child records and harvests, not only disable visual buttons. Finishing a plant group never completes a garden.

**Garden templates:** Applying a template creates a new garden and new plant-group identities if groups are included. Do not copy Journal entries, harvest history, completed tasks, or other activity. Template contents, media-copy semantics, editing, and deletion still require a decision.

**PlantDB:** Preserve external IDs as strings where provided. Store a useful display-name snapshot so existing local gardens remain legible if the reference catalog changes or is unavailable. Delivery/caching and handling custom/unmatched plants are open questions.

### 3.2 Gardener-wide entities

| Store | Key fields | Relationships and rules |
| --- | --- | --- |
| `journalEntries` | `id`, `title`, `entryDate`, `content`, `createdAt`, `updatedAt` | Free-form dated personal entries, no Draft/Publish state; rich-text structure/editor serialization TBD. Can reference shared media IDs; no required garden or plant association. |
| `listItems` | `id`, `kind`, `text`, `completed`, `sortOrder`, `createdAt`, `updatedAt` | `kind` = todo or tobuy. Gardener-wide checklists; stable manual ordering. |
| `notes` | `id`, `text`, `createdAt`, `updatedAt` | Simple gardener-wide text notes; no completion flag. |
| `calendarEvents` | `id`, `title`, `eventDate`, `startTime?`, `description?`, `remindAt?`, `reminderDismissedAt?`, `createdAt`, `updatedAt` | Manually authored events; optional reminder. No recurrence or automatically generated harvest/planting events in v1. |

**Reminders:** Store reminder intent independently of whether notifications can be delivered. Browser notification permissions and open-app alert handling require testing. Do not promise delivery while the application/browser is closed.

### 3.3 Shared data and media

| Store | Key fields | Relationships and rules |
| --- | --- | --- |
| `media` | `id`, `kind`, `filename`, `mimeType`, `byteSize`, `width?`, `height?`, `takenAt?`, `gardenId?`, `createdAt` | Metadata for locally optimized imported pictures or maps; garden association is optional. Journal entries reference the same media by ID, avoiding duplicate binaries. |
| `mediaData` | `id`, `blob` | Binary payload kept apart from metadata for inexpensive gallery queries. IndexedDB Blobs supported; exact photo format/optimization to benchmark. |
| `settings` | `key`, `value` | App-level preferences and storage warnings. Does not replace per-record fields. |

**Media references:** Garden layouts can reference `layoutMediaId`. Journal media may be referenced in sanitized rich-text content or a structured document; the editor/storage format is still open. Object URLs are transient and must not be persisted in content or backups. Deleting shared photos must check for dependent references or use an explicit warning.

**Gallery:** Main view groups by year; optional garden association supports per-garden views. Photo optimization must not modify the device original. Exact maximum dimensions, storage budgets, thumbnail strategy, and quota-error behavior require benchmarking.

## 4. Candidate Dexie v1 indexes (proposed, not yet applied)

This outline shows **IndexedDB indexes only**. All other object properties can still be stored without listing them in `stores()`.

```js
// Proposal: do not replace the temporary test database yet.
db.version(1).stores({
  gardens: 'id, name, status, updatedAt',
  gardenTemplates: 'id, name, updatedAt',
  plantGroups: 'id, gardenId, plantDbId, displayName, plantingDate',
  harvests: 'id, plantGroupId, date',
  journalEntries: 'id, entryDate, updatedAt',
  listItems: 'id, kind, [kind+sortOrder]',
  notes: 'id, updatedAt',
  calendarEvents: 'id, eventDate, remindAt',
  media: 'id, gardenId, kind, takenAt, createdAt',
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

## 7. Backup and restore (proposed contract)

- Export a ZIP containing a JSON manifest with **archive format version**, application version, export timestamp, and counts, plus JSON data files and binary media assets.
- Keep archive version separate from IndexedDB/Dexie schema version and from application release version.
- Validate manifest/version, references, fields, media types/sizes, and consistency *before* committing an import.
- Decide whether v1 uses **replace all** (simplest to reason about) or merge. Never silently replace local content.
- Provide pre-restore warnings and preserve the user's ability to export existing local data first.
- Design large restores to handle quota failures and partial writes. Confirm feasibility of transaction boundaries and staged validation in browser tests.
- Backup includes all app-owned user data and referenced media. A cached copy of the external PlantDB reference catalog need not be treated as user-owned data, but PlantDB identifiers and display-name snapshots must be backed up.

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
3. End-to-end tests: create garden, add repeated plant variety, record multiple harvests, close/archive/reopen, create Journal with photo, backup/restore.
4. Reliability tests: complete browser restart, offline PWA launch, storage quota failure, large media import/restore, backup version incompatibility.

## 11. Decisions still to resolve

1. **Garden configuration:** required fields; which fields/group templates capture; ability to edit/delete templates.
2. **PlantDB contract:** how to obtain/cache choices offline and support custom/unavailable plants.
3. **Measurements:** quantity/units, precision, and whether conversions are appropriate in v1.
4. **Media:** blob formats, image sizing/thumbnails, limits, and reference/deletion policy.
5. **Journal editor:** library and content format; how shared media IDs are embedded.
6. **Calendar:** event times/timezones and feasible reminder delivery.
7. **Backup/restore:** ZIP library, archive schema, replace-vs-merge, large-data safeguards.
8. **Search:** exact fields, performance expectations, and whether basic filtering suffices.
9. **Lifecycle:** detailed valid transition paths and closed/archived behavior for associated records.
10. **Tests/PWA:** choice of runners, service worker tooling, update behavior, and device/browser support.

## 12. Explicitly outside v1

Scaled interactive map editing, automated plant-stage progression, per-individual-plant records, advanced harvest analytics, public Journal/RSS, social accounts, remote synchronization, cloud backup, remote historical-photo archival, PlantDB moderation, and advanced recurring calendar integration remain post-MVP unless GOALS.md is deliberately revised.
