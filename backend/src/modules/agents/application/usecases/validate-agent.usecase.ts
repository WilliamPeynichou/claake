import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../domain/ports/agent.repository.port.js";

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	requiresManualReview: boolean;
}

const DANGEROUS_PATTERNS = [
	// Prompt injection
	/ignore\s+(previous|above|all)\s+(instructions?|prompts?)/i,
	/disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/i,
	/you\s+are\s+now\s+(a\s+)?(?!an?\s+ai)/i,
	/act\s+as\s+(if\s+you\s+(were|are)\s+)?(?!an?\s+ai)/i,
	/new\s+instructions?:/i,
	/system\s*:\s*you/i,
	// Shell injection
	/rm\s+-[rRfF]{1,4}\b/,
	/\bsudo\s+rm\b/i,
	/\bchmod\s+[0-7]{3,4}/,
	// Code execution
	/\beval\s*\(/i,
	/\bexec\s*\(/i,
	/\bsystem\s*\(/i,
	/\bspawn\s*\(/i,
	/\b__import__\s*\(/i,
	/\bsubprocess\s*\./i,
	/\bos\.system\s*\(/i,
	/\bchild_process/i,
	// SQL injection
	/DROP\s+TABLE/i,
	/TRUNCATE\s+TABLE/i,
	/DELETE\s+FROM/i,
	/INSERT\s+INTO/i,
	/UPDATE\s+\w+\s+SET/i,
	/;\s*--/,
	/UNION\s+(?:ALL\s+)?SELECT/i,
	/'\s*OR\s*'?\s*\d+\s*=\s*\d+/i,
	/'\s*;\s*DROP/i,
	// Path traversal
	/\.\.[/\\]/,
	// Data exfiltration hints
	/fetch\s*\(\s*['"`]https?:/i,
	/XMLHttpRequest/i,
];

const WARNING_PATTERNS = [
	/\bpassword\b/i,
	/\bsecret\b/i,
	/\btoken\b/i,
	/\bapi[_\s]?key\b/i,
	/\bcredential/i,
	/\bprivate[_\s]?key\b/i,
	/\baccess[_\s]?key\b/i,
];

function normalizeForScan(text: string): string {
	return text
		.normalize("NFKD")
		.replace(/\s+/g, " ")
		.replace(/[^\x20-\x7E]/g, "")
		.trim();
}

function scanText(text: string, label: string, errors: string[], warnings: string[]): void {
	if (!text) return;
	const normalized = normalizeForScan(text);
	const collapsed = text.replace(/\s/g, "");
	for (const pattern of DANGEROUS_PATTERNS) {
		if (pattern.test(text) || pattern.test(normalized) || pattern.test(collapsed)) {
			errors.push(`Contenu potentiellement dangereux détecté dans ${label} : ${pattern.source}`);
		}
	}
	for (const pattern of WARNING_PATTERNS) {
		if (pattern.test(text) || pattern.test(normalized)) {
			warnings.push(`${label} contient un mot sensible : ${pattern.source}`);
		}
	}
}

@Injectable()
export class ValidateAgentUseCase {
	constructor(@Inject(AGENT_REPOSITORY) private readonly repo: AgentRepositoryPort) {}

	async execute(agentId: string): Promise<ValidationResult> {
		const agent = await this.repo.findById(agentId);
		if (!agent) {
			throw new NotFoundException("Agent not found");
		}

		const errors: string[] = [];
		const warnings: string[] = [];

		// Schema validation
		if (!agent.name?.trim()) errors.push("Le nom de l'agent est requis.");
		if (!agent.description?.trim()) errors.push("La description est requise.");
		if (!agent.category?.trim()) errors.push("La catégorie est requise.");
		if (!agent.models?.length) errors.push("Au moins un modèle doit être sélectionné.");

		// Security scan on all text fields stored in DB
		scanText(agent.systemPrompt ?? "", "le system prompt", errors, warnings);
		scanText(agent.name ?? "", "le nom", errors, warnings);
		scanText(agent.description ?? "", "la description", errors, warnings);

		// Validate .agentjson content from storage if config_url is provided
		if (agent.configUrl) {
			try {
				const res = await fetch(agent.configUrl, { signal: AbortSignal.timeout(5000) });
				if (!res.ok) {
					errors.push(`Impossible de récupérer le fichier de configuration (HTTP ${res.status}).`);
				} else {
					const raw = await res.text();
					let parsed: Record<string, unknown>;
					try {
						parsed = JSON.parse(raw);
					} catch {
						errors.push("Le fichier .agentjson n'est pas un JSON valide.");
						parsed = {};
					}
					const fileSystemPrompt =
						typeof parsed.system_prompt === "string"
							? parsed.system_prompt
							: typeof parsed.systemPrompt === "string"
								? parsed.systemPrompt
								: "";
					scanText(fileSystemPrompt, "le system_prompt du fichier .agentjson", errors, warnings);
					scanText(raw, "le fichier .agentjson (contenu brut)", errors, warnings);
				}
			} catch {
				warnings.push("Le fichier de configuration n'a pas pu être vérifié (timeout ou réseau).");
			}
		}

		const valid = errors.length === 0;
		const requiresManualReview = warnings.length > 0;

		// Update agent status based on validation
		if (!valid) {
			await this.repo.updateStatus(agentId, "DRAFT", "FAILED");
		} else if (requiresManualReview) {
			await this.repo.updateStatus(agentId, "PENDING", "MANUAL_REVIEW");
		} else {
			await this.repo.updateStatus(agentId, "PENDING", "PASSED");
		}

		return { valid, errors, warnings, requiresManualReview };
	}
}
