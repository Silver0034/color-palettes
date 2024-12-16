import { getCollection } from 'astro:content'
import type { CollectionEntry } from 'astro:content'

type FAQEntry = CollectionEntry<'faqs'>

export const getQuestions = async (locationFilter: string) => {
	let filter
	if (locationFilter)
		filter = ({ data }: FAQEntry) => {
			// If location filter is 'all', return all entries
			if (locationFilter === 'all') return true
			const { location } = data
			if (!location) return false
			return location === locationFilter
		}

	return await getCollection('faqs', filter)
}
