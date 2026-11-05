# SOLACE Garden UI conventions

These focused conventions capture patterns demonstrated by the current shell. They are not a comprehensive design system; feature-specific components should be added only when a real workflow needs them.

## Controls and focus

- Use native links for navigation and native buttons for actions. Do not add `tabindex` to elements that are already interactive.
- Icon-only controls need an accessible name through `aria-label` or visually hidden text. The shared `.icon-control` convention provides a 48 × 48 CSS-pixel target; the visible icon remains `aria-hidden="true"`.
- All custom interactive controls use a visible `:focus-visible` outline based on `--sg-color-focus`. Do not remove native focus behavior unless an equivalent visible treatment replaces it.
- Bootstrap Icons are the application icon set. State and meaning must also be communicated through text or accessible naming rather than color or icon shape alone.

## Dialogs and fullscreen editors

- Use Bootstrap 6 `Dialog` with a native `<dialog>`, not Bootstrap 5 Modal markup. Initialize after mount, remove application listeners, and call `dispose()` on unmount.
- Focused editors may use `md-down:dialog-fullscreen`; wider screens may use a conventional centered Dialog.
- The upper-right `.btn-close` is an empty element with an accessible label and an approximately 48 × 48 target. It always means Close/Cancel, never Save.
- Preserve the Plants quick-close guard: if Close is requested during the opening transition, hide immediately after `shown.bs.dialog` rather than dropping the request.

## Close, Save, and unsaved changes

- Close and Cancel return to the prior working context. They must not save or silently discard dirty data.
- Future data-entry screens use explicit Save/Done actions. Save stays disabled when content is invalid or unchanged, stays available while persistence is pending, and reports success only after the repository confirms the write.
- Dirty screens require confirmation before route changes or destructive close. Add `beforeunload` only while dirty, recognizing that browsers may suppress it. Implement this with a real editor workflow rather than a speculative global state manager.

## Feedback states

- Empty states explain what is absent and offer the next meaningful action when one exists.
- Loading states identify the content being loaded and use `aria-live="polite"` only when an announcement is helpful; avoid indefinite spinners without text.
- Recoverable errors keep the user's input, state what failed in plain language, and provide a retry action where meaningful. Validation errors are associated with their fields.
- Create a shared feedback component only after a real data-backed page demonstrates repeated empty, loading, or error markup.

## Contextual Drawer

- `AppDrawer` is optional secondary information, not primary navigation and not a substitute for a fullscreen editor.
- It uses Bootstrap 6 `Drawer` on a native `<dialog>`, restores focus to its trigger, hides that trigger while opening/open/closing, and disposes its Bootstrap instance on unmount.
- The prototype uses a bottom placement at roughly 45% of the dynamic viewport on mobile and 40% on wider screens, with `vh` fallback and safe-area-aware padding. Reassess the height and trigger placement with real contextual content before broad reuse.
