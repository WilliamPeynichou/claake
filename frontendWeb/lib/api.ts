import { createApiClient } from "@claake/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
	throw new Error("NEXT_PUBLIC_API_URL is not set");
}

export const apiClient = createApiClient(API_BASE_URL);
