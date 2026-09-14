import fs from 'node:fs';
import path from 'node:path';
import { getContentPath, getSiteConfig } from '$lib/server/config.js';

export async function GET() {
	// 1. Zkontrolovat, zda uživatel nahrál favicon.svg do server-content/assets/
	const customFaviconPath = path.join(getContentPath(), 'assets', 'favicon.svg');
	if (fs.existsSync(customFaviconPath)) {
		try {
			const buffer = await fs.promises.readFile(customFaviconPath);
			return new Response(buffer, {
				headers: {
					'Content-Type': 'image/svg+xml',
					'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
				}
			});
		} catch (err) {
			console.error('[favicon.svg] Chyba při čtení custom favicon:', err);
		}
	}

	// 2. Fallback na výchozí favicon z repozitáře s dynamickým obarvením podle accentColor
	const defaultPath = path.resolve('static/favicon-default.svg');
	if (fs.existsSync(defaultPath)) {
		try {
			let svg = await fs.promises.readFile(defaultPath, 'utf-8');
			const accentColor = getSiteConfig()?.theme?.accentColor || '#14A4FF';
			// Nahradit barvu cesty výchozího loga za aktuální akcentovou barvu webu
			svg = svg.replace(/fill="#14A4FF"/gi, `fill="${accentColor}"`);

			return new Response(svg, {
				headers: {
					'Content-Type': 'image/svg+xml',
					'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
				}
			});
		} catch (err) {
			console.error('[favicon.svg] Chyba při čtení výchozí favicon:', err);
		}
	}

	return new Response('Not found', { status: 404 });
}
