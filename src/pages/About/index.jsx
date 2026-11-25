import '../secondary.css';

export function About() {
	return (
		<section class="container secondary-page about-page" aria-labelledby="about-title">
			<header class="secondary-page__header about-page__header">
				<img
					class="about-page__wordmark"
					src="/assets/branding/solace-garden-green.svg"
					alt="SOLACE Garden"
				/>
				<h1 id="about-title">SOLACE Garden</h1>
				<p class="about-page__summary">An open-source garden management application.</p>
			</header>

			<div class="card about-page__card">
				<div class="card-body">
					<p>SOLACE Garden helps you plan, manage, and document your gardens throughout their growing seasons.</p>
					<p>Designed around local-first data storage and offline use.</p>
				</div>
			</div>

			<section class="card about-page__card" aria-labelledby="about-project-title">
				<div class="card-body">
					<h2 id="about-project-title"><i class="bi bi-info-circle" aria-hidden="true"></i> Project information</h2>
					<ul class="about-page__links">
						<li><a href="https://solacenetwork.com" target="_blank" rel="noreferrer">SOLACE Network <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i></a></li>
						<li><a href="https://github.com/solacenetwork/solace-garden" target="_blank" rel="noreferrer">Source code on GitHub <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i></a></li>
					</ul>
				</div>
			</section>
		</section>
	);
}
