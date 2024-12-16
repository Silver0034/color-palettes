import paginate from './paginate'

const exportedTextVar = 'title', // Pages should export this variable
	routeReplaceRegex = /\[.*\]/,
	varNameRegex = /\[(\.\.\.)?([^\]]+)\]/,
	paginationFirstPageParam = '1'

const getPageEntries = async () => {
	const pages = import.meta.glob('/src/pages/**/*.astro', {
		eager: true
	})
	const pagesWithRoutes = {},
		pagesWithoutRoutes = {}

	// Go through each page, if it has /\[.*\]/, move it to pagesWithRoutes
	for (const [path, data] of Object.entries(pages)) {
		if (data.getStaticPaths) {
			pagesWithRoutes[path] = data
			continue
		}
		pagesWithoutRoutes[path] = data
	}

	return { pagesWithRoutes, pagesWithoutRoutes }
}

const cleanPath = (path) => {
	// remove /src/pages/ from path
	let clean = path.replace('/src/pages/', '')
	// remove .astro from path
	clean = clean.replace('.astro', '')
	// If it ends in /index, remove it
	return clean.replace(/\/index$/, '')
}

const getPagePathAndText = ([index, entry]) => {
	const text = entry[exportedTextVar]
	if (!text) return { path: '', text: '' } // skip if no text
	const path = cleanPath(index)
	return { path, text }
}

const getVariableNameFromPath = (pathBase) => {
	const match = pathBase.match(varNameRegex)
	return match ? match[2] : null
}

const isPagination = (pathBase) => {
	const variableName = getVariableNameFromPath(pathBase)
	return pathBase.includes(`[...${variableName}]`)
}

const getPathFromRouteParams = (pathBase, params, index) => {
	// Get the variable name from pathBase []
	const variableName = getVariableNameFromPath(pathBase)
	// replace everything in [] with the actual value
	let path

	if (
		isPagination(pathBase) &&
		index === 0 &&
		params[variableName] === paginationFirstPageParam
	) {
		path = pathBase.replace(routeReplaceRegex, '')
	} else {
		path = pathBase.replace(routeReplaceRegex, params[variableName])
	}
	path = path.replace(/\/$/, '')

	return path
}

const getTextFromRouteProps = (props, entry, pathBase, index) => {
	let text

	// Return text from props if it exists (index pages)
	if (props[exportedTextVar]) text = props[exportedTextVar]

	// Return text from collection if it exists (collection pages)
	if (props.data && props.data[exportedTextVar])
		text = props.data[exportedTextVar]

	// Return text from props post if it exists
	if (props.post && props.post.data && props.post.data[exportedTextVar]) {
		text = props.post.data[exportedTextVar]
	}

	if (entry[exportedTextVar]) text = entry[exportedTextVar]

	// Return text from paginated pages
	if (entry.data && entry.data[exportedTextVar])
		text = entry.data[exportedTextVar]

	if (isPagination(pathBase) && index !== 0) {
		text = `${text} | Page ${index + 1}`
	}

	return text
}

const getRoutesPathAndText = async ([index, entry]) => {
	// Stop if there's no getStaticPaths
	if (!entry.getStaticPaths) return

	const data = {}

	const paths = await entry.getStaticPaths({ paginate })

	let pathBase = cleanPath(index)
	for (let i = 0; i < paths.length; i++) {
		const { params, props } = paths[i]
		const path = getPathFromRouteParams(pathBase, params, i)
		const text = getTextFromRouteProps(props, entry, pathBase, i)
		if (!text) continue
		data[path] = text
	}

	return data
}

const getPageData = async () => {
	const { pagesWithRoutes, pagesWithoutRoutes } = await getPageEntries()

	// Key should be the path, value should be the description
	let data = {}

	// Add pages without routes to data
	for (const pageData of Object.entries(pagesWithoutRoutes)) {
		const { path, text } = getPagePathAndText(pageData)
		if (path && text) data[path] = text
	}

	// Add pages with routes to data
	for (const pageData of Object.entries(pagesWithRoutes)) {
		let values = await getRoutesPathAndText(pageData)
		data = { ...data, ...values }
	}

	return data
}

// export getPageData
export { getPageData }
