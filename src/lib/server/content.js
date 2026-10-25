import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { getContentPath, getSiteConfig } from "$lib/server/config.js";
import { slugifyCategory } from "$lib/utils.js";

export { getContentPath, slugifyCategory };

/**
 * Get the path to the blog content directory.
 */
export function getBlogPath() {
	return path.join(getContentPath(), "blog");
}

/**
 * Get the path to the about content directory.
 */
export function getAboutPath() {
	return path.join(getContentPath(), "about");
}

/**
 * Ensure safe slug to prevent directory traversal.
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeSlug(slug) {
	if (!slug || typeof slug !== "string") return null;
	if (slug.includes("..") || slug.includes("/") || slug.includes("\\")) {
		return null;
	}
	if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
		return null;
	}
	return slug;
}

export const DEFAULT_AUTHOR = "KubiV";

export const COMMON_MIME_TYPES = {
	// Images
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.avif': 'image/avif',
	'.ico': 'image/x-icon',
	'.bmp': 'image/bmp',
	// Web & Interactive App Assets
	'.html': 'text/html; charset=utf-8',
	'.htm': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.map': 'application/json; charset=utf-8',
	'.wasm': 'application/wasm',
	'.xml': 'application/xml; charset=utf-8',
	'.txt': 'text/plain; charset=utf-8',
	'.md': 'text/markdown; charset=utf-8',
	'.csv': 'text/csv; charset=utf-8',
	// Fonts
	'.woff2': 'font/woff2',
	'.woff': 'font/woff',
	'.ttf': 'font/ttf',
	'.otf': 'font/otf',
	'.eot': 'application/vnd.ms-fontobject',
	// Audio & Video
	'.mp3': 'audio/mpeg',
	'.wav': 'audio/wav',
	'.ogg': 'audio/ogg',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
	// 3D Printing & CAD models
	'.3mf': 'model/3mf',
	'.stl': 'model/stl',
	'.step': 'model/step',
	'.stp': 'model/step',
	'.gcode': 'text/x-gcode',
	'.obj': 'text/plain; charset=utf-8',
	'.mtl': 'text/plain; charset=utf-8',
	'.glb': 'model/gltf-binary',
	'.gltf': 'model/gltf+json',
	'.bin': 'application/octet-stream',
	// Code & Scripts
	'.py': 'text/x-python; charset=utf-8',
	'.sh': 'application/x-sh',
	// Archives & Documents
	'.pdf': 'application/pdf',
	'.zip': 'application/zip',
	'.tar': 'application/x-tar',
	'.gz': 'application/gzip',
	'.7z': 'application/x-7z-compressed',
	'.rar': 'application/vnd.rar'
};

export const INLINE_ASSET_EXTENSIONS = new Set([
	'.jpg',
	'.jpeg',
	'.png',
	'.webp',
	'.gif',
	'.svg',
	'.avif',
	'.ico',
	'.bmp',
	'.html',
	'.htm',
	'.js',
	'.mjs',
	'.css',
	'.json',
	'.map',
	'.wasm',
	'.xml',
	'.txt',
	'.csv',
	'.woff2',
	'.woff',
	'.ttf',
	'.otf',
	'.eot',
	'.mp3',
	'.wav',
	'.ogg',
	'.mp4',
	'.webm',
	'.pdf',
	'.glb',
	'.gltf',
	'.obj',
	'.mtl',
	'.bin'
]);

/**
 * Resilient file resolver for article / about directories.
 * Handles:
 * - Exact match
 * - URL decoded match (%20, etc.)
 * - Plus vs space normalization (e.g. logaritmicke+pravitko.3mf)
 * - Case-insensitive match on Linux (e.g. profilephoto.JPEG vs profilephoto.jpeg)
 * - Common image extension interchange (.jpg <-> .jpeg)
 */
export async function findFileInDir(dir, requestedName) {
	if (!requestedName || !dir) return null;

	// 1. Direct match
	const directPath = path.join(dir, requestedName);
	try {
		const stat = await fs.promises.stat(directPath);
		if (stat.isFile()) return { fullPath: directPath, filename: requestedName };
	} catch {}

	// 2. URL-decoded match
	try {
		const decoded = decodeURIComponent(requestedName);
		if (decoded !== requestedName) {
			const decPath = path.join(dir, decoded);
			const stat = await fs.promises.stat(decPath);
			if (stat.isFile()) return { fullPath: decPath, filename: decoded };
		}
	} catch {}

	// 3. Plus replaced by space
	const plusAsSpace = requestedName.replace(/\+/g, ' ');
	if (plusAsSpace !== requestedName) {
		const pPath = path.join(dir, plusAsSpace);
		try {
			const stat = await fs.promises.stat(pPath);
			if (stat.isFile()) return { fullPath: pPath, filename: plusAsSpace };
		} catch {}
	}

	// 4. Directory scan for case-insensitive and normalized matches
	try {
		const entries = await fs.promises.readdir(dir);
		const targetLower = requestedName.toLowerCase();
		let targetDecodedLower = targetLower;
		try {
			targetDecodedLower = decodeURIComponent(requestedName).toLowerCase();
		} catch {}
		const targetSpaceLower = plusAsSpace.toLowerCase();

		for (const entry of entries) {
			const entryLower = entry.toLowerCase();
			if (
				entryLower === targetLower ||
				entryLower === targetDecodedLower ||
				entryLower === targetSpaceLower ||
				entryLower.replace(/\+/g, ' ') === targetSpaceLower
			) {
				const candidatePath = path.join(dir, entry);
				const stat = await fs.promises.stat(candidatePath);
				if (stat.isFile()) return { fullPath: candidatePath, filename: entry };
			}
		}

		// 5. Image extension interchange (.jpg <-> .jpeg)
		const ext = path.extname(requestedName).toLowerCase();
		const base = requestedName.slice(0, requestedName.length - ext.length).toLowerCase();
		if (ext === '.jpg' || ext === '.jpeg') {
			for (const entry of entries) {
				const entryExt = path.extname(entry).toLowerCase();
				const entryBase = entry.slice(0, entry.length - entryExt.length).toLowerCase();
				if ((entryExt === '.jpg' || entryExt === '.jpeg') && entryBase === base) {
					const candidatePath = path.join(dir, entry);
					const stat = await fs.promises.stat(candidatePath);
					if (stat.isFile()) return { fullPath: candidatePath, filename: entry };
				}
			}
		}
	} catch {}

	return null;
}

/**
 * Post-processes HTML generated by marked to rewrite relative URLs in HTML tags
 * (such as <img src="./photo.jpeg"> or <a href="./file.3mf">).
 */
export function rewriteRelativeUrlsInHtml(html, basePrefix) {
	if (!html || typeof html !== "string") return html;

	return html.replace(
		/\b(src|href)=("([^"]+)"|'([^']+)')/gi,
		(match, attr, fullVal, doubleVal, singleVal) => {
			const quote = fullVal[0];
			const url = doubleVal !== undefined ? doubleVal : singleVal;

			if (
				!url ||
				url.startsWith("http://") ||
				url.startsWith("https://") ||
				url.startsWith("//") ||
				url.startsWith("#") ||
				url.startsWith("mailto:") ||
				url.startsWith("tel:") ||
				url.startsWith("data:")
			) {
				return match;
			}

			if (
				url.startsWith(basePrefix) ||
				url.startsWith("/custom-assets/") ||
				url.startsWith("/category") ||
				url.startsWith("/blog") ||
				url.startsWith("/models/") ||
				url.startsWith("/logos/") ||
				url.startsWith("/favicon")
			) {
				return match;
			}

			let cleaned = url;
			if (cleaned.startsWith("./")) {
				cleaned = cleaned.slice(2);
			} else if (cleaned.startsWith("/")) {
				cleaned = cleaned.slice(1);
			}

			const finalUrl = `${basePrefix.replace(/\/$/, "")}/${cleaned}`;
			return `${attr}=${quote}${finalUrl}${quote}`;
		}
	);
}

/**
 * Resolve author(s) from article frontmatter data.
 * Supports:
 * - author: "Jan Novák"
 * - authors: ["Jan Novák", "Petr Svoboda"]
 * - authors: "Jan Novák, Petr Svoboda"
 * - author: ["Jan Novák", "Petr Svoboda"]
 * Falls back to DEFAULT_AUTHOR ("KubiV").
 */
export function resolveAuthors(data) {
	const defaultAuthor = getSiteConfig()?.author?.name || DEFAULT_AUTHOR;

	if (!data) {
		return {
			authors: [defaultAuthor],
			author: defaultAuthor
		};
	}

	let authorList = [];

	if (Array.isArray(data.authors)) {
		authorList = data.authors.map((a) => String(a).trim()).filter(Boolean);
	} else if (typeof data.authors === "string" && data.authors.trim()) {
		authorList = data.authors
			.split(",")
			.map((a) => a.trim())
			.filter(Boolean);
	} else if (Array.isArray(data.author)) {
		authorList = data.author.map((a) => String(a).trim()).filter(Boolean);
	} else if (typeof data.author === "string" && data.author.trim()) {
		authorList = [data.author.trim()];
	}

	if (authorList.length === 0) {
		authorList = [defaultAuthor];
	}

	return {
		authors: authorList,
		author: authorList.join(", ")
	};
}

/**
 * Normalizes categories from frontmatter data.
 * Supports:
 * - category: "Návody"
 * - categories: ["Návody", "Web"]
 * - categories: "Návody, Web"
 * - category: "Návody, Web"
 * - category: ["Návody", "Web"]
 * Preserves order, deduplicates case-insensitively while keeping original casing.
 * Falls back to "General".
 */
export function resolveCategories(data) {
	if (!data) {
		return {
			category: "General",
			categorySlug: slugifyCategory("General"),
			categories: ["General"],
			categoryItems: [{ name: "General", slug: slugifyCategory("General") }]
		};
	}

	let list = [];

	if (Array.isArray(data.categories)) {
		list.push(...data.categories.flatMap((c) => (typeof c === "string" ? c.split(",") : [String(c)])));
	} else if (typeof data.categories === "string" && data.categories.trim()) {
		list.push(...data.categories.split(","));
	}

	if (Array.isArray(data.category)) {
		list.push(...data.category.flatMap((c) => (typeof c === "string" ? c.split(",") : [String(c)])));
	} else if (typeof data.category === "string" && data.category.trim()) {
		list.push(...data.category.split(","));
	}

	const cleaned = list.map((c) => String(c).trim()).filter(Boolean);

	const seen = new Set();
	const uniqueCategories = [];
	for (const cat of cleaned) {
		const lower = cat.toLowerCase();
		if (!seen.has(lower)) {
			seen.add(lower);
			uniqueCategories.push(cat);
		}
	}

	if (uniqueCategories.length === 0) {
		uniqueCategories.push("General");
	}

	const primaryCategory = uniqueCategories[0];
	const categoryItems = uniqueCategories.map((c) => ({
		name: c,
		slug: slugifyCategory(c)
	}));

	return {
		category: primaryCategory,
		categorySlug: slugifyCategory(primaryCategory),
		categories: uniqueCategories,
		categoryItems
	};
}



/**
 * Detect all available language variants in a directory dynamically.
 * Matches index.<lang>.md (e.g. index.cs.md, index.en.md, index.fr.md, index.de.md),
 * index.md, <slug>.<lang>.md, and <slug>.md (which defaults to cs or reads frontmatter lang).
 */
export async function detectDirectoryLanguages(dir, slug = null) {
	const fileMap = new Map();

	if (!fs.existsSync(dir)) {
		return { languages: [], fileMap };
	}

	const dirSlug = (slug || path.basename(dir)).toLowerCase();

	try {
		const files = await fs.promises.readdir(dir);

		for (const file of files) {
			const matchIndex = file.match(/^index\.([a-zA-Z]{2,5})\.md$/i);
			if (matchIndex) {
				const code = matchIndex[1].toLowerCase();
				fileMap.set(code, file);
				continue;
			}

			const escapedSlug = dirSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const slugLangRegex = new RegExp(`^${escapedSlug}\\.([a-zA-Z]{2,5})\\.md$`, "i");
			const matchSlug = file.match(slugLangRegex);
			if (matchSlug) {
				const code = matchSlug[1].toLowerCase();
				if (!fileMap.has(code)) {
					fileMap.set(code, file);
				}
			}
		}

		const primaryCandidates = ["index.md"];
		for (const file of files) {
			if (file.toLowerCase() === `${dirSlug}.md` && file !== "index.md") {
				primaryCandidates.push(file);
			}
		}

		for (const candidate of primaryCandidates) {
			if (files.includes(candidate)) {
				try {
					const raw = await fs.promises.readFile(path.join(dir, candidate), "utf-8");
					const { data } = matter(raw);
					const code = (data.lang || "cs").toLowerCase();
					if (!fileMap.has(code)) {
						fileMap.set(code, candidate);
					}
				} catch {
					if (!fileMap.has("cs")) {
						fileMap.set("cs", candidate);
					}
				}
			}
		}

		// Sort: cs first, then en, then others alphabetically
		const languages = Array.from(fileMap.keys()).sort((a, b) => {
			if (a === "cs") return -1;
			if (b === "cs") return 1;
			if (a === "en") return -1;
			if (b === "en") return 1;
			return a.localeCompare(b);
		});

		return { languages, fileMap };
	} catch (err) {
		console.error(`Error detecting languages in ${dir}:`, err);
		return { languages: [], fileMap };
	}
}

/**
 * Extract the first real image from markdown content using marked.lexer tokenization.
 * Automatically skips code blocks and inline code samples.
 */
export function extractFirstImageFromMarkdown(content) {
	if (!content || typeof content !== "string") return null;

	try {
		const tokens = marked.lexer(content);

		function findImage(tokenList) {
			for (const token of tokenList) {
				if (!token) continue;
				// Ignore code blocks and inline code
				if (token.type === "code" || token.type === "codespan") continue;

				if (token.type === "image" && token.href) {
					return {
						src: token.href.trim(),
						alt: (token.text || "").trim()
					};
				}

				if (token.type === "html" && token.raw) {
					const imgMatch = token.raw.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
					if (imgMatch) {
						const altMatch = token.raw.match(/alt=["']([^"']*?)["']/i);
						return {
							src: imgMatch[1].trim(),
							alt: altMatch ? altMatch[1].trim() : ""
						};
					}
				}

				if (Array.isArray(token.tokens)) {
					const nested = findImage(token.tokens);
					if (nested) return nested;
				}

				if (Array.isArray(token.items)) {
					const nested = findImage(token.items);
					if (nested) return nested;
				}

				if (Array.isArray(token.header)) {
					const nested = findImage(token.header);
					if (nested) return nested;
				}

				if (Array.isArray(token.rows)) {
					for (const row of token.rows) {
						if (Array.isArray(row)) {
							const nested = findImage(row);
							if (nested) return nested;
						}
					}
				}
			}
			return null;
		}

		return findImage(tokens);
	} catch (err) {
		console.error("Error extracting first image from markdown:", err);
		return null;
	}
}

/**
 * Resolve the thumbnail image and alt text for an article.
 * Supports:
 * - Direct image defined in frontmatter: image: "./cover.jpg", image: "cover.jpg", or external URL
 * - Explicitly disabled: image: false, image: "none", image: "false", image: null
 * - First image in article: image: "first", image: "auto", image: true, or when omitted/undefined
 * - Fallback to cover.{png,jpg,jpeg,webp,svg,avif} in the article folder
 */
export function resolveThumbnail(data, content, slug, postDir = null) {
	if (!data) return null;

	const rawImage =
		data.image !== undefined ? data.image : (data.thumbnail !== undefined ? data.thumbnail : data.cover);

	// Case 1: Explicitly disabled
	if (
		rawImage === false ||
		rawImage === null ||
		(typeof rawImage === "string" &&
			["none", "false", "no", "off", "null"].includes(rawImage.toLowerCase().trim()))
	) {
		return null;
	}

	function formatImageUrl(src) {
		if (!src) return null;
		const trimmed = src.trim();
		if (!trimmed) return null;
		if (
			trimmed.startsWith("http://") ||
			trimmed.startsWith("https://") ||
			trimmed.startsWith("/") ||
			trimmed.startsWith("data:")
		) {
			return trimmed;
		}
		const cleaned = trimmed.replace(/^\.\//, "");
		return `/blog/${slug}/${cleaned}`;
	}

	// Case 2: Explicitly specified specific image (string or object)
	if (rawImage !== undefined && rawImage !== "first" && rawImage !== "auto" && rawImage !== true) {
		if (typeof rawImage === "string") {
			const finalUrl = formatImageUrl(rawImage);
			if (!finalUrl) return null;
			return {
				image: finalUrl,
				imageAlt: data.imageAlt || data.thumbnailAlt || data.title || "",
				imageSource: "frontmatter"
			};
		}

		if (typeof rawImage === "object") {
			const src = rawImage.src || rawImage.url;
			const finalUrl = formatImageUrl(src);
			if (!finalUrl) return null;
			return {
				image: finalUrl,
				imageAlt: rawImage.alt || data.imageAlt || data.thumbnailAlt || data.title || "",
				imageSource: "frontmatter"
			};
		}
	}

	// Case 3: First image in article (default or explicit first/auto/true)
	const firstImage = extractFirstImageFromMarkdown(content);
	if (firstImage) {
		const finalUrl = formatImageUrl(firstImage.src);
		if (finalUrl) {
			return {
				image: finalUrl,
				imageAlt: firstImage.alt || data.imageAlt || data.title || "",
				imageSource: "markdown"
			};
		}
	}

	// Case 4: Check for cover.{png,jpg,jpeg,webp,svg,avif} in article directory
	if (postDir && fs.existsSync(postDir)) {
		try {
			const files = fs.readdirSync(postDir);
			const coverCandidates = [
				"cover.png",
				"cover.jpg",
				"cover.jpeg",
				"cover.webp",
				"cover.svg",
				"cover.avif",
				"thumbnail.png",
				"thumbnail.jpg",
				"thumbnail.jpeg",
				"thumbnail.webp"
			];
			for (const candidate of coverCandidates) {
				const found = files.find((f) => f.toLowerCase() === candidate);
				if (found) {
					return {
						image: `/blog/${slug}/${found}`,
						imageAlt: data.imageAlt || data.thumbnailAlt || data.title || "",
						imageSource: "cover"
					};
				}
			}
		} catch {}
	}

	// No thumbnail found
	return null;
}

/**
 * Resolve interactive HTML+JS article configuration from frontmatter and post directory.
 */
export function resolveInteractiveConfig(data, postDir, slug) {
	if (!data) {
		return {
			interactive: false,
			type: "markdown",
			htmlFile: null,
			iframeUrl: null,
			iframeHeight: "80vh"
		};
	}

	const typeStr = typeof data.type === "string" ? data.type.toLowerCase().trim() : "";
	const hasExplicitHtmlField = typeof data.html === "string" && data.html.trim().length > 0;
	const requestedHtml = hasExplicitHtmlField
		? data.html.trim().replace(/^\.\//, "")
		: "index.html";

	let htmlFileOnDisk = null;
	if (postDir && fs.existsSync(postDir)) {
		try {
			const files = fs.readdirSync(postDir);
			htmlFileOnDisk =
				files.find((f) => f === requestedHtml) ||
				files.find((f) => f.toLowerCase() === requestedHtml.toLowerCase()) ||
				null;
		} catch {}
	}

	const isExplicitInteractive =
		data.interactive === true ||
		typeStr === "html" ||
		typeStr === "interactive" ||
		hasExplicitHtmlField;

	const isImplicitInteractive =
		data.interactive !== false && typeStr !== "markdown" && Boolean(htmlFileOnDisk);

	const interactive = isExplicitInteractive || isImplicitInteractive;
	const finalHtmlFile = interactive ? htmlFileOnDisk || requestedHtml : null;
	const iframeUrl = interactive && finalHtmlFile ? `/blog/${slug}/${finalHtmlFile}` : null;
	const iframeHeight =
		data.iframeHeight !== undefined && data.iframeHeight !== null && String(data.iframeHeight).trim()
			? String(data.iframeHeight).trim()
			: "80vh";

	return {
		interactive,
		type: interactive ? "html" : typeStr || "markdown",
		htmlFile: finalHtmlFile,
		iframeUrl,
		iframeHeight
	};
}

/**
 * Fetch all published blog posts sorted by date descending.
 * Reads each subfolder in /data/content/blog/<slug>/
 */
export async function getAllPosts() {
	const blogDir = getBlogPath();

	if (!fs.existsSync(blogDir)) {
		return [];
	}

	try {
		const entries = await fs.promises.readdir(blogDir, { withFileTypes: true });
		const posts = [];

		for (const entry of entries) {
			if (!entry.isDirectory()) continue;

			const slug = sanitizeSlug(entry.name);
			if (!slug) continue;

			const postDir = path.join(blogDir, entry.name);
			const { languages, fileMap } = await detectDirectoryLanguages(postDir, slug);
			if (languages.length === 0) continue;

			// Primary file: prefer cs, then en, then first available
			const primaryLang = fileMap.has("cs") ? "cs" : (fileMap.has("en") ? "en" : languages[0]);
			const primaryFile = path.join(postDir, fileMap.get(primaryLang));

			try {
				const raw = await fs.promises.readFile(primaryFile, "utf-8");
				const { data, content } = matter(raw);

				// Skip drafts in production
				if (process.env.NODE_ENV === "production" && data.draft === true) {
					continue;
				}

				// Normalize categories and authors
				const postCategories = resolveCategories(data);
				const postAuthors = resolveAuthors(data);
				const postDate = data.date ? new Date(data.date) : new Date();
				const thumbnail = resolveThumbnail(data, content, slug, postDir);
				const interactiveMeta = resolveInteractiveConfig(data, postDir, slug);

				posts.push({
					slug,
					title: data.title || slug,
					date: postDate.toISOString().split("T")[0],
					dateRaw: postDate.getTime(),
					dateFormatted: postDate.toLocaleDateString("cs-CZ", {
						year: "numeric",
						month: "long",
						day: "numeric",
						timeZone: "UTC"
					}),
					author: postAuthors.author,
					authors: postAuthors.authors,
					category: postCategories.category,
					categorySlug: postCategories.categorySlug,
					categories: postCategories.categories,
					categoryItems: postCategories.categoryItems,
					description: data.description || data.excerpt || "",
					draft: Boolean(data.draft),
					languages,
					image: thumbnail ? thumbnail.image : null,
					imageAlt: thumbnail ? thumbnail.imageAlt : null,
					imageSource: thumbnail ? thumbnail.imageSource : null,
					interactive: interactiveMeta.interactive,
					type: interactiveMeta.type,
					htmlFile: interactiveMeta.htmlFile,
					iframeUrl: interactiveMeta.iframeUrl,
					iframeHeight: interactiveMeta.iframeHeight
				});
			} catch (err) {
				console.error(`Error reading blog post at ${primaryFile}:`, err);
			}
		}

		return posts.sort((a, b) => b.dateRaw - a.dateRaw);
	} catch (err) {
		console.error(`Error reading blog directory ${blogDir}:`, err);
		return [];
	}
}

/**
 * Fetch a single blog post by slug and requested language.
 * Dynamically resolves any language code (cs, en, fr, de, etc.).
 */
export async function getPostBySlug(slug, requestedLang = "cs") {
	const validSlug = sanitizeSlug(slug);
	if (!validSlug) return null;

	const blogDir = getBlogPath();
	const postDir = path.join(blogDir, validSlug);

	// Verify containment
	if (!path.resolve(postDir).startsWith(path.resolve(blogDir))) {
		return null;
	}

	if (!fs.existsSync(postDir)) {
		return null;
	}

	const { languages: availableLanguages, fileMap } = await detectDirectoryLanguages(postDir, validSlug);
	if (availableLanguages.length === 0) {
		return null;
	}

	const req = (requestedLang || "cs").toLowerCase().trim();
	let activeLang;
	let isFallback = false;

	if (fileMap.has(req)) {
		activeLang = req;
	} else {
		// Fallback to cs if present, otherwise first available language
		activeLang = fileMap.has("cs") ? "cs" : availableLanguages[0];
		isFallback = true;
	}

	const targetFileName = fileMap.get(activeLang);
	const targetFile = path.join(postDir, targetFileName);

	if (!fs.existsSync(targetFile)) {
		return null;
	}

	try {
		const raw = await fs.promises.readFile(targetFile, "utf-8");
		const { data, content } = matter(raw);

		if (process.env.NODE_ENV === "production" && data.draft === true) {
			return null;
		}

		// Configure marked to rewrite relative image and file links
		const renderer = new marked.Renderer();
		const originalImageRenderer = renderer.image.bind(renderer);

		renderer.image = function ({ href, title, text }) {
			let finalHref = href;
			if (href && !href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("data:")) {
				if (!href.startsWith("/")) {
					const cleanedHref = href.replace(/^\.\//, "");
					finalHref = `/blog/${validSlug}/${cleanedHref}`;
				} else if (!href.startsWith("/blog/") && !href.startsWith("/custom-assets/")) {
					finalHref = `/blog/${validSlug}/${href.slice(1)}`;
				}
			}
			return originalImageRenderer({ href: finalHref, title, text });
		};

		renderer.link = function (token) {
			let href = token.href;
			const isExternal = href && (href.startsWith("http://") || href.startsWith("https://"));
			const isAnchor = href && href.startsWith("#");
			const isSpecial = href && (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("data:"));

			if (href && !isExternal && !isAnchor && !isSpecial) {
				if (!href.startsWith("/")) {
					const cleanedHref = href.replace(/^\.\//, "");
					href = `/blog/${validSlug}/${cleanedHref}`;
				} else if (!href.startsWith("/blog/") && !href.startsWith("/custom-assets/") && !href.startsWith("/category")) {
					href = `/blog/${validSlug}/${href.slice(1)}`;
				}
			}

			const isDownloadable = /\.(3mf|stl|step|stp|gcode|zip|py|tar|gz|7z|rar|pdf|bin|csv|json|txt|md)$/i.test(href);
			const text = this.parser.parseInline(token.tokens);
			const titleAttr = token.title ? ` title="${token.title}"` : "";
			const downloadAttr = isDownloadable ? " download" : "";
			const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";

			return `<a href="${href}"${titleAttr}${downloadAttr}${targetAttr}>${text}</a>`;
		};

		const hasMarkdownContent = Boolean(content && content.trim().length > 0);
		const rawHtml = hasMarkdownContent
			? marked.parse(content, { renderer, gfm: true, breaks: false })
			: "";
		const html = hasMarkdownContent ? rewriteRelativeUrlsInHtml(rawHtml, `/blog/${validSlug}`) : "";

		const postDate = data.date ? new Date(data.date) : new Date();
		const thumbnail = resolveThumbnail(data, content, validSlug, postDir);
		const postAuthors = resolveAuthors(data);
		const postCategories = resolveCategories(data);
		const interactiveMeta = resolveInteractiveConfig(data, postDir, validSlug);

		const localeMap = {
			cs: "cs-CZ",
			sk: "sk-SK",
			en: "en-US",
			de: "de-DE",
			fr: "fr-FR",
			es: "es-ES",
			it: "it-IT",
			pl: "pl-PL"
		};
		const locale = localeMap[activeLang] || activeLang;

		return {
			slug: validSlug,
			title: data.title || validSlug,
			date: postDate.toISOString().split("T")[0],
			dateFormatted: postDate.toLocaleDateString(locale, {
				year: "numeric",
				month: "long",
				day: "numeric",
				timeZone: "UTC"
			}),
			author: postAuthors.author,
			authors: postAuthors.authors,
			category: postCategories.category,
			categorySlug: postCategories.categorySlug,
			categories: postCategories.categories,
			categoryItems: postCategories.categoryItems,
			description: data.description || data.excerpt || "",
			html,
			hasMarkdownContent,
			lang: activeLang,
			availableLanguages,
			isFallback,
			requestedLang: req,
			image: thumbnail ? thumbnail.image : null,
			imageAlt: thumbnail ? thumbnail.imageAlt : null,
			imageSource: thumbnail ? thumbnail.imageSource : null,
			interactive: interactiveMeta.interactive,
			type: interactiveMeta.type,
			htmlFile: interactiveMeta.htmlFile,
			iframeUrl: interactiveMeta.iframeUrl,
			iframeHeight: interactiveMeta.iframeHeight,
			contentPosition: data.contentPosition || "below"
		};
	} catch (err) {
		console.error(`Error processing post ${validSlug}:`, err);
		return null;
	}
}

/**
 * Fetch all posts matching a specific category (supports diacritics and ascii slugs).
 */
export async function getPostsByCategory(categoryParam) {
	if (!categoryParam) return [];
	const decoded = decodeURIComponent(categoryParam).toLowerCase().trim();
	const targetSlug = slugifyCategory(decoded);
	const allPosts = await getAllPosts();

	return allPosts.filter((post) =>
		post.categories.some((c) => {
			const cLower = c.toLowerCase().trim();
			const cSlug = slugifyCategory(c);
			return cLower === decoded || cSlug === targetSlug || cLower === targetSlug;
		})
	);
}

/**
 * Fetch all unique categories with counts and associated posts.
 * Sorted by post count descending, then alphabetically by name.
 * If categoryFilter is provided, only includes posts matching that category.
 */
export async function getAllCategories(categoryFilter = null) {
	const posts = categoryFilter
		? await getPostsByCategory(categoryFilter)
		: await getAllPosts();
	const map = new Map();

	for (const post of posts) {
		const cats = post.categories && post.categories.length > 0 ? post.categories : ["General"];
		for (const cat of cats) {
			const trimmed = cat.trim();
			const slug = slugifyCategory(trimmed);
			if (!map.has(slug)) {
				map.set(slug, {
					name: trimmed,
					slug,
					count: 0,
					posts: []
				});
			}
			const entry = map.get(slug);
			entry.count += 1;
			entry.posts.push(post);
		}
	}

	return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Fetch About Me content with dynamic language detection.
 */
export async function getAboutContent(requestedLang = "cs") {
	const aboutDir = getAboutPath();
	const { languages: availableLanguages, fileMap } = await detectDirectoryLanguages(aboutDir);

	const req = (requestedLang || "cs").toLowerCase().trim();
	let activeLang;
	let isFallback = false;

	if (fileMap.has(req)) {
		activeLang = req;
	} else {
		activeLang = fileMap.has("cs") ? "cs" : (availableLanguages[0] || "cs");
		if (requestedLang && !fileMap.has(req) && availableLanguages.length > 0) {
			isFallback = true;
		}
	}

	const targetFileName = fileMap.get(activeLang);
	const targetFile = targetFileName ? path.join(aboutDir, targetFileName) : null;

	if (!targetFile || !fs.existsSync(targetFile)) {
		return {
			title: requestedLang === "en" ? "About Me" : (requestedLang === "fr" ? "À propos" : "O mně"),
			description: "Personal profile and projects",
			html: "<p>About me content is currently being updated.</p>",
			lang: activeLang || "cs",
			availableLanguages: availableLanguages.length > 0 ? availableLanguages : ["cs"],
			isFallback
		};
	}

	try {
		const raw = await fs.promises.readFile(targetFile, "utf-8");
		const { data, content } = matter(raw);

		// Configure marked to rewrite relative image and file URLs
		const renderer = new marked.Renderer();
		const originalImageRenderer = renderer.image.bind(renderer);

		renderer.image = function ({ href, title, text }) {
			let finalHref = href;
			if (href && !href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("data:")) {
				if (!href.startsWith("/")) {
					const cleanedHref = href.replace(/^\.\//, "");
					finalHref = `/about/${cleanedHref}`;
				} else if (!href.startsWith("/about/") && !href.startsWith("/custom-assets/")) {
					finalHref = `/about/${href.slice(1)}`;
				}
			}
			return originalImageRenderer({ href: finalHref, title, text });
		};

		renderer.link = function (token) {
			let href = token.href;
			const isExternal = href && (href.startsWith("http://") || href.startsWith("https://"));
			const isAnchor = href && href.startsWith("#");
			const isSpecial = href && (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("data:"));

			if (href && !isExternal && !isAnchor && !isSpecial) {
				if (!href.startsWith("/")) {
					const cleanedHref = href.replace(/^\.\//, "");
					href = `/about/${cleanedHref}`;
				} else if (!href.startsWith("/about/") && !href.startsWith("/custom-assets/") && !href.startsWith("/blog") && !href.startsWith("/category")) {
					href = `/about/${href.slice(1)}`;
				}
			}

			const isDownloadable = /\.(3mf|stl|step|stp|gcode|zip|py|tar|gz|7z|rar|pdf|bin|csv|json|txt|md)$/i.test(href);
			const text = this.parser.parseInline(token.tokens);
			const titleAttr = token.title ? ` title="${token.title}"` : "";
			const downloadAttr = isDownloadable ? " download" : "";
			const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";

			return `<a href="${href}"${titleAttr}${downloadAttr}${targetAttr}>${text}</a>`;
		};

		const rawHtml = marked.parse(content, { renderer, gfm: true, breaks: false });
		const html = rewriteRelativeUrlsInHtml(rawHtml, "/about");

		return {
			title: data.title || (activeLang === "en" ? "About Me" : (activeLang === "fr" ? "À propos" : "O mně")),
			description: data.description || "",
			html,
			lang: activeLang,
			availableLanguages,
			isFallback,
			requestedLang: req
		};
	} catch (err) {
		console.error("Error reading about file:", err);
		return null;
	}
}
