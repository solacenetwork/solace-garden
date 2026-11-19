import Dialog from 'bootstrap/js/dist/dialog.js';
import Tab from 'bootstrap/js/dist/tab.js';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
	CURATED_GARDEN_ICONS,
	GARDEN_COLOR_PALETTE,
	GARDEN_NUMBER_ICONS,
	renderableGardenColor,
	renderableGardenIcon,
	validateBootstrapIconName,
	validateGardenColor,
} from '../gardenIdentity.js';

const ALL_CURATED_ICONS = new Set([...CURATED_GARDEN_ICONS, ...GARDEN_NUMBER_ICONS]);
const PALETTE_COLORS = new Set(GARDEN_COLOR_PALETTE.map(({ value }) => value));

export function GardenIdentityBadge({ icon = null, color = null, className = '' }) {
	const iconName = renderableGardenIcon(icon);
	const ringColor = renderableGardenColor(color);
	return (
		<span
			class={`garden-identity-badge${className ? ` ${className}` : ''}`}
			style={{ '--garden-identity-color': ringColor }}
			aria-hidden="true"
		>
			<span class="garden-identity-badge__inner">
				<i class={`bi bi-${iconName}`}></i>
			</span>
		</span>
	);
}

export function createGardenIdentityDraft(icon, color, type = 'color') {
	const normalizedColor = validateGardenColor(color).color;
	return {
		activeType: type === 'icon' ? 'icon' : 'color',
		draftIcon: icon ?? null,
		draftColor: normalizedColor,
		customIcon: typeof icon === 'string' && !ALL_CURATED_ICONS.has(icon) ? icon : '',
		customColor: normalizedColor && !PALETTE_COLORS.has(normalizedColor) ? normalizedColor : '',
		isCustomIcon: typeof icon === 'string' && !ALL_CURATED_ICONS.has(icon),
		isCustomColor: Boolean(normalizedColor && !PALETTE_COLORS.has(normalizedColor)),
	};
}

export function resetGardenIdentityDraft(draft) {
	return draft.activeType === 'icon'
		? { ...draft, draftIcon: null, customIcon: '', isCustomIcon: false }
		: { ...draft, draftColor: null, customColor: '', isCustomColor: false };
}

export function validateGardenIdentityDraft(draft) {
	const icon = validateBootstrapIconName(draft.isCustomIcon ? draft.customIcon : draft.draftIcon);
	const color = validateGardenColor(draft.isCustomColor ? draft.customColor : draft.draftColor);
	return {
		icon,
		color,
		isValid: icon.isValid && color.isValid,
		identity: { icon: icon.name, color: color.color },
	};
}

function IconChoices({ values, selected, onSelect }) {
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
						onClick={() => onSelect(name)}
					>
						<i class={`bi bi-${name}`} aria-hidden="true"></i>
						{active && <i class="bi bi-check-circle-fill garden-identity-option__check" aria-hidden="true"></i>}
					</button>
				);
			})}
		</div>
	);
}

export function GardenIdentityDialogView({
	dialogRef,
	colorTabRef,
	iconTabRef,
	draftIcon,
	draftColor,
	customIcon,
	customColor,
	isCustomIcon,
	isCustomColor,
	activeType,
	saving = false,
	error = '',
	onSelectIcon = () => {},
	onSelectColor = () => {},
	onSelectCustomIcon = () => {},
	onSelectCustomColor = () => {},
	onCustomIconChange = () => {},
	onCustomColorChange = () => {},
	onReset = () => {},
	onCancel = () => {},
	onSubmit = () => {},
}) {
	const validation = validateGardenIdentityDraft({
		draftIcon, draftColor, customIcon, customColor, isCustomIcon, isCustomColor,
	});
	const { icon: iconValidation, color: colorValidation } = validation;
	const selectedIcon = isCustomIcon ? null : draftIcon;
	const selectedColor = isCustomColor ? null : draftColor;
	return (
		<dialog
			class="dialog dialog-scrollable md-down:dialog-fullscreen garden-identity-dialog"
			ref={dialogRef}
			aria-labelledby="garden-identity-title"
		>
			<div class="dialog-header">
				<h2 class="dialog-title" id="garden-identity-title">Garden Identity</h2>
				<button class="btn-close garden-identity-dialog__close" type="button" aria-label="Cancel Garden identity changes" disabled={saving} onClick={onCancel}></button>
			</div>
			<form class="garden-identity-dialog__form" onSubmit={onSubmit}>
				<div class="dialog-body">
					<div class="garden-identity-preview" aria-label="Garden identity preview">
						<GardenIdentityBadge icon={draftIcon} color={draftColor} />
						<span>Preview</span>
					</div>
					<ul class="nav nav-tabs garden-identity-tabs">
						<li class="nav-item">
							<button ref={colorTabRef} class="nav-link active" id="garden-identity-color-tab" type="button" data-bs-toggle="tab" data-bs-target="#garden-identity-color-panel">Color</button>
						</li>
						<li class="nav-item">
							<button ref={iconTabRef} class="nav-link" id="garden-identity-icon-tab" type="button" data-bs-toggle="tab" data-bs-target="#garden-identity-icon-panel">Icon</button>
						</li>
					</ul>
					<div class="tab-content garden-identity-tab-content">
						<div class="tab-pane fade show active" id="garden-identity-color-panel">
							<fieldset class="garden-identity-fieldset">
								<legend>Choose a color</legend>
								<div class="garden-identity-options garden-identity-options--colors">
									{GARDEN_COLOR_PALETTE.map(({ name, value }) => {
										const active = selectedColor === value;
										return (
											<button
												class={`garden-identity-option garden-identity-option--color${active ? ' garden-identity-option--selected' : ''}`}
												type="button"
												style={{ '--garden-swatch-color': value }}
												aria-pressed={active}
												aria-label={`${name}, ${value}`}
												onClick={() => onSelectColor(value)}
											>
												<span class="garden-identity-option__swatch" aria-hidden="true"></span>
												<span>{name}</span>
												{active && <i class="bi bi-check-circle-fill garden-identity-option__check" aria-hidden="true"></i>}
											</button>
										);
									})}
								</div>
								<button class={`garden-identity-custom${isCustomColor ? ' garden-identity-custom--selected' : ''}`} type="button" aria-pressed={isCustomColor} onClick={onSelectCustomColor}>
									<i class="bi bi-palette-fill" aria-hidden="true"></i> Custom
								</button>
								{isCustomColor && (
									<div class="form-field garden-identity-custom-field">
										<label class="form-label" for="garden-identity-custom-color">Six-digit hex color</label>
										<input
											id="garden-identity-custom-color"
											class={`form-control${colorValidation.isValid ? '' : ' is-invalid'}`}
											type="text"
											inputMode="text"
											placeholder="#287D46"
											value={customColor}
											aria-invalid={colorValidation.isValid ? undefined : 'true'}
											aria-describedby={colorValidation.isValid ? undefined : 'garden-identity-color-error'}
											onInput={(event) => onCustomColorChange(event.currentTarget.value)}
										/>
										{!colorValidation.isValid && <div class="invalid-feedback" id="garden-identity-color-error">{colorValidation.error}</div>}
									</div>
								)}
							</fieldset>
						</div>
						<div class="tab-pane fade" id="garden-identity-icon-panel">
							<fieldset class="garden-identity-fieldset">
								<legend>Garden symbols</legend>
								<IconChoices values={CURATED_GARDEN_ICONS} selected={selectedIcon} onSelect={onSelectIcon} />
								<h3>Number Markers</h3>
								<IconChoices values={GARDEN_NUMBER_ICONS} selected={selectedIcon} onSelect={onSelectIcon} />
								<button class={`garden-identity-custom${isCustomIcon ? ' garden-identity-custom--selected' : ''}`} type="button" aria-pressed={isCustomIcon} onClick={onSelectCustomIcon}>
									<i class="bi bi-keyboard-fill" aria-hidden="true"></i> Custom
								</button>
								{isCustomIcon && (
									<div class="form-field garden-identity-custom-field">
										<label class="form-label" for="garden-identity-custom-icon">Bootstrap Icon name</label>
										<input
											id="garden-identity-custom-icon"
											class={`form-control${iconValidation.isValid ? '' : ' is-invalid'}`}
											type="text"
											autoComplete="off"
											placeholder="flower1"
											value={customIcon}
											aria-invalid={iconValidation.isValid ? undefined : 'true'}
											aria-describedby={iconValidation.isValid ? undefined : 'garden-identity-icon-error'}
											onInput={(event) => onCustomIconChange(event.currentTarget.value)}
										/>
										{!iconValidation.isValid && <div class="invalid-feedback" id="garden-identity-icon-error">{iconValidation.error}</div>}
									</div>
								)}
							</fieldset>
						</div>
					</div>
					{error && <p class="garden-identity-dialog__error" role="alert">{error}</p>}
				</div>
				<div class="dialog-footer garden-identity-dialog__footer">
					<button class="btn-text" type="button" disabled={saving} onClick={onReset}>Reset</button>
					<button class="btn-outline" type="button" disabled={saving} onClick={onCancel}>Cancel</button>
					<button class="btn-solid theme-primary" type="submit" disabled={saving || !validation.isValid}>
						{saving ? 'Saving…' : 'Save Identity'}
					</button>
				</div>
			</form>
		</dialog>
	);
}

export function GardenIdentityModal({ open, type = 'color', icon = null, color = null, trigger = null, onSave, onDismiss }) {
	const dialogElement = useRef(null);
	const dialogInstance = useRef(null);
	const colorTabElement = useRef(null);
	const iconTabElement = useRef(null);
	const isShown = useRef(false);
	const closeAfterShown = useRef(false);
	const savingRef = useRef(false);
	const [draft, setDraft] = useState(() => createGardenIdentityDraft(icon, color, type));
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		const element = dialogElement.current;
		if (!element) return undefined;
		const instance = new Dialog(element);
		const tabs = [colorTabElement.current, iconTabElement.current]
			.filter(Boolean).map((tab) => Tab.getOrCreateInstance(tab));
		const handleShown = () => {
			isShown.current = true;
			if (closeAfterShown.current) {
				closeAfterShown.current = false;
				void instance.hide();
			}
		};
		const handleHide = (event) => {
			if (savingRef.current) event.preventDefault();
		};
		const handleHidden = () => {
			isShown.current = false;
			closeAfterShown.current = false;
			onDismiss?.();
		};
		const handleTabShown = (event) => {
			setDraft((current) => ({
				...current,
				activeType: event.currentTarget === iconTabElement.current ? 'icon' : 'color',
			}));
		};
		dialogInstance.current = instance;
		element.addEventListener('shown.bs.dialog', handleShown);
		element.addEventListener('hide.bs.dialog', handleHide);
		element.addEventListener('hidden.bs.dialog', handleHidden);
		colorTabElement.current?.addEventListener('shown.bs.tab', handleTabShown);
		iconTabElement.current?.addEventListener('shown.bs.tab', handleTabShown);
		return () => {
			element.removeEventListener('shown.bs.dialog', handleShown);
			element.removeEventListener('hide.bs.dialog', handleHide);
			element.removeEventListener('hidden.bs.dialog', handleHidden);
			colorTabElement.current?.removeEventListener('shown.bs.tab', handleTabShown);
			iconTabElement.current?.removeEventListener('shown.bs.tab', handleTabShown);
			for (const tab of tabs) tab.dispose();
			instance.dispose();
			dialogInstance.current = null;
		};
	}, []);

	useEffect(() => {
		if (!open) {
			if (isShown.current) void dialogInstance.current?.hide();
			return;
		}
		const next = createGardenIdentityDraft(icon, color, type);
		setDraft(next);
		setError('');
		const tabElement = next.activeType === 'icon' ? iconTabElement.current : colorTabElement.current;
		void Tab.getOrCreateInstance(tabElement)?.show();
		void dialogInstance.current?.show(trigger);
	}, [open]);

	function close() {
		if (savingRef.current) return;
		if (!isShown.current) {
			closeAfterShown.current = true;
			return;
		}
		void dialogInstance.current?.hide();
	}

	function reset() {
		setError('');
		setDraft(resetGardenIdentityDraft);
	}

	async function save(event) {
		event?.preventDefault();
		if (savingRef.current) return;
		const validation = validateGardenIdentityDraft(draft);
		if (!validation.isValid) return;
		savingRef.current = true;
		setSaving(true);
		setError('');
		try {
			const saved = await onSave(validation.identity);
			if (saved === false) throw new Error('Garden identity was not saved.');
			savingRef.current = false;
			setSaving(false);
			void dialogInstance.current?.hide();
		} catch (caught) {
			setError(caught?.code === 'GARDEN_READ_ONLY'
				? 'This Garden became read-only before the identity could be saved.'
				: 'This Garden identity could not be saved. Your selection is still here.');
			savingRef.current = false;
			setSaving(false);
		}
	}

	return (
		<GardenIdentityDialogView
			dialogRef={dialogElement}
			colorTabRef={colorTabElement}
			iconTabRef={iconTabElement}
			{...draft}
			saving={saving}
			error={error}
			onSelectIcon={(name) => setDraft((current) => ({ ...current, draftIcon: name, isCustomIcon: false }))}
			onSelectColor={(value) => setDraft((current) => ({ ...current, draftColor: value, isCustomColor: false }))}
			onSelectCustomIcon={() => setDraft((current) => ({ ...current, isCustomIcon: true, customIcon: current.customIcon || (ALL_CURATED_ICONS.has(current.draftIcon) ? '' : current.draftIcon ?? '') }))}
			onSelectCustomColor={() => setDraft((current) => ({ ...current, isCustomColor: true, customColor: current.customColor || (PALETTE_COLORS.has(current.draftColor) ? '' : current.draftColor ?? '') }))}
			onCustomIconChange={(value) => setDraft((current) => ({ ...current, customIcon: value, draftIcon: validateBootstrapIconName(value).name }))}
			onCustomColorChange={(value) => setDraft((current) => ({ ...current, customColor: value, draftColor: validateGardenColor(value).color }))}
			onReset={reset}
			onCancel={close}
			onSubmit={save}
		/>
	);
}

export function GardenIdentityEditor({ garden, disabled = false, onSave }) {
	const [request, setRequest] = useState(null);
	function open(type, event) {
		setRequest({ type, trigger: event.currentTarget });
	}
	return (
		<section class="garden-identity-editor" aria-labelledby="garden-identity-editor-title">
			<div class="garden-identity-editor__preview">
				<GardenIdentityBadge icon={garden.icon} color={garden.color} />
				<div>
					<h2 id="garden-identity-editor-title">Garden Identity</h2>
					<p>Choose an optional color and icon to recognize this Garden.</p>
				</div>
			</div>
			<div class="garden-identity-editor__actions">
				<button class="btn-outline" type="button" disabled={disabled} onClick={(event) => open('color', event)}>
					<i class="bi bi-palette-fill" aria-hidden="true"></i> Choose Color
				</button>
				<button class="btn-outline" type="button" disabled={disabled} onClick={(event) => open('icon', event)}>
					<i class="bi bi-flower1" aria-hidden="true"></i> Choose Icon
				</button>
			</div>
			<GardenIdentityModal
				open={Boolean(request)}
				type={request?.type}
				trigger={request?.trigger}
				icon={garden.icon}
				color={garden.color}
				onSave={onSave}
				onDismiss={() => setRequest(null)}
			/>
		</section>
	);
}
