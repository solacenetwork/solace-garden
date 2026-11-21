import { CURATED_GARDEN_ICONS, GARDEN_COLOR_PALETTE } from '../gardenIdentity.js';

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

export function GardenColorChoices({ selected, onSelect, disabled = false }) {
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
		</div>
	);
}
