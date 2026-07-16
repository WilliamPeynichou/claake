#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

const ROOT = process.cwd();
const ALLOWED_ENV_FILES = /(^|\/|\\)\.env(?:\.[^/\\]+)?\.example$/;
const REAL_ENV_FILE = /(^|\/|\\)\.env(?:\.[^/\\]+)?$/;

const patterns = [
	{ name: "private key", regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
	{ name: "GitHub token", regex: /\bgh(?:p|o|u|s|r)_[A-Za-z0-9_]{30,}\b/g },
	{ name: "OpenAI API key", regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g },
	{ name: "Stripe secret key", regex: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_-]{16,}\b/g },
	{ name: "Stripe webhook secret", regex: /\bwhsec_[A-Za-z0-9_-]{16,}\b/g },
	{ name: "Supabase JWT", regex: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g },
	{
		name: "database URL with credentials",
		regex: /\bpostgres(?:ql)?:\/\/[^\s:@/]+:[^\s@/]+@[^\s]+/gi,
	},
	{ name: "64-char encryption key", regex: /(?:^|[^A-Fa-f0-9])[A-Fa-f0-9]{64}(?:$|[^A-Fa-f0-9])/g },
	{
		name: "assigned sensitive value",
		regex:
			/^\s*(?:DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|ENCRYPTION_KEY|OPENAI_EMBEDDING_API_KEY|MISTRAL_API_KEY|OAUTH_GITHUB_CLIENT_SECRET|GITHUB_CLIENT_SECRET)\s*=\s*[^\s#][^\r\n]*$/gm,
	},
];

function versionableFiles() {
	try {
		const output = execFileSync(
			"git",
			["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
			{ cwd: ROOT, encoding: "utf8" },
		);
		return [...new Set(output.split("\0").filter(Boolean))];
	} catch {
		return [];
	}
}

const findings = [];
const files = versionableFiles();
for (const file of files) {
	if (REAL_ENV_FILE.test(file) && !ALLOWED_ENV_FILES.test(file)) {
		findings.push(`${file}: real environment file is versionable`);
	}
}

for (const rel of files) {
	if (ALLOWED_ENV_FILES.test(rel) || rel === "package-lock.json" || rel.endsWith("Cargo.lock")) {
		continue;
	}
	const file = join(ROOT, rel);
	if (!existsSync(file)) continue;
	let text;
	try {
		text = readFileSync(file, "utf8");
	} catch {
		continue;
	}
	for (const pattern of patterns) {
		pattern.regex.lastIndex = 0;
		if (pattern.regex.test(text)) findings.push(`${rel}: ${pattern.name}`);
	}

	if (basename(file) === ".npmrc" && /(?:_authToken|_password)\s*=\s*[^${\s]/.test(text)) {
		findings.push(`${rel}: npm credentials`);
	}
}

if (findings.length > 0) {
	console.error("Secret scan failed. Revoke exposed values and remove them from Git/workspace:");
	for (const finding of findings) console.error(`- ${finding}`);
	process.exit(1);
}

console.log("Secret scan passed.");
