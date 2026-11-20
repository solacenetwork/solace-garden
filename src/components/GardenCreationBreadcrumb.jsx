import { Fragment } from 'preact';

const parentItems = [
	{ label: 'Gardens', href: '/gardens' },
	{ label: 'Create Garden', href: '/gardens/new' },
];

function isUnmodifiedPrimaryActivation(event) {
	return (event.button ?? 0) === 0
		&& !event.ctrlKey
		&& !event.metaKey
		&& !event.shiftKey
		&& !event.altKey;
}

export function GardenCreationBreadcrumb({ current, disabled = false, onNavigate }) {
	const parents = current === 'Create Garden' ? parentItems.slice(0, 1) : parentItems;

	function activate(event, href) {
		if (disabled) {
			event.preventDefault();
			return undefined;
		}
		if (onNavigate && isUnmodifiedPrimaryActivation(event)) {
			event.preventDefault();
			return onNavigate(href);
		}
		return undefined;
	}

	return (
		<nav class="garden-creation-breadcrumb" aria-label="Garden creation breadcrumb">
			<ol class="breadcrumb">
				{parents.map((item) => (
					<Fragment key={item.href}>
						<li class="breadcrumb-item">
							<a
								class="breadcrumb-link"
								href={item.href}
								aria-disabled={disabled ? 'true' : undefined}
								tabIndex={disabled ? -1 : undefined}
								onClick={(event) => activate(event, item.href)}
							>
								{item.label}
							</a>
						</li>
						<li class="breadcrumb-divider" aria-hidden="true"></li>
					</Fragment>
				))}
				<li class="breadcrumb-item">
					<span class="breadcrumb-link active" aria-current="page">{current}</span>
				</li>
			</ol>
		</nav>
	);
}
