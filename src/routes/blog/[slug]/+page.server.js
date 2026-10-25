import { error } from '@sveltejs/kit';
import { getPostBySlug, slugifyCategory } from '$lib/server/content.js';
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

	return {
		post,
		canonicalOrigin
	};
}
