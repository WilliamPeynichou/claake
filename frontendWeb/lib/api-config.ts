const value = process.env.NEXT_PUBLIC_API_URL;

if (!value) {
	throw new Error("NEXT_PUBLIC_API_URL is not set");
}

if (process.env.NODE_ENV === "production") {
	if (!/^https:\/\//.test(value)) {
		throw new Error("NEXT_PUBLIC_API_URL must use https:// in production");
	}
	if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/.test(value)) {
		throw new Error("NEXT_PUBLIC_API_URL must not point to localhost in production");
	}
}

export const API_BASE_URL = value.replace(/\/+$/, "");
