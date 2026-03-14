import { createApiClient } from "@agentplace/shared";

/**
 * API client singleton for the web frontend.
 * Points to the backend API. In dev, uses Next.js rewrites or env variable.
 * In production, will point to the deployed backend.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/v1";

export const apiClient = createApiClient(API_BASE_URL);
