export function createDraftAutosave({
	write,
	onStatus,
	delay = 400,
	setTimer = globalThis.setTimeout,
	clearTimer = globalThis.clearTimeout,
}) {
	let timer = null;
	let pendingValue;
	let pendingNeedsRetry = false;
	let generation = 0;
	let writeChain = Promise.resolve();

	function flush() {
		if (timer !== null) {
			clearTimer(timer);
			timer = null;
		}
		if (pendingValue === undefined) {
			return writeChain;
		}

		const value = pendingValue;
		const writeGeneration = generation;
		pendingValue = undefined;
		if (pendingNeedsRetry) {
			pendingNeedsRetry = false;
			onStatus('saving');
		}
		writeChain = writeChain.catch(() => undefined).then(async () => {
			if (writeGeneration !== generation) {
				return;
			}
			try {
				await write(value);
				if (writeGeneration === generation && pendingValue === undefined) {
					onStatus(value === null ? 'all-saved' : 'draft-saved');
				}
			} catch (error) {
				if (writeGeneration === generation) {
					if (pendingValue === undefined) {
						pendingValue = value;
						pendingNeedsRetry = true;
					}
					onStatus('error', error);
				}
			}
		});
		return writeChain;
	}

	return Object.freeze({
		schedule(value) {
			generation += 1;
			pendingValue = value;
			pendingNeedsRetry = false;
			onStatus('saving');
			if (timer !== null) {
				clearTimer(timer);
			}
			timer = setTimer(flush, delay);
		},

		flush,

		async stop() {
			generation += 1;
			pendingValue = undefined;
			pendingNeedsRetry = false;
			if (timer !== null) {
				clearTimer(timer);
				timer = null;
			}
			await writeChain.catch(() => undefined);
		},
	});
}
