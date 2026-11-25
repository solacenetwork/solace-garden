import { PageHeader } from '../../components/PageHeader.jsx';

export function Search() {
	return (
		<section class="workspace-page placeholder-page" aria-labelledby="search-title">
			<PageHeader title="Search" titleId="search-title" />
			<div class="page-content placeholder-content">
			<div class="placeholder-page__icon" aria-hidden="true">
				<i class="bi bi-search"></i>
			</div>
			<p>Search across SOLACE Garden isn't available yet.</p>
			<p class="placeholder-page__status">
				You can continue using the individual workspaces to find and manage your records.
			</p>
			<a class="app-button" href="/">
				<i class="bi bi-arrow-left" aria-hidden="true"></i>
				Back to Home
			</a>
			</div>
		</section>
	);
}
