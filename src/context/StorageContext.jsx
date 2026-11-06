import { createContext } from 'preact';
import { useContext } from 'preact/hooks';

const StorageContext = createContext(null);

export function StorageProvider({ storage, children }) {
	return (
		<StorageContext.Provider value={storage}>
			{children}
		</StorageContext.Provider>
	);
}

export function useStorage() {
	const storage = useContext(StorageContext);

	if (!storage) {
		throw new Error('useStorage must be used inside StorageProvider.');
	}

	return storage;
}

