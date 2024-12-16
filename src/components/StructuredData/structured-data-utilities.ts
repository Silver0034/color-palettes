import type { CollectionEntry } from 'astro:content'

export interface PropsBase {
	'@type'?:
		| 'Blog'
		| 'BlogPosting'
		| 'CollectionPage'
		| 'FAQPage'
		| 'Organization'
		| 'WebPage'
	description: string
	title: string
	url: string
}

export interface PropsBlogPosting extends PropsBase {
	'@type': 'BlogPosting'
	datePublished: string
}

type PropsBlogMainEntity = PropsBlogPosting[]

export interface PropsBlog extends PropsBase {
	'@type': 'Blog'
	mainEntity: PropsBlogMainEntity
}

export interface PropsCollectionPage extends PropsBase {
	'@type': 'CollectionPage'
	hasPart: PropsBase[]
}

export interface PropsFAQItem {
	'@type': 'Question'
	name: string
	acceptedAnswer: {
		'@type': 'Answer'
		text: string
	}
}

export interface PropsFAQ extends PropsBase {
	'@type': 'FAQPage'
	mainEntity: PropsFAQItem[]
}

export interface PropsFAQQuestion {
	answer: string
	position: number
	id: string
	question: string
	url: string
}

export type PropsFAQQuestions = CollectionEntry<'faqs'>[]

export interface PropsOrganization extends PropsBase {
	'@type': 'Organization'
}

export type mainEntityDefault = {
	'@id': string
}[]

export interface SchemaBase {
	'@context': string
	'@type': string
	description: string
	name: string
	url: string
	sameAs: string[]
	publisher?: {
		'@id': string
	}[]
}

export interface SchemaBlogPosting extends SchemaBase {
	author: {
		'@type': string
		name: string
	}
	datePublished: string
	headline: string
	mainEntity?: SchemaBlogMainEntity
}

type SchemaBlogMainEntity = SchemaBlogPosting[]

export interface SchemaBlog extends SchemaBase {
	mainEntity: SchemaBlogPosting[]
}

export interface SchemaCollectionPage extends SchemaBase {
	hasPart: SchemaBase[]
}

type SchemaFAQMainEntity = PropsFAQItem[]
export interface SchemaFAQ extends SchemaBase {
	mainEntity: SchemaFAQMainEntity
}

export interface SchemaQuestion {
	'@type': 'Question'
	'@id': string
	position: number
	url: string
	name: string
	answerCount: number
	acceptedAnswer: {
		'@type': 'Answer'
		text: string
		inLanguage: string
	}
	inLanguage: string
}

export interface SchemaOrganization extends SchemaBase {
	'@id': string
	address: {
		'@type': string
		streetAddress: string
		addressLocality: string
		addressRegion: string
		postalCode: string
		addressCountry: string
	}
	contactPoint?: {
		'@type': string
		email: string
		contactType: string
	}
}

export function getDataBlog(props: PropsBlog): SchemaBlog {
	const { mainEntity } = props

	const entities = [] as SchemaBlogPosting[]

	for (const entity of mainEntity) {
		entities.push(getDataBlogPosting(entity))
	}

	return {
		mainEntity: entities,
		...getStructuredData(props)
	}
}

export function getDataBlogPosting(props: PropsBlogPosting): SchemaBlogPosting {
	const { datePublished, title } = props
	return {
		author: {
			'@type': 'Organization',
			name: AUTHOR
		},
		datePublished,
		headline: title,
		...getStructuredData(props)
	}
}

export function getDataCollectionPage(
	props: PropsCollectionPage
): SchemaCollectionPage {
	const { hasPart } = props

	const parts = [] as SchemaBase[]

	for (const part of hasPart) {
		parts.push(getStructuredData(part))
	}

	return {
		hasPart: parts,
		...getStructuredData(props)
	}
}

export function getDataFAQ(props: PropsFAQ): SchemaFAQ {
	const { mainEntity } = props as {
		mainEntity: PropsFAQItem[]
	}

	return {
		mainEntity,
		...getStructuredData(props)
	}
}

export function getDataFAQQuestion(props: PropsFAQQuestion): SchemaQuestion {
	const { answer, position, id, question, url } = props

	const finalUrl = `${url}#${id}`

	return {
		'@type': 'Question',
		'@id': finalUrl,
		position,
		url: finalUrl,
		name: question,
		answerCount: 1,
		acceptedAnswer: {
			'@type': 'Answer',
			text: answer,
			inLanguage: 'en-US'
		},
		inLanguage: 'en-US'
	}
}

export function getDataFAQQuestions(
	questions: PropsFAQQuestions,
	url: string
): SchemaQuestion[] {
	const questionArray = [] as SchemaQuestion[]

	questions.forEach((question, index) => {
		const { data, id } = question
		const { answer, question: questionText } = data
		questionArray.push(
			getDataFAQQuestion({
				answer,
				id,
				question: questionText,
				url,
				position: index + 1
			})
		)
	})

	return questionArray
}

export function getDataOrganization(
	props: PropsOrganization
): SchemaOrganization {
	return {
		'@id': `${ORIGIN}#organization`,
		address: {
			'@type': 'PostalAddress',
			streetAddress: ADDRESS_STREET,
			addressLocality: ADDRESS_CITY,
			addressRegion: ADDRESS_STATE,
			postalCode: ADDRESS_ZIP,
			addressCountry: ADDRESS_COUNTRY
		},
		// contactPoint: {
		// 	'@type': 'ContactPoint',
		// 	email: EMAIL_SUPPORT,
		// 	contactType: 'Customer Service'
		// },
		...getStructuredData(props)
	}
}

export function getStructuredData(props: PropsBase): SchemaBase {
	const { description, title, url } = props

	return {
		'@context': 'https://schema.org',
		'@type': props['@type'] ?? 'WebPage',
		description,
		name: title,
		sameAs: [SOCIAL_URL_FACEBOOK, SOCIAL_URL_TWITTER, SOCIAL_URL_LINKEDIN],
		url: url
	}
}
