import { createContext } from 'preact';
import { useContext, useEffect, useMemo, useState } from 'preact/hooks';
import {
	readInterfaceMode,
	resolveInterfaceMode,
	SIMPLE_MODE_MEDIA_QUERY,
	isInterfaceMode,
	writeInterfaceMode,
} from '../services/interfaceMode.js';

const InterfaceModeContext = createContext(null);

function getInitialNarrowState() {
	return globalThis.matchMedia?.(SIMPLE_MODE_MEDIA_QUERY).matches ?? false;
}

export function InterfaceModeProvider({ children }) {
	const [storedMode] = useState(() => readInterfaceMode());
	const [preference, setPreference] = useState(storedMode.preference);
	const [storageAvailable, setStorageAvailable] = useState(
		storedMode.storageAvailable,
	);
	const [isNarrow, setIsNarrow] = useState(getInitialNarrowState);

	useEffect(() => {
		if (!globalThis.matchMedia) {
			return undefined;
		}

		const mediaQuery = globalThis.matchMedia(SIMPLE_MODE_MEDIA_QUERY);
		const handleChange = (event) => setIsNarrow(event.matches);

		setIsNarrow(mediaQuery.matches);
		mediaQuery.addEventListener('change', handleChange);

		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []);

	const updatePreference = (nextPreference) => {
		if (!isInterfaceMode(nextPreference)) {
			return;
		}

		setPreference(nextPreference);
		setStorageAvailable(writeInterfaceMode(nextPreference));
	};

	const effectiveMode = resolveInterfaceMode(preference, isNarrow);
	const value = useMemo(
		() => ({
			preference,
			effectiveMode,
			isNarrow,
			storageAvailable,
			setPreference: updatePreference,
		}),
		[preference, effectiveMode, isNarrow, storageAvailable],
	);

	return (
		<InterfaceModeContext.Provider value={value}>
			{children}
		</InterfaceModeContext.Provider>
	);
}

export function useInterfaceMode() {
	const context = useContext(InterfaceModeContext);

	if (!context) {
		throw new Error('useInterfaceMode must be used inside InterfaceModeProvider.');
	}

	return context;
}
