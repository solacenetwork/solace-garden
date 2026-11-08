function templateContext(template, references) {
	const location = references.locations.find(({ id }) => id === template.configuration.locationId)?.name
		?? 'Saved Location unavailable';
	const typeNames = template.configuration.typeIds.map((id) => (
		references.types.find((type) => type.id === id)?.name ?? 'Unavailable type'
	));
	return `${location} · ${typeNames.length ? typeNames.join(', ') : 'No Garden Types'}`;
}

export function GardenTemplateSelection({
	state,
	references,
	selectedId,
	onSelect,
	onApply,
	onRetry,
	busy = false,
	idPrefix,
	applyLabel = 'Apply Template',
}) {
	return (
		<section class="garden-template-selection" aria-labelledby={`${idPrefix}-template-title`}>
			<div class="garden-template-selection__header">
				<div>
					<h2 id={`${idPrefix}-template-title`}>Choose how to start</h2>
					<p>Start clean or copy reusable details from a saved Garden Template.</p>
				</div>
				<a class="btn-text" href="/templates">Manage Templates</a>
			</div>

			<fieldset class="garden-template-selection__choices" disabled={busy}>
				<legend class="visually-hidden">Garden starting point</legend>
				<label class={`garden-template-choice${selectedId === null ? ' garden-template-choice--selected' : ''}`}>
					<input
						class="radio"
						type="radio"
						name={`${idPrefix}-source`}
						checked={selectedId === null}
						onChange={() => onSelect(null)}
					/>
					<i class="bi bi-flower1" aria-hidden="true"></i>
					<span><strong>Start from Scratch</strong><small>Keep the details already in this draft.</small></span>
				</label>

				{state.status === 'loading' && <div class="garden-template-selection__state" role="status">Loading saved Templates…</div>}
				{state.status === 'error' && <div class="garden-template-selection__state" role="alert"><span>Saved Templates could not be loaded.</span><button class="btn-outline" type="button" onClick={onRetry}>Retry</button></div>}
				{state.status === 'ready' && state.templates.length === 0 && <div class="garden-template-selection__state"><span>No saved Garden Templates yet.</span><a href="/templates">Open Template management</a></div>}
				{state.status === 'ready' && state.templates.map((template) => (
					<label class={`garden-template-choice${selectedId === template.id ? ' garden-template-choice--selected' : ''}`} key={template.id}>
						<input
							class="radio"
							type="radio"
							name={`${idPrefix}-source`}
							checked={selectedId === template.id}
							onChange={() => onSelect(template.id)}
						/>
						<i class="bi bi-file-earmark-text" aria-hidden="true"></i>
						<span>
							<strong>{template.name}</strong>
							<small>Suggested Garden: {template.configuration.name}</small>
							<small>{templateContext(template, references)}</small>
						</span>
					</label>
				))}
			</fieldset>

			{selectedId !== null && <div class="garden-template-selection__apply">
				<button class="btn-solid theme-primary" type="button" disabled={busy} onClick={onApply}>
					<i class="bi bi-copy" aria-hidden="true"></i>{busy ? 'Applying…' : applyLabel}
				</button>
			</div>}
		</section>
	);
}
