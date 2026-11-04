# SOLACE Garden agent instructions

## Project boundaries

- Preserve the existing Preact 11 and Vite architecture. Keep rendering and interaction in Preact components, business rules in domain services/repositories, and storage-specific behavior behind the Dexie adapter boundary described in `docs/TECH_SPEC.md`.
- Make focused changes only. Avoid unnecessary dependencies, speculative abstractions, broad refactors, and unrelated formatting or cleanup.
- Use Bootstrap Icons for interface icons. Give icon-only controls an accessible name and do not rely on icons or color alone to communicate state.

## Bootstrap 6

- This project uses Bootstrap 6 conventions, not Bootstrap 5. Never assume Bootstrap 5 class names, markup, data attributes, Sass APIs, JavaScript exports, or component behavior still apply.
- Consult the repository-local official Bootstrap skills in `.agents/skills/` whenever relevant. For this Preact/Vite application, start with `bootstrap-vite`, `bootstrap-component`, `bootstrap-component-js`, and `bootstrap-v5-v6-migration`; use the color-system and utility-API skills when those concerns are in scope.
- Prefer the official versioned Bootstrap 6 documentation at <https://getbootstrap.com/docs/6.0/>. Treat third-party examples and training-memory patterns as secondary, especially while Bootstrap 6 is prerelease software.
- Verify component APIs, exports, types, markup, and Sass/CSS behavior against the installed `bootstrap@6.0.0-alpha.1` package in `node_modules/bootstrap` before implementation. Recheck this guidance whenever the pinned Bootstrap version changes.
- Bootstrap 6 replaces Offcanvas with Drawer. Use the `Drawer` export, `data-bs-toggle="drawer"`, `data-bs-dismiss="drawer"`, `.drawer*` classes, `*.bs.drawer` events, and a native `<dialog>` element. For a mobile bottom drawer, use `.drawer-bottom`; do not port the old Offcanvas API or render a renamed `<div>`.
- Integrate Bootstrap JavaScript with Preact lifecycle deliberately: initialize only after the element mounts, remove event listeners and call `dispose()` on unmount, and avoid duplicating Bootstrap-managed state in Preact unless the application needs it.

## Automated browser testing 

All headless browser processes and temporary development servers launched for testing must have explicit timeouts and reliable cleanup. Use try/finally or equivalent mechanisms to terminate browser instances and their child processes, including when tests fail or are interrupted. Never leave orphaned Chromium/Chrome processes running. Avoid concurrent browser instances unless necessary. Verify that test-owned processes have exited before reporting completion. Do not terminate unrelated user browser sessions.

You should favor lightweight tests over launching Chromium when a browser isn't actually necessary.