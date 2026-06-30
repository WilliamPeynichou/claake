const SENSITIVE_PATTERN =
	/(authorization\s*[:=]\s*bearer\s+)[^\s,;"']+|(bearer\s+)[^\s,;"']+|((?:api[_-]?key|token|secret|password|webhook[_-]?secret)\s*[:=]\s*)[^\s,;"']+|\b(?:sk|rk|pk|whsec)_(?:test|live)?_[A-Za-z0-9_\-]+\b|\beyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\b/gi;

export function redactSensitive(value: unknown): string {
	const text = value instanceof Error ? `${value.name}: ${value.message}` : String(value);
	return text.replace(SENSITIVE_PATTERN, (...matches: string[]) => {
		if (matches[1]) return `${matches[1]}[REDACTED]`;
		if (matches[2]) return `${matches[2]}[REDACTED]`;
		if (matches[3]) return `${matches[3]}[REDACTED]`;
		return "[REDACTED]";
	});
}
