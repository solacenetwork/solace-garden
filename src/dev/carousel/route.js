export const CAROUSEL_POC_PATH = '/dev/carousel';

export function isCarouselPocPath(
	pathname,
	isDevelopment = import.meta.env.DEV,
) {
	return isDevelopment && pathname === CAROUSEL_POC_PATH;
}
