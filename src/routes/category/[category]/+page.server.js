import { getPostsByCategory, getAllCategories } from "$lib/server/content.js";

export async function load({ params }) {
	const categoryParam = decodeURIComponent(params.category);
	const [posts, allCategories] = await Promise.all([
		getPostsByCategory(categoryParam),
		getAllCategories()
	]);

	const matchedCat = allCategories.find(
		(c) =>
			c.slug === categoryParam.toLowerCase() ||
			c.name.toLowerCase() === categoryParam.toLowerCase()
	);
	const category = matchedCat ? matchedCat.name : categoryParam;

	return {
		category,
		posts,
		allCategories
	};
}
