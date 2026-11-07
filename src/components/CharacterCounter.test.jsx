import { describe, expect, it } from 'vitest';
import { CharacterCounter } from './CharacterCounter.jsx';

function counter(props) {
	return CharacterCounter(props);
}

describe('CharacterCounter', () => {
	it('shows an empty value as zero characters', () => {
		expect(counter({ value: '' }).props.children).toBe('0 characters');
	});

	it('uses singular and plural character wording', () => {
		expect(counter({ value: 'a' }).props.children).toBe('1 character');
		expect(counter({ value: 'ab' }).props.children).toBe('2 characters');
		expect(counter({ value: 'a', maxChars: 1 }).props.children).toBe('1 / 1 character');
	});

	it('supports count-only mode when no maximum is supplied', () => {
		expect(counter({ value: 'garden' }).props.children).toBe('6 characters');
	});

	it('shows a below-limit count and maximum', () => {
		expect(counter({ value: 'hello', maxChars: 10 }).props.children).toBe('5 / 10 characters');
	});

	it('shows an exactly-at-limit count without an over-limit warning', () => {
		const result = counter({ value: 'hello', maxChars: 5 });
		expect(result.props.children).toBe('5 / 5 characters');
		expect(result.props.class).not.toContain('fg-danger');
	});

	it('shows textual and visual over-limit feedback without truncating', () => {
		const value = 'abcdef';
		const result = counter({ value, maxChars: 5 });
		expect(result.props.children).toBe('6 / 5 characters — 1 over limit');
		expect(result.props.class).toContain('fg-danger');
		expect(value).toHaveLength(6);
	});

	it('formats counts and maximums with native thousands separators', () => {
		const result = counter({ value: 'x'.repeat(1234), maxChars: 2000 });
		expect(result.props.children).toBe(
			`${(1234).toLocaleString()} / ${(2000).toLocaleString()} characters`,
		);
	});

	it('counts emoji consistently with JavaScript string length', () => {
		const value = '🌱';
		expect(value.length).toBe(2);
		expect(counter({ value }).props.children).toBe('2 characters');
	});

	it('reflects updated props in the rendered display', () => {
		expect(counter({ value: 'a', maxChars: 3 }).props.children).toBe('1 / 3 characters');
		expect(counter({ value: 'abcd', maxChars: 3 }).props.children).toBe('4 / 3 characters — 1 over limit');
	});

	it('supports an optional HTML ID and additional CSS class', () => {
		const result = counter({
			value: 'abc',
			id: 'garden-notes-counter',
			className: 'text-end',
		});
		expect(result.type).toBe('p');
		expect(result.props.id).toBe('garden-notes-counter');
		expect(result.props.class).toBe('form-text character-counter text-end');
		expect(result.props['aria-live']).toBeUndefined();
	});
});
