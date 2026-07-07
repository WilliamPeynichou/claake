import type { CreateEndpointFormat } from "@claake/shared";

export type BuilderMode = "create" | "edit";

export type ExecutionModeValue = "LOCAL" | "CLOUD" | "HYBRID";
export type CloudStrategyValue = "USER_API_KEY" | "SELLER_API_KEY" | "SELLER_ENDPOINT";

/**
 * État de formulaire unique partagé par la création et l'édition d'agent.
 * Toutes les valeurs sont des chaînes (champs de formulaire) ; la conversion
 * vers le payload API (`snake_case`, JSON, tableaux) se fait dans `lib/`.
 */
export interface AgentBuilderForm {
	name: string;
	description: string;
	longDescription: string;
	category: string;
	tags: string;
	model: string;
	mode: ExecutionModeValue;
	cloudStrategy: CloudStrategyValue;
	requiredUserProvider: string;
	systemPrompt: string;
	welcomeMessage: string;
	suggestedPrompts: string;
	limitations: string;
	variables: string;
	fewShotExamples: string;
	outputFormat: string;
	qualityChecklist: string;
	endpoint: string;
	endpointFormat: CreateEndpointFormat;
	sellerApiKey: string;
	sellerApiProvider: string;
	dockerImage: string;
	downloadUrl: string;
}

export const INITIAL_AGENT_FORM: AgentBuilderForm = {
	name: "",
	description: "",
	longDescription: "",
	category: "",
	tags: "",
	model: "claude-sonnet-4-20250514",
	mode: "CLOUD",
	cloudStrategy: "USER_API_KEY",
	requiredUserProvider: "anthropic",
	systemPrompt: "",
	welcomeMessage: "",
	suggestedPrompts: "",
	limitations: "",
	variables: "",
	fewShotExamples: "",
	outputFormat: "",
	qualityChecklist: "",
	endpoint: "",
	endpointFormat: "OPENAI",
	sellerApiKey: "",
	sellerApiProvider: "anthropic",
	dockerImage: "",
	downloadUrl: "",
};

export type SetField = <K extends keyof AgentBuilderForm>(
	field: K,
	value: AgentBuilderForm[K],
) => void;
