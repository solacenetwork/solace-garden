# Parking Lot

New ideas that don't belong in technical specifications or the roadmap can be documented here so they aren't forgotten.

**Current UI decisions:** See [UI_REDESIGN.md](UI_REDESIGN.md). This file retains deferred alternatives and future ideas; it is not an alternate specification for the current V1 redesign.

After the current A–F implementation work, we could do a documentation cleanup alongside the UI sweep:
1. Keep ROADMAP focused on committed V1 milestones and a concise future-direction summary.
2. Move detailed speculative features and unresolved research into the appropriate parking lot.
3. Preserve relevant technical reasoning and links so information isn't lost.
4. Avoid treating tentative version numbers as commitments.


## Future candidate: External support and knowledge base

**Status:** Parked idea (November 2026), not a V1 launch requirement or committed platform choice.

- Keep the Garden PWA focused on gardening and offline use. Retain brief, essential in-app help (especially backup/restore and other tasks users may need while offline), while putting longer tutorials, FAQs, troubleshooting, and support contact/tickets on a separately maintained support website.
- Explore an external knowledge-base/helpdesk system such as **HESK** (candidate only), potentially hosted at `https://garden.solace.network/support` (illustrative path, not a deployed endpoint). Check Apache routing and SPA rewrite exclusions if it shares the Garden host; keep support availability independent of the PWA's offline operation.
- Possible knowledge-base categories: Getting Started; Using Garden; Privacy and Sharing; Troubleshooting; Contact Support.
- Include **photo-sharing privacy guidance** in the external documentation: simple staged/stock *safer versus risky* example images (e.g. close-up plant versus photo with identifiable sign/building); background landmarks and visible text; EXIF/GPS metadata; using device tools to crop or fully cover sensitive details; links to up-to-date Apple, Google, and other trusted instructions. Don't build a photo editor or an EXIF inspection UI into Garden. Keep any future public-image metadata stripping verification in the separate sharing/privacy planning notes.
- Store development screenshots and visual reference material in `docs/pics/` as appropriate, but keep documentation examples and other development-only assets out of the production PWA bundle. Review/remove disposable development material from the V1 production distribution; externally hosted support content can be maintained separately.
- Consider an app-specific support site now and a consistent support strategy across SOLACE applications later, without requiring a single shared helpdesk from the outset.

## Post-V2 candidate: Household Garden publishing and read-only sharing

**Status:** Concept from November 2026; not part of V1, and **not a V2 launch requirement**. First establish authenticated online access at `garden.solace.network`; define publishing and sharing after that foundation exists. Precise release/version sequencing remains undecided.

**Ownership and participants**
- The Garden dataset belongs to a **Household ID (HID)**, not separate gardener profiles or per-member records. Authorized household members may use and edit the same Garden database, locally or through future authenticated remote access. Household membership is independent of where a member lives (for example, a student away at college); access policy is supplied by SOLACE identity services rather than location checks.
- Non-household recipients—public visitors and explicitly invited, authenticated friends, relatives, or neighboring households—receive **read-only** access to permitted content. External sharing never grants editing rights or ownership. Authentication does not by itself authorize access to a household's data.

**Public gardening knowledge, not personal profiles**
- A household could opt to publish selected plant varieties, growing methods, dates, harvest information, photos, and public journal entries, possibly via RSS or other feeds. The subject is the gardening knowledge, not the household's members or street address.
- A changeable public display name such as “Sally's Garden” is independent of the internal HID and of stable opaque public URLs/identifiers. Private records, household identity, mailing address, precise coordinates, private journals, tasks, and wishlist content remain undisclosed unless separately and deliberately authorized for a sharing context.

**Graduated location disclosure**
- Internal Locations may eventually hold optional addresses or GPS coordinates for weather, rainfall, frost alerts, growing guidance, etc. Such internal data is not automatically published; external weather providers receiving coordinates is a separate privacy consideration.
- Consider opt-in public location precision: **hidden → country → broad region → state → town/city → exact coordinates**. An explicit exact-location exception may be useful for a community garden. Visibility choices can differ between public and invited audiences and perhaps by Garden or published item.
- Inspect published photos/media metadata and text for location leakage; preview the recipient-visible result before enabling sharing. Broad locations may still reveal information in small communities.
- **Photo privacy education first:** When public photo publishing is designed, provide plain-language Help documentation explaining EXIF metadata (especially embedded GPS coordinates), how gardeners can inspect/remove location information using their own devices, and how to disable camera geotagging. Remind users that visible landmarks and text can also disclose location. Link to that guidance near public photo-sharing controls rather than building a separate EXIF-management UI by default.
- **Verify image processing before publishing originals:** Garden already plans image optimization/resizing. Investigate whether the produced public-facing image derivatives omit EXIF/GPS metadata and confirm this with tests; do not assume resizing automatically removes metadata. Prefer distributing metadata-free derivatives for public photos where feasible, while keeping private originals and any needed metadata under appropriate controls. If an original image would be served publicly, document and assess that exposure explicitly. Defer exact processing requirements until the post-V2 publishing feature is scoped.

**Sharing management (hypothetical UI)**
- A central **Sharing** page could list recipients, invite authenticated contacts, inspect what each may view, adjust read-only scopes, and revoke access. An individual Garden could provide a reciprocal view of who can see it. Both manage one authorization model, not duplicate permissions.
- Keep all publication **private by default**. A shared view is server-enforced read-only; revocation prevents future authorized access, but cannot retract already downloaded information. Cross-household editing, collaborative conflict resolution, personal activity feeds, and a conventional social-profile system are outside this concept.
- Household-to-household identity relationships and member transitions are governed by the organization-level `IDENTITY_AND_GOVERNANCE.md`, not by Garden's own profile system.

**Future dependency:** Hosted authorization and publishing require explicit server-side privacy enforcement and tested data-provider boundaries. V3 two-way synchronization and conflict resolution are separate from the read-only sharing model; do not build either as part of the current UI review.

## V1.5 developer testing and regression hardening — Playwright

**Status (updated November 15, 2026):** The original post-V1, pre-V2 QA proposal now has an earlier **local Playwright foundation** checkpoint after UI redesign Step 5 acceptance (see [UI_REDESIGN.md](UI_REDESIGN.md) §9). GitHub Actions CI, expanded regression coverage and advanced diagnostics remain post-V1/V1.5 work. This is developer tooling, not an end-user feature or V1 launch gate. The V1.5 label identifies an internal engineering checkpoint; decide release/version tagging when the work is scoped.

**Purpose:** Establish a small repeatable local Chromium/IndexedDB browser-test suite during the UI redesign; after V1 ships, expand it into a CI-supported regression pipeline before V2 work. Keep the established Vitest suite and hands-on device testing; Playwright complements rather than replaces them.

**Initial proposed coverage:**
- Critical flows: Garden creation through Wizard and Advanced, Template save/apply, Location reassignment/deletion safeguards, draft recovery, and ZIP backup/restore.
- Cross-mode/browser behavior: Simple and Standard presentations, representative phone/tablet/desktop viewports, and Chromium/Firefox where practical.
- Offline-first integrity: installed PWA startup and navigation offline, IndexedDB persistence across reload/reopen and app updates, and safe behavior when storage or restore fails.
- Repeatable test fixtures with clean isolated browser profiles and disposable synthetic data; after public V1 release, never destroy or reset actual user data for testing.
- Consider CI via GitHub Actions once local execution is dependable; document how developers run the suite and diagnose failures.

### V1.0 beta versus V1.5 build identification and diagnostics

**Beta backup guidance:** The Welcome page and Help should communicate a simple, consistent message: SOLACE Garden is beta software; data lives locally in the browser/PWA; unexpected bugs, device loss, or clearing browser data may cause loss; **create regular ZIP backups and keep a copy somewhere safe**. Explain the manual export, backup validation, and replace-only restore path once implemented. Avoid implying that a beta label excuses unsafe saves or that remote redundancy already exists. Possible post-V1 improvements—backup reminders, easier backup management and later optional online backup/sync—remain exploratory, not V1 requirements.

**V1 soft launch:** Label the first public build **1.0 beta** and clearly explain that bugs may remain. Show a basic **running app version** in About plus an obvious Help/contact link (e.g. `feedback@solace.network`), and explain local-only storage and the importance of ZIP backups. Avoid suggesting cloud redundancy or guaranteed recovery. Keep existing service-worker update consent, stable offline use, safe storage operations, and V1 acceptance checks; a beta label is not permission to silently lose real user data.

**Defer to V1.5:** Vite-generated consistent build metadata (version, commit/build ID, timestamp) embedded in the compiled bundle and emitted as `build-info.json`; detailed About → Build Information; on-demand read-only `collectDiagnostics()` shared by About/Help and `window.getDiagnostics()`; optional user-reviewed diagnostic content for Help → Report a Problem; service-worker, Workbox cache, IndexedDB schema, browser/OS/PWA status; and Playwright validation of running-versus-waiting builds, offline updates and persistence. Never infer the **running** version from a JSON asset fetched after a deployment. Avoid sending user content, secrets or identifying diagnostics automatically.

**Versioning distinction:** Application version, IndexedDB schema version, service-worker asset revisions and portable backup format version are independent. There is no need for an IndexedDB store dedicated to running-build identification or manual cache-version increments.

### Possible future CI/CD deployment pipeline

**Status:** Parked design follow-up to the V1.5 testing infrastructure, not an approved deployment implementation or a prerequisite for V1 release.

- Run Vitest and Playwright in GitHub Actions; retain failure logs and Playwright reports/traces for diagnosis. Only publish a built `dist/` artifact after required tests pass. A dedicated deployment repository containing production files only is one candidate, subject to comparison with a deployment branch or direct Actions deployment.
- **Hostinger behavior observed in FreeTV testing:** An existing `.htaccess` in the hosting destination was **overwritten** by Git auto-deployment when the deployed repository included its own `.htaccess`. Earlier FreeTV testing also suggested destination contents are replaced rather than selectively merged. Design Garden deployments on the conservative assumption that **server-side hand edits and files are not preserved**; verify removal semantics and the exact Hostinger configuration before implementation.
- Keep a **production-safe `.htaccess`** with the deployment artifact for Apache SPA fallback/PWA delivery and caching. Never depend on an existing server-side `.htaccess` surviving automatic deployment.
- Current Hostinger password protection is temporary. Keep authentication directives and `.htpasswd` credentials out of the public deployment repository and build artifact. Separate any host-managed protection from app routing until protection is deliberately removed for public V1; verify the transition does not accidentally expose a password-protected test site.
- Treat the deployable folder as fully reproducible: no irreplaceable uploads, manual customizations, or secrets in a directory subject to replacement. Validate SPA deep links, cached/PWA clients during deploys, missing/stale assets, and recovery/rollback before enabling unattended production releases.

**Scope boundary:** No new gardening features or V2 backend/sync development in this phase. Playwright automation does not substitute for V1's existing manual accessibility, device, offline/PWA, backup, and data-preservation release checks. Prioritize stable, meaningful end-to-end tests over a brittle requirement for exhaustive coverage. Revisit exact test scenarios, dependencies, browser matrix, and CI configuration when V1.5 begins.

## Welcome carousel — detailed design owned by UI_REDESIGN.md

The startup preference, full-page Welcome route, Help access, deep-link behavior, and purpose of the short skippable Bootstrap 6 feature-introduction carousel have been decided. The authoritative current requirements and remaining slide-design questions are in [UI_REDESIGN.md](UI_REDESIGN.md) §7A. Do not maintain a second copy of those decisions here.

Retain this entry as a pointer only; future alternative Welcome experiences should be added separately and clearly marked as deferred rather than mixed into the approved V1 direction.

## Future candidate (V2): Garden discovery through Location filters and user-defined tags

**Status:** Parked V2 ideas (November 16, 2026); not approved for V1 or the current UI redesign Steps 6B–6.5. Exact UX, scope, and data design remain to be determined.

- **Filter Gardens by geographic Location:** Consider an optional **All Locations / specific Location** filter on the Gardens Hub for people managing multiple properties or community plots. Reuse the existing Garden `locationId` associations; do not repeat a Location label on every V1 card. Decide later how filtering interacts with Draft, Current, Planned, and Previous sections, and whether Location filters should apply elsewhere.
- **User-created tags:** Let gardeners assign their own descriptive tags to Gardens (examples: `vegetables`, `perennials`, `experiment`), then **search or filter by those tags** to find Gardens faster. These are gardener-defined organizational labels, distinct from Garden Type, geographic Location, lifecycle state, or the personal icon/color identity planned for Step 6.5.
- **Combined discovery:** Explore whether keyword search, tags, and Location filtering should work together, without requiring all three controls to be visible on every Garden card. Keep the ordinary Gardens Hub usable for gardeners with only one Location and no custom tags.
- **Future design questions:** Tag creation/editing/removal and normalization; single versus multiple tag selection; whether tags apply only to Gardens or later to Notes/other records; filtering of drafts; persistence and future sync behavior; mobile presentation and accessibility.

**V1 boundary:** Step 6B cards display the illustration, title, optional subtitle, and optional start date—no Location line, lifecycle badge, or user-defined tags. Do not add tag fields, filters, schema changes, or search functionality to the current milestone.

## Future candidate (possibly V2): Per-filmstrip sorting preferences

**Status:** Parked enhancement (November 17, 2026); not part of V1 or UI redesign Step 6D. V2 is a possible timeframe, not a commitment.

- Consider a small **Sort** affordance beside each Garden filmstrip, using a recognizable sort/order icon (such as arrows up/down), **not a gear/settings icon**.
- Offer sorting by **most recently modified**, **alphabetical Garden name**, or **creation date**; decide ascending/descending choices and precise labeling when designed.
- Keep sorting preferences independent for each filmstrip rather than imposing one global order; use local UI preferences if implemented. The dedicated `/gardens/drafts` page should honor the same Draft sort choice as the Hub filmstrip.
- Maintain **most recently modified first** as the current V1 Draft filmstrip default. Editing a draft updates its timestamp and may move it to the beginning; do not change that existing behavior now.
- **Longer-term V2/V3 possibility: Custom/manual order.** Let gardeners arrange cards into their own sequence and remember that sequence across visits, rather than automatically moving edited items. Explore accessible move-up/move-down controls as well as optional drag-and-drop on touch and desktop; manual ordering must remain usable from a keyboard. Decide how new items enter the custom order, how removal works, and whether the same ordering is shared with the dedicated collection page. Keep this separate from the simpler preset sorting options and do not implement it in V1.
- Later review how sorting applies to saved Garden collections and Home rails, responsive presentation, accessibility, and future synchronization of preferences.

**Reason for parking:** During Step 6D manual testing, modifying a draft moved it from third to first in the Draft filmstrip, making its previous position unreliable. User-controlled sorting may improve predictability without complicating the current V1 Hub work.

## Future candidate (possibly V2): Show Drafts on Gardens dashboard preference

**Status:** Parked future enhancement from November 14, 2026. **Not in V1 scope.** No new `/drafts` route or preference yet.

- Add a **Show drafts on Garden dashboard** checkbox governing unfinished drafts on `/gardens` (not Home `/`).
- **Checked:** show the compact Draft Gardens horizontal filmstrip, with resume actions.
- **Unchecked:** replace that filmstrip with a **Drafts** button linking to a possible `/drafts` page listing all unfinished drafts and resume actions.
- The setting affects **presentation only**: drafts, autosave, resume mode, and operational data integrity remain unchanged. Hiding the rail never deletes drafts.
- If implemented later, use the existing local UI preferences rather than a special store; no obsolete alpha data compatibility migrations.
- **Future decisions:** default checkbox state, where its control lives, whether `/drafts` or a nested Gardens route is preferable, and responsive accessibility.

**V1 decision source:** [UI_REDESIGN.md](UI_REDESIGN.md) §7B specifies the approved compact Draft Gardens rail on `/gardens` and the exclusion of drafts from Home. This entry records only the possible V2 display preference and `/drafts` destination.

## Future UI Review (after 8F): Garden-grouped Notes navigation

**Status:** Parked UX concept from November 8, 2026; evaluate during the app-wide post-8F UI sweep, not during 8F3/8F4. No implementation or data-contract change approved yet.

**Goal:** Make it easy to browse Notes and understand which Gardens they are associated with, without suggesting that Notes are physical files or are stored inside Gardens.

**Candidate interaction:**
- Present a tree-like *grouped view* using **Bootstrap 6 accordion** sections named for Gardens, plus an **Unassigned Notes** section. Expand/collapse to reveal Note entries; use Note terminology and appropriate icons rather than filesystem folders/files.
- Provide **live filtering as the gardener types** to find Notes quickly. During UI design, decide whether search filters the current Garden group, all Notes, or offers a clear scope choice; make matching items discoverable even when their group was collapsed.
- Select a Note to open the existing Notes reader/editor. The grouped view is navigation over the **existing Dexie/IndexedDB Note records and Garden associations**, not a new storage hierarchy, file manager, or duplicated data.
- **No drag-and-drop.** Moving a Note between displayed Garden groups would imply changing its association, so any reassociation should happen through explicit existing or future Note controls, not by dragging virtual items.
- Keep the display understandable and touch/keyboard accessible on **phones and desktops**, including when many Gardens and Notes exist (test with roughly 50 example Notes or more).
- Use existing **Preact, Bootstrap 6 and Bootstrap Icons** where practical; do not introduce `js-fileexplorer` or require SortableJS for this browsing interaction.

**Mental model:** These are **Notes associated with a Garden**, not files physically contained in a folder or stored in a device's filesystem. Garden-specific groups are filtered views; the underlying Notes remain independent records. Coordinate this concept with the separately parked linked-Garden indicator on Note cards.

**Timing:** Prototype/evaluate as part of the cohesive post-8F app-wide UI review. Do not interrupt current Garden Template development.

## V1 release preparation: Consolidated license and third-party notices page

**Status:** Parked release-preparation idea; not an immediate implementation task. Revisit during the V1 distribution and license-compliance review.

**Concept:** Provide a single offline-accessible `/license` page where users can read SOLACE Garden's software license and the required third-party notices/license texts, without navigating to GitHub. A scrollable, selectable text presentation (such as a read-only `<textarea>` or `<pre>`) is sufficient; prefer accessible formatting and clickable links where useful.

- Keep the repository's primary `LICENSE` file distinct from `THIRD_PARTY_NOTICES.md`. Garden's own software license does not automatically apply to bundled Pexels photographs or other third-party assets.
- Continue expanding `THIRD_PARTY_NOTICES.md` during development with appropriate project, copyright, license and attribution details; Pexels is already acknowledged there.
- For the final distribution, audit actual bundled dependencies and assets for required notices and full license texts. Do not assume a short acknowledgment satisfies every license or that every npm package requires a manually written entry.
- Consider generating a consolidated distribution-ready notice/text artifact from maintained sources at build or release time, rather than editing duplicate lists by hand. Include it with the PWA's offline assets so `/license` works without an Internet connection.
- Decide the exact file name, generation method, format, and page presentation when preparing V1. Do not replace the top-level `LICENSE` with a mixture of unrelated licenses.

**Timing:** V1 release checklist / distribution polish; no immediate code or schema changes.

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

## Future UI Review (after 8F): Template IDs as optional details

**Status:** Parked visual/UX refinement; 8F2 accepted, no change needed during 8F3/8F4.

The `/templates` management page currently prints a full UUID (e.g. `Template ID: ...`) on each Template card. Stable internal IDs are useful during development, diagnostics, and for distinguishing duplicate-named Templates, but are not meaningful to typical gardeners and clutter the primary presentation.

**Proposed UI review direction:** Hide raw UUIDs from the default card view, while retaining a discoverable optional details/info affordance (for example, an info icon with an accessible label and details panel) for advanced users and support troubleshooting. Preserve UUID-based internal identity and duplicate-name handling; do not replace IDs with names as identifiers. Evaluate the final presentation during the scheduled post-8F UI review.

## Page types and informational navigation — design principles consolidated

The post-8F review has incorporated the useful principle from this earlier note: **not every page is a workspace, and route registration is separate from navigation prominence**. The current navigation placements, Simple/Standard shell decisions, and open presentation questions are maintained only in [UI_REDESIGN.md](UI_REDESIGN.md) §§3, 5, 6, and 7A.

Do not introduce a mandatory workspace/utility/information route taxonomy or a new navigation framework merely to classify every page. Keep Help, About, and Welcome out of gardening-workspace directories; Welcome is reached from Help. Preserve direct URLs even when a destination is available only through More or contextual navigation.

This section is retained as rationale for the redesign, not as a second list of current implementation requirements. Any remaining page-wiring or presentation work should be specified in UI_REDESIGN.md before a Codex prompt is written.

## Future UI Review (after 8F): Linked Garden indicator on Notes cards

**Status:** UX observation from the 8E7 manual browser test on November 7, 2026. **8E7 test 1 passed**: a newly created Note linked to a Garden appeared on that Garden's detail page and the association survived reload. The gardener-wide `/notes` listing, however, shows linked and unlinked Notes identically, so users cannot tell which Notes are associated with a Garden without opening them. This is **not a functional test failure**; defer the display improvement to the post-8F UI refinement pass and the gardener's separate UI observation notes.

**Candidate:** Show a small Bootstrap Icons **link indicator** on a Note card only when `gardenId` is present. A Bootstrap 6 **click/tap-triggered popover** is preferred over a hover-only tooltip: identify the linked Garden by readable name (and useful context if names are duplicated), allow a link to the Garden detail page, and support long names. The indicator should be keyboard-accessible and carry a meaningful accessible label (e.g. “Linked to Test Garden”). It should **not** change the association or unexpectedly open Note editing. Unlinked Notes need no icon. Evaluate using the same visual convention on Tasks and Wish List entries for consistency; do not introduce a broad component framework merely for this.

**Timing:** No code changes during focused 8E7 acceptance; revisit in the UI Review after 8F.

## Future UI Review (after 8F): Long Garden names and card layout

**Status:** Browser-testing observation from 8E5 on November 7, 2026; deferred UX/data-contract decision, **not an 8E5 blocker or an approved implementation change**. All seven 8E5 manual acceptance checks were reported as passing. A deliberately verbose Garden name, including the opening of *A Tale of Two Cities* (“It was the best of times. It was the worst of times”), demonstrated how a long title expands a Garden card and makes the grid uneven. The record remains usable; the concern is presentation and future-proofing.

**Proposed approach to evaluate in the post-8F UI Review:**
- Consider a **generous maximum Garden name length around 200 characters** (preferred over the earlier 120-character suggestion; final number not yet committed). Support descriptive or whimsical names rather than imposing an unnecessarily short limit.
- If adopting a maximum, add native HTML `maxlength` to **all Garden name entry paths**, including Quick Start, Wizard, Advanced and Edit, and enforce the same limit in shared **domain/service validation**; browser attributes alone are not sufficient. **During alpha, existing Garden records and local test data are disposable: do not spend time on migrations, backward compatibility, or preserving over-length alpha names.** Clearing/recreating alpha data is acceptable. Revisit preservation/import compatibility only after stable data contracts matter. Consider whether the shared `CharacterCounter` is useful for names, but do not require additional UI clutter.
- **Independently of any storage limit**, constrain Garden card title presentation so one verbose name cannot create an unusually tall card or distort the grid. Prefer a sensible **two-line visual clamp / truncation** with wrapping safeguards, using Bootstrap utilities where suitable and minimal CSS if necessary (Bootstrap single-line `.text-truncate` alone may be too aggressive). Apply the same policy thoughtfully to future Garden list/preview widgets. Preserve the full underlying string and accessible identification.
- On the **Garden detail page**, allow the full wordy Garden name to wrap and remain visible; no display truncation required there.
- Test long words, spaces, mobile widths, keyboard/screen-reader accessibility, and the availability of the full Garden name from a card (e.g., accessible label or detail page).

**Do not implement during 8E5; review alongside the larger Gardens hub/card redesign after 8F.**

## Future UI Tweaks pass (after 8F): Remaining Gardens hub alternatives

**Status:** The overall Gardens review is now underway. The approved V1 separation and Draft Gardens filmstrip are specified in [UI_REDESIGN.md](UI_REDESIGN.md) §7B. This parking-lot entry preserves the earlier observations and alternatives that have **not** been selected; it must not override the current design record.

### Observed user-confusion cases to resolve in the design

- **Quick Start → Advanced/Wizard:** The old arrangement placed a Quick Start name field beside Wizard/Advanced links, implying that the typed name would carry into another method even though they create separate flows. The new creation entry design must make the three choices distinct or explicitly specify safe carry-forward behavior. Any optional URL-prefill must never create a Garden or overwrite an existing UUID draft; see the separate URL-prefill idea below.
- **Blank name / “Untitled Garden”:** An Advanced draft may have an empty name and appear in the draft collection. Consider a clear label such as **“Unnamed draft”** so it cannot be mistaken for a saved Garden.
- **Finding a newly created Garden:** Keep unfinished drafts distinct from saved Gardens. A saved Garden with status **Planned** is not an unfinished creation draft. Duplicate Garden names remain valid and are distinguished by IDs.

### Alternatives still parked, not selected for V1

- **Tabs:** Bootstrap 6 tabs for Current / Drafts / Previous, perhaps with counts. Tradeoff: inactive tabs hide content.
- **Dedicated filtered routes:** Possible `/current`, `/planned`, `/drafts`, and `/previous` pages alongside `/gardens`. These are historical candidates, not approved routes. **Planned is not Draft.** Not every route needs a primary-navigation item.
- **“I want to…” action selector:** A task-oriented selector for Create a Garden, Continue a draft, Find an earlier Garden, or Manage Gardens. This remains an alternative, not a V1 requirement.
- **Selector visibility preference:** A possible future Settings option to hide the action selector, only if the selector is eventually adopted.

Preserve the separation between draft creation sessions, saved Garden lifecycle, navigation, and display. Do not change the accepted draft/autosave/atomic-creation contract to solve a presentation issue. Resolve remaining V1 choices in UI_REDESIGN.md; promote a parked alternative only through an explicit design decision.

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
