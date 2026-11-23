export function suggestedTemplateName(gardenName) {
	return `${gardenName} Template`;
}

export function SaveTemplateDialog({
	dialogRef, inputRef, garden, name, onNameChange, nameError, saveError,
	busy, onCancel, onSubmit, submitLabel = 'Save Template', description,
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
					<p>{description ?? <>Create a reusable snapshot of <strong>{garden.name}</strong>. The Garden will not be changed.</>}</p>
					<div class="form-field">
						<label class="form-label" for="garden-template-name">Template name</label>
						<input ref={inputRef} class="form-control" id="garden-template-name" type="text" autoComplete="off" value={name} disabled={busy} aria-invalid={nameError ? 'true' : undefined} aria-describedby={describedBy} onInput={(event) => onNameChange(event.currentTarget.value)} />
						{nameError && <p class="garden-template-dialog__error" id="template-name-error" role="alert">{nameError}</p>}
					</div>
					{saveError && <p class="garden-template-dialog__error" id="template-save-error" role="alert">{saveError}</p>}
				</div>
				<div class="dialog-footer">
					<button class="btn-outline" type="button" disabled={busy} onClick={onCancel}>Cancel</button>
					<button class="btn-solid theme-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
				</div>
			</form>
		</dialog>
	);
}
