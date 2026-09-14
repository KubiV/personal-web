import fs from 'node:fs';
import path from 'node:path';
import { getContentPath } from '$lib/server/config.js';

export async function GET() {
	const contentDir = getContentPath();

	// 1. Zkontrolovat apple-touch-icon.png v server-content/assets/
	const customTouchPath = path.join(contentDir, 'assets', 'apple-touch-icon.png');
	if (fs.existsSync(customTouchPath)) {
		try {
			const buffer = await fs.promises.readFile(customTouchPath);
			return new Response(buffer, {
				headers: {
					'Content-Type': 'image/png',
					'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
				}
			});
		} catch (err) {
			console.error('[apple-touch-icon.png] Chyba při čtení custom icon:', err);
		}
	}

	// 2. Případný fallback na favicon.png v assets
	const customPngPath = path.join(contentDir, 'assets', 'favicon.png');
	if (fs.existsSync(customPngPath)) {
		try {
			const buffer = await fs.promises.readFile(customPngPath);
			return new Response(buffer, {
				headers: {
					'Content-Type': 'image/png',
					'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
				}
			});
		} catch (err) {}
	}

	// 3. Fallback na výchozí apple-touch-icon-default.png
	const defaultPath = path.resolve('static/apple-touch-icon-default.png');
	if (fs.existsSync(defaultPath)) {
		try {
			const buffer = await fs.promises.readFile(defaultPath);
			return new Response(buffer, {
				headers: {
					'Content-Type': 'image/png',
					'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
				}
			});
		} catch (err) {}
	}

	return new Response('Not found', { status: 404 });
}
