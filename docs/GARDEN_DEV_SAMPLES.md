# Garden browsing acceptance samples (8E2)

Use a disposable alpha browser profile. With `npm run dev` running, open the
application, then run this once in its browser developer console:

```js
const { seedGardenSamples } = await import('/src/dev/seedGardens.js');
const samples = await seedGardenSamples();
console.table(samples.map(({ id, name, subtitle, status }) => ({ id, name, subtitle, status })));
```

Navigate to `/gardens` (reload if already there). Current Gardens contains two
Tomatoes records, with South Garden and Patio subtitles, in Planned and Active
states. Previous Gardens contains Completed Summer Greens and Archived Herbs.
The Planned Garden has no selected types, project dates, description, or Notes. Patio includes
description, a project start date, and embedded Garden Notes. Location labels use
the saved built-in Location, including any renamed label.

Open each Garden, reload its detail URL, and try browser Back/Forward. In either
interface mode, check that Settings returns to Gardens. A malformed ID such as
`/gardens/not-an-id` and an unused UUID should show Garden not found; a storage
read failure should show a Retry action instead. Overview and detail are read-only.

The helper is explicitly invoked and guarded by Vite development mode; nothing
seeds Gardens on startup. Each invocation adds four new records without changing
existing Gardens. It creates records through the 8E1 service, then applies fixture
statuses only to those new IDs through an isolated development adapter operation.
This is not an application lifecycle API. No sample helper is included in the
production application entry graph or deployed build. Use a disposable profile
rather than expecting an in-app deletion workflow, which belongs to 8E7.
