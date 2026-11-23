export function SaveAsTemplateField({ checked, disabled = false, idPrefix, onChange }) {
	const id = `${idPrefix}-save-template`;
	const helpId = `${id}-help`;
	return (
		<div class="form-field garden-fields__wide">
			<input
				id={id}
				class="check"
				type="checkbox"
				checked={checked}
				disabled={disabled}
				aria-describedby={helpId}
				onChange={(event) => onChange(event.currentTarget.checked)}
			/>
			<label for={id}>Save as Template</label>
			<p id={helpId} class="form-text">You’ll confirm the Template name before the Garden is created.</p>
		</div>
	);
}
