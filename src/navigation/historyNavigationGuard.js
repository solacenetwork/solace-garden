const HISTORY_POSITION_KEY = '__solaceGardenHistoryPosition';
const ORIGINAL_STATE_KEY = '__solaceGardenOriginalHistoryState';

function readPosition(state) {
	return state && typeof state === 'object'
		? state[HISTORY_POSITION_KEY]
		: undefined;
}

function withPosition(state, position) {
	if (state && typeof state === 'object' && !Array.isArray(state)) {
		return { ...state, [HISTORY_POSITION_KEY]: position };
	}

	return {
		[HISTORY_POSITION_KEY]: position,
		[ORIGINAL_STATE_KEY]: state,
	};
}

export function createHistoryNavigationGuard({
	eventTarget,
	history,
	navigation,
	confirmNavigation,
}) {
	let blocker = null;
	let currentPosition;
	let isRestoring = false;
	let installed = false;
	let originalPushState;
	let originalReplaceState;
	let hadOwnPushState;
	let hadOwnReplaceState;

	function navigationPosition() {
		const position = navigation?.currentEntry?.index;
		return Number.isInteger(position) ? position : undefined;
	}

	function destinationPosition(event) {
		const taggedPosition = readPosition(event.state);
		return navigationPosition() ?? (
			Number.isInteger(taggedPosition) ? taggedPosition : undefined
		);
	}

	function handlePopState(event) {
		const destination = destinationPosition(event);

		if (isRestoring) {
			isRestoring = false;
			if (Number.isInteger(destination)) {
				currentPosition = destination;
			}
			return;
		}

		if (!blocker?.()) {
			if (Number.isInteger(destination)) {
				currentPosition = destination;
			}
			return;
		}

		if (confirmNavigation()) {
			if (Number.isInteger(destination)) {
				currentPosition = destination;
			}
			return;
		}

		event.stopImmediatePropagation();
		isRestoring = true;

		// Entries created during this app session are tagged. The Navigation API
		// supplies an index for older entries where supported. An untagged fallback
		// can only be an older entry and is therefore restored with one Forward step.
		const offset = Number.isInteger(destination)
			? currentPosition - destination
			: 1;
		history.go(offset);
	}

	return Object.freeze({
		install() {
			if (installed) {
				return;
			}

			installed = true;
			originalPushState = history.pushState;
			originalReplaceState = history.replaceState;
			hadOwnPushState = Object.hasOwn(history, 'pushState');
			hadOwnReplaceState = Object.hasOwn(history, 'replaceState');
			currentPosition = navigationPosition() ?? readPosition(history.state) ?? 0;

			if (!Number.isInteger(readPosition(history.state))) {
				originalReplaceState.call(
					history,
					withPosition(history.state, currentPosition),
					'',
				);
			}

			history.pushState = function pushState(state, title, url) {
				currentPosition += 1;
				return originalPushState.call(
					this,
					withPosition(state, currentPosition),
					title,
					url,
				);
			};
			history.replaceState = function replaceState(state, title, url) {
				return originalReplaceState.call(
					this,
					withPosition(state, currentPosition),
					title,
					url,
				);
			};

			eventTarget.addEventListener('popstate', handlePopState, true);
		},

		setBlocker(nextBlocker) {
			blocker = nextBlocker;

			return () => {
				if (blocker === nextBlocker) {
					blocker = null;
				}
			};
		},

		uninstall() {
			if (!installed) {
				return;
			}

			eventTarget.removeEventListener('popstate', handlePopState, true);
			if (hadOwnPushState) {
				history.pushState = originalPushState;
			} else {
				delete history.pushState;
			}
			if (hadOwnReplaceState) {
				history.replaceState = originalReplaceState;
			} else {
				delete history.replaceState;
			}
			blocker = null;
			isRestoring = false;
			installed = false;
		},
	});
}
