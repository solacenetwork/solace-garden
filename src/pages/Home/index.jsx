import { primaryActions } from '../../navigation.js';
import './style.css';

export function Home() {
	return (
		<div class="container home-page">
			<section class="home-intro" aria-labelledby="home-title">
				<p class="home-intro__eyebrow">Simple Mode preview</p>
				<h1 id="home-title">What would you like to do?</h1>
				<p class="home-intro__summary">
					Choose a garden activity to get started. These workspaces are
					placeholders while the first version takes root.
				</p>
			</section>

			<nav class="action-grid" aria-label="Garden actions">
				{primaryActions.map((action) => (
					<a class="action-card" href={action.path} key={action.path}>
						<span class="action-card__icon" aria-hidden="true">
							<i class={`bi bi-${action.icon}`}></i>
						</span>
						<span class="action-card__label">{action.label}</span>
						<span class="action-card__detail">{action.detail}</span>
					</a>
				))}
			</nav>
		</div>
	);
}
