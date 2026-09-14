import { getSiteRuntimeData } from '$lib/server/config.js';

/** @type {import('./$types').LayoutServerLoad} */
export async function load() {
	const { config, themeCss } = getSiteRuntimeData();

	return {
		siteConfig: config,
		themeCss
	};
}
