import type { AgentBuilderForm, ExecutionModeValue } from "../agent-builder.types";

/**
 * Transforme un `.agentjson` (structure libre, snake_case ou camelCase) en patch
 * partiel du formulaire builder. Lève si le JSON est invalide.
 */
export function parseAgentJson(text: string): Partial<AgentBuilderForm> {
	const parsed = JSON.parse(text) as Record<string, unknown>;

	const arr = (v: unknown): string[] | undefined =>
		Array.isArray(v) ? (v as string[]) : undefined;
	const joinLines = (v: unknown): string | undefined => arr(v)?.join("\n");
	const jsonStr = (v: unknown): string | undefined =>
		v !== undefined && v !== null ? JSON.stringify(v, null, 2) : undefined;
	const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

	const p = parsed;
	const patch: Partial<AgentBuilderForm> = {};

	const set = <K extends keyof AgentBuilderForm>(
		key: K,
		value: AgentBuilderForm[K] | undefined,
	) => {
		if (value !== undefined) patch[key] = value;
	};

	set("name", str(p.name));
	set("description", str(p.description));
	set("longDescription", str(p.long_description) ?? str(p.longDescription));
	set("category", str(p.category));
	set("tags", arr(p.tags)?.join(", "));
	set("model", str(p.model) ?? arr(p.models)?.[0]);
	set(
		"mode",
		typeof p.mode === "string" ? (p.mode.toUpperCase() as ExecutionModeValue) : undefined,
	);
	set("cloudStrategy", str(p.cloud_strategy) as AgentBuilderForm["cloudStrategy"] | undefined);
	set("requiredUserProvider", str(p.required_user_provider));
	set("systemPrompt", str(p.system_prompt) ?? str(p.systemPrompt));
	set("welcomeMessage", str(p.welcome_message) ?? str(p.welcomeMessage) ?? str(p.welcome));
	set("suggestedPrompts", joinLines(p.suggested_prompts) ?? joinLines(p.suggestedPrompts));
	set("limitations", joinLines(p.limitations));
	set("variables", jsonStr(p.variables));
	set("fewShotExamples", jsonStr(p.few_shot_examples) ?? jsonStr(p.fewShotExamples));
	set("outputFormat", str(p.output_format) ?? str(p.outputFormat));
	set("qualityChecklist", joinLines(p.quality_checklist) ?? joinLines(p.qualityChecklist));
	set("endpoint", str(p.endpoint) ?? str(p.config_url));
	set("endpointFormat", str(p.endpoint_format) as AgentBuilderForm["endpointFormat"] | undefined);
	set("sellerApiProvider", str(p.seller_api_provider));
	set("dockerImage", str(p.docker_image));
	set("downloadUrl", str(p.download_url));

	return patch;
}
