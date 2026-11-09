import { beforeEach, describe, expect, it, vi } from 'vitest';

// Exercise editor event handlers with persistent hook slots, without a browser.
const hooks = vi.hoisted(() => ({ slots: [], index: 0, effects: [], route: vi.fn() }));
vi.mock('preact-iso', () => ({ useLocation: () => ({ route: hooks.route }) }));
vi.mock('preact/hooks', () => {
	function slot(initial) {
		const index = hooks.index++;
		if (!(index in hooks.slots)) hooks.slots[index] = initial();
		return index;
	}
	return {
		useState(initial) {
			const index = slot(() => initial);
			return [hooks.slots[index], (value) => {
				hooks.slots[index] = typeof value === 'function' ? value(hooks.slots[index]) : value;
			}];
		},
		useRef: (initial) => hooks.slots[slot(() => ({ current: initial }))],
		useMemo: (factory) => hooks.slots[slot(factory)],
		useEffect(effect) { slot(() => { hooks.effects.push(effect); return true; }); },
	};
});

import { GardenDraftEditor } from './FullGardenCreation.jsx';
import { GardenTemplateSelection } from './GardenTemplateSelection.jsx';
import { GardenFields } from '../../components/GardenFields.jsx';

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	return [node, ...nodes(node.props?.children)];
}
function button(tree, label) {
	return nodes(tree).find((node) => node.type === 'button' && [node.props.children].flat().join('') === label);
}
const template = {
	id: 'source', name: 'Saved Template',
	configuration: { name: 'Original template name', locationId: 'home', typeIds: [] },
};
const fields = {
	name: 'Edited after application', subtitle: 'Keep subtitle', description: 'Keep description',
	locationId: 'home', typeIds: [], startDate: '2026-04-01', endDate: '',
};

function editor({ mode = 'wizard', templates = [template], sourceTemplateId = template.id } = {}) {
	let draft = { id: 'draft', createdAt: 'created', preferredEditor: mode, sourceTemplateId, fields };
	const workspace = {
		drafts: { save: vi.fn(async (record) => { draft = record; return record; }) },
		templates: { list: vi.fn(async () => templates), resolveConfiguration: vi.fn() },
	};
	const references = { locations: [{ id: 'home', name: 'Home' }], types: [] };
	function render() {
		hooks.index = 0;
		return GardenDraftEditor({ draft, references, workspace, mode });
	}
	async function mount() {
		const tree = render();
		for (const effect of hooks.effects.splice(0)) effect();
		await Promise.resolve();
		return tree;
	}
	return {
		render, mount, workspace,
		get draft() { return draft; },
		switchMode(nextMode) {
			mode = nextMode;
			hooks.slots = [];
			hooks.effects = [];
		},
	};
}
function selector(tree) {
	const node = nodes(tree).find((node) => node.type === GardenTemplateSelection);
	return GardenTemplateSelection(node.props);
}

beforeEach(() => {
	hooks.slots = [];
	hooks.effects = [];
	hooks.route.mockReset();
});

describe('Wizard applied Template progression', () => {
	it.each([false, true])('continues with edited fields without reapplying (deleted source: %s)', async (deleted) => {
		const view = editor({ templates: deleted ? [] : [template] });
		await view.mount();
		const tree = view.render();
		const selection = selector(tree);
		expect(nodes(selection).filter((node) => node.type === 'button')).toHaveLength(0);
		if (deleted) expect(JSON.stringify(selection)).toContain('Source Template unavailable');
		else {
			expect(JSON.stringify(selection)).toContain('Applied');
			expect(nodes(selection).filter((node) => node.type === 'input').map((node) => node.props.checked)).toEqual([false, true]);
		}
		const next = button(tree, 'Continue');
		expect(next.props.disabled).toBe(false);
		next.props.onClick();
		expect(nodes(view.render()).find((node) => node.type === GardenFields).props.fields).toEqual(fields);
		expect(view.workspace.templates.resolveConfiguration).not.toHaveBeenCalled();
		expect(view.workspace.drafts.save).not.toHaveBeenCalled();
	});

	it.each(['source', null])('requires applying a new selection and persists only the applied association (source: %s)', async (sourceTemplateId) => {
		const other = { ...template, id: 'other' };
		const view = editor({ templates: [template, other], sourceTemplateId });
		await view.mount();
		const choices = nodes(selector(view.render())).filter((node) => node.type === 'input');
		choices[2].props.onChange();
		const tree = view.render();
		expect(button(tree, 'Continue').props.disabled).toBe(true);
		expect(JSON.stringify(selector(tree))).toContain('Apply Template and Continue');
		await button(tree, 'Switch to Advanced').props.onClick();
		expect(view.draft).toMatchObject({ sourceTemplateId, fields, preferredEditor: 'advanced' });
		expect(view.workspace.templates.resolveConfiguration).not.toHaveBeenCalled();
	});

	it('preserves fields and source across Advanced → Wizard → Advanced, and continues normally', async () => {
		const view = editor({ mode: 'advanced' });
		await view.mount();
		await button(view.render(), 'Switch to Wizard').props.onClick();
		expect(view.draft).toMatchObject({ fields, sourceTemplateId: 'source', preferredEditor: 'wizard' });
		expect(hooks.route).toHaveBeenLastCalledWith('/gardens/new/wizard/draft');
		view.switchMode('wizard');
		await view.mount();
		const tree = view.render();
		expect(nodes(selector(tree)).filter((node) => node.type === 'input')[1].props.checked).toBe(true);
		expect(button(tree, 'Continue').props.disabled).toBe(false);
		button(tree, 'Continue').props.onClick();
		expect(nodes(view.render()).find((node) => node.type === GardenFields).props.fields).toEqual(fields);
		await button(view.render(), 'Switch to Advanced').props.onClick();
		expect(view.draft).toMatchObject({ fields, sourceTemplateId: 'source', preferredEditor: 'advanced' });
		expect(view.workspace.templates.resolveConfiguration).not.toHaveBeenCalled();
	});

	it('clears the association for Start from Scratch while keeping fields and allowing Continue', async () => {
		const view = editor();
		await view.mount();
		const selectionNode = nodes(view.render()).find((node) => node.type === GardenTemplateSelection);
		await selectionNode.props.onSelect(null);
		expect(view.draft).toMatchObject({ sourceTemplateId: null, fields });
		const tree = view.render();
		expect(button(tree, 'Continue').props.disabled).toBe(false);
		button(tree, 'Continue').props.onClick();
		expect(nodes(view.render()).find((node) => node.type === GardenFields).props.fields).toEqual(fields);
		expect(view.workspace.templates.resolveConfiguration).not.toHaveBeenCalled();
	});
});
