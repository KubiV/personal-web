import { error } from '@sveltejs/kit';
import {
	getPostBySlug,
	getAllPosts,
	getPostsByCategory,
	slugifyCategory
} from '$lib/server/content.js';
import { getSiteConfig } from '$lib/server/config.js';

export async function load({ params, url, locals }) {
	const requestedLang = url.searchParams.get('lang') || 'cs';
	const post = await getPostBySlug(params.slug, requestedLang);

	if (!post) {
		throw error(404, {
			message: `Article "${params.slug}" was not found.`
		});
	}

	const siteConfig = getSiteConfig();
	const hostInfo = locals.hostInfo;
	const subdomainData = locals.subdomainData;
	let canonicalOrigin = subdomainData?.origin || hostInfo?.origin || url.origin;

	const postCategorySlugs = (post.categories || []).map((c) => slugifyCategory(c));

	if (subdomainData) {
		const subCatSlug = slugifyCategory(subdomainData.category);
		if (postCategorySlugs.includes(subCatSlug)) {
			canonicalOrigin = subdomainData.origin;
		} else {
			canonicalOrigin = subdomainData.baseOrigin;
		}
	} else if (
		siteConfig?.subdomains &&
		hostInfo?.baseHostname &&
		hostInfo.baseHostname !== 'localhost' &&
		hostInfo.baseHostname !== '127.0.0.1'
	) {
		for (const [subKey, subRule] of Object.entries(siteConfig.subdomains)) {
			if (subKey === '_comment' || !subRule || typeof subRule !== 'object') continue;
			const ruleSlug = slugifyCategory(subRule.category || subKey);
			if (postCategorySlugs.includes(ruleSlug)) {
				canonicalOrigin = `${hostInfo.proto}://${subKey.toLowerCase()}.${hostInfo.baseHost}`;
				break;
			}
		}
	}

	const subdomainCategory = subdomainData?.category || null;
	const allPosts = subdomainCategory
		? await getPostsByCategory(subdomainCategory)
		: await getAllPosts();

	const currentIndex = allPosts.findIndex((p) => p.slug === post.slug);
	const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
	const prevPost =
		currentIndex !== -1 && currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

	const sameCategoryPosts = allPosts.filter(
		(p) =>
			p.slug !== post.slug &&
			(p.categories || []).some((c) => postCategorySlugs.includes(slugifyCategory(c)))
	);

	const relatedPosts = [...sameCategoryPosts];
	if (relatedPosts.length < 3) {
		for (const candidate of allPosts) {
			if (
				candidate.slug !== post.slug &&
				!relatedPosts.some((r) => r.slug === candidate.slug)
			) {
				relatedPosts.push(candidate);
				if (relatedPosts.length >= 3) break;
			}
		}
	}

	return {
		post,
		canonicalOrigin,
		prevPost: prevPost
			? { slug: prevPost.slug, title: prevPost.title, dateFormatted: prevPost.dateFormatted }
			: null,
		nextPost: nextPost
			? { slug: nextPost.slug, title: nextPost.title, dateFormatted: nextPost.dateFormatted }
			: null,
		relatedPosts: relatedPosts.slice(0, 3)
	};
}
