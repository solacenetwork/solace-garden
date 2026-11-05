import { render } from 'preact';
import { LocationProvider, Router, Route, useLocation } from 'preact-iso';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Header } from './components/Header.jsx';
import { StandardNavigation } from './components/StandardNavigation.jsx';
import { InterfaceModeProvider, useInterfaceMode } from './context/InterfaceModeContext.jsx';
import { routeCatalog } from './navigation.js';
import { Home } from './pages/Home/index.jsx';
import { Plants } from './pages/Plants/index.jsx';
import { PlaceholderPage } from './pages/PlaceholderPage.jsx';
import { Settings } from './pages/Settings/index.jsx';
import { NotFound } from './pages/_404.jsx';
import './style.css';

const pageComponents = {
	home: Home,
	plants: Plants,
	settings: Settings,
};

function AppShell() {
	const { preference, effectiveMode } = useInterfaceMode();
	const { path } = useLocation();
	const currentRoute = routeCatalog.find((route) => route.path === path);

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
						{routeCatalog.map((route) => (
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

export function App() {
	return (
		<LocationProvider>
			<InterfaceModeProvider>
				<AppShell />
			</InterfaceModeProvider>
		</LocationProvider>
	);
}

render(<App />, document.getElementById('app'));
