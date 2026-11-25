import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Header } from './components/Header.jsx';
import { PwaUpdateNotice } from './components/PwaUpdateNotice.jsx';
import { StandardNavigation } from './components/StandardNavigation.jsx';
import { StorageRecoveryScreen } from './components/StorageRecoveryScreen.jsx';
import { InterfaceModeProvider, useInterfaceMode } from './context/InterfaceModeContext.jsx';
import { StorageProvider } from './context/StorageContext.jsx';
import { applicationRoutes } from './routes.js';
import { Home } from './pages/Home/index.jsx';
import { Lists } from './pages/Lists/index.jsx';
import { Gardens, GardenDetail, GardenDrafts } from './pages/Gardens/index.jsx';
import { CreateGarden, QuickStartGarden } from './pages/Gardens/CreateGarden.jsx';
import { GardenDraftRoute, NewGardenDraftRoute } from './pages/Gardens/FullGardenCreation.jsx';
import { EditGarden } from './pages/Gardens/EditGarden.jsx';
import { Locations } from './pages/Locations/index.jsx';
import { Plants } from './pages/Plants/index.jsx';
import { EditNote, NewNote, NewNoteDraft, Notes } from './pages/Notes/index.jsx';
import { PlaceholderPage } from './pages/PlaceholderPage.jsx';
import { Settings } from './pages/Settings/index.jsx';
import { Templates } from './pages/Templates/index.jsx';
import { Welcome } from './pages/Welcome/index.jsx';
import { Help } from './pages/Help/index.jsx';
import { About } from './pages/About/index.jsx';
import { Harvest } from './pages/Harvest/index.jsx';
import { NotFound } from './pages/_404.jsx';
import { applyWelcomeStartupPreference } from './services/welcomePreference.js';
import { CAROUSEL_POC_PATH } from './dev/carousel/route.js';
import { HUBTEST_PATH } from './dev/hubtest/route.js';
import { WIZARD_PREVIEW_PATH } from './dev/wizard/route.js';
import './style.css';

const pageComponents = {
	home: Home,
	plants: Plants,
	lists: Lists,
	locations: Locations,
	gardens: Gardens,
	'garden-new': CreateGarden,
	'garden-quickstart': QuickStartGarden,
	'garden-drafts': GardenDrafts,
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
	templates: Templates,
	welcome: Welcome,
	help: Help,
	about: About,
	harvest: Harvest,
};

function AppShell() {
	const { preference, effectiveMode } = useInterfaceMode();

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

	if (
		import.meta.env.DEV
		&& globalThis.location?.pathname === CAROUSEL_POC_PATH
	) {
		const { CarouselPoc } = await import('./dev/carousel/CarouselPoc.jsx');
		render(<CarouselPoc />, root);
		return;
	}

	if (
		import.meta.env.DEV
		&& globalThis.location?.pathname === HUBTEST_PATH
	) {
		const { HubTest } = await import('./dev/hubtest/HubTest.jsx');
		render(<HubTest />, root);
		return;
	}

	if (
		import.meta.env.DEV
		&& globalThis.location?.pathname === WIZARD_PREVIEW_PATH
	) {
		const { WizardPreview } = await import('./dev/wizard/WizardPreview.jsx');
		render(<WizardPreview />, root);
		return;
	}

	const { initializeStorage } = await import('./storage/index.js');
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
	applyWelcomeStartupPreference();
	render(<App storage={storage} />, root);
}

void startApplication();
