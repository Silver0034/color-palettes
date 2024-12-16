import { defineMiddleware } from 'astro:middleware'
import { format, height, width } from './image-generator'

export const onRequest = defineMiddleware(async (context, next) => {
	const response = await next()

	// Stop if not HTML
	if (!response.headers.get('content-type')?.includes('text/html')) {
		return next()
	}

	const html = await response.text()
	if (!html) {
		return next()
	}

	let pathname = context.url.pathname
	if ((pathname = '/')) pathname = 'index'
	// remove leading and trailing slashes
	pathname = pathname.replace(/^\/|\/$/g, '')

	const url = `${ORIGIN}/open-graph/${pathname}.png`

	let metaTagHTML = ''

	// Add og:image if not already on page
	if (!html.includes('property="og:image"')) {
		metaTagHTML = `
            <meta property="og:image:type" content="${format}" />
            <meta property="og:image:height" content="${height}" />
            <meta property="og:image:width" content="${width}" />
            <meta property="og:image" content="${url}" />
        `
	}

	// Add twitter:image if not already on page
	if (!html.includes('name="twitter:image"')) {
		metaTagHTML += `
            <meta name="twitter:image" content="${url}" />
        `
	}

	const newHTML = html.replaceAll('</head>', metaTagHTML + '</head>')

	return new Response(newHTML, {
		status: 200,
		headers: response.headers
	})
})
