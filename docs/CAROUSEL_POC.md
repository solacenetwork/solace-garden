# Bootstrap 6 card Carousel proof of concept

**Status:** Step 4.5A proof of concept and Step 4.5B production component accepted after automated and physical-device testing (November 15, 2026). Step 5 Home uses the production component; its page-level physical-device acceptance remains pending.
**Tested version:** `bootstrap@6.0.0-alpha.1`
**Development URL:** `/dev/carousel`

## Purpose and isolation

This experiment evaluates the pinned Bootstrap 6 Carousel as a foundation for the horizontal card filmstrips proposed for Current Gardens, Previous Gardens, Gallery images, and unfinished Garden drafts. It is not the final `CardCarousel` component.

The page is intercepted only when `import.meta.env.DEV` is true. It renders outside the normal application shell before storage initialization, is absent from `applicationRoutes`, does not appear in navigation, and does not initialize IndexedDB. The production build contains no prototype JavaScript/CSS chunk, route string, sample content, or PWA precache entry. The existing temporary public assets remain governed by the project's existing `public/assets/temp` handling.

The accepted Step 4.5A page used six independent instances:

- eight static Garden cards, including long titles, missing subtitles, and missing images;
- eight static Gallery cards alternating `object-fit: cover` and `contain`;
- separate zero-, one-, two-, and three-card edge cases.

## Architecture tested

Each instance uses Bootstrap's required `.carousel`, `.carousel-inner`, and `.carousel-item` structure. Preact explicitly constructs:

```js
new Carousel(element, {
  autoplay: false,
  ends: 'stop',
  keyboard: true,
  pause: false,
});
```

Previous and Next are native buttons using Bootstrap 6's `data-bs-target` and `data-bs-slide` data API. Explicit initialization is preferable for this application because Preact can deterministically call `dispose()` during cleanup. The data API controls successfully reuse that explicit instance.

The component reinitializes when collection membership changes. This is necessary because the pinned Carousel observes the items present during construction but does not watch DOM mutations. A local `ResizeObserver` measures whether the rail actually overflows and hides the entire control group when it does not; Bootstrap disables controls at scroll boundaries but does not itself suppress unnecessary controls for every fully fitting short collection.

Responsive multi-item layout uses Bootstrap's `--bs-carousel-items`, `--bs-carousel-items-gap`, and scroll-snap engine. Container queries, rather than viewport-only assumptions, select approximately 2, 2.5, 3.5, 4.5, or 6 items based on the available rail width. Fractional item counts provide a partial-card affordance where useful.

## Sample assets

No files were copied, changed, downloaded, or optimized. The Gallery prototype references:

- `/assets/temp/stock-images/card-demo-raised-beds.jpg`
- `/assets/temp/stock-images/card-demo-flower-beds.jpg`
- `/assets/temp/stock-images/card-demo-fruit-trees.jpg`
- `/assets/temp/stock-images/card-demo-container-garden.jpg`
- `/assets/temp/stock-images/card-demo-in-ground.jpg`
- `/assets/temp/stock-images/card-demo-edible-bushes.jpg`
- `/assets/temp/stock-images/pexels-elle-hughes-2696064.jpg`
- `/assets/temp/stock-images/pexels-sarah-chai-7262863.jpg`

All available stock photographs inspected for this test are landscape-oriented. Crop and contain behavior was tested, but a true portrait source was not available and therefore remains unverified.

## Automated and headless browser findings

Vitest covers prototype rendering, unique identities, zero-to-three-card collections, public asset paths, explicit Bootstrap configuration, overflow measurement, collection-membership lifecycle dependency, cleanup/disposal, absence from production routes/navigation, and no IndexedDB access.

Headless Chromium tested widths 320, 375, 576, 767, 768, 900, 1024, 1280, and 1440 CSS pixels:

| Width | Fully visible | Partial next card | Observed card width |
| --- | ---: | --- | ---: |
| 320 | 2 | No | 134px |
| 375 | 2 | No | 154px |
| 576 | 2 | No | 254px |
| 767–900 | 3 | Yes | 191–227px |
| 1024 | 4 | Yes | 200px |
| 1280 | 6 | No | 187px |
| 1440 | 6 | No | 213px |

The browser checks also confirmed:

- no document-level horizontal overflow;
- equal-height Garden cards despite missing fields and long labels;
- independent instances (moving Gardens did not move Gallery);
- Previous disabled at the beginning and Next disabled at the end;
- `ends: 'stop'` with no looping, autoplay, blank trailing area, or inaccessible last card;
- mandatory snapping settled exactly on a card boundary;
- zero-, one-, and two-card collections hid controls at every tested width; three-card controls appeared only when that local rail overflowed;
- all eight image assets loaded with natural dimensions and the requested cover/contain treatments;
- card activation updated only the local accessible status and did not navigate or alter history;
- Tab reached all eight Garden links in DOM order, scrolled later focused cards into view, and did not trap focus;
- control activation and Carousel Arrow keys moved the rail, with visible card focus;
- a vertical wheel gesture over the rail moved the page without changing horizontal rail position;
- reduced-motion emulation moved immediately and never enabled autoplay;
- portrait/landscape viewport changes and emulated 200% page scale retained all six carousels without page overflow;
- the development page made zero observed IndexedDB calls and produced no runtime exceptions.

The headless touch-scroll synthesis did not move the native rail, so it did not constitute a swipe result. Chrome's normal native scroll-snap behavior was verified with programmatic scrolling, mouse controls, keyboard controls, and wheel/page interaction. Subsequent physical-phone acceptance confirmed horizontal swiping, natural vertical page scrolling, and card activation behavior for the proof of concept. Physical-device regression testing of the reusable Step 4.5B component remains a separate manual acceptance step.

## Bootstrap and Preact limitations

1. Bootstrap provides the scroll-snap engine and boundary state, but the application must choose responsive item counts and card sizing.
2. Fully fitting short collections need application-level overflow measurement if controls must disappear rather than merely become disabled.
3. A changed collection must dispose and recreate the instance (or deliberately manage observers); the tested alpha does not automatically observe added or removed `.carousel-item` elements.
4. Fractional `--bs-carousel-items` values work for a partial-card affordance, but Step 4.5B should treat the chosen values as product layout policy, not Bootstrap defaults.
5. The stock photos did not provide a portrait-ratio source, and headless automation cannot replace physical swipe regression testing.

## Recommendation for Step 4.5B

**Adapt Bootstrap 6 Carousel as the foundation.** The pinned implementation naturally supports multiple visible cards, native scrolling and snapping, independent instances, stop-at-ends controls, keyboard movement, and reduced motion. A small production wrapper should own explicit construction/disposal, responsive `--bs-carousel-items` policy, short-collection overflow detection, and reinitialization when collection membership changes.

No additional carousel dependency is warranted by the findings. The prototype itself was not promoted into production; Step 4.5B extracted only the generic lifecycle, scrolling, control, responsive, and accessibility behavior while leaving sample content in the development harness.

## Step 4.5B production component

Step 4.5B carries the accepted behavior into `src/components/CardCarousel.jsx` and `CardCarousel.css`. The public API is intentionally generic: required `label` and `children`, plus optional `id` and `className`. Parents own records, loading, errors, filtering, sorting, empty-state copy, and the child card markup. The component owns only the Bootstrap rail, controls, responsive sizing, measurable overflow, and lifecycle.

The production implementation differs from the original proof-of-concept wrapper in these ways:

- Preact's stable `useId()` supplies a unique instance ID when a caller does not provide one. Both controls target that instance only.
- Children are normalized with `toChildArray()` and wrapped in Bootstrap `.carousel-item` elements. Supplied Preact keys become wrapper keys; no Garden-specific identity is required.
- A direct-child `MutationObserver` detects actual slide additions, removals, and keyed DOM reordering. It disposes and recreates Bootstrap locally because the pinned alpha does not observe collection mutations. Equivalent parent arrays and content-only changes inside an existing slide do not trigger reconstruction.
- A local `ResizeObserver` updates whether controls are needed. A window resize listener is installed only as a fallback when `ResizeObserver` is unavailable.
- Structural carousel elements add no tab stop. Keyboard access comes from the caller's interactive card content and native Previous/Next buttons.
- Container queries now live with the reusable component and apply to its actual inline size. The development harness includes a constrained-width instance for testing inside wide pages and future sidebars.
- Zero children render a valid empty rail with hidden controls. Empty-state content remains the parent's responsibility.

The `/dev/carousel` page now renders the production `CardCarousel` for all original samples and adds a seventh constrained instance with controls for membership, ordering, content-only, and unrelated-parent updates. The development entry returns before importing storage, so the harness does not load Dexie or access IndexedDB. Development sample data and temporary image paths remain isolated from production component code.
