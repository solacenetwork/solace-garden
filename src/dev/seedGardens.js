// Explicit, disposable alpha fixtures only. Never imported by application startup.
export async function seedGardenSamples({ dependencies } = {}) {
	if (!import.meta.env.DEV) {
		throw new Error('Garden samples are available only in Vite development mode.');
	}
	const [
		{ initializeDexieStorage }, { createGardenDatabase },
		{ createGardensService }, { DEFAULT_LOCATION_ID },
	] = await Promise.all([
		import('../storage/dexie/initializeDexieStorage.js'),
		import('../storage/dexie/gardenDatabase.js'),
		import('../services/gardens.js'),
		import('../storage/locationValidation.js'),
	]);
	const storage = await initializeDexieStorage({ dependencies });
	if (storage.status !== 'ready') throw new Error('Local storage must be ready before adding samples.');
	let database;
	try {
		const service = createGardensService(storage.repositories.gardens);
		const samples = [
			{ name: 'Tomatoes', subtitle: 'South Garden' },
			{
				name: 'Tomatoes', subtitle: 'Patio', typeIds: ['container', 'outdoor'],
				description: 'A small collection of tomatoes near the kitchen.',
				startDate: '2026-02-01', notes: 'Planning began before planting.\nKeep observations here.',
			},
			{ name: 'Summer Greens', typeIds: ['in-ground', 'outdoor'], startDate: '2026-03-01', endDate: '2026-09-30' },
			{ name: 'Herbs', subtitle: 'Previous project', typeIds: ['indoor'] },
		];
		const records = [];
		for (const sample of samples) {
			records.push(await service.create({ locationId: DEFAULT_LOCATION_ID, ...sample }));
		}
		// Isolated fixture setup, not a public lifecycle service. Only newly created
		// sample IDs are touched; normal application operations cannot do this.
		database = createGardenDatabase(storage.databaseName, dependencies);
		await database.open();
		const table = database.table('gardens');
		await database.transaction('rw', table, async () => {
			for (const [index, status] of ['planned', 'active', 'completed', 'archived'].entries()) {
				await table.update(records[index].id, { status, isClosed: status === 'archived' });
			}
		});
		return await Promise.all(records.map(({ id }) => service.getById(id)));
	} finally {
		database?.close();
		storage.close();
	}
}
