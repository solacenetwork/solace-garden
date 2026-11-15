// Fixed controls (Search, Add New and More) are always reserved. Each visible
// tool adds its intrinsic width and one gap alongside those controls.
export function getVisibleToolCount({ availableWidth, toolWidths, reservedWidths, gap = 0 }) {
	if (!Number.isFinite(availableWidth) || availableWidth <= 0) return 0;
	let used = reservedWidths.reduce((sum, width) => sum + width, 0)
		+ Math.max(0, reservedWidths.length - 1) * gap;
	let count = 0;
	for (const width of toolWidths) {
		const next = used + width + (reservedWidths.length + count > 0 ? gap : 0);
		if (next > availableWidth) break;
		used = next;
		count += 1;
	}
	return count;
}
