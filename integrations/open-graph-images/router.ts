export const prerender = true

import type { APIRoute, GetStaticPathsResult } from 'astro'
import { getPageData } from './page-data'
import { generateImage } from './image-generator'

const defaults = (await getPageData()) as { [key: string]: string }

export const GET: APIRoute = async ({ params }) => {
	const { path } = params
	if (!path) return new Response('Invalid path', { status: 404 })

	const description = defaults[path]
	if (!description)
		return new Response(
			'Requested image does not have a description set.',
			{ status: 500 }
		)

	const cleanedOrigin = ORIGIN.replace('https://', '').replace('www.', '')
	let url = `${cleanedOrigin}/`
	if (path !== 'index') url += `${path}/`

	return new Response(await generateImage(description, url), {
		headers: { 'Content-Type': 'image/png' }
	})
}

export function getStaticPaths() {
	const response = [] as GetStaticPathsResult

	// Add each item in default to the response
	Object.keys(defaults).forEach((path) => {
		response.push({ params: { path } })
	})

	return response
}
