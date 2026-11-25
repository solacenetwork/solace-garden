import './PageHeader.css';

export function PageHeader({
	title,
	titleId,
	eyebrow,
	description,
	leading,
	breadcrumbs,
	actions,
	status,
	className = '',
}) {
	return (
		<header class={`page-header${className ? ` ${className}` : ''}`}>
			{breadcrumbs && <div class="page-header__breadcrumbs">{breadcrumbs}</div>}
			<div class="page-header__layout">
				<div class="page-header__main">
					{eyebrow && <p class="page-header__eyebrow">{eyebrow}</p>}
					<h1 id={titleId} class="h1 page-header__title">
						{leading && <span class="page-header__leading">{leading}</span>}
						<span class="page-header__title-text">{title}</span>
					</h1>
					{description && <p class="page-header__description">{description}</p>}
				</div>
				{(actions || status) && (
					<div class="page-header__aside">
						{status && <div class="page-header__status">{status}</div>}
						{actions && <div class="page-header__actions">{actions}</div>}
					</div>
				)}
			</div>
		</header>
	);
}
