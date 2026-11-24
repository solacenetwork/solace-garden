import { describe, expect, it, vi } from 'vitest';
import {
	createTemplateDispatcherUrl,
	replaceGardenDraftUrl,
	resolveCreateGardenDispatch,
	templateSourceSearch,
} from './creationNavigation.js';

const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440010';

describe('Create Garden dispatcher', () => {
	it('replaces an autosave-established draft URL without creating history', () => {
		const historyObject = { state: { retained: true }, replaceState: vi.fn() };
		replaceGardenDraftUrl('/gardens/new/advanced/draft-id', historyObject);
		expect(historyObject.replaceState).toHaveBeenCalledWith(
			historyObject.state,
			'',
			'/gardens/new/advanced/draft-id',
		);
	});
	it('keeps the parameter-free URL on the landing page', () => {
		expect(resolveCreateGardenDispatch({})).toEqual({ status: 'landing' });
	});

	it.each([
		['quickstart', '/gardens/new/quickstart'],
		['wizard', '/gardens/new/wizard'],
		['advanced', '/gardens/new/advanced'],
	])('routes type=%s to its existing creation entry', (type, destination) => {
		expect(resolveCreateGardenDispatch({ type })).toEqual({ status: 'redirect', destination });
	});

	it.each(['wizard', 'advanced'])('preserves a valid Template ID for %s', (type) => {
		const query = { type, source: 'template', id: TEMPLATE_ID };
		expect(resolveCreateGardenDispatch(query)).toEqual({
			status: 'redirect',
			destination: `/gardens/new/${type}?source=template&id=${TEMPLATE_ID}`,
		});
		expect(createTemplateDispatcherUrl(type, TEMPLATE_ID)).toBe(
			`/gardens/new?type=${type}&source=template&id=${TEMPLATE_ID}`,
		);
	});

	it('rejects unsupported, incomplete, extra, and invalid dispatcher parameters', () => {
		for (const query of [
			{ type: 'other' },
			{ type: 'wizard', source: 'template' },
			{ type: 'wizard', source: 'other', id: TEMPLATE_ID },
			{ type: 'wizard', source: 'template', id: 'not-a-uuid' },
			{ type: 'quickstart', source: 'template', id: TEMPLATE_ID },
			{ type: 'advanced', extra: 'value' },
			{ source: 'template', id: TEMPLATE_ID },
		]) {
			expect(resolveCreateGardenDispatch(query)).toMatchObject({ status: 'error' });
		}
	});

	it('retains only a complete Template source on the new draft URL', () => {
		expect(templateSourceSearch({ source: 'template', id: TEMPLATE_ID }))
			.toBe(`?source=template&id=${TEMPLATE_ID}`);
		for (const query of [
			undefined,
			{},
			{ source: 'template' },
			{ source: 'template', id: 'bad' },
			{ source: 'template', id: TEMPLATE_ID, extra: 'value' },
		]) expect(templateSourceSearch(query)).toBe('');
		expect(createTemplateDispatcherUrl('quickstart', TEMPLATE_ID)).toBeNull();
	});
});
