import { createContext } from 'preact';
import { useContext, useLayoutEffect, useRef } from 'preact/hooks';
import { createHistoryNavigationGuard } from '../navigation/historyNavigationGuard.js';

const NavigationGuardContext = createContext(null);
const DISCARD_MESSAGE = 'Discard your unsaved Note and leave this page?';

export function NavigationGuardProvider({ children }) {
	const guard = useRef(null);

	if (!guard.current) {
		guard.current = createHistoryNavigationGuard({
			eventTarget: globalThis,
			history: globalThis.history,
			navigation: globalThis.navigation,
			confirmNavigation: () => globalThis.confirm(DISCARD_MESSAGE),
		});
	}

	useLayoutEffect(() => {
		guard.current.install();
		return () => guard.current.uninstall();
	}, []);

	return (
		<NavigationGuardContext.Provider value={guard.current}>
			{children}
		</NavigationGuardContext.Provider>
	);
}

export function useNavigationGuard() {
	const guard = useContext(NavigationGuardContext);

	if (!guard) {
		throw new Error('useNavigationGuard must be used inside NavigationGuardProvider.');
	}

	return guard;
}
