import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: ["/dashboard/", "/admin/", "/checkout/", "/chat/"],
		},
		sitemap: "https://claake.com/sitemap.xml",
	};
}
