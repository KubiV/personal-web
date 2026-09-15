import fs from 'node:fs';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import { getAboutPath, findFileInDir, COMMON_MIME_TYPES } from '$lib/server/content.js';

export async function GET({ params }) {
	const { image } = params;

	// Validate filename against path traversal
	if (!image || image.includes('..') || image.includes('/') || image.includes('\\') || image.includes('\0')) {
		throw error(400, 'Invalid filename');
	}

	const aboutDir = getAboutPath();
	const found = await findFileInDir(aboutDir, image);

	if (!found) {
		throw error(404, 'File not found');
	}

	// Strict containment check: ensure resolved path is inside aboutDir
	const resolvedPath = path.resolve(found.fullPath);
	if (!resolvedPath.startsWith(path.resolve(aboutDir))) {
		throw error(403, 'Access denied');
	}

	const ext = path.extname(found.filename).toLowerCase();
	const contentType = COMMON_MIME_TYPES[ext] || 'application/octet-stream';

	const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.ico', '.bmp'].includes(ext);
	const disposition = isImage
		? 'inline'
		: `attachment; filename="${encodeURIComponent(found.filename)}"; filename*=UTF-8''${encodeURIComponent(found.filename)}`;

	try {
		const fileBuffer = await fs.promises.readFile(resolvedPath);
		return new Response(fileBuffer, {
			headers: {
				'Content-Type': contentType,
				'Content-Length': fileBuffer.length.toString(),
				'Content-Disposition': disposition,
				'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
			}
		});
	} catch (err) {
		console.error(`Failed to read file at ${resolvedPath}:`, err);
		throw error(500, 'Could not read file');
	}
}
