import { useLocation } from 'preact-iso';
import { GardenBrand } from './GardenBrand';

export function Header() {
	const { path } = useLocation();
	const isHome = path === '/';

	return (
		<header class="app-header">
			<div class="container app-header__inner">

				<GardenBrand/>

				<nav aria-label="Primary navigation">
					<a
						class={`app-home-link${isHome ? ' is-active' : ''}`}
						href="/"
						aria-current={isHome ? 'page' : undefined}
					>
						<i class="bi bi-house-door" aria-hidden="true"></i>
						<span>Home</span>
					</a>
				</nav>
			</div>
		</header>
	);
}
