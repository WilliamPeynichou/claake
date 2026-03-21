import { createApiClient } from "@claake/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const apiClient = createApiClient(API_URL);
