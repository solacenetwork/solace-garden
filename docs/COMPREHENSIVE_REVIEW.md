# Comprehensive Review: SOLACE Garden

This is a historical audit, not a design exercise.

### Historical Sources

The comprehensive review will examine the following sources:

| Source | Description | Review Status |
|---|---|---|
| Original PHP Garden application | Historical PHP implementation and user interfaces | Pending |
| MariaDB database and PlantDB | Original database schemas, relationships, and available historical data | Pending |
| JavaScript Garden application | Separate historical implementation | Pending |
| Paper notebooks | Handwritten feature ideas, sketches, and planning notes | Pending |
| Previous SOLACE conversations | Historical discussions, proposed features, and design decisions | In progress |

Features will be classified according to the evidence available from each source.

Where implementation cannot be verified, the feature will remain classified as **Unknown** or **Proposed**, rather than being assumed to exist.

<br>

### Implementation Status

| **Classification** | **Meaning** |
|---|---|
| Implemented | Exists in code and appears functional |
| Partial | Some implementation exists, but functionality is incomplete |
| Broken | Implemented, but not working correctly |
| Proposed | Documented or discussed, but never implemented |
| Unknown | Needs further inspection or testing |

For every identified feature, we can record its purpose, interface, database dependencies, implementation location, limitations, and original design reasoning. That will help us avoid accidentally discarding useful work—or carrying forward features just because they existed.

<br>

### Future Disposition

| **Historical status** | **Future disposition** |
|---|---|
| Implemented | Retain |
| Partial | Redesign |
| Broken | Combine with another feature |
| Proposed | Defer |
| Unknown | Retire |

A feature's implementation status describes what existed.

Its disposition describes what we intend to do with it.

<br>

### Historical Feature: Online/Offline Status Indicator

**Original implementation:** A small status indicator dot in the lower-right corner of the Garden application, carried forward into subsequent application iterations.

**Original intent:** Communicate online/offline connectivity status to the user.

**Observed concern:** The indicator provides limited practical value by itself. It does not establish how application data is stored, retrieved, or synchronized when network connectivity is unavailable.

**Underlying requirement:** Determine how Garden handles reading, creating, updating, and preserving user data during connectivity interruptions.

**Review decision:** Do not automatically carry the status indicator into the new application simply because it appeared in previous versions.

**Questions for the Goals document:**
- Which Garden features should work offline?
- Where should data be saved during offline operation?
- What happens to changes awaiting synchronization?
- How should the application handle synchronization failures or conflicts?
- What feedback does the user actually need?

**Status:** Historical UI feature; retain, redesign, or remove after the data-handling architecture is established.

### Historical Feature: Directory-Based Garden Plugins

**Original implementation:** One iteration of Garden organized optional functionality into subdirectories under `garden/plugins/`. The presence of a plugin directory indicated that the plugin was installed. There was no dedicated plugin management system.

**Original plugin concepts:**
- Plant Database (default-installed)
- Companion Plants
- Hydroponics
- Irrigation
- Light Manager
- Pest Control
- Seed Manager

**Additional design objective:** Allow third-party developers to create specialized Garden functionality without modifying the core application.

**Examples of potential third-party plugins:**
- Tractor and agricultural equipment maintenance
- Harvest tracking and yield analysis
- Crop curing, drying, and processing
- Specialized cultivation and agricultural workflows

**Architectural principle:** Garden should provide a useful common foundation while allowing specialized functionality to remain separate.

**Implementation status:** The historical directory-based organization existed, but individual plugin functionality and any extension interfaces require source-code review.

**Future consideration:** Determine whether the new Garden architecture should support optional built-in modules, third-party extensions, or both. A formal plugin API and management system are not currently established MVP requirements.