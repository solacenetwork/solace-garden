import { CharacterCounter } from './CharacterCounter.jsx';
import { GardenTypeSelector } from './GardenTypeSelector.jsx';

export const GARDEN_NOTES_MAX_LENGTH = 1000;

function FieldError({ id, message }) {
	return message ? <div id={id} class="invalid-feedback">{message}</div> : null;
}

function describedBy(...ids) {
	return ids.filter(Boolean).join(' ') || undefined;
}

export function GardenFields({
	fields,
	errors = {},
	locations,
	types,
	onChange,
	disabled = false,
	includeNotes = false,
	idPrefix = 'garden',
}) {
	const availableTypeIds = new Set(types.map(({ id }) => id));
	const missingTypeIds = fields.typeIds.filter((id) => !availableTypeIds.has(id));
	const locationAvailable = locations.some(({ id }) => id === fields.locationId);
	const id = (field) => `${idPrefix}-${field}`;

	return (
		<div class="garden-fields">
			<div class="form-field garden-fields__wide">
				<label class="form-label" for={id('name')}>Garden name</label>
				<input id={id('name')} class={`form-control${errors.name ? ' is-invalid' : ''}`} type="text" required value={fields.name} disabled={disabled} aria-invalid={errors.name ? 'true' : undefined} aria-describedby={errors.name ? id('name-error') : undefined} onInput={(event) => onChange('name', event.currentTarget.value)} />
				<FieldError id={id('name-error')} message={errors.name} />
			</div>
			<div class="form-field garden-fields__wide">
				<label class="form-label" for={id('subtitle')}>Subtitle <span>(optional)</span></label>
				<input id={id('subtitle')} class={`form-control${errors.subtitle ? ' is-invalid' : ''}`} type="text" value={fields.subtitle} disabled={disabled} aria-invalid={errors.subtitle ? 'true' : undefined} aria-describedby={errors.subtitle ? id('subtitle-error') : undefined} onInput={(event) => onChange('subtitle', event.currentTarget.value)} />
				<FieldError id={id('subtitle-error')} message={errors.subtitle} />
			</div>
			<div class="form-field garden-fields__wide">
				<label class="form-label" for={id('description')}>Description <span>(optional)</span></label>
				<textarea id={id('description')} class={`form-control${errors.description ? ' is-invalid' : ''}`} rows="4" value={fields.description} disabled={disabled} aria-invalid={errors.description ? 'true' : undefined} aria-describedby={errors.description ? id('description-error') : undefined} onInput={(event) => onChange('description', event.currentTarget.value)}></textarea>
				<FieldError id={id('description-error')} message={errors.description} />
			</div>
			<div class="form-field garden-fields__wide">
				<label class="form-label" for={id('location')}>Location</label>
				<select id={id('location')} class={`form-control${errors.locationId ? ' is-invalid' : ''}`} required value={fields.locationId} disabled={disabled} aria-invalid={errors.locationId ? 'true' : undefined} aria-describedby={errors.locationId ? id('location-error') : undefined} onChange={(event) => onChange('locationId', event.currentTarget.value)}>
					{!locationAvailable && fields.locationId && <option value={fields.locationId}>Unavailable Location (select another)</option>}
					{locations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}
				</select>
				<FieldError id={id('location-error')} message={errors.locationId} />
			</div>
			<div class="garden-fields__wide">
				<GardenTypeSelector
					types={types}
					selectedIds={fields.typeIds}
					onChange={(value) => onChange('typeIds', value.filter((typeId) => availableTypeIds.has(typeId)))}
					disabled={disabled}
				/>
				{missingTypeIds.length > 0 && <div class="garden-fields__warning"><span role="status">One or more saved Garden Types are unavailable.</span><button class="btn-text" type="button" disabled={disabled} onClick={() => onChange('typeIds', fields.typeIds.filter((typeId) => availableTypeIds.has(typeId)))}>Remove unavailable selections</button></div>}
				{errors.typeIds && <p class="garden-fields__error" role="alert">{errors.typeIds}</p>}
			</div>
			<div class="form-field">
				<label class="form-label" for={id('start-date')}>Start date <span>(optional)</span></label>
				<input id={id('start-date')} class={`form-control${errors.startDate ? ' is-invalid' : ''}`} type="date" value={fields.startDate} disabled={disabled} aria-invalid={errors.startDate ? 'true' : undefined} aria-describedby={errors.startDate ? id('start-date-error') : undefined} onInput={(event) => onChange('startDate', event.currentTarget.value)} />
				<FieldError id={id('start-date-error')} message={errors.startDate} />
			</div>
			<div class="form-field">
				<label class="form-label" for={id('end-date')}>End date <span>(optional)</span></label>
				<input id={id('end-date')} class={`form-control${errors.endDate ? ' is-invalid' : ''}`} type="date" value={fields.endDate} disabled={disabled} aria-invalid={errors.endDate ? 'true' : undefined} aria-describedby={errors.endDate ? id('end-date-error') : undefined} onInput={(event) => onChange('endDate', event.currentTarget.value)} />
				<FieldError id={id('end-date-error')} message={errors.endDate} />
			</div>
			{includeNotes && (
				<div class="form-field garden-fields__wide">
					<label class="form-label" for={id('notes')}>Garden Notes <span>(optional)</span></label>
					<textarea id={id('notes')} class={`form-control${errors.notes ? ' is-invalid' : ''}`} rows="7" maxLength={GARDEN_NOTES_MAX_LENGTH} value={fields.notes} disabled={disabled} aria-invalid={errors.notes ? 'true' : undefined} aria-describedby={describedBy(id('notes-count'), errors.notes && id('notes-error'))} onInput={(event) => onChange('notes', event.currentTarget.value)}></textarea>
					<CharacterCounter value={fields.notes} maxChars={GARDEN_NOTES_MAX_LENGTH} id={id('notes-count')} />
					<FieldError id={id('notes-error')} message={errors.notes} />
				</div>
			)}
		</div>
	);
}
