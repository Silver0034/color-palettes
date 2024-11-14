export function formatCanonicalURL(path: string): string {
	let url = new URL(path, ORIGIN).href

	// Remove trailing slash from homepage URL
	if (url === ORIGIN + '/') {
		url = ORIGIN
	}

	return url
}
