const STATUS_LABELS = {
	planned: 'Planned',
	active: 'Active',
	completed: 'Completed',
	archived: 'Archived',
};

export function gardenAssociationLabel(garden, locations = []) {
	const status = STATUS_LABELS[garden.status] ?? 'Unknown status';
	const location = locations.find(({ id }) => id === garden.locationId)?.name;
	return `${garden.name} — ${[status, location].filter(Boolean).join(', ')}`;
}

export function GardenAssociationSelector({
	id,
	value = null,
	gardens = [],
	locations = [],
	onChange,
	disabled = false,
	label = 'Garden association',
	error = '',
}) {
	return (
		<div class="form-field">
			<label class="form-label" for={id}>{label}</label>
			<select
				id={id}
				class={`form-control${error ? ' is-invalid' : ''}`}
				value={value ?? ''}
				disabled={disabled}
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={error ? `${id}-error` : undefined}
				onChange={(event) => onChange(event.currentTarget.value || null)}
			>
				<option value="">No Garden</option>
				{gardens.map((garden) => (
					<option value={garden.id} key={garden.id}>
						{gardenAssociationLabel(garden, locations)}
					</option>
				))}
			</select>
			{gardens.length === 0 && (
				<p class="form-text">No Gardens are available. This item will remain unlinked.</p>
			)}
			{error && <div id={`${id}-error`} class="invalid-feedback">{error}</div>}
		</div>
	);
}
