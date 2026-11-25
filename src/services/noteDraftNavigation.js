let returnContext = null;

export function replaceNoteDraftUrl(destination, historyObject = globalThis.history) {
	historyObject?.replaceState?.(historyObject.state ?? null, '', destination);
}

export function setNoteDraftReturnContext(draftId) {
	returnContext = typeof draftId === 'string' ? { draftId } : null;
}

export function consumeNoteDraftReturnContext() {
	const context = returnContext;
	returnContext = null;
	return context;
}
