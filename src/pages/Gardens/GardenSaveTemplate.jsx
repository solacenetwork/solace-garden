import Dialog from 'bootstrap/js/dist/dialog.js';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { createGardenTemplatesService } from '../../services/gardenTemplates.js';

export function suggestedTemplateName(gardenName) {
	return `${gardenName} Template`;
}

export function savedTemplateConfirmation(templateName) {
	return `Template “${templateName}” was saved.`;
}

export function createSaveTemplateSubmitter({
	createTemplate,
	onNameError = () => {},
	onSaving = () => {},
	onSaveError = () => {},
}) {
	let saving = false;
	return async (gardenId, name) => {
		if (saving) return null;
		if (typeof name !== 'string' || !name.trim()) {
			onNameError('Enter a Template name.');
			return null;
		}
		saving = true;
		onSaving(true);
		onNameError('');
		onSaveError('');
		try {
			return await createTemplate({ gardenId, name });
		} catch {
			onSaveError('This Template could not be saved. Your name was kept so you can try again.');
			return null;
		} finally {
			saving = false;
			onSaving(false);
		}
	};
}

export function SaveTemplateDialog({
	dialogRef, inputRef, garden, name, onNameChange, nameError, saveError,
	busy, onCancel, onSubmit,
}) {
	const describedBy = [nameError && 'template-name-error', saveError && 'template-save-error']
		.filter(Boolean).join(' ') || undefined;
	return (
		<dialog class="dialog dialog-scrollable garden-template-dialog" ref={dialogRef} aria-labelledby="save-template-title">
			<div class="dialog-header">
				<h2 class="dialog-title" id="save-template-title">Save as Template</h2>
				<button class="btn-close" type="button" aria-label="Cancel saving Template" disabled={busy} onClick={onCancel}></button>
			</div>
			<form onSubmit={onSubmit}>
				<div class="dialog-body">
					<p>Create a reusable snapshot of <strong>{garden.name}</strong>. The Garden will not be changed.</p>
					<div class="form-field">
						<label class="form-label" for="garden-template-name">Template name</label>
						<input
							ref={inputRef}
							class="form-control"
							id="garden-template-name"
							type="text"
							autoComplete="off"
							value={name}
							disabled={busy}
							aria-invalid={nameError ? 'true' : undefined}
							aria-describedby={describedBy}
							onInput={(event) => onNameChange(event.currentTarget.value)}
						/>
						{nameError && <p class="garden-template-dialog__error" id="template-name-error" role="alert">{nameError}</p>}
					</div>
					{saveError && <p class="garden-template-dialog__error" id="template-save-error" role="alert">{saveError}</p>}
				</div>
				<div class="dialog-footer">
					<button class="btn-outline" type="button" disabled={busy} onClick={onCancel}>Cancel</button>
					<button class="btn-solid theme-primary" type="submit" disabled={busy}>
						{busy ? 'Saving…' : 'Save Template'}
					</button>
				</div>
			</form>
		</dialog>
	);
}

export function GardenSaveTemplate({ garden, repository }) {
	const dialogElement = useRef(null);
	const inputElement = useRef(null);
	const dialogInstance = useRef(null);
	const triggerElement = useRef(null);
	const busyRef = useRef(false);
	const [name, setName] = useState(suggestedTemplateName(garden.name));
	const [nameError, setNameError] = useState('');
	const [saveError, setSaveError] = useState('');
	const [busy, setBusy] = useState(false);
	const [confirmation, setConfirmation] = useState('');
	const templates = useMemo(() => createGardenTemplatesService(repository), [repository]);
	const submitTemplate = useMemo(() => createSaveTemplateSubmitter({
		createTemplate: (input) => templates.createFromGarden(input),
		onNameError: setNameError,
		onSaving(value) {
			busyRef.current = value;
			setBusy(value);
		},
		onSaveError: setSaveError,
	}), [templates]);

	useEffect(() => {
		const element = dialogElement.current;
		if (!element) return undefined;
		const instance = new Dialog(element);
		const focusInput = () => {
			inputElement.current?.focus();
			inputElement.current?.select();
		};
		const preventBusyHide = (event) => {
			if (busyRef.current) event.preventDefault();
		};
		const restoreFocus = () => triggerElement.current?.focus();
		dialogInstance.current = instance;
		element.addEventListener('shown.bs.dialog', focusInput);
		element.addEventListener('hide.bs.dialog', preventBusyHide);
		element.addEventListener('hidden.bs.dialog', restoreFocus);
		return () => {
			element.removeEventListener('shown.bs.dialog', focusInput);
			element.removeEventListener('hide.bs.dialog', preventBusyHide);
			element.removeEventListener('hidden.bs.dialog', restoreFocus);
			instance.dispose();
			dialogInstance.current = null;
		};
	}, []);

	function open(event) {
		triggerElement.current = event.currentTarget;
		setName(suggestedTemplateName(garden.name));
		setNameError('');
		setSaveError('');
		setConfirmation('');
		void dialogInstance.current?.show(event.currentTarget);
	}

	function cancel() {
		if (!busyRef.current) void dialogInstance.current?.hide();
	}

	async function save(event) {
		event.preventDefault();
		const created = await submitTemplate(garden.id, name);
		if (!created) return;
		await dialogInstance.current?.hide();
		setConfirmation(savedTemplateConfirmation(created.name));
	}

	return (
		<div class="garden-template-action">
			<button class="btn-outline" type="button" onClick={open}>
				<i class="bi bi-copy" aria-hidden="true"></i> Save as Template
			</button>
			{confirmation && <p class="garden-template-action__status" role="status" aria-live="polite">{confirmation}</p>}
			<SaveTemplateDialog
				dialogRef={dialogElement}
				inputRef={inputElement}
				garden={garden}
				name={name}
				onNameChange={(value) => {
					setName(value);
					if (nameError) setNameError('');
				}}
				nameError={nameError}
				saveError={saveError}
				busy={busy}
				onCancel={cancel}
				onSubmit={save}
			/>
		</div>
	);
}
