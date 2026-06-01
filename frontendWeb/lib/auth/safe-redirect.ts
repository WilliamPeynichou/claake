const SAFE_REDIRECT_PREFIXES = ["/dashboard", "/chat", "/checkout", "/admin"];

export function safeRedirectPath(
	value: string | null | undefined,
	fallback = "/dashboard",
): string {
	if (!value) return fallback;
	if (!value.startsWith("/") || value.startsWith("//")) return fallback;
	if (value.includes("\\")) return fallback;
	let decodedValue = value;
	try {
		decodedValue = decodeURIComponent(value);
	} catch {
		return fallback;
	}
	if (decodedValue.includes("\\") || decodedValue.startsWith("//")) return fallback;

	let parsed: URL;
	try {
		parsed = new URL(value, "https://claake.local");
	} catch {
		return fallback;
	}

	if (parsed.origin !== "https://claake.local") return fallback;
	if (
		!SAFE_REDIRECT_PREFIXES.some(
			(prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`),
		)
	) {
		return fallback;
	}

	return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
