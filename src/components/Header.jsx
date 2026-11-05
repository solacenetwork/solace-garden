import { useLocation } from 'preact-iso';
import { GardenBrand } from './GardenBrand';

export function Header() {
	const { path } = useLocation();

	return (
		<header class="app-header">
			<div class="container app-header__inner">
				<GardenBrand />
				<a
					class="app-settings-link"
					href="/settings"
					aria-label="Settings"
					aria-current={path === '/settings' ? 'page' : undefined}
				>
					<i class="bi bi-gear" aria-hidden="true"></i>
				</a>
			</div>
		</header>
	);
}
