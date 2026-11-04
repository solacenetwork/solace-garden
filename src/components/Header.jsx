import { useLocation } from 'preact-iso';

export function Header() {
	const { url } = useLocation();
	const isHome = url === '/';

	return (
		<header class="app-header">
			<div class="container app-header__inner">
				<a class="app-brand" href="/" aria-label="SOLACE Garden home">
					<span class="app-brand__mark" aria-hidden="true">
						<i class="bi bi-flower1"></i>
					</span>
					<span class="app-brand__name">
						<span class="app-brand__network">SOLACE</span>
						<span>Garden</span>
					</span>
				</a>

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
