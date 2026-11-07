export function updateItemCompletion(items, id, completed) {
	return items.map((item) =>
		item.id === id ? { ...item, completed } : item
	);
}
