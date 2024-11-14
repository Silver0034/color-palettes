export interface PropsBase {
	'@type'?:
		| 'Blog'
		| 'BlogPosting'
		| 'CollectionPage'
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

export interface PropsBlog extends PropsBase {
	'@type': 'Blog'
	mainEntity: PropsBlogPosting[]
}

export interface PropsCollectionPage extends PropsBase {
	'@type': 'CollectionPage'
	hasPart: PropsBase[]
}

export interface PropsOrganization extends PropsBase {
	'@type': 'Organization'
}

export interface SchemaBase {
	'@context': string
	'@type': string
	description: string
	name: string
	url: string
	sameAs: string[]
}

export interface SchemaBlogPosting extends SchemaBase {
	author: {
		'@type': string
		name: string
	}
	datePublished: string
	headline: string
}

export interface SchemaBlog extends SchemaBase {
	mainEntity: SchemaBlogPosting[]
}

export interface SchemaCollectionPage extends SchemaBase {
	hasPart: SchemaBase[]
}

export interface SchemaOrganization extends SchemaBase {
	address: {
		'@type': string
		streetAddress: string
		addressLocality: string
		addressRegion: string
		postalCode: string
		addressCountry: string
	}
	contactPoint: {
		'@type': string
		email: string
		contactType: string
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

export function getDataOrganization(
	props: PropsOrganization
): SchemaOrganization {
	return {
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
