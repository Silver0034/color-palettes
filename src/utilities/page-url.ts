export function formatCanonicalURL(path: string): string {
	let url = new URL(path, ORIGIN).href

	// Remove trailing slash from homepage URL
	if (url === ORIGIN + '/') {
		url = ORIGIN
	}

	return url
}

export function getUTMLink(
	url: string,
	campaign: string,
	medium = 'landing-page',
	source = 'JoinVDC'
): string {
	if (!url) throw new Error('URL is required')

	// If the url is internal, do not add UTM params
	if (url.startsWith(ORIGIN)) return url
	if (url.startsWith('/')) return url
	if (url.startsWith('mailto:')) return url
	if (url.startsWith('tel:')) return url
	if (url.startsWith('sms:')) return url

	if (!campaign) throw new Error('Campaign is required')

	const utmParams = new URLSearchParams({
		utm_source: source,
		utm_campaign: campaign,
		utm_medium: medium
	})

	return `${url}?${utmParams.toString()}`
}
