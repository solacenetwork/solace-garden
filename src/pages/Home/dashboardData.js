const PREVIEW_LIMIT = 5;

function compareIds(first, second) {
	const left = String(first.id);
	const right = String(second.id);
	return left < right ? -1 : left > right ? 1 : 0;
}

function timestamp(value) {
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function newestFirst(field) {
	return (first, second) =>
		timestamp(second[field]) - timestamp(first[field]) ||
		compareIds(first, second);
}

export function prepareGardens(records) {
	const current = [];
	const previous = [];

	for (const garden of [...records].sort(newestFirst('updatedAt'))) {
		if (
			garden.isClosed === true ||
			garden.status === 'completed' ||
			garden.status === 'archived'
		) {
			previous.push(garden);
		} else if (
			garden.isClosed === false &&
			(garden.status === 'planned' || garden.status === 'active')
		) {
			current.push(garden);
		}
	}

	return { current, previous };
}

export function prepareRecentItems(records) {
	return [...records].sort(newestFirst('createdAt')).slice(0, PREVIEW_LIMIT);
}

export async function readGardenPreviews(gardens) {
	return prepareGardens(await gardens.list());
}

export async function readListPreview(lists, kind) {
	return prepareRecentItems(await lists.list(kind));
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
	timeZone: 'UTC',
});

export function formatDateOnly(value) {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return null;
	}

	const [year, month, day] = value.split('-').map(Number);
	return dateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}
