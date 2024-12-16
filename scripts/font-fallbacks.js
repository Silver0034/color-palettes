import fs from 'fs'
import path from 'path'
import { createFontStack } from '@capsizecss/core'
import arial from '@capsizecss/metrics/arial'
import roboto from '@capsizecss/metrics/roboto'
import { fromFile } from '@capsizecss/unpack'

const fonts = {
	Inter: './node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2',
	Truculenta:
		'./node_modules/@fontsource/truculenta/files/truculenta-latin-400-normal.woff2'
}

async function generateFontFace(fontName, fontPath) {
	const font = await fromFile(fontPath)

	font.fontFamily = fontName
	font.familyName = fontName
	font.fullName = fontName

	const { fontFaces } = createFontStack([font, arial, roboto], {
		fontFaceProperties: {
			fontDisplay: 'swap'
		}
	})

	return fontFaces
}

async function generateCSS() {
	let css = ''

	for (const [name, filePath] of Object.entries(fonts)) {
		css += await generateFontFace(name, filePath)
	}

	return css
}

function writeCSSFile(css) {
	const filePath = './public/styles/font-fallbacks.css'
	const dir = path.dirname(filePath)

	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true })
	}

	fs.writeFileSync(filePath, css)
}

writeCSSFile(await generateCSS())
