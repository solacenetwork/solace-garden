# Parking Lot

New ideas that don't belong in technical specifications or the roadmap can be documented here so they aren't forgotten.

**Current UI decisions:** See [UI_REDESIGN.md](UI_REDESIGN.md). This file retains deferred alternatives and future ideas; it is not an alternate specification for the current V1 redesign.

After the current A–F implementation work, we could do a documentation cleanup alongside the UI sweep:
1. Keep ROADMAP focused on committed V1 milestones and a concise future-direction summary.
2. Move detailed speculative features and unresolved research into the appropriate parking lot.
3. Preserve relevant technical reasoning and links so information isn't lost.
4. Avoid treating tentative version numbers as commitments.


## Future improvement idea: Home dashboard Tasks and Wish List previews

**Status (November 25, 2026):** Parked for future review; no assigned implementation milestone. The developer observed that the read-only Home dashboard Tasks and Wish List widgets display checkbox/radio-like indicators, checked states and strikethrough text, creating the impression that items can be operated directly. They are currently previews, not interactive editors.

Near-term presentation alternatives to evaluate: (1) replace input-like indicators with ordinary list bullets so the preview does not imply an available toggle; (2) make each preview row a genuine accessible link to `/tasks` or `/wishlist`, respectively, so clicking/tapping the item opens its established workspace. These alternatives may be combined; preserve meaningful completion information (including strikethrough if useful), avoid nested interactive controls, and keep keyboard focus and link affordances clear. No specific item deep-link contract or immediate implementation is approved.

**V2 candidate:** Explore genuinely interactive dashboard widgets allowing completion/reopening of Tasks and purchased/unpurchased Wish List items directly from Home. Reuse authoritative list services, validation, persistence and operation guards; refresh the preview consistently after successful changes and provide accessible feedback on failure. Do not create a second record type, duplicate list editor or widget framework for V1. Coordinate later with the separate configurable dashboard widget idea.

## Future improvement idea: Navigation on short landscape viewports

**Status (November 25, 2026):** Parked; no assigned milestone and not a Step 10 or Step 9 blocker. During Step 10A manual acceptance, a phone in landscape orientation with Standard Mode manually selected displayed only one or two workspace destinations at a time in the left navigation drawer because its header and footer consumed much of the available height. Automatic/Simple Mode already provides an alternative for small screens; the developer explicitly chose not to change Standard Mode for this edge case now.

Future option: investigate a height-sensitive fullscreen Bootstrap Dialog presentation (rather than orientation alone), possibly with a multi-column navigation layout and a single accessible close control. Reuse navigation definitions and focus/dismissal behavior; verify available viewport height, safe areas, scrolling, keyboard and touch access, and breakpoint transitions. Reference: https://getbootstrap.com/docs/6.0/components/dialog/#fullscreen-dialog. No threshold or implementation is approved. Preserve the current drawer until separately scoped.

## V2 candidate: Expanded and contextual list-item creation

**Status (November 25, 2026):** Parked for V2 Lists planning; no committed implementation milestone. Explicitly outside V1 and UI redesign 8B6.

- Retain the lightweight Quick Add action. Consider a second **Add More Details** action that expands optional fields before creation, so the gardener can save a complete Task or Wish List item in one operation instead of adding it and subsequently editing it.
- Tasks can optionally select an associated Garden; Wish List items can additionally supply quantity, product URL and notes. Reuse the existing list-item field validation, Garden association selector and creation service rather than adding a separate record type or Garden-specific editor.
- Consider contextual creation actions on Garden detail pages, such as **Add a Task** and **Add a Wish List Item**, opening the ordinary expanded form with the current Garden preselected. Candidate URL proposed by the developer: `/lists?type=wishlist&gardenId=UUID&extra=true` if a combined Lists workspace is adopted. Alternatives using existing separate routes include `/wishlist?gardenId=UUID&extra=true`, `/tasks?gardenId=UUID&extra=true`, and `/wishlist?extra=true` for expanded creation without Garden context. The exact routing and parameter contract remain undecided.
- Treat URL parameters as initial UI context only, never authorization or an instruction to write. Validate the Garden UUID and existence, handle missing Gardens visibly, keep association optional and editable, and do not create a record until explicit submission succeeds. Do not overwrite user edits on rerender or repeated context application. Design Save/Cancel and contextual return navigation when scoped.
- Align with the parked contextual Note creation idea below, potentially establishing a reusable contextual record creation convention across SOLACE Garden. No combined Lists workspace, schema change, automatic record creation, or expanded creation flow is approved for V1.

## Future test maintenance: Shared Playwright accordion expansion helper

**Status:** Parked November 24, 2026; no assigned milestone. Identified during post-8B5 Playwright maintenance ([`097a133`](https://github.com/solacenetwork/solace-garden/commit/097a133d4420df877109f34e6adcd1a3fdf04f3e)).

Accordion expansion logic is duplicated across several Playwright specs (Garden lifecycle deletion, viewport scrolling, shell navigation, Notes persistence and populated navigation). During a future test-maintenance pass, consolidate this into a small shared test helper that accepts a scoped accordion locator, checks whether its native `details` is open, clicks `summary` only when necessary, and waits for the open state. Preserve actual user interaction, visibility assertions and each test's original intent. Avoid production code changes or unnecessary test abstractions. Verify affected specs and the full Playwright suite after consolidation. Current 56/56 suite is passing; this is a nonblocking maintainability improvement, not an immediate assignment.

## Future idea: Linking Gardens Back to Notes — contextual creation

**Status (November 24, 2026):** Parked; no assigned milestone or release commitment. Explicitly outside 8B5-A.

From an existing Garden detail workspace, consider a **+ Add Note** action that opens the normal new Note editor with that Garden preselected in the existing association selector. This complements the existing Note-to-Garden association workflow, analogous to the two-way Template creation entry points. Candidate URL concept: `/notes?type=garden&id=UUID`; actual dispatcher/new-editor route and query contract to be designed when scoped. Use the stable Garden UUID, validate the target, handle missing/deleted Gardens visibly, and apply context only once without overwriting resumed draft edits. Keep association optional and editable. Create an ordinary independent Note, not embedded Garden Notes, and retain explicit Save and lazy draft establishment. Do not create a saved Note merely by following the shortcut. Consider return navigation and lifecycle rules during design; no automatic reassociation, new record type or storage change is implied.

## Future idea: Actionable Location deletion restrictions

**Status (November 24, 2026):** Parked usability enhancement discovered during UI 8B3 manual acceptance. No assigned milestone or release commitment; not an 8B3 blocker.

- The existing Location deletion protection correctly refuses deletion when saved Gardens reference the Location. The current repository query counts matching Gardens, and the error asks the gardener to reassign every referencing Garden.
- Instead of requiring the gardener to find those Gardens manually, consider displaying a list of the blocking saved Gardens by name, optionally with subtitle or lifecycle status to distinguish similar names. Each entry should link to its existing `/gardens/:id` details route, using the stable Garden UUID rather than its name.
- Retrieve the matching records or a minimal summary using the existing `locationId` index; decide the service/error-details and accessible dialog or inline feedback presentation at implementation time. Keep the transactional deletion check authoritative and recheck on retry.
- Preserve all existing deletion rules: do not silently reassign or delete Gardens, do not make drafts or Template snapshots block deletion, and retain their current missing-Location recovery/fallback behavior. Consider how locked or archived Gardens can be handled under existing lifecycle rules; do not bypass those protections.
- Consider reusing the actionable dependency-list pattern for other deletion restrictions (e.g. Garden Types) where the existing data contract warrants it. No new data store, automatic bulk reassignment or compatibility migration is required by this idea.

## V4+ candidate: Optional AI assistance and agent interoperability

**Status (November 23, 2026):** Long-term exploration only, **not before approximately V4** and not a committed release target. **Prerequisites:** Server-side user accounts, authenticated APIs, suitable authorization and permissions, and a defined offline-first synchronization/conflict model. Do not expand V1 UI redesign or current server plans to implement this.

**Two complementary integration directions:**

- **Bring Your Own AI (inside Garden):** An optional Settings connection where the gardener selects a compatible hosted AI provider or potentially a locally operated model. Example: attach a photograph of a tomato leaf and ask, “Why do my tomatoes look like this?” The assistant could suggest possible explanations and follow-up checks without claiming certainty; the gardener decides whether to save notes or create tasks. Explore provider connections, model capabilities (including image input), costs, offline limitations, and safe credential handling at design time. Never assume a third-party provider API key is safe to store directly in browser/IndexedDB data; prefer appropriately secured server-side or delegated connection mechanisms when available.
- **External assistants interacting with Garden:** A documented, authenticated Garden API could eventually allow authorized assistants—including a potential ChatGPT connector and other third-party/local agents—to read selected Garden information or perform scoped actions (e.g., add a Task, record a harvest, create a Journal entry). Use explicit per-capability permissions, separate read and write access, user approval for consequential changes, auditability, and revocation. The underlying API should not depend on one AI vendor.

**Agent discovery and developer guidance:** Consider repository `AGENTS.md` for coding-agent guidance independently of the server rollout. Once a public server/API and useful agent-facing documentation exist, evaluate a site `llms.txt`, published API reference, and supported integration protocol(s). Discovery text alone does not provide authentication, tools, or authorization.

**Nonnegotiable product direction:** Garden remains fully useful through its ordinary manual UI, with **AI optional and off by default**. A user must be able to continue using their data after disconnecting an assistant. Only data explicitly required and authorized for an individual request should be shared; photo and journal privacy matter. Preserve offline-first operation, user ownership/control, and normal data integrity.

**Open future design questions:** Account architecture, credential protection, user consent and permission scopes, API authentication/rate limits, hosted versus local inference, supported providers, cost transparency, photo handling, server sync and conflicts, and a revocation/audit interface. Reassess versions and scope when the prerequisite server capabilities exist.

## V1 release-candidate tooling review

**Status:** Deferred until the V1 release-candidate preparation and repository-wide cleanup; not part of current feature development.

Review development-only utilities and test harnesses, including `/dev/wizard` (Wizard Stepper tester) and other `/dev/` tooling. For each, decide whether to **keep it beside the application component**, **extract it into a possible `solace-garden-tooling` repository** (following the FreeTV tooling approach), or **retire it** if no longer useful. Standalone fixture generators, validators, and test-data utilities may be better extraction candidates than tightly coupled UI harnesses.

Keep development tooling out of the distributed production PWA, regardless of its source repository. Verify existing development-only build exclusions before relocating anything. Coordinate this review with the final repository sweep for unused files and assets, without disrupting active V1 development or regression coverage.

## Future UI consistency and appearance work (Step 10 and later)

**Status (November 20, 2026):** Ideas to assess after current Garden creation functionality. The detailed accepted requirements and findings remain in [UI_REDESIGN.md](UI_REDESIGN.md), Step 10, and [UI_CONVENTIONS.md](UI_CONVENTIONS.md). These are reminders, not a separate design specification.

- **Reusable PageHeader component (Step 10 candidate):** Consider `PageHeader.jsx` for common breadcrumb, eyebrow, page title, description, and optional header actions. Keep the global `Header.jsx` responsible for the application navbar. Ensure headers share a stable alignment anchor in the page layout even when the form and card-grid widths differ; simply extracting markup into a component is insufficient.
- **Live palette/typography comparison (Step 10 development aid):** Consider a small, temporary preview/harness that applies the preserved Original Garden and Natural Earth palette candidates and font treatments to representative *real* Garden elements: buttons, links, breadcrumb states, navigation, cards, forms, headings, and labels. Inspect contrast, interactive states, responsive layouts, and outdoor readability before selecting the V1 default. This is a visual comparison tool, not a V1 user-facing theme picker.
- **Future appearance preferences (V2+):** Explore a restrained built-in choice of approximately 2–3 color themes and seven fonts. Later, potentially support schema-validated drop-in third-party themes/fonts, initially for the hosted web deployment and eventually offline PWA use if feasible. Keep the full theme architecture, validation/fallback concept, and version boundaries in `UI_CONVENTIONS.md`, rather than duplicating them here.

## Media/Gallery encoder candidates and benchmark research (8I / 8J; November 21–23, 2026)

**Status (approved November 23, 2026; renumbered November 24):** The isolated encoder benchmark has been **promoted to planned roadmap milestone GARDEN-V1-8I**, after 8H and before 8J; see [ROADMAP.md](ROADMAP.md) and [TECH_SPEC.md](TECH_SPEC.md) for its approved execution scope, acceptance and exact-version dependency prerequisite. This section preserves the research and alternatives, not a competing implementation specification. Keep the original development sample photographs for benchmark testing; production asset cleanup belongs to later release preparation. `@jsquash/webp` is not installed yet.

- **Primary comparison:** Native browser Canvas WebP encoding versus `@jsquash/webp` (libwebp compiled to WASM, browser/Web Worker target, Apache-2.0). Compare file size/visual quality, encoding time, memory, alpha support, WASM delivery in Vite/PWA precache, and offline operation using identical JPEG/PNG samples.
- **Not preferred for browser runtime:** `imagemin-webp` is a Node/native-`cwebp` build-time option. `@stacksjs/ts-webp` (pure TypeScript, MIT, early 0.x) is an interesting portable fallback, but its simplified lossy encoder is explicitly not as compression-efficient as `cwebp`, and the source's preferred system-binary pathway is not available in an installed browser PWA.
- **Research outcome:** Keep FilePond for selection/validation/preview rather than relying on its concurrent variants or undocumented WebP behavior. Process each image sequentially and generate the thumbnail from the display derivative; see `TECH_SPEC.md` for the proposed pipeline, storage/EXIF concerns, and real-device acceptance questions. No library installed and no mobile compatibility experimentally verified.

## Future Wizard UX and diagnostics refinements (post-V1 candidates)

**Status (November 20, 2026):** Deferred, not requirements for V1 Step 8A.

- **Contextual Wizard field help and external FAQ links (November 23 idea):** Consider a small accessible question-mark icon beside selected Wizard field labels. On click/tap/keyboard activation, show a concise, plain-English explanation in a Bootstrap popover (or a tooltip only for truly brief text). Optionally include a **More information** link to a dedicated, longer support FAQ article with examples and screenshots, potentially at the future centralized `support.solace.network` site. Bundle short popover text locally so it works **offline**; clearly identify the FAQ as an external, online resource. A reusable presentational `FieldHelp` component could accept a title, explanation, and optional URL (omit link until an article exists). The help UI must not modify field values, validation, draft persistence, IndexedDB contracts, or Wizard behavior. Defer design, placement, URL strategy, accessibility/focus/dismissal details, and implementation until a later Wizard UX polish milestone; **not part of 8A7**.

- **Clickable progress indicator:** V1's horizontal Wizard Stepper displays progress only; Back/Continue and browser history handle navigation. Later evaluate clicking completed/reachable step indicators, including validation/accessibility rules, after real-user testing.
- **Richer diagnostics and error handling:** V1 distinguishes recoverable user input/navigation errors from application/configuration/storage failures; use native/browser validation, concise on-screen messages, and basic meaningful `console.error` details without logging private Garden data. Later consider standardized diagnostic codes, richer developer logging, centralized error handling, and optional user-reviewed diagnostic exports if real support requirements justify them. Avoid building a logging framework prematurely.
- **Wizard configuration integrity:** V1's production JSON includes every active step, with stable IDs and explicit ordering; no `showInWizard` or production test-configuration URL override. Future engine/test-harness work can expand development-only step/form testing without exposing incomplete steps to users.

**Architecture boundary update (November 21, 2026):** Read-only Codex reviews established that UI redesign **8A4** will implement the reusable *definition and navigation foundation* (strict step JSON validation, stable-ID resolution, Garden URL/history adapter and draft viewed-step persistence); **8A5** will add Garden-specific step-form registration and validation. This is incremental delivery of useful pieces, **not** authorization to build the fully configurable engine/test host. V1 only needs clear recoverable navigation errors, failed-configuration messages and basic privacy-conscious console diagnostics; a centralized Wizard error handler and diagnostic codes remain candidates here for later evaluation. See `TECH_SPEC.md` and `UI_REDESIGN.md` for approved V1 scope.

## Portable backup test bench — promoted to V1 8H (November 24, 2026)

The isolated backup prototype and production current-data foundation are now planned in 8H1–8H4; see ROADMAP and TECH_SPEC. Future synthetic portable fixtures can support repeated desktop/phone acceptance and isolated Wizard testing. Keep fixture data synthetic and retain existing direct IndexedDB Playwright fixtures; do not make all tests depend on ZIP restore. The full Wizard test host remains deferred.

## Future development tooling: Configurable Wizard Engine and isolated full-Wizard test harness

**Status (updated November 21, 2026):** The **full configurable Wizard Engine and isolated test host remain deferred**; the small navigation core is planned for 8A4 and Garden-specific form registration for 8A5. Revisit the test host after ZIP export/import is available, since portable fixtures may simplify setup.

- **Immediate scope stays small:** Extract a reusable, presentation-only horizontal `WizardStepper` component and test it on development-only `/dev/wizard` with alternative step JSON configurations, sample labels, counts, ordering, and scroll/navigation simulation. No draft persistence or IndexedDB dependency in the initial harness.
- **Future Wizard Engine:** Separate the reusable stepper *display* from orchestration of ordered step definitions, step-form component registration/rendering, Back/Continue navigation, URL history, validation, draft autosave/resume, and final creation. Reuse the same engine in production and in a development testing host; avoid special production URLs, `showInWizard` switches, or test-only branches in the production Wizard.
- **Full step-form testing:** Eventually extend `/dev/wizard` beyond visual stepper previews to test newly implemented or experimental form steps and their validation before adding them to the production Wizard configuration. Development-only components/configurations must not accidentally enter the production bundle.
- **Storage isolation:** The future test host injects a **separate storage session** pointing to an isolated, disposable IndexedDB database, never the active production Garden database. Keep Dexie selection and database naming outside the Wizard Engine; use existing storage-neutral services, not global production singletons. Testing may create/delete draft and Garden records **only in this test database**.
- **Fixture setup:** Start from empty/seeded test data; consider one-way snapshots of selected real data or import of portable sample ZIP fixtures after ZIP export/import exists. No live synchronization or writes back to production. Provide an explicit **Reset Test Database** control.
- **Integrity boundary:** Test operations must not affect the active Garden database. Alpha test data in the isolated database is expendable; no legacy alpha-format migrations are needed, while ordinary operational write/transaction integrity remains necessary.
- **Delivery sequence:** The Stepper prototype is accepted (8A1). Implement minimal reusable navigation in 8A4, Garden-specific forms in 8A5, and finish the existing UI redesign before considering the full engine/test harness as a separate, scoped tooling effort, potentially following ZIP export/import.

## V2 candidate: Re-enable switching between Garden Wizard and Advanced during creation

**Status (November 20, 2026):** Explicitly **deferred from V1 Step 8A** for simplicity; possible V2 improvement, not a release commitment. The technical capability already exists in the current shared-draft creation infrastructure.

- V1 gardeners choose **Guided Wizard** or **Advanced Form** from the four-card `/gardens/new` chooser and stay with that presentation for the current draft. Template-based creation selects the intended editor at the entry point too.
- Revisit exposing **Switch to Advanced** / **Switch to Wizard** controls only after the distinct V1 creation paths have been tested with real users and the interaction is demonstrably clearer.
- If reintroduced, preserve the same draft identity, validated field state, autosaved content, selected Template's copied values, and last Wizard step across transitions. Do not silently reset fields or start new drafts when changing editor.
- Avoid a second implementation of creation or a V1-only migration/compatibility layer. This idea concerns **visible workflow switching**, not the existing application-wide Simple/Standard interface-mode preference.

## V2/V3 candidate: Bookmarklet, list-item deep links, and sharing

**Status (November 19, 2026):** Future exploration; **not part of V1** and not a committed V2 or V3 release requirement. Related to, but independent of, the proposed combined Lists overview below.

**Initial local-first proof of concept**

- Explore a desktop browser **“Save to SOLACE Garden” bookmarklet** that captures the current shopping page's title and product URL, then opens Garden with a prefilled **Wish List** Add form. Task-item links could use the same pattern.
- An illustrative URL might be `/lists?add=true&list=wishlist&title=Tomato+Seeds&quantity=2&url=https%3A%2F%2Fexample.com%2Fseeds`. This **does not establish /lists as the chosen route**; dedicated `/tasks`, `/wishlist`, or another import entry point may be better. The combined Lists dashboard must not be a prerequisite.
- Parse and validate URL parameters, reject unsupported types/fields, show a review/edit/confirmation step, and **never write to IndexedDB merely because a link was opened**. Preserve the offline-first model and existing Tasks/Wish List semantics.
- A local bookmarklet can work without a PHP API when the installed or otherwise available Garden app and its cached assets are accessible. Test browser/PWA handling and offline behavior rather than assuming custom protocol support.

**Person-to-person sharing**

- Consider an in-app **Share Item** action that produces a self-contained link containing only selected transferable fields. A recipient running Garden could open it, review the proposed Task/Wish List item, and choose whether to add a **copy** to their own list. Sharing an item must **not** grant access to the sender's list, household data, internal IDs or other private records.
- When offline, offer **Copy formatted text** (item name, quantity, optionally product URL and notes) so the user can paste it into email or messaging when a communications channel is available. Generating that text must not require a server.
- Clarify URL length, escaping, validation, privacy of URL query strings (history/logging/referrers), size limits, and which fields are safe to include before defining a permanent format.

**Server-backed evolution and SOLACE interoperability**

- As Garden eventually introduces authenticated PHP APIs, server-side persistence and mirroring/synchronization, investigate authorized import and sharing endpoints. Server writes should be authenticated, authorized, rate-limited and treated separately from simple prefilled-link navigation.
- Organization-wide concepts such as a shared SOLACE short-link resolver (candidate `snlink.org`) and a future native `sn://` protocol belong in [the organization-level Parking Lot](https://github.com/solacenetwork/.github/blob/main/docs/PARKING_LOT.md). Garden could eventually consume or generate such links but should not depend on the central link service for local/offline operation.
- Keep payload/schema validation and user confirmation common across local URLs, server APIs, and eventual cross-app imports. Versioning and cross-device conflict/sync rules belong to the later backend design rather than the bookmarklet proof of concept.

## V2 candidate: Combined Lists overview for Tasks and Wish List

**Status (November 19, 2026):** Deferred from the V1 UI redesign Step 8. This is a possibility to evaluate for V2, not a committed V2 feature.

- Revisit whether a common **Lists** entry point or a combined Lists overview improves navigation for people using both Tasks and Wish List.
- A possible dashboard could show both lists and offer separate Add actions; investigate the actual benefit after observing how people use the existing pages.
- Preserve dedicated /tasks and /wishlist destinations and independent editing workflows and item semantics. No new data model or shared Lists page is required for V1.
- Do not conflate this proposal with the already approved Home dashboard's separate Tasks and Wish List previews.

## Future idea: Preferred Garden creation method

**Status (November 19, 2026):** Deferred user preference, not an implementation requirement for Step 7. Initial default remains the guided Wizard.

- Add a preference such as **“When I click Create Garden, open: Wizard | Advanced Form.”** The preference selects the default entry point only; both methods remain accessible at all times.
- Do not automatically switch a user to Advanced after a certain number of Gardens. A gardener who has created 10–20 Gardens may choose Advanced themselves.
- Wizard remains guided and incremental; Advanced presents the full form for experienced users and historical-record entry. The agreed initial lifecycle-status selections for Step 7 belong in [UI_REDESIGN.md](UI_REDESIGN.md), not in this deferred preference.

## Future idea: Preserve unsaved changes to existing Gardens across sessions

**Status (November 19, 2026):** Deferred workflow improvement prompted by manual use; not a Step 6.5 or Step 7 implementation instruction.

- **Terminology:** **Draft** means only a proposed Garden not yet officially created. An official Garden with pending edits is a **Garden with Unsaved Changes**. Do not call the latter a draft in the user interface.
- Explore automatically preserving edits to an existing Garden locally across navigation, reloads, closed tabs, and later sessions **without committing those edits to the official Garden record**. Clearly indicate when work has been preserved but still needs **Save Changes** to update the Garden.
- Keep explicit Save Changes and Discard Changes semantics. On returning to the editor, present preserved pending changes rather than silently losing them or silently applying them to the official record.
- Preserve already committed Garden data, correct identity-field updates, and normal operational data integrity. Review interaction with navigation/Back links, standalone identity saves, and edit conflicts before scoping implementation.
- The aim is to reduce editing friction and inconsistent navigation expectations created by the convenient autosave behavior of proposed-Garden Drafts; this is a future exploration, not approval of a specific storage design.

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

**V1 soft launch:** Label the first public build **1.0 beta** and clearly explain that bugs may remain. Show **running version/build identity and a simple online PWA freshness check** in the About page's read-only Build Information area (8G), plus an obvious Help/contact link (e.g. `feedback@solace.network`), and explain local-only storage and the importance of ZIP backups. Avoid suggesting cloud redundancy or guaranteed recovery. Keep existing service-worker update consent, stable offline use, safe storage operations, and V1 acceptance checks; a beta label is not permission to silently lose real user data.

**8G moved into V1 (November 21, 2026):** Generate consistent build metadata (running application version, unique build ID, timestamp) embedded in executing JavaScript plus a matching deployed `build-info.json`. About displays this in a simple read-only text area on mobile, alongside available service-worker/waiting-update state and a network-only latest-deployment comparison. An offline or failed comparison must say **Offline** or **Unable to check**, never claim the cache is current. Never infer the **running** version from JSON fetched after deployment; Workbox revisions identify individual assets, not a single current-build timestamp. No Garden IndexedDB reads, cache deletion, or update action is needed for this display.

**Defer to V1.5:** Detailed `collectDiagnostics()` shared by About/Help and `window.getDiagnostics()`; optional user-reviewed diagnostic content for Help → Report a Problem; deep service-worker/Workbox cache, IndexedDB schema, browser/OS/PWA diagnostics; and expanded Playwright update/offline/persistence validation. Avoid sending user content, secrets or identifying diagnostics automatically.

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
- **Longer-term V2/V3 possibility: Custom/manual order with explicit Edit Mode.** The Android home-screen analogy describes the separation between normal interaction and rearranging items, **not a requirement for long-press activation**. Offer a visible **Edit** (or **Arrange**) button/link in the filmstrip controls to enter Edit Mode on desktop and mobile. Within Edit Mode, users rearrange cards by drag-and-drop where appropriate, with accessible keyboard/Move Up/Move Down alternatives; normal Resume/Open/Discard actions should not activate accidentally during rearrangement. Provide a clear **Done** control to exit and return to normal browsing. Save the custom order across visits and ordinary record edits, so item positions do not automatically change. Mobile long press could be considered later as an optional shortcut, never the sole way to enter the mode. Decide later whether changes persist immediately or on Done, how cancellation works, where new cards go, and whether dedicated collection pages share the same order. Keep this distinct from preset sorting choices; no V1 implementation.
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

## Future idea: Create a Garden directly from a Template card

**Status (November 23, 2026):** Parking Lot proposal; **not part of UI milestone 8A6**. 8A6 implements the approved From Template selection workflow on `/gardens/new`, with one-time prefill and Wizard/Advanced entry. This proposed enhancement provides a shortcut from the separate `/templates` management page using that same workflow.

Each Template card currently includes Delete. Rather than adding two long creation links, add a compact **Creation method** select (default **Guided Wizard**; alternative **Advanced Form**) followed by a single **Create Garden** button. The selected Template's UUID is already available on its card; the gardener should not have to select the Template again. Example target routes:

- Guided Wizard → `/gardens/new?type=wizard&source=template&id=UUID`
- Advanced Form → `/gardens/new?type=advanced&source=template&id=UUID`

`UUID` is the clicked Template card's actual ID, URL-encoded as needed. These are **proposed route contracts**, not a claim that the current dispatcher supports `source` and `id` yet. When implemented, route through the existing one-time Template prefill and editor workflow: resolve the selected Template, initialize a **new independent draft by copying its configuration once**, and open the selected editor. Preserve missing/deleted Template handling, Location fallback, autosave, and no-reapplication semantics. Editing the new Garden must never mutate the source Template.

Use existing Bootstrap 6 form and button conventions, accessible labeling, and a responsive layout so Template cards stay compact on phones. Keep Delete and its confirmation independent of Create Garden. This is a convenience entry point, not a new Garden creation implementation.


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

## Historical Wizard proposal — promoted into UI Redesign Step 8A (November 21, 2026)

**Status: Superseded as an active parking-lot task.** The post-8F idea to turn the original three-stage Wizard into a guided sequence of manageable screens has been approved and promoted into [UI_REDESIGN.md](UI_REDESIGN.md) §7C / Step 8A, with the current Garden-specific implementation boundaries in [TECH_SPEC.md](TECH_SPEC.md) and the current sequence in [ROADMAP.md](ROADMAP.md). UI Steps 8A1–8A3 are accepted; **8A4 (five-step navigation and durable draft step ID) is next, not yet implemented**. Do not use the historical six-step illustration or Review/Plant Selection steps below as V1 requirements.

**Historical reasoning retained:** Prefer stable, descriptive Wizard step IDs/components over hardcoded numeric screen identity, keep shared draft/autosave and Garden service validation independent of UI step order, and keep Wizard guided versus Advanced all-fields-at-once. The November 7 vanilla-JavaScript `wizard.zip` and [archived PHP example](https://github.com/solacenetwork/garden-archive/blob/main/app/garden/new-garden.php) are design history, not contracts to port. Earlier brainstorms mentioned a hypothetical six-step flow including Appearance, Plant Selection and Review; the **approved V1 design is a different five-step flow** with no Review step, preserving create-first/add-plants-later boundaries. Future generic engine/test harness proposals remain parked separately above.


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

## V2 candidate: Multiple saved PlantTrays and Garden associations

**Status:** Deferred V2 concept; not a V1 commitment. V1 uses one temporary `PlantTray` for collecting plant selections from PlantPicker or the full master catalog and adding them to **one chosen Garden**. The V1 tray is not a purchasing cart, Wish List or persistent planting record.

- Explore **multiple persistent, named PlantTrays**, each optionally associated with a Garden by its stable `gardenId`, allowing gardeners to plan different Gardens before adding Plant Groups.
- Default name pattern: **`[Garden Name] Tray [next sequence number]`**, with independent numbering per Garden (e.g. `Raised Bed 1 Tray 1`, `Raised Bed 1 Tray 2`, `Greenhouse Tray 1`). Names are editable, may repeat, and are not identity keys. Do not renumber surviving trays when one is deleted.
- If saved Tray records are introduced, give each its own immutable **Tray UUID**. Garden associations use Garden UUIDs, not names; renaming either entity does not break identity or references. Sequence numbers are naming conveniences only.
- Consider reopening, editing, renaming, moving and deleting saved trays; decide lifecycle, storage schema and how pending items are handled when destination Gardens are closed/deleted or changed at implementation time.
- Keep this separate from Garden Templates (reusable Garden configurations) and actual Plant Groups (saved planting records). No V1 saved tray store, migration, multi-tray management or per-item destination picker.

### Possible V2/V3 concept and interaction

- **Discover → collect → assign:** Reuse the V1 **PlantTray** selection concept as the starting point for possible later visual Maps planning. Explore assigning collected candidates to Garden plant groups and arranging their representations on a map; don't duplicate a separate “Potential Plants” basket model.
- **Visual Garden area:** Display the selected Garden as a simple rectangular workspace with **colored rectangles/squares representing its plant groups**, inspired by Piet Mondrian-style CSS layouts. Labels identify the actual plant groups. Tiles may be moved, resized, recolored, and rearranged to create a readable, *representational* layout.
- **Two areas on larger screens:** Potential Plants / unplaced plant groups on one side; the selected Garden's visual area on the other. Drag-and-drop is a candidate, with explicit **Add/Move to Garden** controls as a touch/keyboard-accessible alternative. On small screens, use sequential selection and placement instead of requiring precise dragging.
- **Not required for basic gardening:** The ordinary Garden and plant-group lists remain fully functional without a map; the layout is an optional visualization, not the authoritative record of which plants are being grown.
- **Identity:** Each tile references a persistent **plant-group ID**. Plant groups reference PlantDB records by stable plant ID. Assign to a **Garden ID**, not to a Garden Type (Raised Bed, Container, etc. are classifications, potentially multiple per Garden). Duplicated plant selections produce independent plant groups, not duplicate catalog records.
- **Future saved selection lifecycle:** Multiple persistent trays and Garden associations are parked separately in the V2 PlantTrays entry above; map layout work does not require them.

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
- **Scope boundary:** Garden V1 uses the gardener's uploaded JPG/PNG map as reference media and implements PlantDB lookup/selection and real plant-group creation in 8O/8P. It does not implement an interactive Maps editor. Avoid speculative diagram/geometry fields in V1 storage.

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
