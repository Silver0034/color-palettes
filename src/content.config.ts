import { z, defineCollection } from 'astro:content'
import { glob, file } from 'astro/loaders'

const faqsCollection = defineCollection({
	loader: file('src/data/faqs.json'),
	schema: z.object({
		question: z.string(),
		answer: z.string(),
		location: z.string().optional()
	})
})

export const collections = {
	faqs: faqsCollection
}
