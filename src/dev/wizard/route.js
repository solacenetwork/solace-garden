export const WIZARD_PREVIEW_PATH = '/dev/wizard';

export function isWizardPreviewPath(
	pathname,
	isDevelopment = import.meta.env.DEV,
) {
	return isDevelopment && pathname === WIZARD_PREVIEW_PATH;
}
