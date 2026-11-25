import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	consumeNoteDraftReturnContext, replaceNoteDraftUrl, setNoteDraftReturnContext,
} from './noteDraftNavigation.js';

beforeEach(() => consumeNoteDraftReturnContext());

describe('Note draft navigation', () => {
	it('replaces the fresh URL without adding history', () => {
		const history = { state: { retained: true }, replaceState: vi.fn() };
		replaceNoteDraftUrl('/notes/new/draft-id', history);
		expect(history.replaceState).toHaveBeenCalledWith(history.state, '', '/notes/new/draft-id');
	});

	it('hands off an exact draft UUID once', () => {
		setNoteDraftReturnContext('draft-id');
		expect(consumeNoteDraftReturnContext()).toEqual({ draftId: 'draft-id' });
		expect(consumeNoteDraftReturnContext()).toBeNull();
	});
});
