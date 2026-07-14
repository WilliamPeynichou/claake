/**
 * HTTP abuse limits for costly or security-sensitive operations.
 *
 * These complement business quotas (for example ChatQuotaService's per-user minute/day
 * limits). Nest's default throttler tracks by client IP; authenticated business quotas track
 * by user where persistence and longer windows matter.
 */
export const RATE_LIMITS = {
	chatSessionCreate: { default: { ttl: 60_000, limit: 20 } },
	chatMessage: { default: { ttl: 60_000, limit: 10 } },
	upload: { default: { ttl: 60_000, limit: 20 } },
	paymentCheckout: { default: { ttl: 60_000, limit: 10 } },
	paymentWebhook: { default: { ttl: 60_000, limit: 120 } },
	stripeOnboarding: { default: { ttl: 60_000, limit: 5 } },
	apiKeyMutation: { default: { ttl: 60_000, limit: 5 } },
} as const;
