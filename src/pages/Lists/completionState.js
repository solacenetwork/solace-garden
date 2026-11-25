export function updateItemCompletion(items, id, completed) {
	return items.map((item) =>
		item.id === id ? { ...item, completed } : item
	);
}

export function deriveListCollections(items) {
	return {
		outstanding: items.filter((item) => !item.completed),
		completed: items.filter((item) => item.completed),
	};
}

export function reconstructListOrder(items, collection, reorderedCollection) {
	const selectedCompleted = collection === 'completed';
	let selectedIndex = 0;

	return items.map((item) => {
		if (Boolean(item.completed) === selectedCompleted) {
			const reordered = reorderedCollection[selectedIndex];
			selectedIndex += 1;
			return reordered ?? item;
		}
		return item;
	});
}
