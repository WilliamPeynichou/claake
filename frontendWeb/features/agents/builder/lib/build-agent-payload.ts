import type { CreateAgentInput } from "@claake/shared";
import type { AgentBuilderForm } from "../agent-builder.types";

export function slugify(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

function splitLines(value: string): string[] {
	return value
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
}

/** Champs dérivés communs create/edit. Lève `SyntaxError` si variables/few-shot invalides. */
function derived(form: AgentBuilderForm) {
	const isLocalCapable = form.mode === "LOCAL" || form.mode === "HYBRID";
	const isCloud = form.mode !== "LOCAL";

	return {
		tags: form.tags
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean),
		suggestedPrompts: splitLines(form.suggestedPrompts),
		limitations: splitLines(form.limitations),
		qualityChecklist: splitLines(form.qualityChecklist),
		variables: form.variables.trim()
			? (JSON.parse(form.variables) as Record<string, unknown>)
			: undefined,
		fewShotExamples: form.fewShotExamples.trim()
			? (JSON.parse(form.fewShotExamples) as Record<string, unknown>[])
			: undefined,
		isLocalCapable,
		isCloud,
	};
}

interface CreateOptions {
	imageUrl?: string;
	configUrl?: string;
}

/** Construit le payload de création d'agent (brouillon). */
export function buildCreateAgentPayload(
	form: AgentBuilderForm,
	options: CreateOptions = {},
): CreateAgentInput {
	const d = derived(form);
	const slug = slugify(form.name);

	return {
		name: form.name,
		slug,
		description: form.description,
		long_description: form.longDescription || undefined,
		category: form.category,
		tags: d.tags,
		models: [form.model],
		mode: form.mode,
		image_url: options.imageUrl ?? undefined,
		cloud_strategy: d.isCloud ? form.cloudStrategy : undefined,
		required_user_provider:
			form.cloudStrategy === "USER_API_KEY" ? form.requiredUserProvider : undefined,
		endpoint_url: form.cloudStrategy === "SELLER_ENDPOINT" ? form.endpoint || undefined : undefined,
		endpoint_format: form.cloudStrategy === "SELLER_ENDPOINT" ? form.endpointFormat : undefined,
		seller_api_key:
			form.cloudStrategy === "SELLER_API_KEY" ? form.sellerApiKey || undefined : undefined,
		seller_api_provider:
			form.cloudStrategy === "SELLER_API_KEY" ? form.sellerApiProvider || undefined : undefined,
		docker_image: d.isLocalCapable ? form.dockerImage || undefined : undefined,
		download_url: d.isLocalCapable ? form.downloadUrl || undefined : undefined,
		config_url: options.configUrl || undefined,
		system_prompt: form.systemPrompt || undefined,
		welcome_message: form.welcomeMessage || undefined,
		suggested_prompts: d.suggestedPrompts.length ? d.suggestedPrompts : undefined,
		limitations: d.limitations.length ? d.limitations : undefined,
		variables: d.variables,
		few_shot_examples: d.fewShotExamples,
		output_format: form.outputFormat || undefined,
		quality_checklist: d.qualityChecklist.length ? d.qualityChecklist : undefined,
		pricing_model: "FREE",
	};
}

/** Construit le payload partiel de mise à jour d'agent (brouillon/rejeté). */
export function buildUpdateAgentPayload(
	form: AgentBuilderForm,
	options: CreateOptions = {},
): Partial<CreateAgentInput> {
	const d = derived(form);

	return {
		name: form.name,
		description: form.description,
		long_description: form.longDescription || undefined,
		category: form.category,
		tags: d.tags,
		models: [form.model],
		mode: form.mode,
		image_url: options.imageUrl ?? undefined,
		config_url: options.configUrl ?? undefined,
		system_prompt: form.systemPrompt || undefined,
		welcome_message: form.welcomeMessage || undefined,
		suggested_prompts: d.suggestedPrompts,
		limitations: d.limitations,
		variables: d.variables,
		few_shot_examples: d.fewShotExamples,
		output_format: form.outputFormat || undefined,
		quality_checklist: d.qualityChecklist,
		cloud_strategy: d.isCloud ? form.cloudStrategy : undefined,
		required_user_provider:
			form.cloudStrategy === "USER_API_KEY" ? form.requiredUserProvider : undefined,
		endpoint_format: form.cloudStrategy === "SELLER_ENDPOINT" ? form.endpointFormat : undefined,
		docker_image: d.isLocalCapable ? form.dockerImage || undefined : undefined,
		download_url: d.isLocalCapable ? form.downloadUrl || undefined : undefined,
	};
}
