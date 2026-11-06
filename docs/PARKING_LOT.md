# Parking Lot

New ideas that don't belong in technical specifications or the roadmap can be documented here so they aren't forgotten.

After the current A–F implementation work, we could do a documentation cleanup alongside the UI sweep:
1. Keep ROADMAP focused on committed V1 milestones and a concise future-direction summary.
2. Move detailed speculative features and unresolved research into the appropriate parking lot.
3. Preserve relevant technical reasoning and links so information isn't lost.
4. Avoid treating tentative version numbers as commitments.


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
