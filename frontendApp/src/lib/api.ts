import { createApiClient } from "@claake/shared";
import { requirePublicServiceUrl } from "./environment";

export const API_BASE_URL = requirePublicServiceUrl(
	import.meta.env.VITE_API_URL,
	"VITE_API_URL",
	import.meta.env.PROD,
);

export const apiClient = createApiClient(API_BASE_URL);
