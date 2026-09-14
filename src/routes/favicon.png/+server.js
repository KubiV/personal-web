import fs from 'node:fs';
import path from 'node:path';
import { getContentPath } from '$lib/server/config.js';

export async function GET() {
	// 1. Zkontrolovat, zda existuje favicon.png v server-content/assets/
	const customFaviconPath = path.join(getContentPath(), 'assets', 'favicon.png');
	if (fs.existsSync(customFaviconPath)) {
		try {
			const buffer = await fs.promises.readFile(customFaviconPath);
			return new Response(buffer, {
				headers: {
					'Content-Type': 'image/png',
					'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
				}
			});
		} catch (err) {
			console.error('[favicon.png] Chyba při čtení custom favicon:', err);
		}
	}

	// 2. Fallback na výchozí favicon-default.png
	const defaultPath = path.resolve('static/favicon-default.png');
	if (fs.existsSync(defaultPath)) {
		try {
			const buffer = await fs.promises.readFile(defaultPath);
			return new Response(buffer, {
				headers: {
					'Content-Type': 'image/png',
					'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
				}
			});
		} catch (err) {
			console.error('[favicon.png] Chyba při čtení výchozí favicon:', err);
		}
	}

	return new Response('Not found', { status: 404 });
}
