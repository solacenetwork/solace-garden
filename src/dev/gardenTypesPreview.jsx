import { render } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { GardenTypeSelector } from '../components/GardenTypeSelector.jsx';
import { StorageProvider, useStorage } from '../context/StorageContext.jsx';
import { createGardenTypesService } from '../services/gardenTypes.js';
import { initializeStorage } from '../storage/index.js';
import '../style.css';

function Preview() {
	const storage = useStorage();
	const service = useMemo(
		() => createGardenTypesService(storage.repositories.gardenTypes),
		[storage],
	);
	const [types, setTypes] = useState([]);
	const [selectedIds, setSelectedIds] = useState([]);
	const [error, setError] = useState('');

	useEffect(() => {
		service.list().then(setTypes).catch(() => {
			setError('The seeded Garden Types could not be loaded.');
		});
	}, [service]);

	return (
		<main class="container py-8" style={{ maxWidth: '72rem' }}>
			<h1>Garden Type selector preview</h1>
			<p>This development-only page uses the real seeded Garden Type catalog.</p>
			{error ? <p role="alert">{error}</p> : (
				<>
					<GardenTypeSelector
						types={types}
						selectedIds={selectedIds}
						onChange={setSelectedIds}
					/>
					<p class="mt-5">
						<strong>Selected IDs:</strong>{' '}
						<code>{JSON.stringify(selectedIds)}</code>
					</p>
					<hr class="my-7" />
					<GardenTypeSelector
						types={types}
						selectedIds={['in-ground', 'outdoor']}
						onChange={() => {}}
						disabled
						legend="Disabled example"
					/>
				</>
			)}
		</main>
	);
}

async function startPreview() {
	const storage = await initializeStorage();
	const root = document.getElementById('app');
	if (storage.status !== 'ready') {
		render(<main><h1>Storage recovery required</h1><p>{storage.error.message}</p></main>, root);
		return;
	}

	globalThis.addEventListener('pagehide', () => storage.close(), { once: true });
	render(
		<StorageProvider storage={storage}>
			<Preview />
		</StorageProvider>,
		root,
	);
}

void startPreview();
