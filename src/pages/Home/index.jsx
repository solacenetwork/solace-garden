import { useInterfaceMode } from '../../context/InterfaceModeContext.jsx';
import { HomeDashboard } from './HomeDashboard.jsx';
import { SimpleNavigationCards } from './SimpleNavigationCards.jsx';
import './style.css';

export function Home() {
	const { effectiveMode } = useInterfaceMode();
	const isSimple = effectiveMode === 'simple';

	return (
		<div class={`container home-page home-page--${effectiveMode}`}>
			<header class="home-intro">
				<h1>{isSimple ? 'Where would you like to go?' : 'Your Garden'}</h1>
				{!isSimple && <p>Recent activity and Gardens at a glance.</p>}
			</header>

			{isSimple && <SimpleNavigationCards />}
			<HomeDashboard />
		</div>
	);
}
