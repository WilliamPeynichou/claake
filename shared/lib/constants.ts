/** Maximum sandbox interactions per agent without API key */
export const MAX_SANDBOX_INTERACTIONS = 3;

/** Available AI providers */
export const AI_PROVIDERS = [
	{ id: "anthropic", name: "Anthropic (Claude)" },
	{ id: "openai", name: "OpenAI (GPT)" },
	{ id: "google", name: "Google (Gemini)" },
	{ id: "mistral", name: "Mistral" },
] as const;

/** Available AI models for agent creation */
export const AI_MODELS = [
	{ id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "anthropic" },
	{ id: "claude-opus-4-20250514", name: "Claude Opus 4", provider: "anthropic" },
	{ id: "gpt-4o", name: "GPT-4o", provider: "openai" },
	{ id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "google" },
	{ id: "mistral-large", name: "Mistral Large", provider: "mistral" },
] as const;

/** Agent execution modes */
export const EXECUTION_MODES = [
	{ id: "cloud" as const, name: "Cloud" },
	{ id: "local" as const, name: "Local" },
	{ id: "hybrid" as const, name: "Hybride" },
] as const;

/** Agent status labels (FR) */
export const STATUS_LABELS: Record<string, string> = {
	published: "Publié",
	pending: "En attente",
	draft: "Brouillon",
	rejected: "Rejeté",
};

/** User role labels (FR) */
export const ROLE_LABELS: Record<string, string> = {
	published: "Utilisateur",
	developer: "Développeur",
	admin: "Admin",
};

/** Cloud execution strategies for the agent builder (id = backend enum, FR labels). */
export const CLOUD_STRATEGIES = [
	{
		id: "USER_API_KEY" as const,
		label: "Clé API utilisateur",
		desc: "L'utilisateur fournit sa propre clé",
	},
	{
		id: "SELLER_API_KEY" as const,
		label: "Clé API vendeur",
		desc: "Vous fournissez votre clé API",
	},
	{
		id: "SELLER_ENDPOINT" as const,
		label: "Endpoint custom",
		desc: "Votre propre serveur API",
	},
] as const;

/** Endpoint API formats for the seller endpoint strategy (id = backend enum). */
export const ENDPOINT_FORMATS = [
	{ id: "OPENAI" as const, label: "OpenAI compatible" },
	{ id: "ANTHROPIC" as const, label: "Anthropic" },
	{ id: "GOOGLE" as const, label: "Google" },
	{ id: "MISTRAL" as const, label: "Mistral" },
	{ id: "GROQ" as const, label: "Groq" },
	{ id: "HUGGINGFACE" as const, label: "HuggingFace" },
	{ id: "CLAAKE" as const, label: "Claake" },
] as const;

/** Provider options shown in the agent builder selects (includes Groq). */
export const BUILDER_PROVIDER_OPTIONS = [
	{ id: "anthropic", name: "Anthropic (Claude)" },
	{ id: "openai", name: "OpenAI (GPT)" },
	{ id: "google", name: "Google (Gemini)" },
	{ id: "mistral", name: "Mistral" },
	{ id: "groq", name: "Groq" },
] as const;
