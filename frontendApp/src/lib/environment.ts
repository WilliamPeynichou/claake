const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|\[::1\])$/i;

export function requirePublicServiceUrl(
	value: string | undefined,
	name: string,
	isProduction: boolean,
): string {
	if (!value) throw new Error(`${name} is not set`);

	let parsed: URL;
	try {
		parsed = new URL(value);
	} catch {
		throw new Error(`${name} must be a valid URL`);
	}

	if (parsed.username || parsed.password) {
		throw new Error(`${name} must not contain credentials`);
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error(`${name} must use http:// or https://`);
	}
	if (isProduction) {
		if (parsed.protocol !== "https:") {
			throw new Error(`${name} must use https:// in production`);
		}
		if (LOCAL_HOST_PATTERN.test(parsed.hostname)) {
			throw new Error(`${name} must not point to localhost in production`);
		}
	}

	return value.replace(/\/+$/, "");
}
