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
- Integrate Bootstrap JavaScript with Preact lifecycle deliberately: initialize only after the element mounts, remove event listeners and call `dispose()` on unmount, and avoid duplicating Bootstrap-managed state in Preact unless the application needs it.

## Testing responsibilities

- Codex should run focused and full **Vitest** tests as appropriate to its implementation changes, plus the production build when relevant.
- **Playwright end-to-end testing is handled by the developer** (or eventually GitHub automation), not by Codex. Do not create, modify, or run Playwright/browser E2E tests as part of normal Codex milestones.
- **Exception:** If a specific defect cannot reasonably be diagnosed without browser-level testing, Codex may use a narrowly scoped browser test for troubleshooting. Explain why it is necessary and keep it limited to the defect. Apply explicit timeouts, clean up any test-owned browsers and servers, and leave unrelated browser sessions untouched.
- Report which Vitest/build checks ran and their results. State explicitly when Playwright was not run; do not imply E2E acceptance from unit tests alone.

### Alpha Development Data Policy

SOLACE projects follow a strict distinction between disposable alpha development data and persistent user data after release.

**During alpha development:**
- All local test data, including IndexedDB/Dexie records, is expendable.
- The developer routinely clears browser storage and starts fresh when data contracts change.
- Do not introduce backward-compatibility code, migrations, legacy defaults, or recovery mechanisms solely to preserve obsolete alpha test data.
- Implement the current intended data contract directly, removing outdated assumptions and code.
- Schema version changes are not automatically required when only stored record properties change and IndexedDB stores/indexes remain unchanged.
- Favor clean, maintainable implementation over compatibility with previous alpha builds.

**After public release:**
- Treat real user data as persistent and valuable.
- Plan and version incompatible data/schema changes deliberately.
- Preserve user data through appropriate migrations and recovery mechanisms.

**Important:** Do not confuse protecting currently valid data during normal operations (autosave, draft recovery, atomic transactions) with supporting obsolete alpha data formats. Operational data integrity remains required, even during alpha.

When discussing or writing Codex prompts, apply this policy automatically unless the developer explicitly overrides it.

### Documentation scope

Treat `docs/` as the authoritative source for current project documentation.

Ignore `docs/historical/` during normal development, research, and implementation. It contains obsolete research and archived material that must not be treated as current requirements.

Consult historical files only when explicitly requested.