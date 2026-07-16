import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface.js";

const DESKTOP_ORIGINS = ["tauri://localhost", "http://tauri.localhost"];
const DEVELOPMENT_ORIGINS = [
	"http://localhost:3000",
	"http://localhost:3001",
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"http://localhost:8081",
];

function parseWebOrigin(value: string | undefined, isProduction: boolean): string | undefined {
	if (!value) {
		if (isProduction) throw new Error("WEB_URL is required in production for CORS");
		return undefined;
	}

	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new Error("WEB_URL must be a valid URL");
	}

	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new Error("WEB_URL must use http:// or https://");
	}
	if (url.username || url.password || url.search || url.hash || url.pathname !== "/") {
		throw new Error("WEB_URL must be an origin without credentials, path, query, or fragment");
	}
	if (isProduction && url.protocol !== "https:") {
		throw new Error("WEB_URL must use https:// in production");
	}

	return url.origin;
}

export function createCorsOptions(env: NodeJS.ProcessEnv): CorsOptions {
	const isProduction = env.NODE_ENV === "production";
	const webOrigin = parseWebOrigin(env.WEB_URL, isProduction);
	const origins = [
		...(isProduction ? [] : DEVELOPMENT_ORIGINS),
		...DESKTOP_ORIGINS,
		...(webOrigin ? [webOrigin] : []),
	];

	return {
		origin: [...new Set(origins)],
		credentials: true,
		methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Stripe-Signature"],
	};
}
