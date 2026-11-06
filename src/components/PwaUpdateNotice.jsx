import { useEffect, useRef, useState } from 'preact/hooks';
import { registerSW } from 'virtual:pwa-register';

export function PwaUpdateNotice() {
	const updateServiceWorker = useRef(null);
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const [updating, setUpdating] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		let active = true;

		updateServiceWorker.current = registerSW({
			onNeedRefresh() {
				if (active) {
					setError('');
					setUpdateAvailable(true);
				}
			},
			onRegisterError(registrationError) {
				console.error('SOLACE Garden service worker registration failed.', registrationError);
			},
		});

		return () => {
			active = false;
			updateServiceWorker.current = null;
		};
	}, []);

	async function applyUpdate() {
		if (!updateServiceWorker.current) {
			return;
		}

		setUpdating(true);
		setError('');

		try {
			await updateServiceWorker.current(true);
		} catch (updateError) {
			console.error('SOLACE Garden update activation failed.', updateError);
			setUpdating(false);
			setError('The update could not be applied. You can keep working and try again later.');
		}
	}

	if (!updateAvailable) {
		return null;
	}

	return (
		<aside
			class="pwa-update-notice theme-primary"
			role="status"
			aria-live="polite"
			aria-atomic="true"
			aria-labelledby="pwa-update-title"
		>
			<div class="pwa-update-notice__message">
				<i class="bi bi-arrow-repeat" aria-hidden="true"></i>
				<div>
					<strong id="pwa-update-title">An update is ready</strong>
					<span>Apply it when you are ready to reload SOLACE Garden.</span>
					{error && <span class="pwa-update-notice__error">{error}</span>}
				</div>
			</div>
			<div class="pwa-update-notice__actions">
				<button
					class="btn-text pwa-update-notice__button"
					type="button"
					onClick={() => setUpdateAvailable(false)}
					disabled={updating}
				>
					Later
				</button>
				<button
					class="btn-solid theme-primary pwa-update-notice__button"
					type="button"
					onClick={applyUpdate}
					disabled={updating}
				>
					{updating ? 'Updating…' : 'Update now'}
				</button>
			</div>
		</aside>
	);
}
