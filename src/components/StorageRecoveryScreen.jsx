import { useRef, useState } from 'preact/hooks';
import { GardenBrand } from './GardenBrand.jsx';

export function StorageRecoveryScreen({ error }) {
	const diagnosticsField = useRef(null);
	const [copyStatus, setCopyStatus] = useState('');
	const diagnostics = JSON.stringify(error.diagnostics, null, 2);
	async function copyDiagnostics() {
		try {
			if (globalThis.navigator?.clipboard?.writeText) {
				await globalThis.navigator.clipboard.writeText(diagnostics);
			} else {
				diagnosticsField.current.focus();
				diagnosticsField.current.select();
				if (!document.execCommand('copy')) throw new Error('Copy unavailable');
			}
			setCopyStatus('Technical diagnostics copied.');
		} catch {
			diagnosticsField.current.focus();
			diagnosticsField.current.select();
			setCopyStatus('Select and copy the technical diagnostics below.');
		}
	}

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
				{error.diagnostics && <details class="mt-4">
					<summary>Technical diagnostics</summary>
					<p>No Garden records are included. Nothing is sent automatically.</p>
					<button type="button" class="app-button" onClick={copyDiagnostics}>Copy technical diagnostics</button>
					<p role="status">{copyStatus}</p>
					<label for="storage-diagnostics">Technical diagnostics to copy</label>
					<textarea id="storage-diagnostics" class="w-100" rows="10" readOnly value={diagnostics} ref={diagnosticsField} />
				</details>}
			</div>
		</main>
	);
}

