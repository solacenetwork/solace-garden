# Manual acceptance

SOLACE Garden uses scenario-based regression testing with standardized datasets
and requirements traceability for integrated manual acceptance. Scenario
records should use stable identifiers so results remain attributable across
milestones and dataset revisions.

The standardized reference dataset will be captured as
`tests/fixtures/sample-data.json` after the Manual Testing Scenarios have been
executed in the dedicated fixture-authoring Chromium profile. The existing
`tests/fixtures/sample-garden.json` remains the automated-test fixture until a
separate review and migration is approved.

## Periodic Dataset and Scenario Review Policy

Review manual scenarios and standardized datasets at meaningful development
milestones, particularly after substantial changes to persisted fields, data
contracts, or application workflows.

- Review existing records and scenarios before adding new ones.
- Revise, replace, or remove obsolete and redundant sample data when it no
  longer represents the intended application.
- Represent newly implemented features and meaningful boundary cases without
  duplicating scenarios that already provide the needed coverage.
- Keep automated fixtures and manual testing datasets aligned with current
  intended contracts, while allowing them to serve different test purposes.
- Preserve stable scenario identifiers and historical testing results when the
  current scenario evolves. Do not rewrite prior execution history.
- During alpha development, rebuild fixtures when appropriate instead of adding
  backward compatibility solely to preserve obsolete test records.

Record the dataset revision used for each acceptance run. A dataset review does
not itself authorize changing historical results, production data contracts, or
the automated fixture consumed by existing tests.
