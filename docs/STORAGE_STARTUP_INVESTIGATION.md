# Mobile storage startup investigation — November 15, 2026

## Diagnosis

The reported devices use plain HTTP on a LAN. Fresh Chromium testing reproduced
`CONTROL_OPEN_FAILED` with `TypeError: crypto.randomUUID is not a function` at
`configuration-populate-uuid`. In that context, IndexedDB and
`crypto.getRandomValues` were available, `isSecureContext` was false, and
`crypto.randomUUID` was absent. The same application started on localhost, which
Chromium treats as a secure context. This establishes a cause matching the
reported environment; physical mobile devices must still confirm the fix.

This is an exception in initialization, not evidence of unavailable IndexedDB or
insufficient disk space. Dexie 4.4.7 propagates a thrown populate callback through
its opening promise and aborts the creation transaction. The existence probe
successfully returned false and database enumeration returned an empty array
before that callback failed. Retrying the isolated control open reproduced the
same TypeError in the browser console.

The UUID dependency predates Step 3: it is present in storage reliability commit
`6a047d0`. The Step 3 shell cannot render until storage returns ready. No evidence
connects the failure to the responsive navigation work.

## Complete startup path

1. `src/index.jsx` awaits `initializeStorage()`, which calls
   `initializeDexieStorage()`. Recovery renders instead of the shell on failure.
2. The control existence probe calls native `indexedDB.open('solace-config')`
   without a version. An absent database reaches `upgradeneeded` at oldVersion 0;
   the probe aborts that upgrade, closes the connection, and waits for the request's
   AbortError before returning false. It never deletes a database. Other errors,
   unavailable APIs and blocked requests require recovery.
3. Only when control is absent, `indexedDB.databases()` enumerates names. Existing
   Garden names prevent creation of a replacement control database. Enumeration
   failure also requires recovery.
4. The `CONTROL_OPEN_FAILED` try/catch includes **all** of: constructing Dexie;
   declaring its version and configuration store; registering the populate
   callback; calling/awaiting `open()` (including IndexedDB opening/upgrading,
   generating the initial UUID and configuration, and adding that configuration
   in the populate transaction); inspecting the native schema through
   `backendDB().objectStoreNames` and `verno`; and the invalid-schema branch's
   close/recovery return. Thus its original message did not distinguish an
   IndexedDB failure from an application exception inside populate.
5. Read `configuration/main` and strictly validate its current data contract and
   UUID-named pointer. Initial configuration contains an initializing marker.
6. Open the named Garden database, permitting creation only with that marker.
   Existing installations first probe for the configured database. Validate all
   stores, indexes and schema version. Ensure the built-in Location and Garden
   Types, then clear the initialization marker. Interrupted initialization retries
   the same pointer. Close control and expose storage-neutral repositories.
7. Only now mount the application shell. `PwaUpdateNotice` registers the service
   worker after mounting either the shell or recovery screen.

The populate callback performs synchronous UUID generation followed by a returned
Dexie write promise on its provided transaction. It does not await unrelated
asynchronous APIs, timers or network requests, which could otherwise allow native
IndexedDB transactions to commit prematurely. No transaction/probe changes are
needed for this verified failure.

A blocked probe rejects with its own recovery diagnostic. Dexie's installed
`open()` forwards native blocked events to `db.on('blocked')`; a blocked version
upgrade can remain pending until the blocking connection closes. It is not the
observed TypeError. No speculative timeout, deletion, migration or schema
relaxation has been introduced.

## Scoped correction

Use one UUID-v4 function based exclusively on cryptographically strong
`crypto.getRandomValues`, setting RFC 9562's version and variant bits. There is
no Math.random fallback. This API is available in the reproduced HTTP context.
Replace the same secure-context-only dependency in database naming, repository
record IDs, Garden draft creation and the new Note route, so startup success is
not followed by the same failure on the first write. Existing UUIDs, validation,
schemas, transactions and records remain unchanged.

## Recovery diagnostics and privacy

Expand **Technical diagnostics** and choose **Copy technical diagnostics**.
The read-only field also supports manual selection if clipboard access fails.
Plain HTTP supports the selection/copy path without requiring the secure
Clipboard API. The original recovery message and Retry remain available.

Reports include the recovery code, failing stage, original exception name and
allowlisted original infrastructure message, nested cause/inner exception chain
(up to four entries), Dexie version, loaded module/bundle filename, secure-context
status, IndexedDB and crypto API availability, user agent/platform and whether a
service worker controls the page. Unknown exception messages are explicitly
redacted because they could contain records or keys. Stacks, database names,
configuration values, Garden records, notes, locations, URLs and arbitrary
exception properties are not serialized. Nothing is logged or transmitted by
this diagnostic feature; copying is an explicit user action.

## PWA and version consistency

Vite generates hashed JavaScript/CSS and a Workbox precache. Existing configuration
uses prompt-based updates, `skipWaiting: false`, `clientsClaim: false`, and outdated
cache cleanup; it does not activate an update midway through a session. An old
worker may still serve the older application until an update is accepted. The
report's bundle filename and controller flag help distinguish that situation.

Plain HTTP LAN pages cannot register a service worker, unlike localhost/HTTPS.
The failing reproduction used a fresh browser profile without an existing worker,
so stale cached assets cannot explain that reproduction. Deployment/cache
consistency on the physical devices has not been independently inspected. PWA
configuration and registration behavior are unchanged.

## Verification

`npm test -- --maxWorkers=1 --testTimeout=60000` passed **405 tests across
36 files**. One preceding default-timeout run hit the five-second limit in an
unchanged Garden editor CharacterCounter test under host resource pressure;
the full rerun passed without changing that test or application behavior.

Fresh isolated Chromium origins passed all six startup stages independently on
localhost and HTTP LAN: absent-database probing, empty enumeration, control
creation/opening, transactional configuration population, strict configuration
validation, and Garden creation/opening. Forced UUID population failure rolled
back creation without leaving database artifacts. Ordinary reopen retained a
saved Note and the same active database pointer; new Note and Garden draft routes
also worked with the native randomUUID API absent. A disabled IndexedDB global
produced a safe recovery report and selectable HTTP copy fallback.

`npm run build` passed, including generated `sw.js`/Workbox and 11 precached
assets. PWA options and registration code were not changed.

Final production Chromium acceptance passed on localhost and HTTP LAN using
fresh origins in an isolated test profile. Notes were saved through the UI and
reopened after reload, and Garden drafts retained their routes after reload.
Localhost successfully installed and loaded under the generated service worker;
HTTP LAN worked with native randomUUID absent and no service worker. At a 375px
phone viewport, simulated IndexedDB unavailability rendered the correct report
with the final hashed bundle filename; the HTTP copy action succeeded, no
horizontal overflow occurred, and restoring IndexedDB reopened the saved Note.
No uncaught runtime exceptions occurred. Test browser process groups and temporary
servers were terminated and checked after each run.

The temporary development harness initially had a probe-page middleware ordering
error, then an assertion that checked the Notes list before asynchronous loading
finished. These were harness failures; the final production run waited for the
saved Note and passed the recovery-preservation check.

Regression coverage includes absent native randomUUID, fresh creation and valid-record
reopening, unavailable IndexedDB, blocked probes and failed control opens,
transaction rollback without database deletion, safe nested diagnostics, UUID
version/variant bits and HTTP/secure clipboard behavior.

Physical tablet/phone testing remains required: reload the new build at the same
HTTP LAN origin, verify startup, create/reopen a Note and Garden draft, and retry
startup. Preserve the existing browser profile. If recovery persists, copy its
technical diagnostics without clearing site data. HTTPS should also be tested on
the actual deployment, including the existing consent-based PWA update flow.

## API references

- [Dexie populate event](https://dexie.org/docs/Dexie/Dexie.on.populate)
- [Crypto.randomUUID secure-context requirement](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)
- [Crypto.getRandomValues availability](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)
- [RFC 9562 UUID version 4](https://www.rfc-editor.org/rfc/rfc9562.html#section-5.4)

Installed `node_modules/dexie/package.json` reports **4.4.7**. Its
`dist/dexie.mjs` confirms populate is executed through `DexiePromise.follow`,
rejection aborts the upgrade transaction, and native blocked events are forwarded
to `_fireOnBlocked`.
