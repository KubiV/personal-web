import fs from 'node:fs';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import {
	getBlogPath,
	sanitizeSlug,
	findFileInDir,
	COMMON_MIME_TYPES,
	INLINE_ASSET_EXTENSIONS
} from '$lib/server/content.js';

export async function GET({ params, url }) {
	const { slug, image } = params;

	// Validate slug
	const validSlug = sanitizeSlug(slug);
	if (!validSlug) {
		throw error(404, 'Invalid article path');
	}

	// Validate filename against path traversal
	if (!image || image.includes('..') || image.includes('/') || image.includes('\\') || image.includes('\0')) {
		throw error(400, 'Invalid filename');
	}

	const blogDir = getBlogPath();
	const articleDir = path.join(blogDir, validSlug);
	const found = await findFileInDir(articleDir, image);

	if (!found) {
		throw error(404, 'File not found');
	}

	// Strict containment check: ensure resolved path is inside the article directory
	const resolvedPath = path.resolve(found.fullPath);
	if (!resolvedPath.startsWith(path.resolve(articleDir) + path.sep)) {
		throw error(403, 'Access denied');
	}

	const ext = path.extname(found.filename).toLowerCase();
	const contentType = COMMON_MIME_TYPES[ext] || 'application/octet-stream';

	const forceDownload = url.searchParams.has('download');
	const isInline = !forceDownload && INLINE_ASSET_EXTENSIONS.has(ext);
	const disposition = isInline
		? 'inline'
		: `attachment; filename="${encodeURIComponent(found.filename)}"; filename*=UTF-8''${encodeURIComponent(found.filename)}`;

	const isCodeOrHtml = ['.html', '.htm', '.js', '.mjs', '.css', '.json'].includes(ext);
	const cacheControl = isCodeOrHtml
		? 'public, max-age=300, stale-while-revalidate=3600'
		: 'public, max-age=86400, stale-while-revalidate=604800';

	try {
		const fileBuffer = await fs.promises.readFile(resolvedPath);
		return new Response(fileBuffer, {
			headers: {
				'Content-Type': contentType,
				'Content-Length': fileBuffer.length.toString(),
				'Content-Disposition': disposition,
				'X-Content-Type-Options': 'nosniff',
				'Cache-Control': cacheControl
			}
		});
	} catch (err) {
		console.error(`Failed to read file at ${resolvedPath}:`, err);
		throw error(500, 'Could not read file');
	}
}
