import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHistoryNavigationGuard } from './historyNavigationGuard.js';

function createBrowserHistory() {
	const listeners = [];
	const entries = [{ state: null, url: '/' }];
	let index = 0;

	const eventTarget = {
		addEventListener(type, listener, capture = false) {
			listeners.push({ type, listener, capture });
		},
		removeEventListener(type, listener, capture = false) {
			const listenerIndex = listeners.findIndex((registered) =>
				registered.type === type &&
				registered.listener === listener &&
				registered.capture === capture,
			);
			if (listenerIndex !== -1) {
				listeners.splice(listenerIndex, 1);
			}
		},
		dispatchPopState(state) {
			let propagationStopped = false;
			const event = {
				state,
				stopImmediatePropagation() {
					propagationStopped = true;
				},
			};

			for (const { listener } of listeners
				.filter(({ type, capture }) => type === 'popstate' && capture)
				.concat(listeners.filter(({ type, capture }) =>
					type === 'popstate' && !capture,
				))) {
				if (propagationStopped) {
					break;
				}
				listener(event);
			}
		},
		listenerCount() {
			return listeners.length;
		},
	};

	const history = {
		get state() {
			return entries[index].state;
		},
		get length() {
			return entries.length;
		},
		get url() {
			return entries[index].url;
		},
		pushState(state, _title, url) {
			entries.splice(index + 1);
			entries.push({ state, url });
			index = entries.length - 1;
		},
		replaceState(state, _title, url) {
			entries[index] = {
				state,
				url: url ?? entries[index].url,
			};
		},
		go(offset) {
			const destination = index + offset;
			if (destination < 0 || destination >= entries.length) {
				return;
			}

			index = destination;
			eventTarget.dispatchPopState(entries[index].state);
		},
		back() {
			this.go(-1);
		},
		forward() {
			this.go(1);
		},
	};

	return {
		eventTarget,
		history,
		originalPushState: history.pushState,
		originalReplaceState: history.replaceState,
	};
}

describe('History navigation guard', () => {
	let eventTarget;
	let history;
	let confirmNavigation;
	let guard;
	let routedUrl;
	let routerEventCount;
	let editorState;
	let originalPushState;
	let originalReplaceState;

	beforeEach(() => {
		({
			eventTarget,
			history,
			originalPushState,
			originalReplaceState,
		} = createBrowserHistory());
		confirmNavigation = vi.fn();
		guard = createHistoryNavigationGuard({
			eventTarget,
			history,
			confirmNavigation,
		});
		guard.install();
		routedUrl = history.url;
		routerEventCount = 0;
		editorState = { isOpen: false, draft: '' };
		eventTarget.addEventListener('popstate', () => {
			routerEventCount += 1;
			routedUrl = history.url;
			// A router-visible traversal can replace the active route tree. Model the
			// resulting editor teardown so canceled-navigation tests cover lifecycle
			// state, rather than only asserting the restored URL.
			editorState = { isOpen: false, draft: '' };
		});
	});

	it('cancels Back navigation without losing the route, draft, or history entry', () => {
		history.pushState(null, '', '/notes');
		routedUrl = '/notes';
		editorState = { isOpen: true, draft: 'Exact unsaved\nNote text  ' };
		const activeEditor = editorState;
		guard.setBlocker(() => true);
		confirmNavigation.mockReturnValue(false);
		const originalLength = history.length;

		history.back();

		expect(confirmNavigation).toHaveBeenCalledOnce();
		expect(history.url).toBe('/notes');
		expect(routedUrl).toBe('/notes');
		expect(routerEventCount).toBe(0);
		expect(editorState).toBe(activeEditor);
		expect(editorState).toEqual({
			isOpen: true,
			draft: 'Exact unsaved\nNote text  ',
		});
		expect(history.length).toBe(originalLength);
	});

	it('allows confirmed Back navigation to reach its intended destination', () => {
		history.pushState(null, '', '/notes');
		routedUrl = '/notes';
		editorState = { isOpen: true, draft: 'Discard this edit' };
		guard.setBlocker(() => true);
		confirmNavigation.mockReturnValue(true);

		history.back();

		expect(confirmNavigation).toHaveBeenCalledOnce();
		expect(history.url).toBe('/');
		expect(routedUrl).toBe('/');
		expect(routerEventCount).toBe(1);
		expect(editorState.isOpen).toBe(false);
	});

	it('handles canceled and confirmed Forward navigation without a loop', () => {
		history.pushState(null, '', '/notes');
		history.pushState(null, '', '/settings');
		history.back();
		expect(history.url).toBe('/notes');

		routerEventCount = 0;
		editorState = { isOpen: true, draft: 'Forward-sensitive draft' };
		const activeEditor = editorState;
		guard.setBlocker(() => true);
		confirmNavigation.mockReturnValueOnce(false).mockReturnValueOnce(true);
		const originalLength = history.length;

		history.forward();
		expect(history.url).toBe('/notes');
		expect(routedUrl).toBe('/notes');
		expect(routerEventCount).toBe(0);
		expect(editorState).toBe(activeEditor);
		expect(editorState.draft).toBe('Forward-sensitive draft');

		history.forward();
		expect(history.url).toBe('/settings');
		expect(routedUrl).toBe('/settings');
		expect(routerEventCount).toBe(1);
		expect(editorState.isOpen).toBe(false);
		expect(confirmNavigation).toHaveBeenCalledTimes(2);
		expect(history.length).toBe(originalLength);
	});

	it('does not confirm or block history navigation without unsaved changes', () => {
		history.pushState(null, '', '/notes');
		routedUrl = '/notes';

		history.back();

		expect(confirmNavigation).not.toHaveBeenCalled();
		expect(history.url).toBe('/');
		expect(routedUrl).toBe('/');
		expect(routerEventCount).toBe(1);
	});

	it('restores correctly after a new route replaces the Forward branch', () => {
		history.pushState(null, '', '/notes');
		history.pushState(null, '', '/settings');
		history.back();
		history.pushState(null, '', '/harvest');
		routedUrl = '/harvest';
		guard.setBlocker(() => true);
		confirmNavigation.mockReturnValue(false);

		history.back();

		expect(history.url).toBe('/harvest');
		expect(routedUrl).toBe('/harvest');
		expect(routerEventCount).toBe(1);
		expect(history.length).toBe(3);
	});

	it('preserves the same editor through repeated canceled traversals', () => {
		history.pushState(null, '', '/notes');
		routedUrl = '/notes';
		editorState = { isOpen: true, draft: 'Do not reset me' };
		const activeEditor = editorState;
		guard.setBlocker(() => true);
		confirmNavigation.mockReturnValue(false);
		const originalLength = history.length;

		history.back();
		history.back();
		history.back();

		expect(confirmNavigation).toHaveBeenCalledTimes(3);
		expect(routerEventCount).toBe(0);
		expect(editorState).toBe(activeEditor);
		expect(editorState.draft).toBe('Do not reset me');
		expect(history.url).toBe('/notes');
		expect(history.length).toBe(originalLength);
	});

	it('removes a cleared blocker and restores listeners and History methods', () => {
		const removeBlocker = guard.setBlocker(() => true);
		removeBlocker();
		history.pushState(null, '', '/notes');
		routedUrl = '/notes';

		history.back();
		expect(confirmNavigation).not.toHaveBeenCalled();

		guard.uninstall();
		expect(eventTarget.listenerCount()).toBe(1);
		expect(history.pushState).toBe(originalPushState);
		expect(history.replaceState).toBe(originalReplaceState);
	});
});
