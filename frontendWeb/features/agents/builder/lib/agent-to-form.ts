import type { Agent, CreateEndpointFormat } from "@claake/shared";
import {
	type AgentBuilderForm,
	type CloudStrategyValue,
	type ExecutionModeValue,
	INITIAL_AGENT_FORM,
} from "../agent-builder.types";

/** Hydrate le formulaire builder depuis un agent existant (mode édition). */
export function agentToForm(agent: Agent): AgentBuilderForm {
	return {
		...INITIAL_AGENT_FORM,
		name: agent.name,
		description: agent.description,
		longDescription: agent.long_description ?? "",
		category: agent.category,
		tags: agent.tags.join(", "),
		model: agent.models[0] ?? INITIAL_AGENT_FORM.model,
		mode: agent.mode.toUpperCase() as ExecutionModeValue,
		cloudStrategy: (agent.cloud_strategy?.toUpperCase() ?? "USER_API_KEY") as CloudStrategyValue,
		requiredUserProvider: agent.required_user_provider ?? "anthropic",
		systemPrompt: agent.system_prompt ?? "",
		welcomeMessage: agent.welcome_message ?? "",
		suggestedPrompts: agent.suggested_prompts.join("\n"),
		limitations: agent.limitations.join("\n"),
		variables: agent.variables ? JSON.stringify(agent.variables, null, 2) : "",
		fewShotExamples: agent.few_shot_examples.length
			? JSON.stringify(agent.few_shot_examples, null, 2)
			: "",
		outputFormat: agent.output_format ?? "",
		qualityChecklist: agent.quality_checklist.join("\n"),
		endpointFormat: (agent.endpoint_format?.toUpperCase() ?? "OPENAI") as CreateEndpointFormat,
		dockerImage: agent.docker_image ?? "",
		downloadUrl: agent.download_url ?? "",
	};
}
