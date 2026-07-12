"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ToolConfigJson {
	name: string;
	enabled: boolean;
	config?: { allowed_domains?: string[]; timezone?: string };
}

const BUILT_IN_TOOLS: Array<{ name: string; label: string; description: string }> = [
	{
		name: "current_datetime",
		label: "Date et heure",
		description: "L'agent connaît la date et l'heure courantes.",
	},
	{
		name: "knowledge_search",
		label: "Recherche connaissances",
		description: "L'agent interroge sa base de connaissances pendant la réponse.",
	},
	{
		name: "fetch_url",
		label: "Lecture d'URL",
		description: "L'agent lit des pages web sur des domaines autorisés uniquement.",
	},
];

function parseTools(value: string): ToolConfigJson[] {
	if (!value.trim()) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? (parsed as ToolConfigJson[]) : [];
	} catch {
		return [];
	}
}

function serializeTools(tools: ToolConfigJson[]): string {
	const enabled = tools.filter((tool) => tool.enabled);
	return enabled.length > 0 ? JSON.stringify(enabled, null, 2) : "";
}

interface AgentToolsEditorProps {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

/** Structured editor for backend built-in tools; stores the same JSON contract as before. */
export function AgentToolsEditor({ value, onChange, disabled = false }: AgentToolsEditorProps) {
	const tools = parseTools(value);
	const byName = new Map(tools.map((tool) => [tool.name, tool]));
	const fetchUrl = byName.get("fetch_url");
	const allowedDomains = fetchUrl?.config?.allowed_domains?.join(", ") ?? "";

	const toggle = (name: string, enabled: boolean) => {
		const next = tools.filter((tool) => tool.name !== name);
		if (enabled) {
			const previous = byName.get(name);
			next.push({ name, enabled: true, ...(previous?.config ? { config: previous.config } : {}) });
		}
		onChange(serializeTools(next));
	};

	const setAllowedDomains = (raw: string) => {
		const domains = raw
			.split(",")
			.map((domain) => domain.trim().toLowerCase())
			.filter(Boolean);
		const next = tools.filter((tool) => tool.name !== "fetch_url");
		next.push({
			name: "fetch_url",
			enabled: true,
			...(domains.length > 0 ? { config: { allowed_domains: domains } } : {}),
		});
		onChange(serializeTools(next));
	};

	return (
		<div className="space-y-3">
			<Label>Tools agent</Label>
			<div className="space-y-2 rounded-md border p-3">
				{BUILT_IN_TOOLS.map((tool) => {
					const isEnabled = byName.get(tool.name)?.enabled === true;
					return (
						<div key={tool.name} className="flex items-start gap-3">
							<input
								id={`tool-${tool.name}`}
								type="checkbox"
								className="mt-1 h-4 w-4 accent-primary"
								checked={isEnabled}
								disabled={disabled}
								onChange={(e) => toggle(tool.name, e.target.checked)}
							/>
							<div className="flex-1">
								<Label htmlFor={`tool-${tool.name}`} className="cursor-pointer">
									{tool.label}
								</Label>
								<p className="text-xs text-muted-foreground">{tool.description}</p>
								{tool.name === "fetch_url" && isEnabled && (
									<div className="mt-2">
										<Input
											value={allowedDomains}
											disabled={disabled}
											placeholder="example.com, docs.example.org"
											onChange={(e) => setAllowedDomains(e.target.value)}
										/>
										<p className="mt-1 text-xs text-muted-foreground">
											Domaines autorisés, séparés par des virgules. Obligatoire.
										</p>
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
			<p className="text-xs text-muted-foreground">
				Tools exécutés uniquement côté backend, quotas et sécurité inclus.
			</p>
		</div>
	);
}
