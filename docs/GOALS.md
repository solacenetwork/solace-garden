# Goals for SOLACE Garden

Garden should remain simple and useful for ordinary gardeners while allowing specialized functionality to be added without unnecessarily expanding the core application.

This is a **living goals document**. Sections marked *To discuss* are not yet approved MVP requirements. Implementation details belong in `TECH_SPEC.md`, and delivery milestones belong in `ROADMAP.md`.

---

## 1. Core Purpose

SOLACE Garden is a garden-management application focused primarily on food plants. It should serve gardeners with a wide range of growing spaces, from a single container on an apartment porch or balcony to a multi-acre outdoor garden.

Its purpose is to help gardeners **plan, organize, document, maintain, and evaluate** their gardens during a growing season and across successive years.

The application should remain practical and approachable without requiring specialized equipment, advanced technical knowledge, or participation in optional community features.

## 2. MVP

The MVP should support a coherent garden-management workflow while keeping individual features as simple as possible. A feature's historical presence in the JavaScript or PHP prototypes does not automatically make its full historical implementation a v1 requirement.

### 2.1 Garden Creation and Management

- Users can create and manage gardens representing individual growing seasons or garden projects.
- Each garden has its own identity, information, and lifecycle; historical activity remains associated with that garden record.
- The model should accommodate gardens whose layout stays the same across years as well as gardens whose size or configuration changes significantly.
- Users can create a garden from scratch or start from a saved garden template.
- Garden creation should be approachable rather than requiring all optional tools and settings to be configured at once.

**Scope boundary:** We are not requiring a single permanent physical-garden record containing every growing season. Reusable templates provide continuity without merging separate seasons' histories.

### 2.2 Garden Templates

Garden v1 will support **independently named, reusable garden templates**.

A user may create a new garden from scratch or select an existing template in the Create Garden wizard. A template provides a starting configuration for a new garden; it is not itself a historical garden record.

Users should be able to:

- Save an existing garden configuration as a named template.
- Select a saved template while creating a new garden.
- Start from scratch without using a template.
- Modify a garden created from a template without changing the original template.
- Reuse the same template for multiple gardens or growing seasons.
- Maintain templates independently of gardens created from them.

Journal entries, harvest records, completed tasks, and other historical activity should **not** be copied into a new garden when applying a template.

**Deferred detail:** Exactly which configuration fields are retained in templates, and how template editing and deletion work, will be defined in `TECH_SPEC.md`.

### 2.3 Plant Research (PlantDB)

*To discuss.* **Existing boundary decision:** PlantDB is an independent project; Garden v1 must provide access to it. The access/integration mechanism remains undecided.

### 2.4 Garden Maps

*To discuss.* Determine the simplest v1 way to represent a garden layout without rebuilding the historical drawing editor.

### 2.5 Growing Season Tracking

*To discuss.* Define minimum plant records, planting details, and ongoing observations.

### 2.6 Lists and Notes

*To discuss.* To-Do, To-Buy (shopping), and simple Notes.

### 2.7 Garden Journal

*To discuss.* Record the growing season with dated journal entries.

### 2.8 Photos and Gallery

*To discuss.* Attach and manage photographs associated with gardens.

### 2.9 Current and Previous Gardens

*To discuss.* Quick access to active gardens and earlier garden records.

### 2.10 Search

*To discuss.* Search current and historical gardens.

### 2.11 Harvest Tracking

*To discuss.* Record harvest yields associated with gardens and plants.

### 2.12 Calendar and Reminders

*To discuss.* Gardening events and reminders, such as watering, weeding, and pest control.

## 3. Post-MVP

Valuable capabilities that need not be included in the first release. **To discuss** after the minimum implementation of each MVP feature has been agreed upon.

## 4. Initial Data Handling

What gets stored, where it lives, and how people access it during Phase 1. **To discuss.**

## 5. Future Data Handling

Local-first operation, synchronization, portability, privacy, and eventually household-hosted services. **To discuss.**
