/**
 * themeColors.js
 * Utility for parsing and generating dynamic CSS theme variables from a central accent color.
 */

/**
 * Parse a hex color string (#rgb, #rrggbb) to { r, g, b }.
 * Returns null if invalid.
 *
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number } | null}
 */
export function hexToRgb(hex) {
	if (!hex || typeof hex !== 'string') return null;
	let cleanHex = hex.trim().replace(/^#/, '');

	if (cleanHex.length === 3) {
		cleanHex = cleanHex
			.split('')
			.map((c) => c + c)
			.join('');
	}

	if (cleanHex.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
		return null;
	}

	const num = parseInt(cleanHex, 16);
	return {
		r: (num >> 16) & 255,
		g: (num >> 8) & 255,
		b: num & 255
	};
}

/**
 * Adjust brightness of RGB color (amount between -1 and 1).
 * Negative = darker, Positive = brighter.
 */
export function adjustBrightness({ r, g, b }, amount) {
	const factor = 1 + amount;
	return {
		r: Math.min(255, Math.max(0, Math.round(r * factor))),
		g: Math.min(255, Math.max(0, Math.round(g * factor))),
		b: Math.min(255, Math.max(0, Math.round(b * factor)))
	};
}

/**
 * Convert RGB object to hex string.
 */
export function rgbToHex({ r, g, b }) {
	const toHex = (n) => n.toString(16).padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate complete CSS variables string based on central accent color.
 * Generates both light and dark mode rules with fallback to default #14A4FF.
 *
 * @param {string} accentHex - e.g. "#14A4FF" or "#10b981"
 * @returns {string} CSS block for insertion in <style>
 */
export function generateThemeCss(accentHex = '#14A4FF') {
	const rgb = hexToRgb(accentHex) || { r: 20, g: 164, b: 255 };
	const mainHex = rgbToHex(rgb);

	// Light mode derivatives
	const hoverLightRgb = adjustBrightness(rgb, -0.15);
	const hoverLightHex = rgbToHex(hoverLightRgb);
	const gradientEndLightRgb = adjustBrightness(rgb, -0.25);
	const gradientEndLightHex = rgbToHex(gradientEndLightRgb);

	// Dark mode derivatives
	const hoverDarkRgb = adjustBrightness(rgb, 0.18);
	const hoverDarkHex = rgbToHex(hoverDarkRgb);

	return `
:root {
  --accent: ${mainHex};
  --accent-hover: ${hoverLightHex};
  --accent-light: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08);
  --accent-border: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.30);
  --accent-glow: 0 0 16px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25);
  --quote-border: ${mainHex};
  --card-bg: linear-gradient(135deg, #ffffff 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.04) 100%);
  --card-shadow: 0 4px 16px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06);
  --top-bar-gradient: linear-gradient(90deg, ${mainHex} 0%, ${gradientEndLightHex} 100%);
}

:root[data-theme="dark"],
:root.dark {
  --accent: ${mainHex};
  --accent-hover: ${hoverDarkHex};
  --accent-light: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15);
  --accent-border: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35);
  --accent-glow: 0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35);
  --quote-border: ${hoverDarkHex};
  --card-bg: linear-gradient(135deg, #171c26 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08) 100%);
  --card-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
  --top-bar-gradient: linear-gradient(90deg, ${mainHex} 0%, ${hoverDarkHex} 100%);
}
`.trim();
}
