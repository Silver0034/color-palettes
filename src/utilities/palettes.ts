type HEX = string
type OKLCH = [number, number, number, number]

type Color = HEX | OKLCH

const white: OKLCH = [1, 0, 0, 1]
const black: OKLCH = [0, 0, 0, 1]
const wcagAA = 4.5
const wcagAAA = 7
const hueRedStart = 20
const hueRedEnd = 40
const hueGreenStart = 120
const hueGreenEnd = 180
const hueYellowStart = 90
const hueYellowEnd = 100
const hueBlueStart = 190
const hueBlueEnd = 250
const iterationLimit = 100
const minLightness = 1
const maxLightness = 99
const defaultEndingLightnessShades = 5
const defaultEndingLightnessTints = 95
const totalDegrees = 360

// Convert HEX color to RGB
function hexToRGB(hex: Color): [number, number, number] {
	if (typeof hex === 'string') {
		const bigint = parseInt(hex.slice(1), 16)
		const r = (bigint >> 16) & 255
		const g = (bigint >> 8) & 255
		const b = bigint & 255
		return [r, g, b]
	}
	throw new Error('Invalid hex color')
}

// Convert RGB to XYZ color space
function rgbToXYZ([r, g, b]: [number, number, number]): [
	number,
	number,
	number
] {
	r = r / 255
	g = g / 255
	b = b / 255

	r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
	g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
	b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

	const x = r * 0.4124 + g * 0.3576 + b * 0.1805
	const y = r * 0.2126 + g * 0.7152 + b * 0.0722
	const z = r * 0.0193 + g * 0.1192 + b * 0.9505

	return [x * 100, y * 100, z * 100]
}

// Convert XYZ to LAB color space
function xyzToLAB([x, y, z]: [number, number, number]): [
	number,
	number,
	number
] {
	x = x / 95.047
	y = y / 100.0
	z = z / 108.883

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116

	const l = 116 * y - 16
	const a = 500 * (x - y)
	const b = 200 * (y - z)

	return [l, a, b]
}

// Convert LAB to LCH color space
function labToLCH([l, a, b]: [number, number, number]): [
	number,
	number,
	number
] {
	const c = Math.sqrt(a * a + b * b)
	const h = Math.atan2(b, a) * (180 / Math.PI)
	const hNormalized = h < 0 ? h + 360 : h
	return [l, c, hNormalized]
}

// Convert HEX to OKLCH color space
function hexToOKLCH(hex: HEX): [number, number, number, number] {
	const rgb = hexToRGB(hex)
	const xyz = rgbToXYZ(rgb)
	const lab = xyzToLAB(xyz)
	return [...labToLCH(lab), 1]
}

// Check if the color is in HEX format
function isHex(color: Color): color is string {
	return typeof color === 'string'
}

// Mix two colors to remove opacity
function mixColorsToRemoveOpacity(foreground: OKLCH, background: OKLCH): OKLCH {
	const [l1, c1, h1, a1] = foreground
	const [l2, c2, h2, a2] = background

	const mixedL = l1 * a1 + l2 * (1 - a1)
	const mixedC = c1 * a1 + c2 * (1 - a1)
	const mixedH = h1 * a1 + h2 * (1 - a1)

	return [mixedL, mixedC, mixedH, 1]
}

// Calculate contrast between two colors
function contrast(foreground: OKLCH, background: OKLCH): number {
	const mixedBg = mixColorsToRemoveOpacity(background, white)
	const mixedFg = mixColorsToRemoveOpacity(foreground, mixedBg)

	const fgLuminance = mixedFg[0]
	const bgLuminance = mixedBg[0]

	if (fgLuminance > bgLuminance) {
		return (fgLuminance + 0.05) / (bgLuminance + 0.05)
	} else {
		return (bgLuminance + 0.05) / (fgLuminance + 0.05)
	}
}

// Adjust contrast of a color to meet target contrast ratio
function adjustContrast(
	foreground: OKLCH = black,
	background: OKLCH = white,
	targetContrast: number = wcagAAA,
	property: string = 'lightness'
): OKLCH {
	let direction = 1
	let currentValue = minLightness

	foreground = [...foreground] as OKLCH
	foreground[0] = currentValue
	let contrastValue = contrast(foreground, background)

	if (contrastValue >= targetContrast) {
		currentValue = maxLightness
		direction = -1
		foreground[0] = currentValue
	}

	for (let i = 1; i <= iterationLimit; i++) {
		contrastValue = contrast(foreground, background)
		if (contrastValue >= targetContrast) {
			return foreground
		}

		const newValue = currentValue + i * direction
		if (newValue < 0 || newValue > 100) {
			console.warn('Contrast could not be achieved')
			return foreground
		}

		foreground[0] = newValue
	}

	return foreground
}

// Generate shades of a color
function getShades(
	color: OKLCH,
	stops: number,
	endingLightness: number = defaultEndingLightnessShades
): OKLCH[] {
	const startingLightness = color[0]
	const colors: OKLCH[] = []

	for (let i = 1; i <= stops; i++) {
		const newLightness =
			startingLightness +
			((endingLightness - startingLightness) / stops) * i
		const newColor = [...color] as OKLCH
		newColor[0] = newLightness
		colors.push(newColor)
	}

	return colors
}

// Generate tints of a color
function getTints(
	color: OKLCH,
	stops: number,
	endingLightness: number = defaultEndingLightnessTints
): OKLCH[] {
	const startingLightness = color[0]
	const colors: OKLCH[] = []

	for (let i = 1; i <= stops; i++) {
		const newLightness =
			endingLightness -
			((endingLightness - startingLightness) / stops) * i
		const newColor = [...color] as OKLCH
		newColor[0] = newLightness
		colors.push(newColor)
	}

	return colors
}

// Get the rounding number based on the number of stops
function getRoundNumber(stops: number): number {
	let round = 100
	if (stops > 10) round = 50
	if (stops > 20) round = 25
	if (stops > 40) round = 10
	if (stops > 80) round = 5
	if (stops > 160) round = 1
	return round
}

// Generate an evenly spaced palette
function evenlySpacedPalette(
	label: string,
	color: OKLCH,
	stops: number
): Record<string, OKLCH> {
	const endLabelNumber = 900
	const round = getRoundNumber(stops)
	const colors = getShades(color, stops)
	const palette: Record<string, OKLCH> = {}

	colors.forEach((color, i) => {
		const labelNumber =
			Math.round(((endLabelNumber / stops) * (i + 1)) / round) * round
		palette[`${label}-${labelNumber}`] = color
	})

	return palette
}

// Generate a palette with colors starting at the middle
function paletteWithStartAtMiddle(
	label: string,
	color: OKLCH,
	stops: number
): Record<string, Color> {
	const endLabelNumber = 900
	const round = getRoundNumber(stops)
	const halfOfStops = Math.floor(stops / 2)
	const tints = getTints(color, Math.ceil(halfOfStops))
	const shades = getShades(color, Math.floor(halfOfStops))
	const colors = [...tints, ...shades]
	const palette: Record<string, Color> = {}

	colors.forEach((color, i) => {
		const labelNumber =
			Math.round(((endLabelNumber / stops) * (i + 1)) / round) * round
		palette[`${label}-${labelNumber}`] = color
	})

	return palette
}

// Shift the hue of a color to be within a specified range
function shiftToWithinRange(color: OKLCH, min: number, max: number): OKLCH {
	const [l, c, h, a] = color

	// If already in the specified range, return the color
	if (h >= min && h <= max) {
		return color
	}

	let distanceToMax = h - max
	let distanceToMin = min - h

	// Fix if the hue needs to wrap at 360/0
	if (distanceToMax < 0) {
		distanceToMax += totalDegrees
	}
	if (distanceToMax > totalDegrees) {
		distanceToMax -= totalDegrees
	}

	if (distanceToMin < 0) {
		distanceToMin += totalDegrees
	}
	if (distanceToMin > totalDegrees) {
		distanceToMin -= totalDegrees
	}

	// Adjust hue to the nearest boundary
	const newHue = distanceToMax < distanceToMin ? max : min

	return [l, c, newHue, a]
}

// Ensure the vibrant start color has enough chroma and lightness
function ensureVibrantStart(color: OKLCH): OKLCH {
	let [l, c, h, a] = color
	if (c < 50) {
		c = 50
	}
	if (l < 40) {
		l = 40
	}
	return [l, c, h, a]
}

// Ensure the neutral color has specific chroma and lightness
function ensureNeutral(color: OKLCH): OKLCH {
	let [l, c, h, a] = color
	c = 8
	l = 95
	return [l, c, h, a]
}

// Create a color palette based on primary and accent colors
export function createPalette(
	primary: Color,
	accent: Color
): Record<string, Color> {
	if (isHex(primary)) {
		primary = hexToOKLCH(primary)
	}
	if (isHex(accent)) {
		accent = hexToOKLCH(accent)
	}

	const vibrantStart = ensureVibrantStart(primary)
	const neutral = ensureNeutral(primary)

	const adjustedPrimary = adjustContrast(primary, white, wcagAA)
	const adjustedAccent = adjustContrast(accent, white, wcagAA)
	const danger = shiftToWithinRange(vibrantStart, hueRedStart, hueRedEnd)
	const success = shiftToWithinRange(vibrantStart, hueGreenStart, hueGreenEnd)
	const warning = shiftToWithinRange(
		vibrantStart,
		hueYellowStart,
		hueYellowEnd
	)
	const info = shiftToWithinRange(vibrantStart, hueBlueStart, hueBlueEnd)

	return {
		...paletteWithStartAtMiddle('primary', adjustedPrimary, 9),
		...paletteWithStartAtMiddle('accent', adjustedAccent, 9),
		...evenlySpacedPalette('neutral', neutral, 9),
		...paletteWithStartAtMiddle('danger', danger, 5),
		...paletteWithStartAtMiddle('success', success, 5),
		...paletteWithStartAtMiddle('warning', warning, 5),
		...paletteWithStartAtMiddle('info', info, 5)
	}
}
