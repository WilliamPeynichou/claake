import { createApiClient } from "@claake/shared";

const API_URL = import.meta.env.VITE_API_URL;
const isProduction = import.meta.env.PROD;

if (!API_URL) {
	throw new Error("VITE_API_URL is not set");
}

if (isProduction) {
	if (!/^https:\/\//.test(API_URL)) {
		throw new Error("VITE_API_URL must use https:// in production");
	}
	if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/.test(API_URL)) {
		throw new Error("VITE_API_URL must not point to localhost in production");
	}
}

export const API_BASE_URL = API_URL.replace(/\/+$/, "");

export const apiClient = createApiClient(API_BASE_URL);
