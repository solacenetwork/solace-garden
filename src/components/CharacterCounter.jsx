function formatCount(value) {
	return value.toLocaleString();
}

export function CharacterCounter({ value, maxChars, id, className = '' }) {
	const count = value.length;
	const hasMaximum = Number.isInteger(maxChars) && maxChars > 0;
	const overBy = hasMaximum ? count - maxChars : 0;
	const overLimit = overBy > 0;
	const classes = [
		'form-text',
		'character-counter',
		overLimit && 'fg-danger',
		className,
	].filter(Boolean).join(' ');
	const countText = hasMaximum
		? `${formatCount(count)} / ${formatCount(maxChars)} ${maxChars === 1 ? 'character' : 'characters'}`
		: `${formatCount(count)} ${count === 1 ? 'character' : 'characters'}`;

	return (
		<p id={id} class={classes}>
			{overLimit ? `${countText} — ${formatCount(overBy)} over limit` : countText}
		</p>
	);
}
