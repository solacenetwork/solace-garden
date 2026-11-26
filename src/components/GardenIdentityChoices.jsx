import { useEffect, useState } from 'preact/hooks';
import { CURATED_GARDEN_ICONS, GARDEN_NUMBER_ICONS, GARDEN_COLOR_PALETTE } from '../gardenIdentity.js';
import {
	readGardenIdentityAccordionPreference,
	writeGardenIdentityAccordionPreference,
} from '../services/gardenIdentityAccordionPreference.js';

export function GardenIconChoices({ values = CURATED_GARDEN_ICONS, selected, onSelect, disabled = false }) {
	return (
		<div class="garden-identity-options garden-identity-options--icons">
			{values.map((name) => {
				const active = selected === name;
				return (
					<button
						class={`garden-identity-option garden-identity-option--icon${active ? ' garden-identity-option--selected' : ''}`}
						type="button"
						aria-pressed={active}
						aria-label={`Use ${name} icon`}
						disabled={disabled}
						onClick={() => onSelect(name)}
						key={name}
					>
						<i class={`bi bi-${name}`} aria-hidden="true"></i>
						{active && <i class="bi bi-check-circle-fill garden-identity-option__check" aria-hidden="true"></i>}
					</button>
				);
			})}
		</div>
	);
}

export function GardenColorChoices({ selected, onSelect, onCustomSelect, onCustomChange, disabled = false }) {
	const paletteValues = new Set(GARDEN_COLOR_PALETTE.map(({ value }) => value));
	const isCustom = typeof selected === 'string' && !paletteValues.has(selected);
	return (
		<div class="garden-identity-options garden-identity-options--colors">
			{GARDEN_COLOR_PALETTE.map(({ name, value }) => {
				const active = selected === value;
				return (
					<button
						class={`garden-identity-option garden-identity-option--color${active ? ' garden-identity-option--selected' : ''}`}
						type="button"
						style={{ '--garden-swatch-color': value }}
						aria-pressed={active}
						aria-label={`${name}, ${value}`}
						disabled={disabled}
						onClick={() => onSelect(value)}
						key={value}
					>
						<span class="garden-identity-option__swatch" aria-hidden="true"></span>
						<span>{name}</span>
						{active && <i class="bi bi-check-circle-fill garden-identity-option__check" aria-hidden="true"></i>}
					</button>
				);
			})}
			<button
				class={`garden-identity-custom${isCustom ? ' garden-identity-custom--selected' : ''}`}
				type="button"
				aria-pressed={isCustom}
				disabled={disabled}
				onClick={() => onCustomSelect?.(isCustom ? selected : '#287D46')}
			>
				<i class="bi bi-palette-fill" aria-hidden="true"></i> Custom
			</button>
			{isCustom && (
				<div class="form-field garden-identity-custom-field">
					<label class="form-label" for="garden-custom-ring-color">Custom Ring Color</label>
					<input
						id="garden-custom-ring-color"
						class="form-control form-control-color"
						type="color"
						value={selected}
						disabled={disabled}
						onInput={(event) => onCustomChange?.(event.currentTarget.value)}
					/>
				</div>
			)}
		</div>
	);
}

export function GardenCreationIdentitySections({
	fields,
	errors = {},
	onChange,
	disabled = false,
	idPrefix,
}) {
	const [preference, setPreference] = useState(readGardenIdentityAccordionPreference);
	useEffect(() => {
		writeGardenIdentityAccordionPreference(preference);
	}, [preference]);

	function toggle(section, open) {
		setPreference((current) => {
			const next = { ...current, [section]: open };
			writeGardenIdentityAccordionPreference(next);
			return next;
		});
	}

	const iconPreview = fields.icon
		? <><i class={`bi bi-${fields.icon}`} aria-hidden="true"></i> {fields.icon}</>
		: 'Not set';
	const colorPreview = fields.color
		? <><span class="garden-create__color-preview" style={{ '--garden-swatch-color': fields.color }} aria-hidden="true"></span> {fields.color}</>
		: 'Not set';

	return (
		<div class="garden-create__identity accordion" aria-label="Optional Garden identity">
			<details class="accordion-item" open={preference.icon} onToggle={(event) => toggle('icon', event.currentTarget.open)}>
				<summary class="accordion-header">
					<span>Icon (optional)</span>
					<span class="garden-create__accordion-preview">{iconPreview}</span>
				</summary>
				<div class="accordion-body">
					<GardenIconChoices
						values={[...CURATED_GARDEN_ICONS, ...GARDEN_NUMBER_ICONS]}
						selected={fields.icon}
						disabled={disabled}
						onSelect={(value) => onChange('icon', value)}
					/>
					<button
						id={`${idPrefix}-icon`}
						class="btn-text garden-create__clear-identity"
						type="button"
						disabled={disabled || fields.icon === null}
						aria-describedby={errors.icon ? `${idPrefix}-icon-error` : undefined}
						onClick={() => onChange('icon', null)}
					>Reset Icon</button>
					{errors.icon && <p id={`${idPrefix}-icon-error`} class="garden-create__field-error" role="alert">{errors.icon}</p>}
				</div>
			</details>
			<details class="accordion-item" open={preference.color} onToggle={(event) => toggle('color', event.currentTarget.open)}>
				<summary class="accordion-header">
					<span>Ring Color (optional)</span>
					<span class="garden-create__accordion-preview">{colorPreview}</span>
				</summary>
				<div class="accordion-body">
					<GardenColorChoices
						selected={fields.color}
						disabled={disabled}
						onSelect={(value) => onChange('color', value)}
						onCustomSelect={(value) => onChange('color', value)}
						onCustomChange={(value) => onChange('color', value)}
					/>
					<button
						id={`${idPrefix}-color`}
						class="btn-text garden-create__clear-identity"
						type="button"
						disabled={disabled || fields.color === null}
						aria-describedby={errors.color ? `${idPrefix}-color-error` : undefined}
						onClick={() => onChange('color', null)}
					>Reset Color</button>
					{errors.color && <p id={`${idPrefix}-color-error`} class="garden-create__field-error" role="alert">{errors.color}</p>}
				</div>
			</details>
		</div>
	);
}
