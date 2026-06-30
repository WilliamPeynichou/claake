import type { MetadataRoute } from "next";

const BASE_URL = "https://claake.com";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: BASE_URL,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${BASE_URL}/catalogue`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.9,
		},
		{
			url: `${BASE_URL}/download`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.7,
		},
	];
}
