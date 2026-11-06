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
