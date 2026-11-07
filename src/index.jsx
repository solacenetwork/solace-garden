import { render } from 'preact';
import { LocationProvider, Router, Route, useLocation } from 'preact-iso';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Header } from './components/Header.jsx';
import { PwaUpdateNotice } from './components/PwaUpdateNotice.jsx';
import { StandardNavigation } from './components/StandardNavigation.jsx';
import { StorageRecoveryScreen } from './components/StorageRecoveryScreen.jsx';
import { InterfaceModeProvider, useInterfaceMode } from './context/InterfaceModeContext.jsx';
import { StorageProvider } from './context/StorageContext.jsx';
import { applicationRoutes, findRoute } from './navigation.js';
import { Home } from './pages/Home/index.jsx';
import { Lists } from './pages/Lists/index.jsx';
import { Gardens, GardenDetail } from './pages/Gardens/index.jsx';
import { CreateGarden } from './pages/Gardens/CreateGarden.jsx';
import { GardenDraftRoute, NewGardenDraftRoute } from './pages/Gardens/FullGardenCreation.jsx';
import { EditGarden } from './pages/Gardens/EditGarden.jsx';
import { Locations } from './pages/Locations/index.jsx';
import { Plants } from './pages/Plants/index.jsx';
import { EditNote, NewNote, NewNoteDraft, Notes } from './pages/Notes/index.jsx';
import { PlaceholderPage } from './pages/PlaceholderPage.jsx';
import { Settings } from './pages/Settings/index.jsx';
import { NotFound } from './pages/_404.jsx';
import { initializeStorage } from './storage/index.js';
import './style.css';

const pageComponents = {
	home: Home,
	plants: Plants,
	lists: Lists,
	locations: Locations,
	gardens: Gardens,
	'garden-new': CreateGarden,
	'garden-wizard-new': () => <NewGardenDraftRoute mode="wizard" />,
	'garden-advanced-new': () => <NewGardenDraftRoute mode="advanced" />,
	'garden-wizard': (props) => <GardenDraftRoute {...props} mode="wizard" />,
	'garden-advanced': (props) => <GardenDraftRoute {...props} mode="advanced" />,
	'garden-edit': EditGarden,
	'garden-detail': GardenDetail,
	notes: Notes,
	'note-new': NewNote,
	'note-new-draft': NewNoteDraft,
	'note-edit': EditNote,
	settings: Settings,
};

function AppShell() {
	const { preference, effectiveMode } = useInterfaceMode();
	const { path } = useLocation();
	const currentRoute = findRoute(path);

	return (
		<div
			class={`app-shell app-shell--${effectiveMode}`}
			data-interface-mode={effectiveMode}
			data-interface-preference={preference}
		>
			<Header />
			<div class="app-workspace">
				{effectiveMode === 'standard' && <StandardNavigation />}
				<main id="main-content" class="app-main">
					{effectiveMode === 'standard' && currentRoute && (
						<details class="standard-context">
							<summary>About this workspace</summary>
							<p>{currentRoute.description}</p>
						</details>
					)}
					<Router>
						{applicationRoutes.map((route) => (
							<Route
								key={route.path}
								path={route.path}
								component={pageComponents[route.view] ?? PlaceholderPage}
							/>
						))}
						<Route default component={NotFound} />
					</Router>
				</main>
			</div>
		</div>
	);
}

export function App({ storage }) {
	return (
		<>
			<LocationProvider>
				<StorageProvider storage={storage}>
					<InterfaceModeProvider>
						<AppShell />
					</InterfaceModeProvider>
				</StorageProvider>
			</LocationProvider>
			<PwaUpdateNotice />
		</>
	);
}

async function startApplication() {
	const root = document.getElementById('app');
	const storage = await initializeStorage();

	if (storage.status === 'recovery-required') {
		render(
			<>
				<StorageRecoveryScreen error={storage.error} />
				<PwaUpdateNotice />
			</>,
			root,
		);
		return;
	}

	globalThis.addEventListener('pagehide', () => storage.close(), { once: true });
	render(<App storage={storage} />, root);
}

void startApplication();
