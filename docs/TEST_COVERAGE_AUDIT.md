# Step 9 — Automated coverage and fixture audit

## Scope and evidence

Read-only audit of the post-Step-10 application at [3011a24](https://github.com/solacenetwork/solace-garden/commit/3011a24accd566cb24daf8ad074224d4ad39e855), conducted November 27–28, 2026. Developer confirmed 727 Vitest tests, 57 Playwright tests and production build passed at the baseline. The reviewer did not execute the suites. Playwright review covered 15 specifications (some by selected assertions); Vitest review inventoried 77 tracked test files, primarily by test titles, not exhaustive assertion inspection. The historical 76-file count was not reconciled. No instrumented coverage percentage was measured. Findings below are coverage observations, not confirmed defects or individually approved work items.

## Pass A — Playwright

| Working IDs | Coverage and findings | Disposition |
|---|---|---|
| PW001–003 | Populated smoke verifies rendering and nonzero counts, not pristine initialization or exact active-database integrity; Hub overlap is intentional. | Clean startup in manual scenarios; retain smoke. |
| PW004–008 | Shell navigation, mode selection, Drawer keyboard/focus and nested Template navigation covered; automatic mode transitions, unsaved editor changes and Add New/Search activation less exercised. | Verify intended responsive behavior manually. Search placeholder remains scoped to current implementation. |
| PW009–012 | Representative short-desktop and phone scrolling checks retained; phone Standard layout not in this matrix; CSS/last-child selectors may be brittle. | Manual physical-device/visual coverage; no large viewport matrix. Existing forced-Standard short-height limitation remains deferred. |
| PW013–017 | Gardens Hub classification, ordering, filmstrip/grid, independent expansion and navigation covered; dedicated Drafts workflow, actual discard and later visual changes less covered. | Vitest covers Drafts orchestration; manual touch and full workflows. |
| PW018–023 | Saved identity dialog independent saves, cancel, resets, fallback and phone layout well covered; creation disclosures, native picker and saved reset combinations less exercised. | Retain; manual native controls and creation variants. |
| PW024–029 | Quick Start basic save/reload; Wizard and Advanced navigation, recovery, validation and Template finalization covered; Quick Start draft lifecycle, Advanced validation and ordinary finalization consumption less exercised in browser. | Vitest covers underlying contracts/rollback; manual all three editors; future selective browser coverage. |
| PW030–035 | Template save/apply/delete and deleted-Location fallback covered; direct links, Wizard application, deletion persistence, Location management and duplicate identity targeting less covered. | Component/service coverage plus manual integrated workflows. |
| PW036–039 | Lifecycle, lock/unlock, archive/unarchive and deletion association cleanup covered; ordinary saved Garden edit less exercised; failure rollback belongs to Vitest. | Manual saved edit and lifecycle; retain tests. |
| PW040–046 | Notes scrolling, draft recovery, save and discard covered; association editing, missing Garden recovery, filtering/preferences, saved deletion and physical mobile keyboard less exercised. | Vitest covers many contracts; manual integrated and mobile behavior. |
| PW047–053 | Lists create/edit/complete/order/delete and persistence covered; exact deleted UUID, reverse completion, drag interaction, association/filter and focus deserve attention. Quantity is intentionally text. | Exact UUID assertion is a small future candidate; manual drag and keyboard; retain service validation. |

Chromium-only development-server tests use isolated contexts, one worker, representative viewports and failure screenshots/traces. They do not verify production installed-PWA behavior or other engines. Preserve the existing suite; avoid blanket retries, broad viewport multiplication or visual snapshot infrastructure. Earlier intermittent timing failures are not established application defects.

## Pass B — Vitest

| Working IDs | Coverage and findings | Disposition |
|---|---|---|
| VT001–003 | Storage initialization/recovery, Garden finalization rollback/concurrency and deletion/association rollback. | Retain deterministic integrity coverage. |
| VT004–006 | Quick Start, dedicated Drafts/discard, duplicate Garden/Template UUID targeting. | Browser gaps are not absence of functional protection. |
| VT007–009 | Note association/recovery, list completion/reorder/focus, responsive navigation/component orchestration. | Retain; complement with manual integrated execution. |
| VT010 | Historical DB migration and obsolete identity compatibility assumptions. | Review against alpha policy if relevant; do not remove legitimate operational safeguards or change production code during audit. |
| VT011–012 | Dev prototypes and component orchestration overlap with production/browser tests. | Retain while useful; physical browser behavior still needs verification. |
| VT013–015 | Instrumented coverage optional, historical file count discrepancy unresolved, installed PWA outside unit-test scope. | No percentage target or test-count expansion requirement. |

Inventory includes storage/services, Garden workflows, other pages, shared components, application contracts and dev prototypes. No entirely untested high-risk functional area was identified by this inventory; this is not proof of exhaustive coverage. Manual scenarios are driven by requirements, not by existing test titles.

## Pass C — Fixture and dataset

The November 16 capture predates many UI Redesign features, notably Garden identities and later Notes/editor refinements. It served its original purpose; absent later feature examples are historical limitations, not defects at capture time. User-entered names, including misspellings, are valid text.

The existing sample-garden.json has 71 records including one configuration record: 11 Gardens (5 Active, 2 Planned, 2 Completed, 2 Archived), 3 Garden drafts (all Advanced), 3 Note drafts, 4 Templates, 8 Garden Types, 25 list items (14 Tasks and 11 Wish List), 5 Locations and 11 Notes. All Garden identities are default; duplicate Container Tomatoes records have distinct IDs. Static inspection found matching active pointer, valid saved associations and referenced catalogs, and contiguous list ordering. This was not live restoration or exhaustive record validation.

| Working IDs | Findings and disposition |
|---|---|
| FD001–002 | Existing fixture internally consistent on inspected relationships; tests depend on existing names/IDs. Preserve until replacement is approved. |
| FD003–006 | New dataset should exercise custom identities, all three draft editors, associated Note drafts and meaningful original long/multiline Notes. |
| FD007–008 | Existing Chromium/origin-specific capture/restore utilities needed active-pointer/schema/record checks and summaries; addressed by modernization below. |
| FD009 | Dev seed helper bypasses some UI interactions; retain for convenience, exclude from manual scenario dataset authoring. |
| FD010 | Portable application-level checkpoints belong to 8H, not this task. |
| FD011 | Deliberate boundaries: duplicate names, optional blanks, valid text quantities, fixed dates, independent and associated records, recoverable references. |

## Fixture utility modernization and acceptance

- [cd2a47a](https://github.com/solacenetwork/solace-garden/commit/cd2a47a9034cf620deccfc3ba11e1dbaf7a791f6): named profiles and fixture filenames, shared schema/pointer/relationship validation, summaries, safe replacement and isolated restore.
- [9b28ab8](https://github.com/solacenetwork/solace-garden/commit/9b28ab8edb7960f0155c2b11ebe17dc529dd5822): FU-004 malformed structures, FU-005 draft contracts, FU-006 recoverable stale draft types, FU-007 seeded catalog validation. Source review accepted. FU-001–003 and FU-008–010 accepted, with count-only restore comparison and developer-confirmed autosave completion as documented limitations.
- Codex reported syntax/diff checks and read-only in-memory validation passed, including the existing fixture. No Vitest, Playwright Test, browser session or build was executed by Codex for these changes.
- **November 28, 2026: developer confirmed FU-M01–FU-M04 passed** (clean capture, populated capture, restoration and isolation). Temporary tests/fixtures/review.json added to .gitignore and verified present on main. Runtime acceptance is complete by developer report; reviewer did not independently execute it.

## Decisions and next steps

Preserve current automated tests and fixture until the new reference dataset is authored through the UI and captured as tests/fixtures/sample-data.json. Review fixture-dependent tests before switching. Prioritize manual acceptance and confirmed blockers; defer routine regression expansion to V1.5. Review scenarios and sample data at meaningful contract/workflow milestones before appending records, replacing obsolete or redundant alpha data where appropriate. See [MANUAL_ACCEPTANCE.md](MANUAL_ACCEPTANCE.md) for the living specification and policy. SOLACE QA collects observations and evidence; observations are not automatically defects. No roadmap or Monday changes, production changes, migrations, or 8H implementation are implied by this audit.
