import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Header } from './components/Header.jsx';
import { workspaceRoutes } from './navigation.js';
import { Home } from './pages/Home/index.jsx';
import { PlaceholderPage } from './pages/PlaceholderPage.jsx';
import { NotFound } from './pages/_404.jsx';
import './style.css';

export function App() {
	return (
		<LocationProvider>
			<Header />
			<main id="main-content" class="app-main">
				<Router>
					<Route path="/" component={Home} />
					{workspaceRoutes.map((route) => (
						<Route
							key={route.path}
							path={route.path}
							component={PlaceholderPage}
						/>
					))}
					<Route default component={NotFound} />
				</Router>
			</main>
		</LocationProvider>
	);
}

render(<App />, document.getElementById('app'));
