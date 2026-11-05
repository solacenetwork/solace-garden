import { GardenBrand } from './GardenBrand.jsx';

export function StorageRecoveryScreen({ error }) {
	return (
		<main class="storage-recovery container py-5">
			<div class="storage-recovery__panel mx-auto p-4 p-md-5">
				<GardenBrand />
				<i class="bi bi-exclamation-triangle storage-recovery__icon" aria-hidden="true" />
				<h1 class="h2">{error.title}</h1>
				<p>{error.message}</p>
				<p class="text-body-secondary">{error.action}</p>
				<button
					type="button"
					class="app-button storage-recovery__retry"
					onClick={() => globalThis.location.reload()}
				>
					<i class="bi bi-arrow-clockwise" aria-hidden="true" />
					Retry
				</button>
			</div>
		</main>
	);
}

