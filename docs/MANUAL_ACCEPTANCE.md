# SOLACE Garden — Manual Testing Scenarios

## Purpose and status

This living specification establishes the repeatable manual acceptance and regression testing process for SOLACE Garden. UI Redesign Step 9 is its first comprehensive execution; subsequent milestones extend it as product requirements evolve.

This initial revision defines the testing foundation. The actual scenarios, prescribed dataset and execution results will be developed separately. It does not record a completed acceptance run.

## 1. Testing methodology

SOLACE Garden adopts a lightweight **Scenario-Based Regression Testing process with standardized test datasets and requirements traceability**.

The guiding principles are reproducibility, traceability and continuity. Equivalent starting conditions, inputs, actions and expected results enable apples-to-apples comparisons across browsers, physical devices, interface modes and application versions.

### Seven-stage process

| Stage | Activity | Responsibility |
| --- | --- | --- |
| 1 | Product requirements | Establish intended behavior using [GOALS.md](GOALS.md), [TECH_SPEC.md](TECH_SPEC.md) and approved [UI conventions](UI_CONVENTIONS.md). |
| 2 | Define testing scenarios | Translate requirements into repeatable Manual Testing Scenarios in this document, with stable identifiers and objective acceptance criteria. |
| 3 | Establish standardized datasets | Define meaningful named records, prescribed inputs and dataset checkpoints. |
| 4 | Map existing automated coverage | Cross-reference scenario requirements against Vitest and Playwright tests; identify covered behavior and gaps. |
| 5 | Execute manual acceptance | Run the scenarios across applicable browsers, physical devices and interface modes. |
| 6 | Identify defects and coverage gaps | Record reproducible observations, expected versus actual behavior, and missing regression protection. |
| 7 | Correct, retest and preserve | Resolve confirmed defects, verify corrections, retain appropriate regression tests and preserve portable fixtures when supported. |

This is a continuous improvement process, not a one-time checklist. Existing automated tests inform manual scenario design, while the scenarios reveal gaps in automated coverage. Intended product behavior, not the existing tests alone, determines acceptance requirements.

## 2. Complementary testing methods

| Method | Purpose | Mechanism |
| --- | --- | --- |
| Unit and component testing | Verify individual components, business logic, validation and data integrity. | Vitest, including service and storage integration tests. |
| End-to-end testing | Verify repeatable integrated application workflows in a browser. | Playwright. |
| Manual scenario-based testing | Verify consistent behavior across browsers, physical devices and interface modes, including visual and native-control behavior. | This specification. |
| Exploratory testing | Discover unexpected behavior, edge cases and usability problems. | Human investigation and SOLACE QA observations. |

These approaches complement rather than replace one another. Deterministic business rules, transaction rollback and failure handling are generally best tested in Vitest; browser workflows belong in Playwright when suitable. Physical touch interactions, native controls, visual consistency and actual installed PWA behavior require appropriate manual verification.

Structured manual testing follows prescribed conditions, inputs, actions and expected results. Exploratory testing allows the tester to adapt actions as findings emerge. A reproducible exploratory finding may become a permanent manual scenario and, where appropriate, an automated regression test.

## 3. Scenario and dataset conventions

Each major testing step contains four essential elements:

| Element | Purpose |
| --- | --- |
| Prescribed input | Exact, reproducible sample values, including names, text, dates and selections. |
| Test actions | Ordered, specific interactions to perform. |
| Expected results | Objective acceptance criteria for the actions. |
| Dataset checkpoint | Expected records, counts, values, associations and states before proceeding. |

Each scenario also identifies its starting conditions, applicable environment constraints and stable identifier (for example, `3B-01`). Identifiers are assigned when scenarios are defined and retained for references in QA observations, testing history and automated coverage mappings.

Building the standardized dataset is itself a functional test. Use meaningful gardening records and intentionally chosen boundaries, including duplicate names, missing required values, long text and valid optional blanks. Use fixed dates, exact palette names and custom hexadecimal colors where reproducibility matters. Distinguish identically named records by identity and verify that navigation and associations target the correct independent records.

Scenarios may build on prior dataset checkpoints. Do not silently substitute a different dataset or continue from an invalid checkpoint; record deviations and restore or recreate the required conditions as appropriate. Automated fixtures and manual datasets need not be identical. Portable checkpoint backups can be introduced when Backup & Restore is implemented under 8H; this does not advance that milestone.

## 4. Coverage traceability and findings

Cross-reference each scenario with the relevant product requirement and existing automated test files or cases where applicable. Distinguish:

- **Vitest gap:** business logic, component behavior, validation or data integrity needs additional automated coverage.
- **Playwright gap:** an integrated browser workflow needs additional regression coverage.
- **Manual-only scenario:** visual appearance, native controls or physical-device interaction is best verified manually.
- **Already covered:** existing tests provide sufficient regression protection for the intended guarantee.

Coverage may be complementary across layers. A missing browser test does not automatically imply missing functional protection. Passing automated tests do not establish that every manual acceptance criterion is met.

Record the application version, browser/platform, device or viewport, interface mode, scenario ID and actual result for acceptance runs. Use SOLACE QA to collect unexpected observations with reproducible steps and supporting evidence. Observations are not automatically confirmed defects or roadmap items. Distinguish application defects, browser/platform compatibility issues, usability findings and coverage gaps during review.

Resolve acceptance-blocking functional risks before closing Step 9. Evaluate important regression improvements individually; preserve routine automated coverage expansion for the planned V1.5 testing milestone rather than automatically adding tests for every gap.

## 5. Documentation responsibilities and evolution

This document is the reusable testing specification, not the historical execution log. Record verification history in [TESTING_NOTES.md](TESTING_NOTES.md), confirmed UI issues and improvements in [UI_ISSUES.md](UI_ISSUES.md), and approved UI implementation patterns in [UI_CONVENTIONS.md](UI_CONVENTIONS.md). Maintain browser/platform-specific findings in BROWSER_COMPATIBILITY.md when that document is established. SOLACE QA preserves acceptance observations and evidence.

Extend the scenarios as subsequent features are implemented. Step 9 establishes the foundation; 8H can enable portable checkpoints; later feature milestones extend the scenarios; 8T and 8U can reuse the mature specification for usability and release acceptance; V1.5 can use accumulated coverage gaps to guide regression hardening. The existing [roadmap](ROADMAP.md) governs milestone scope and order.

During alpha, use isolated, disposable Garden test data and the current intended data contract. Do not introduce migrations or legacy compatibility solely to preserve obsolete alpha test records. Operational data integrity, including valid draft recovery and atomic operations, remains required. QA evidence is not disposable Garden test data. After public release, preserve real user data through deliberately planned migrations and recovery mechanisms.

### Periodic Dataset and Scenario Review Policy

Review the manual testing scenarios and standardized datasets at meaningful development milestones, particularly after substantial changes to persisted fields, data contracts or application workflows.

- Review existing records and scenarios before adding new ones.
- Revise, replace or remove obsolete and redundant sample data when it no longer represents the intended application.
- Represent newly implemented features and meaningful boundary cases without duplicating scenarios that already provide the needed coverage.
- Keep automated fixtures and manual testing datasets aligned with current intended contracts while allowing them to serve different testing purposes.
- Preserve stable scenario identifiers and historical testing results as scenarios evolve. Do not rewrite prior execution history.
- During alpha development, rebuild fixtures when appropriate rather than adding backward compatibility solely to preserve obsolete test records.

Record the dataset revision used for each acceptance run. A dataset review does not itself authorize changing historical results, production data contracts or the automated fixture consumed by existing tests.

The standardized reference dataset will be captured as `tests/fixtures/sample-data.json` after the Manual Testing Scenarios have been executed in the dedicated fixture-authoring Chromium profile. The existing `tests/fixtures/sample-garden.json` remains the automated-test fixture until a separate review and migration is approved. Do not create or replace the new dataset as part of the fixture-utility modernization task.

## 6. Manual Testing Scenarios

To be developed for Step 9. Prescribed datasets, scenario identifiers, requirements mappings and checkpoints will be added after review of the current implementation and existing fixtures.
