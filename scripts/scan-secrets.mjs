#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
	".claakecode",
	".git",
	".next",
	".vercel",
	"Pake",
	"coverage",
	"dist",
	"build",
	"node_modules",
	"skills",
	"target",
]);
const SKIP_FILES = new Set(["package-lock.json", "tsconfig.tsbuildinfo"]);
const ALLOWED_EXAMPLE_FILES = /(^|\/|\\)\.env(\.[^/\\]+)?\.example$/;

const patterns = [
	{ name: "Stripe secret key", regex: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_\-]{16,}\b/g },
	{ name: "Stripe webhook secret", regex: /\bwhsec_[A-Za-z0-9_\-]{16,}\b/g },
	{ name: "Supabase service role JWT", regex: /eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]*\"?role\"?\s*:?\s*\"?service_role\"?[A-Za-z0-9_\-\.]*|eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/g },
	{ name: "64-char hex encryption key", regex: /(?:^|[^A-Fa-f0-9])[A-Fa-f0-9]{64}(?:$|[^A-Fa-f0-9])/g },
];

function shouldSkip(path) {
	const rel = relative(ROOT, path);
	if (!rel) return false;
	const parts = rel.split(/[\\/]/);
	return parts.some((part) => SKIP_DIRS.has(part)) || SKIP_FILES.has(parts.at(-1));
}

function walk(dir, files = []) {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (shouldSkip(path)) continue;
	try {
		const stat = statSync(path);
		if (stat.isDirectory()) walk(path, files);
		else if (stat.isFile() && stat.size <= 1024 * 1024) files.push(path);
	} catch {
		// Ignore broken symlinks or files removed during traversal.
	}
	}
	return files;
}

const findings = [];
for (const file of walk(ROOT)) {
	const rel = relative(ROOT, file);
	if (ALLOWED_EXAMPLE_FILES.test(rel)) continue;
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
}

if (findings.length > 0) {
	console.error("Secret scan failed. Rotate exposed values and remove them from the workspace:");
	for (const finding of findings) console.error(`- ${finding}`);
	process.exit(1);
}

console.log("Secret scan passed.");
