import type { AgentBuilderForm } from "../agent-builder.types";

/** Étapes du wizard de création. */
export const CREATE_STEPS = [
	"Fichier .agentjson",
	"Métadonnées",
	"Configuration",
	"Tarification",
	"Validation",
] as const;

/**
 * Détermine si l'étape courante du wizard de création peut avancer.
 * Reprend à l'identique les règles de l'ancien `canAdvance`.
 */
export function canAdvanceCreateStep(step: number, form: AgentBuilderForm): boolean {
	switch (step) {
		case 1:
			return !!(form.name && form.description && form.category);
		case 2: {
			const isCloud = form.mode !== "LOCAL";
			const isLocal = form.mode === "LOCAL" || form.mode === "HYBRID";
			if (isCloud && form.cloudStrategy === "SELLER_ENDPOINT" && !form.endpoint) return false;
			if (isCloud && form.cloudStrategy === "SELLER_API_KEY" && !form.sellerApiKey) return false;
			if (isLocal && !form.dockerImage && !form.downloadUrl) return false;
			return true;
		}
		default:
			return true;
	}
}

/** Validation minimale avant soumission (nom, description, catégorie). */
export function hasRequiredFields(form: AgentBuilderForm): boolean {
	return !!(form.name && form.description && form.category);
}
