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
	/ignore\s+(previous|above|all)\s+(instructions?|prompts?)/i,
	/rm\s+-rf/i,
	/\beval\s*\(/i,
	/\bexec\s*\(/i,
	/DROP\s+TABLE/i,
	/DELETE\s+FROM/i,
	/;\s*--/i,
	/UNION\s+SELECT/i,
	/\bsystem\s*\(/i,
	/\b__import__\s*\(/i,
];

const WARNING_PATTERNS = [
	/\bpassword\b/i,
	/\bsecret\b/i,
	/\btoken\b/i,
	/\bapi[_\s]?key\b/i,
	/\bcredential/i,
];

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

		// System prompt security scan
		const systemPrompt = agent.systemPrompt ?? "";
		if (systemPrompt) {
			for (const pattern of DANGEROUS_PATTERNS) {
				if (pattern.test(systemPrompt)) {
					errors.push(
						`Contenu potentiellement dangereux détecté dans le system prompt : ${pattern.source}`,
					);
				}
			}
			for (const pattern of WARNING_PATTERNS) {
				if (pattern.test(systemPrompt)) {
					warnings.push(`Le system prompt contient un mot sensible : ${pattern.source}`);
				}
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
