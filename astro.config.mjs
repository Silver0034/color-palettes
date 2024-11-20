// @ts-check
import { defineConfig } from 'astro/config'
import { constants, stringifiedConstants } from './constants'
import sitemap from '@astrojs/sitemap'

const { ORIGIN } = constants

// https://astro.build/config
export default defineConfig({
	integrations: [sitemap()],
	prefetch: {
		prefetchAll: true
	},
	site: ORIGIN,
	vite: {
		define: { ...stringifiedConstants }
	}
})
