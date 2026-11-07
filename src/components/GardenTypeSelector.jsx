import './GardenTypeSelector.css';

export function nextGardenTypeSelection(selectedIds, id, checked) {
	if (checked) {
		return selectedIds.includes(id) ? [...selectedIds] : [...selectedIds, id];
	}
	return selectedIds.filter((selectedId) => selectedId !== id);
}

export function GardenTypeSelector({
	types,
	selectedIds,
	onChange,
	disabled = false,
	legend = 'Garden Types',
}) {
	function changeSelection(id, checked) {
		if (disabled) return;
		onChange(nextGardenTypeSelection(selectedIds, id, checked));
	}

	return (
		<fieldset class="garden-type-selector" disabled={disabled}>
			<legend>{legend}</legend>
			<div class="garden-type-selector__grid">
				{types.map((type) => {
					const selected = selectedIds.includes(type.id);
					return (
						<label class="garden-type-option" key={type.id}>
							<input
								class="check check-lg"
								type="checkbox"
								value={type.id}
								checked={selected}
								disabled={disabled}
								onChange={(event) => changeSelection(
									type.id,
									event.currentTarget.checked,
								)}
							/>
							<span class="garden-type-option__content">
								<span class="garden-type-option__name">{type.name}</span>
								{type.description && (
									<span class="garden-type-option__description">{type.description}</span>
								)}
							</span>
							<span class="garden-type-option__state">
								{selected ? 'Selected' : 'Not selected'}
							</span>
						</label>
					);
				})}
			</div>
		</fieldset>
	);
}
