import type { AstroIntegration } from 'astro'

const integration = (): AstroIntegration => {
	return {
		name: 'open-graph-images',
		hooks: {
            'astro:config:setup': ({ addMiddleware, injectRoute }) => {
				// Inject a route for each page file in the site
				injectRoute({
					pattern: '/open-graph/[...path].png',
					entrypoint: new URL('./router.ts', import.meta.url),
					prerender: true
                })
                
				// Add middleware add meta tags linking the images to each page
				addMiddleware({
					entrypoint: new URL('./middleware.ts', import.meta.url),
					order: 'pre'
				})
			}
		}
	}
}

export default integration
