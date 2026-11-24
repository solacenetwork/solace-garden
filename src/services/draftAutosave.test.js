import { describe, expect, it, vi } from 'vitest';
import { createDraftAutosave } from './draftAutosave.js';

describe('Draft autosave failure recovery', () => {
	it('retries a failed snapshot without another field change and clears the error status', async () => {
		const write = vi.fn()
			.mockRejectedValueOnce(new Error('temporary failure'))
			.mockResolvedValueOnce(undefined);
		const statuses = [];
		const autosave = createDraftAutosave({ write, onStatus: (...status) => statuses.push(status) });

		autosave.schedule('unsaved');
		await autosave.flush();
		await autosave.flush();

		expect(write.mock.calls).toEqual([['unsaved'], ['unsaved']]);
		expect(statuses.map(([status]) => status)).toEqual([
			'saving', 'error', 'saving', 'draft-saved',
		]);
	});

	it('keeps repeatedly failing data available for a later explicit retry', async () => {
		const write = vi.fn()
			.mockRejectedValueOnce(new Error('first failure'))
			.mockRejectedValueOnce(new Error('second failure'))
			.mockResolvedValueOnce(undefined);
		const autosave = createDraftAutosave({ write, onStatus() {} });

		autosave.schedule({ name: 'Retain me' });
		await autosave.flush();
		await autosave.flush();
		await autosave.flush();

		expect(write).toHaveBeenCalledTimes(3);
		expect(write.mock.calls.map(([value]) => value.name)).toEqual([
			'Retain me', 'Retain me', 'Retain me',
		]);
	});

	it('lets a newer snapshot supersede an older in-flight failure', async () => {
		let rejectOlder;
		const write = vi.fn()
			.mockImplementationOnce(() => new Promise((resolve, reject) => { rejectOlder = reject; }))
			.mockResolvedValueOnce(undefined);
		const statuses = [];
		const autosave = createDraftAutosave({ write, onStatus: (status) => statuses.push(status) });

		autosave.schedule('older');
		const olderFlush = autosave.flush();
		await vi.waitFor(() => expect(write).toHaveBeenCalledOnce());
		autosave.schedule('newer');
		const newerFlush = autosave.flush();
		rejectOlder(new Error('older failed'));
		await Promise.all([olderFlush, newerFlush]);
		await autosave.flush();

		expect(write.mock.calls.map(([value]) => value)).toEqual(['older', 'newer']);
		expect(statuses.at(-1)).toBe('draft-saved');
	});
});
