import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { getContentPath, getSiteConfig } from "$lib/server/config.js";

export { getContentPath };

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

/**
 * Helper to generate a clean ASCII slug for category URLs.
 * Strips diacritics (e.g. Návody -> navody).
 */
export function slugifyCategory(text) {
	if (!text) return "general";
	return text
		.toString()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export const DEFAULT_AUTHOR = "KubiV";

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
 * Detect all available language variants in a directory dynamically.
 * Matches index.<lang>.md (e.g. index.cs.md, index.en.md, index.fr.md, index.de.md)
 * and index.md (which defaults to cs or reads frontmatter lang).
 */
export async function detectDirectoryLanguages(dir) {
	const fileMap = new Map();

	if (!fs.existsSync(dir)) {
		return { languages: [], fileMap };
	}

	try {
		const files = await fs.promises.readdir(dir);

		for (const file of files) {
			const match = file.match(/^index\.([a-zA-Z]{2,5})\.md$/i);
			if (match) {
				const code = match[1].toLowerCase();
				fileMap.set(code, file);
			}
		}

		if (files.includes("index.md")) {
			try {
				const raw = await fs.promises.readFile(path.join(dir, "index.md"), "utf-8");
				const { data } = matter(raw);
				const code = (data.lang || "cs").toLowerCase();
				if (!fileMap.has(code)) {
					fileMap.set(code, "index.md");
				}
			} catch {
				if (!fileMap.has("cs")) {
					fileMap.set("cs", "index.md");
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
 */
export function resolveThumbnail(data, content, slug) {
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

	// No thumbnail found
	return null;
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
			const { languages, fileMap } = await detectDirectoryLanguages(postDir);
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

				// Normalize category
				let category = data.category || (Array.isArray(data.categories) ? data.categories[0] : "General");
				let categories = Array.isArray(data.categories)
					? data.categories
					: (data.category ? [data.category] : ["General"]);

				const postDate = data.date ? new Date(data.date) : new Date();
				const thumbnail = resolveThumbnail(data, content, slug);
				const postAuthors = resolveAuthors(data);

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
					category,
					categorySlug: slugifyCategory(category),
					categories,
					description: data.description || data.excerpt || "",
					draft: Boolean(data.draft),
					languages,
					image: thumbnail ? thumbnail.image : null,
					imageAlt: thumbnail ? thumbnail.imageAlt : null,
					imageSource: thumbnail ? thumbnail.imageSource : null
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

	const { languages: availableLanguages, fileMap } = await detectDirectoryLanguages(postDir);
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

		// Configure marked to rewrite relative image URLs
		const renderer = new marked.Renderer();
		const originalImageRenderer = renderer.image.bind(renderer);

		renderer.image = function ({ href, title, text }) {
			let finalHref = href;
			if (href && !href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("/") && !href.startsWith("data:")) {
				const cleanedHref = href.replace(/^\.\//, "");
				finalHref = `/blog/${validSlug}/${cleanedHref}`;
			}
			return originalImageRenderer({ href: finalHref, title, text });
		};

		const html = marked.parse(content, { renderer, gfm: true, breaks: false });

		const postDate = data.date ? new Date(data.date) : new Date();
		const thumbnail = resolveThumbnail(data, content, validSlug);
		const postAuthors = resolveAuthors(data);
		let category = data.category || (Array.isArray(data.categories) ? data.categories[0] : "General");
		let categories = Array.isArray(data.categories)
			? data.categories
			: (data.category ? [data.category] : ["General"]);

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
			category,
			categorySlug: slugifyCategory(category),
			categories,
			description: data.description || data.excerpt || "",
			html,
			lang: activeLang,
			availableLanguages,
			isFallback,
			requestedLang: req,
			image: thumbnail ? thumbnail.image : null,
			imageAlt: thumbnail ? thumbnail.imageAlt : null,
			imageSource: thumbnail ? thumbnail.imageSource : null
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
 */
export async function getAllCategories() {
	const posts = await getAllPosts();
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
		const html = marked.parse(content, { gfm: true, breaks: false });

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
