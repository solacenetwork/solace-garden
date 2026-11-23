import { GardenColorChoices, GardenIconChoices } from '../../components/GardenIdentityChoices.jsx';
import { GardenTypeSelector } from '../../components/GardenTypeSelector.jsx';
import { CURATED_GARDEN_ICONS, GARDEN_NUMBER_ICONS, validateBootstrapIconName, validateGardenColor } from '../../gardenIdentity.js';
import { normalizeGardenFields, validateGardenDateOrder } from '../../storage/gardenValidation.js';
import { SaveAsTemplateField } from './SaveAsTemplateField.jsx';

function FieldError({ id, message }) {
	return message ? <div id={id} class="invalid-feedback">{message}</div> : null;
}

export function GardenWizardIdentityStep({ fields, errors, onChange, disabled, idPrefix }) {
	const id = (field) => `${idPrefix}-${field}`;
	return (
		<div class="garden-fields">
			<div class="form-field garden-fields__wide">
				<label class="form-label" for={id('name')}>Garden name</label>
				<input id={id('name')} name="name" class={`form-control${errors.name ? ' is-invalid' : ''}`} type="text" autoComplete="off" required value={fields.name} disabled={disabled} aria-invalid={errors.name ? 'true' : undefined} aria-describedby={errors.name ? id('name-error') : undefined} onInput={(event) => onChange('name', event.currentTarget.value)} />
				<FieldError id={id('name-error')} message={errors.name} />
			</div>
			<div class="form-field garden-fields__wide">
				<label class="form-label" for={id('subtitle')}>Subtitle <span>(optional)</span></label>
				<input id={id('subtitle')} class={`form-control${errors.subtitle ? ' is-invalid' : ''}`} type="text" value={fields.subtitle} disabled={disabled} onInput={(event) => onChange('subtitle', event.currentTarget.value)} />
			</div>
			<fieldset class="garden-create__identity-field garden-fields__wide">
				<legend>Icon <span class="garden-create__optional">(optional)</span></legend>
				<GardenIconChoices values={[...CURATED_GARDEN_ICONS, ...GARDEN_NUMBER_ICONS]} selected={fields.icon} disabled={disabled} onSelect={(value) => onChange('icon', value)} />
				<button id={id('icon')} class="btn-text garden-create__clear-identity" type="button" disabled={disabled || fields.icon === null} aria-describedby={errors.icon ? id('icon-error') : undefined} onClick={() => onChange('icon', null)}>No icon</button>
				{errors.icon && <p id={id('icon-error')} class="garden-create__field-error" role="alert">{errors.icon}</p>}
			</fieldset>
			<fieldset class="garden-create__identity-field garden-fields__wide">
				<legend>Color <span class="garden-create__optional">(optional)</span></legend>
				<GardenColorChoices selected={fields.color} disabled={disabled} onSelect={(value) => onChange('color', value)} />
				<button id={id('color')} class="btn-text garden-create__clear-identity" type="button" disabled={disabled || fields.color === null} aria-describedby={errors.color ? id('color-error') : undefined} onClick={() => onChange('color', null)}>No color</button>
				{errors.color && <p id={id('color-error')} class="garden-create__field-error" role="alert">{errors.color}</p>}
			</fieldset>
			<div class="form-field garden-fields__wide">
				<label class="form-label" for={id('image')}>Garden Image <span>(optional)</span></label>
				<input id={id('image')} class="form-control" type="file" accept="image/*" disabled aria-describedby={id('image-help')} />
				<p id={id('image-help')} class="form-text">Garden image selection will be available after Gallery and media support is implemented.</p>
			</div>
		</div>
	);
}

export function GardenWizardDetailsStep({ fields, errors, locations, onChange, disabled, idPrefix }) {
	const locationAvailable = locations.some(({ id }) => id === fields.locationId);
	return (
		<div class="garden-fields">
			<div class="form-field garden-fields__wide">
				<label class="form-label" for={`${idPrefix}-description`}>Description <span>(optional)</span></label>
				<textarea id={`${idPrefix}-description`} class="form-control" rows="5" value={fields.description} disabled={disabled} onInput={(event) => onChange('description', event.currentTarget.value)}></textarea>
			</div>
			<div class="form-field garden-fields__wide">
				<label class="form-label" for={`${idPrefix}-location`}>Geographic Location</label>
				<select id={`${idPrefix}-location`} class={`form-control${errors.locationId ? ' is-invalid' : ''}`} required value={fields.locationId} disabled={disabled} aria-invalid={errors.locationId ? 'true' : undefined} aria-describedby={errors.locationId ? `${idPrefix}-location-error` : undefined} onChange={(event) => onChange('locationId', event.currentTarget.value)}>
					{!locationAvailable && fields.locationId && <option value={fields.locationId}>Unavailable Location (select another)</option>}
					{locations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}
				</select>
				<FieldError id={`${idPrefix}-location-error`} message={errors.locationId} />
			</div>
		</div>
	);
}

export function GardenWizardTypesStep({ fields, errors, types, onChange, disabled, idPrefix }) {
	const availableTypeIds = new Set(types.map(({ id }) => id));
	const missingTypeIds = fields.typeIds.filter((id) => !availableTypeIds.has(id));
	return (
		<div class="garden-fields">
			<div class="garden-fields__wide">
				<GardenTypeSelector types={types} selectedIds={fields.typeIds} onChange={(value) => onChange('typeIds', value.filter((id) => availableTypeIds.has(id)))} disabled={disabled} />
				{missingTypeIds.length > 0 && <div class="garden-fields__warning"><span role="status">One or more saved Garden Types are unavailable.</span><button id={`${idPrefix}-typeIds`} class="btn-text" type="button" disabled={disabled} aria-describedby={errors.typeIds ? `${idPrefix}-typeIds-error` : undefined} onClick={() => onChange('typeIds', fields.typeIds.filter((id) => availableTypeIds.has(id)))}>Remove unavailable selections</button></div>}
				{errors.typeIds && <p id={`${idPrefix}-typeIds-error`} class="garden-fields__error" role="alert">{errors.typeIds}</p>}
			</div>
		</div>
	);
}

export function GardenWizardDatesStep({ fields, errors, onChange, disabled, idPrefix }) {
	return (
		<div class="garden-fields">
			{[['startDate', 'start-date', 'Start date'], ['endDate', 'end-date', 'End date']].map(([field, suffix, label]) => (
				<div class="form-field" key={field}>
					<label class="form-label" for={`${idPrefix}-${suffix}`}>{label} <span>(optional)</span></label>
					<input id={`${idPrefix}-${suffix}`} class={`form-control${errors[field] ? ' is-invalid' : ''}`} type="date" value={fields[field]} disabled={disabled} aria-invalid={errors[field] ? 'true' : undefined} aria-describedby={errors[field] ? `${idPrefix}-${suffix}-error` : undefined} onInput={(event) => onChange(field, event.currentTarget.value)} />
					<FieldError id={`${idPrefix}-${suffix}-error`} message={errors[field]} />
				</div>
			))}
		</div>
	);
}

export function GardenWizardOptionsStep({ fields, errors, onChange, disabled, idPrefix }) {
	return (
		<div class="garden-fields">
			<fieldset class="garden-create__status garden-fields__wide" aria-describedby={errors.status ? `${idPrefix}-status-error` : undefined}>
				<legend>Garden status</legend>
				<label><input id={`${idPrefix}-status`} class="radio" type="radio" name={`${idPrefix}-status`} value="planned" checked={fields.status === 'planned'} disabled={disabled} onChange={() => onChange('status', 'planned')} /> Planned</label>
				<label><input class="radio" type="radio" name={`${idPrefix}-status`} value="active" checked={fields.status === 'active'} disabled={disabled} onChange={() => onChange('status', 'active')} /> Active</label>
				{errors.status && <p id={`${idPrefix}-status-error`} class="garden-create__field-error" role="alert">{errors.status}</p>}
			</fieldset>
			<SaveAsTemplateField checked={fields.saveAsTemplate} disabled={disabled} idPrefix={idPrefix} onChange={(value) => onChange('saveAsTemplate', value)} />
		</div>
	);
}

export function GardenAdvancedOptionsStep({ fields, errors, onChange, disabled, idPrefix }) {
	const statusErrorId = `${idPrefix}-status-error`;
	const closedHelpId = `${idPrefix}-isClosed-help`;
	const closedErrorId = `${idPrefix}-isClosed-error`;
	const archived = fields.status === 'archived';
	function changeStatus(status) {
		onChange('status', status);
		if (status === 'archived' && !fields.isClosed) onChange('isClosed', true);
	}
	return (
		<div class="garden-fields">
			<fieldset class="garden-create__status garden-fields__wide" aria-describedby={errors.status ? statusErrorId : undefined}>
				<legend>Garden status</legend>
				{[
					['planned', 'Planned'], ['active', 'Active'],
					['completed', 'Completed'], ['archived', 'Archived'],
				].map(([value, label], index) => (
					<label key={value}>
						<input id={index === 0 ? `${idPrefix}-status` : undefined} class="radio" type="radio" name={`${idPrefix}-status`} value={value} checked={fields.status === value} disabled={disabled} onChange={() => changeStatus(value)} /> {label}
					</label>
				))}
				{errors.status && <p id={statusErrorId} class="garden-create__field-error" role="alert">{errors.status}</p>}
			</fieldset>
			<div class="form-field garden-fields__wide">
				<input
					id={`${idPrefix}-isClosed`}
					class="check"
					type="checkbox"
					checked={fields.isClosed}
					disabled={disabled || (archived && fields.isClosed)}
					aria-invalid={errors.isClosed ? 'true' : undefined}
					aria-describedby={[closedHelpId, errors.isClosed && closedErrorId].filter(Boolean).join(' ')}
					onChange={(event) => onChange('isClosed', event.currentTarget.checked)}
				/>
				<label for={`${idPrefix}-isClosed`}>Closed</label>
				<p id={closedHelpId} class="form-text">Closed Gardens are read-only. Archived Gardens must remain closed.</p>
				{errors.isClosed && <p id={closedErrorId} class="garden-create__field-error" role="alert">{errors.isClosed}</p>}
			</div>
			<SaveAsTemplateField checked={fields.saveAsTemplate} disabled={disabled} idPrefix={idPrefix} onChange={(value) => onChange('saveAsTemplate', value)} />
		</div>
	);
}

function validation(errors = {}) {
	return { valid: Object.keys(errors).length === 0, errors };
}

function validateIdentity(fields) {
	const errors = {};
	if (!fields.name.trim()) errors.name = 'Enter a Garden name.';
	const icon = validateBootstrapIconName(fields.icon);
	const color = validateGardenColor(fields.color);
	if (!icon.isValid) errors.icon = icon.error;
	if (!color.isValid) errors.color = color.error;
	return validation(errors);
}

function validateDetails(fields, references) {
	return validation(references.locations.some(({ id }) => id === fields.locationId)
		? {} : { locationId: 'Select an available Location.' });
}

function validateTypes(fields, references) {
	const available = new Set(references.types.map(({ id }) => id));
	return validation(fields.typeIds.some((id) => !available.has(id))
		? { typeIds: 'Remove unavailable Garden Types before continuing.' } : {});
}

function validateDates(fields) {
	try {
		const dates = normalizeGardenFields({
			startDate: fields.startDate || null,
			endDate: fields.endDate || null,
		});
		validateGardenDateOrder(dates);
		return validation();
	} catch (error) {
		return validation({ [error.field ?? 'endDate']: error.message });
	}
}

function validateOptions(fields) {
	return validation(['planned', 'active'].includes(fields.status)
		? {} : { status: 'Choose Planned or Active.' });
}

export function validateAdvancedOptions(fields) {
	if (!['planned', 'active', 'completed', 'archived'].includes(fields.status)) {
		return validation({ status: 'Choose Planned, Active, Completed, or Archived.' });
	}
	if (typeof fields.isClosed !== 'boolean') {
		return validation({ isClosed: 'Choose whether this Garden is closed.' });
	}
	if (fields.status === 'archived' && !fields.isClosed) {
		return validation({ isClosed: 'Archived Gardens must be closed.' });
	}
	return validation();
}

export const GARDEN_WIZARD_STEP_FORMS = Object.freeze({
	identity: Object.freeze({ Component: GardenWizardIdentityStep, validate: validateIdentity }),
	details: Object.freeze({ Component: GardenWizardDetailsStep, validate: validateDetails }),
	types: Object.freeze({ Component: GardenWizardTypesStep, validate: validateTypes }),
	dates: Object.freeze({ Component: GardenWizardDatesStep, validate: validateDates }),
	options: Object.freeze({ Component: GardenWizardOptionsStep, validate: validateOptions }),
});

export const GARDEN_FIELD_STEP_IDS = Object.freeze({
	name: 'identity', subtitle: 'identity', icon: 'identity', color: 'identity',
	description: 'details', locationId: 'details', typeIds: 'types',
	startDate: 'dates', endDate: 'dates', status: 'options', isClosed: 'options',
});

export function gardenWizardStepRegistration(steps) {
	const registrations = steps.map((step) => ({ ...step, ...GARDEN_WIZARD_STEP_FORMS[step.id] }));
	const missing = registrations.find(({ Component, validate }) => !Component || !validate);
	if (missing || registrations.length !== Object.keys(GARDEN_WIZARD_STEP_FORMS).length) {
		throw new Error(`Garden Wizard form registration does not match the production steps${missing ? `: ${missing.id}` : ''}.`);
	}
	return registrations;
}
