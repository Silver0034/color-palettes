const paginate = (data, args = {}) => {
	let { pageSize: _pageSize, params: _params, props: _props } = args
	const pageSize = _pageSize || 10
	const lastPage = Math.max(1, Math.ceil(data.length / pageSize))

	const result = []

	// For each page
	for (let i = 0; i < lastPage; i++) {
		const pageNumber = i + 1
		const start = i * pageSize
		const end = start + pageSize
		const page = {
			params: {
				page: String(pageNumber)
			},
			props: {
				data: [], // this page's data
				start,
				end,
				size: pageSize,
				total: data.length,
				currentPage: pageNumber,
				lastPage: lastPage,
				url: {
					current: '',
					next: '',
					prev: undefined,
					first: undefined,
					last: undefined
				}
			}
		}

		result.push(page)
	}
	return result
}

export default paginate
