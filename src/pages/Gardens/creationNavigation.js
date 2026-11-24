import { validateRecordId } from '../../storage/validation.js';

const DIRECT_TYPES = new Set(['quickstart', 'wizard', 'advanced']);
const TEMPLATE_TYPES = new Set(['wizard', 'advanced']);

function isValidTemplateId(id) {
	try {
		validateRecordId(id, 'id');
		return true;
	} catch {
		return false;
	}
}

function hasOnlyKeys(query, expectedKeys) {
	const keys = Object.keys(query ?? {}).sort();
	return keys.length === expectedKeys.length
		&& keys.every((key, index) => key === [...expectedKeys].sort()[index]);
}

export function createTemplateDispatcherUrl(mode, templateId) {
	if (!TEMPLATE_TYPES.has(mode) || !isValidTemplateId(templateId)) return null;
	const parameters = new URLSearchParams({
		type: mode,
		source: 'template',
		id: templateId,
	});
	return `/gardens/new?${parameters}`;
}

export function replaceGardenDraftUrl(destination, historyObject = globalThis.history) {
	historyObject?.replaceState?.(historyObject.state ?? null, '', destination);
}

export function templateSourceSearch(query) {
	if (
		!hasOnlyKeys(query, ['id', 'source'])
		|| query.source !== 'template'
		|| !isValidTemplateId(query.id)
	) return '';

	return `?${new URLSearchParams({ source: 'template', id: query.id })}`;
}

export function resolveCreateGardenDispatch(query = {}) {
	const keys = Object.keys(query);
	if (keys.length === 0) return { status: 'landing' };

	const { type } = query;
	if (!DIRECT_TYPES.has(type)) {
		return { status: 'error', message: 'Choose one of the available Garden creation methods.' };
	}

	if (hasOnlyKeys(query, ['type'])) {
		return { status: 'redirect', destination: `/gardens/new/${type}` };
	}

	if (
		TEMPLATE_TYPES.has(type)
		&& hasOnlyKeys(query, ['id', 'source', 'type'])
		&& query.source === 'template'
		&& isValidTemplateId(query.id)
	) {
		return {
			status: 'redirect',
			destination: `/gardens/new/${type}${templateSourceSearch({
				source: query.source,
				id: query.id,
			})}`,
		};
	}

	return {
		status: 'error',
		message: 'This Garden creation link is incomplete or unsupported. Choose a method to continue.',
	};
}
