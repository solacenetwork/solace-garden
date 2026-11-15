import { afterEach, describe, expect, it, vi } from 'vitest';
const hooks = vi.hoisted(() => ({ field: { focus: vi.fn(), select: vi.fn() }, status: vi.fn() }));
vi.mock('preact/hooks', () => ({ useRef: () => ({ current: hooks.field }), useState: () => ['', hooks.status] }));
import { StorageRecoveryScreen } from './StorageRecoveryScreen.jsx';
function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	return [node, ...nodes(node.props?.children)];
}
const diagnostics = { code: 'CONTROL_OPEN_FAILED', stage: 'configuration-populate-uuid', exceptions: [] };
function screen() { return nodes(StorageRecoveryScreen({ error: { title: 'Garden storage needs attention', message: 'The local storage configuration could not be opened.', action: 'Retry.', diagnostics } })); }
const copy = () => screen().find(node => node.type === 'button' && node.props.children === 'Copy technical diagnostics').props.onClick();
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe('recovery diagnostics copying', () => {
	it('copies only the safe report through the clipboard when available', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal('navigator', { clipboard: { writeText } });
		await copy();
		expect(writeText).toHaveBeenCalledWith(JSON.stringify(diagnostics, null, 2));
		expect(hooks.status).toHaveBeenCalledWith('Technical diagnostics copied.');
		const field = screen().find(node => node.type === 'textarea');
		expect(field.props.readOnly).toBe(true);
		expect(field.props.value).toBe(JSON.stringify(diagnostics, null, 2));
	});
	it('supports copying on HTTP without the secure clipboard API', async () => {
		vi.stubGlobal('navigator', {});
		const execCommand = vi.fn(() => true);
		vi.stubGlobal('document', { execCommand });
		await copy();
		expect(hooks.field.select).toHaveBeenCalled();
		expect(execCommand).toHaveBeenCalledWith('copy');
		expect(hooks.status).toHaveBeenCalledWith('Technical diagnostics copied.');
	});
	it('leaves a selectable report and instructions when clipboard access is refused', async () => {
		vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } });
		await copy();
		expect(hooks.field.focus).toHaveBeenCalled();
		expect(hooks.field.select).toHaveBeenCalled();
		expect(hooks.status).toHaveBeenCalledWith('Select and copy the technical diagnostics below.');
	});
});
