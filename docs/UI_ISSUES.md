# UI Issues

Observations / Issues / Bugs / Tweaks / Improvements to the UI for triage in milestone 8T and verification before milestone 8U is accepted. Confirmed release blockers must be resolved; optional enhancements and unconfirmed findings require disposition, not automatic implementation. Current Step 10 work stays in UI_REDESIGN.md until accepted; this log does not expand its scope. Historical acceptance evidence stays in TESTING_NOTES.md and MILESTONE_HISTORY.md. Suggested template:

```
UI-000 — Title
Target milestone: 00
Location: 
Observed: 
Expected: 
Related: 
Priority: 
```

## To Fix	
Confirmed issues with an agreed correction.

### UI-001 — Home logo scrolls to top

**Target milestone:** 8T  
**Location:** Home dashboard, global logo  
**Observed:** After scrolling to Tasks or other previews on `/`, activating the logo does nothing because the destination is already the current route.  
**Expected:** Intentional Home navigation, including same-route logo activation, reveals the top of Home. Preserve ordinary history restoration and keyboard accessibility.  
**Related:** UI-002; [redesign scroll/focus decision](UI_REDESIGN.md).  
**Priority:** Nonblocking

### UI-016 — Search feedback cannot be dismissed after empty submission

**Target milestone:** 8M — Initial Search  
**Location:** Header Search placeholder  
**Observed:** (a) Entering whitespace (e.g. one space) and pressing Go displays an X that clears both input and the “Search isn't available yet.” message. (b) Entering a text query and pressing Go behaves the same way. (c) Leaving the input completely empty and pressing Go displays the message but no X, leaving no apparent way to dismiss the feedback.  
**Expected:** During 8M, handle empty and whitespace-only input deliberately and ensure displayed feedback has an appropriate dismissal or reset path. Verify all three cases and keyboard interaction. No particular implementation is approved.  
**Related:** Step 10B manual acceptance, November 25, 2026; developer clarification supersedes the initial whitespace-only diagnosis.  
**Priority:** Nonblocking; explicitly deferred to 8M.


### UI-019 — Edit Garden identity action overflow on narrow screens

**Target milestone:** 8T  
**Location:** Saved Garden Edit page, Galaxy S22 portrait  
**Observed:** Choose Ring Color and Choose Icon actions extend outside their containing panel on narrow screens; reported during 10C manual acceptance.  
**Expected:** Keep both actions within the usable panel using responsive wrapping/stacking and appropriate touch targets; preserve modal behavior and keyboard focus.  
**Related:** [TESTING_NOTES.md](TESTING_NOTES.md), 10C.  
**Priority:** Nonblocking; explicitly deferred to 8T.


## To Investigate	
Reproducible issues where the cause or solution is unknown.

### UI-002 — Application-wide navigation scroll and focus

**Target milestone:** 8T  
**Location:** Wizard, Home and all V1 screens  
**Observed:** Vivaldi Mobile Back/Forward correctly restores Wizard step, URL and draft but scrolls to/focuses Continue at the bottom. Home same-route activation is another confirmed symptom (UI-001).  
**Expected:** Audit actual scroll containers, sticky headers, history events and focus timing. Reveal active Wizard step heading/stepper after history navigation, preserve useful ordinary Back/Forward position, reveal validation fields, preserve local accordion/content position and restore dialog/drawer focus without unnecessary scroll. No blanket scroll-to-top on every render or route change. Respect deep links, drafts, keyboard access and reduced motion; verify desktop, mobile including Vivaldi, PWA and both modes. Document shared convention and focused regression coverage.  
**Related:** UI-001; [UI_REDESIGN.md](UI_REDESIGN.md), former item 18.  
**Priority:** Nonblocking


### UI-003 — Responsive drawer lateral whitespace

**Target milestone:** 8T  
**Location:** Standard Mode responsive navigation drawer  
**Observed:** A narrow blank lateral strip was reported in screenshot 1.extra-space-side-drawer.png. Step 10B inspection reported zero Bootstrap inset and intentional safe-area padding; no safe correction identified.  
**Expected:** Reproduce device/viewport case and inspect actual drawer layout; correct only unintended whitespace, preserving safe areas and global scrollbar stability. Avoid arbitrary offsets.  
**Related:** [10B implementation](https://github.com/solacenetwork/solace-garden/commit/d308030cbcb9e812d89f92c23088a5456a59f877); redesign item 24.  
**Priority:** Nonblocking


### UI-004 — Brief loading flash on creation-form switches

**Target milestone:** 8T  
**Location:** Quick Start, Wizard, Advanced  
**Observed:** A brief loading screen appears on switching creation modes. 10A.1 inspection found fresh/persisted draft route transitions legitimately fetch draft/reference data.  
**Expected:** Review perceived transition quality if still noticeable in final V1; preserve genuine loading/error states and draft recovery, no artificial delays or hiding errors.  
**Related:** [10A.1](https://github.com/solacenetwork/solace-garden/commit/344f0065a31c5497c3704f72f86f0035961b0118).  
**Priority:** Nonblocking



## Unconfirmed	
Intermittent observations that haven't been reliably reproduced.

### UI-006 — Unmapped Wizard validation feedback

**Target milestone:** 8T  
**Location:** Garden Wizard finalization  
**Observed:** Static review noted an unexpected unmapped error field might leave a pending feedback request; no reproduced defect reported.  
**Expected:** Verify fallback feedback and focus handling; correct only if necessary, preserving draft integrity.  
**Related:** [TESTING_NOTES.md](TESTING_NOTES.md), 8B3.  
**Priority:** Nonblocking


### UI-007 — Retry busy-state edge case

**Target milestone:** 8T  
**Location:** Geographic Locations / secondary pages  
**Observed:** 8B7 review noted a Retry control busy-state edge case; no reproduced failure recorded.  
**Expected:** Reproduce and verify Retry remains appropriately guarded and accessible.  
**Related:** [TESTING_NOTES.md](TESTING_NOTES.md), 8B7.  
**Priority:** Nonblocking


### UI-008 — More-menu route-transition focus

**Target milestone:** 8T  
**Location:** Global More menu  
**Observed:** 8B7 review noted potential route-transition focus issue; not reproduced.  
**Expected:** Investigate if reproduced, coordinate with UI-002.  
**Related:** [TESTING_NOTES.md](TESTING_NOTES.md), 8B7.  
**Priority:** Nonblocking


### UI-009 — Rapid leave-and-return during list write

**Target milestone:** 8T  
**Location:** Tasks and Wish List  
**Observed:** Static review suggested a rapid leave-and-return during a pending write might temporarily display stale data; not reproduced.  
**Expected:** Verify if reproduced; preserve authoritative list state, operation guards and persistence.  
**Related:** [TESTING_NOTES.md](TESTING_NOTES.md), 8B6.  
**Priority:** Nonblocking


### UI-010 — Template fallback semantics and duplicate-name links

**Target milestone:** 8T  
**Location:** Templates  
**Observed:** 8B4 review suggested moving fallback explanation inside associated definition-list dd and explicitly verifying independent creation URLs for duplicate names; no reproduced functional defect recorded.  
**Expected:** Review semantic association and verify UUID-based destinations remain independent.  
**Related:** [TESTING_NOTES.md](TESTING_NOTES.md), 8B4.  
**Priority:** Nonblocking

## Enhancements	
Optional UI-specific improvements to otherwise functional UI. Non-UI stuff belongs in PARKING_LOT.md instead.

### UI-011 — Final palette and typography trials

**Target milestone:** 8T  
**Location:** Application-wide visual design  
**Observed:** Original Garden and Natural Earth candidates and custom-font research remain deferred; Step 10 uses Bootstrap baseline typography and practical semantic states.  
**Expected:** Compare candidates against implemented UI in temporary development-only previews, including contrast, outdoor legibility, responsive layouts and interactive states. Self-host approved licensed fonts if selected; no production CDN dependency. V1 light-only; no theme switcher.  
**Related:** [UI_CONVENTIONS.md](UI_CONVENTIONS.md), theme and typography research.  
**Priority:** Nonblocking


### UI-012 — CSS organization and theme readiness

**Target milestone:** 8T  
**Location:** Shared and page stylesheets  
**Observed:** Earlier audit found parallel Garden/Bootstrap tokens and inconsistent states; Step 10D may resolve some findings.  
**Expected:** Re-audit final V1 after Step 10D and remaining features; consolidate only justified semantic tokens and CSS organization. Preserve intentional identity colors and Welcome overlays; no theme engine or selectable themes in V1.  
**Related:** [UI_CONVENTIONS.md](UI_CONVENTIONS.md), Theme Architecture.  
**Priority:** Nonblocking


### UI-013 — Draft versus saved Garden visual treatment

**Target milestone:** 8T  
**Location:** Garden cards and editors  
**Observed:** Warm earth tones for drafts and green for saved editing were proposed; no palette approved.  
**Expected:** Evaluate subtle visual distinction with explicit labels, never color alone, subject to final palette review and any treatment already implemented in Step 10D.  
**Related:** UI-011; [UI_REDESIGN.md](UI_REDESIGN.md), item 10.  
**Priority:** Nonblocking


### UI-014 — Navigation on short landscape viewports

**Target milestone:** 8T review candidate only; implementation unassigned  
**Location:** Manually selected Standard Mode on landscape phones  
**Observed:** Drawer header/footer leave room for only one or two destinations. Automatic/Simple Mode already offers an alternative.  
**Expected:** Optional review of height-sensitive fullscreen dialog, possibly multi-column with single close control. Preserve existing navigation and focus semantics; no threshold or implementation approved. Explicitly not a V1 blocker; may remain deferred beyond 8U.  
**Related:** [PARKING_LOT.md](PARKING_LOT.md), former short-landscape entry; https://getbootstrap.com/docs/6.0/components/dialog/#fullscreen-dialog  
**Priority:** Optional; not a release blocker

### UI-017 — Custom icon selection consistency

**Target milestone:** 8T  
**Location:** Garden creation identity disclosures and saved Garden identity modal  
**Observed:** Saved Garden modal accepts custom Bootstrap icon names; Quick Start, Guided Wizard and Advanced Form offer curated icons only.  
**Expected:** Evaluate consistent custom icon selection across identity surfaces, preserving validation and draft persistence; implementation not yet approved.  
**Related:** [TESTING_NOTES.md](TESTING_NOTES.md), 10C.  
**Priority:** Nonblocking enhancement

### UI-018 — Advanced creation breadcrumb wrapping

**Target milestone:** 8T  
**Location:** Advanced Garden creation, narrow mobile portrait  
**Observed:** Breadcrumb wraps onto a second line. Navigation remains functional.  
**Expected:** Review compact breadcrumb presentation without clipping or removing navigation semantics. Wrapping is acceptable if needed for accessibility.  
**Related:** [TESTING_NOTES.md](TESTING_NOTES.md), 10C.  
**Priority:** Nonblocking enhancement

### UI-020 — PageHeader action grouping and responsive layout

**Target milestone:** 8T  
**Location:** Shared PageHeader; observed on Gardens Hub desktop during 10D review  
**Observed:** Locations, Templates and Create Garden stack vertically at the right of the heading despite ample apparent horizontal space. The action cluster increases header height and pushes content down. The developer accepted the new button/form visual treatment; action grouping is a nonblocking refinement.  
**Expected:** Reassess shared PageHeader action allocation, grouping and responsive wrapping across workspaces before final polish. Prefer compact, coherent grouping where space permits, with intentional stacking on narrow screens. Preserve primary/secondary hierarchy, long-title wrapping, the shared alignment anchor, accessible focus/order and touch targets; do not force a single row or assume a specific CSS fix before inspection.  
**Related:** [UI_REDESIGN.md](UI_REDESIGN.md), 10A/10A.1 and 10D; developer desktop screenshot November 26, 2026.  
**Priority:** Nonblocking enhancement; no implementation approved in 10D or Step 9.

## Resolved	
Completed corrections with commit references and verification results.

### UI-015 — Long Garden card and detail titles

**Target milestone:** 10A.1 (accepted)  
**Location:** Garden filmstrips, grids, details  
**Observed:** Long names distorted card heights and overlapped detail actions.  
**Expected:** Resolved: three-line card title/two-line subtitle clamp, full wrapping detail title, isolated badge typography. No stored-name limits introduced. Developer manual acceptance, Vitest 726/726, Playwright 57/57 and build passed.  
**Related:** [344f006](https://github.com/solacenetwork/solace-garden/commit/344f0065a31c5497c3704f72f86f0035961b0118); [TESTING_NOTES.md](TESTING_NOTES.md).  
**Priority:** Resolved

### UI-005 — About project website destination

**Target milestone:** Corrected during Step 10B acceptance  
**Location:** About and package author metadata  
**Observed:** The previous URL pointed to solacenetwork.com, which the developer does not own.  
**Expected:** Link to https://solace.network. The developer also owns solacenetwork.org.  
**Related:** Resolved in [a08002b](https://github.com/solacenetwork/solace-garden/commit/a08002b87f42d71701127eb28d13518215f2e08e); About link, author metadata and corresponding Vitest expectation corrected. Package and lockfile bumped to 0.0.3-alpha. Source changes reviewed; developer confirmed manual About link acceptance; post-change automated results not separately reported.  
**Priority:** Resolved; manual verification passed.
