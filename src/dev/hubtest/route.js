export const HUBTEST_PATH = '/dev/hubtest';

export function isHubtestPath(
	pathname,
	isDevelopment = import.meta.env.DEV,
) {
	return isDevelopment && pathname === HUBTEST_PATH;
}
