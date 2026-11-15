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

- `AppDrawer` provides a reusable Bootstrap 6 `Drawer` on a native `<dialog>`. The default Information trigger remains for optional secondary information, not a substitute for a fullscreen editor. Standard Mode also uses a custom trigger for its medium-screen navigation overlay.
- Required props: `id` (unique dialog ID) and `title` (visible heading and accessible name). `placement` accepts `top`, `end`, `bottom`, or `start`; omitted or invalid values use `bottom`. Start/end follow the document direction.
- `children` supplies drawer-body content, or a render function receiving `{ close }` for content with its own close action. The labelled header close control and footer Close button are always provided.
- `triggerLabel` defaults to `Information`. Optional `renderTrigger(triggerProps)` replaces the fixed Information button. Return a native button and spread **all** supplied props onto it: `ref`, `type`, `onClick`, `aria-controls`, `aria-expanded`, and `hidden`. Give the button visible text or an accessible name, visible focus, and a roughly 48px touch target. Do not override the hidden state or add Bootstrap data-toggle attributes that would open the same instance twice.
- The invoking trigger is hidden during opening/open/closing. Close during opening is deferred until `shown.bs.drawer`; focus returns to the original connected trigger after dismissal. Pending focus restoration is cancelled on reopen/unmount. Listeners are removed and the Bootstrap instance is disposed on unmount, including while open.
- The header Close control uses native `autofocus` for initial focus. After `shown.bs.drawer`, focus is moved there only if it remains outside the dialog (the pinned alpha’s visibility transition can prevent native autofocus). This is a one-time correction, not a focus trap. Bootstrap owns modal focus entry/trapping, Escape/backdrop dismissal, scrolling and reduced-motion transitions. Do not add a second focus trap. Consumers must unmount/remount the drawer to change placement while it is in use (Bootstrap initializes swipe direction on first opening).
- Top/bottom are full-width at roughly 45% of dynamic viewport height on mobile and 40% at `md` and up, with `vh` fallback. Side drawers are full-height and default to 300px wide, constrained by Bootstrap to the viewport. Surface, close controls, inner scrolling and safe-area spacing are shared; corner rounding faces the content area.
- Override dimensions with `--app-drawer-height` or `--app-drawer-width` on the dialog via CSS (for example `#garden-info`) or the optional `style` prop. Defaults remain unchanged for existing bottom-drawer callers. Reassess dimensions with real content before broad reuse.

```jsx
<AppDrawer id="garden-info" title="Garden information">
  <p>Contextual information</p>
</AppDrawer>

<AppDrawer
  id="custom-panel"
  title="Panel"
  placement="start"
  style={{ '--app-drawer-width': '280px' }}
  renderTrigger={(triggerProps) => (
    <button class="icon-control" {...triggerProps} aria-label="Open panel">
      <i class="bi bi-list" aria-hidden="true"></i>
    </button>
  )}
>
  {({ close }) => <button type="button" onClick={close}>Done</button>}
</AppDrawer>
```

## Standard Mode navigation

- `StandardNavigation` resolves `standardPrimaryIds` through the destination registry: Gardens, Journal, Gallery (`photos`), PlantDB (`plants`). Display overrides stay local to navigation. Templates is a nested secondary link directly under Gardens, omitted from the iconbar. Home keeps its independent legacy configuration.
- At `lg` (1024px) and above, the expanded sidebar has a fixed 300px width/flex basis. At `md` (768px) through 1023px, the iconbar has a fixed 60px total width, four direct 48px icon links with accessible names/titles, and an explicit Open navigation button. Current links use `findRoute(path)`, `aria-current="page"`, and a visible dot in addition to color.
- The medium expansion uses one `AppDrawer` with `placement="start"`, title Navigation, and `--app-drawer-width: 300px`. Its total width overlays the iconbar and 240px of workspace; it never changes workspace dimensions. Forward all native trigger props. Normal link activation calls the render-function `close()` without preventing routing; modified activation leaves the Drawer open.
- Match-media presentation changes unmount the Drawer, allowing AppDrawer/Bootstrap to release native modal state. If navigation held focus, restore it to the corresponding visible link (Gardens when a secondary destination has no icon). Entering the temporary small presentation expands it before focusing. If StandardNavigation itself disappears, the logo is the focus fallback. This handles removed controls only; AppDrawer owns ordinary dismissal and focus restoration, with no additional focus trap.
- Below 768px, manually selected Standard retains the full-width Browse workspaces collapsible navigation until Step 3D. Automatic/Simple/Standard resolution and persistence remain independent of navigation presentation. The generic global About this workspace disclosure is removed; contextual information belongs to feature pages.
