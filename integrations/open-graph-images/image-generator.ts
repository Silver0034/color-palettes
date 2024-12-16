import sharp from 'sharp'

const background = './src/assets/og-background.png',
	fontColor = '#000000',
	format = 'image/png',
	height = 630,
	logo = './src/icons/logo.svg',
	logoHeight = 60,
	padding = 40,
	primaryFontSize = 60,
	secondaryFontSize = 25,
	width = 1200

const generateImage = async (primaryText: string, secondaryText: string) => {
	const formatType = format.split('/')[1] as keyof sharp.FormatEnum

	// Load the background image
	const backgroundImage = await sharp(background)
		.resize(width, height)
		.toBuffer()

	// Load the logo image
	const logoImage = await sharp(logo)
		.resize({ height: logoHeight })
		.toBuffer()

	// escape special characters in the text
	const escapedPrimaryText = escapeHtml(primaryText)
	const escapedSecondaryText = escapeHtml(secondaryText)

	// Add the primary text to the center (wrap lines if needed. use padding)
	// Add secondary text to the bottom right (with padding)
	// Create the SVG for the text
	// Wrap the primary text
	const wrappedPrimaryText = wrapSvgText(
		escapedPrimaryText,
		primaryFontSize,
		width - 2 * padding
	)
	const svgText = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <style>
                .text-primary {
                    font-family: 'sans-serif';
                    font-size: ${primaryFontSize}px;
                    fill: ${fontColor};
                    text-anchor: middle;
                }
                .text-secondary {
                    font-family: 'sans-serif';
                    font-size: ${secondaryFontSize}px;
                    fill: ${fontColor};
                    text-anchor: end;
                }
            </style>
            ${wrappedPrimaryText}
            <text x="${width - padding}" y="${height - padding}" class="text-secondary">${escapedSecondaryText}</text>
        </svg>
    `
	const svgBuffer = Buffer.from(svgText)

	// Composite the images and text
	const finalImage = await sharp(backgroundImage)
		.composite([
			{ input: logoImage, top: padding, left: padding },
			{ input: svgBuffer, top: 0, left: 0 }
		])
		.toFormat(formatType)
		.toBuffer()

	return finalImage
}

const wrapSvgText = (text: string, fontSize: number, maxWidth: number) => {
	const words = text.split(' ')
	const lines = []
	const balancedLines = []
	let currentLine = words[0]

	for (let i = 1; i < words.length; i++) {
		const word = words[i]
		const testLine = currentLine + ' ' + word
		const testWidth = testLine.length * (fontSize * 0.5)
		if (testWidth < maxWidth) {
			currentLine = testLine
		} else {
			lines.push(currentLine)
			currentLine = word
		}
	}
	lines.push(currentLine)

	const lineCount = lines.length
	const wordsPerLine = Math.ceil(words.length / lineCount)
	for (let i = 0; i < lineCount; i++) {
		balancedLines.push(
			words.slice(i * wordsPerLine, (i + 1) * wordsPerLine).join(' ')
		)
	}

	const lineHeight = fontSize * 1.2
	const yStart = (height - lines.length * lineHeight) / 2 + fontSize / 2
	return balancedLines
		.map(
			(line, index) =>
				`<text x="50%" y="${yStart + index * lineHeight}" class="text-primary">${line}</text>`
		)
		.join('')
}

const escapeHtml = (unsafe: string) => {
	return unsafe.replace(/[&<"']/g, (match) => {
		switch (match) {
			case '&':
				return '&amp;'
			case '<':
				return '&lt;'
			case '>':
				return '&gt;'
			case '"':
				return '&quot;'
			case "'":
				return '&#039;'
			default:
				return match
		}
	})
}

export { format, height, width, generateImage }
