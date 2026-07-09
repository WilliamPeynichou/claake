import type { AgentToolConfig } from "../agent-tools.js";

export class AgentEntity {
	constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly slug: string,
		public readonly description: string,
		public readonly longDescription: string | null,
		public readonly category: string,
		public readonly tags: string[],
		public readonly models: string[],
		public readonly mode: string,
		public readonly configUrl: string | null,
		public readonly imageUrl: string | null,
		public readonly screenshots: string[],
		public readonly pricingModel: string,
		public readonly price: number,
		public readonly creditCost: number,
		public readonly status: string,
		public readonly permissions: Record<string, unknown> | null,
		public readonly downloadCount: number,
		public readonly rating: number,
		public readonly reviewCount: number,
		public readonly creatorId: string,
		public readonly creatorName: string | null,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
		public readonly systemPrompt: string | null = null,
		public readonly cloudStrategy: string | null = null,
		public readonly endpointUrl: string | null = null,
		public readonly endpointFormat: string | null = null,
		public readonly sellerApiKeyEncrypted: string | null = null,
		public readonly sellerApiProvider: string | null = null,
		public readonly requiredUserProvider: string | null = null,
		public readonly dockerImage: string | null = null,
		public readonly downloadUrl: string | null = null,
		public readonly welcomeMessage: string | null = null,
		public readonly suggestedPrompts: string[] = [],
		public readonly limitations: string[] = [],
		public readonly modelSettings: Record<string, unknown> | null = null,
		public readonly capabilities: Record<string, unknown> | null = null,
		public readonly variables: Record<string, unknown> | null = null,
		public readonly fewShotExamples: Record<string, unknown>[] = [],
		public readonly outputFormat: string | null = null,
		public readonly qualityChecklist: string[] = [],
		public readonly tools: AgentToolConfig[] = [],
	) {}

	isOwnedBy(userId: string): boolean {
		return this.creatorId === userId;
	}

	isFree(): boolean {
		return this.pricingModel === "FREE";
	}

	isPublished(): boolean {
		return this.status === "APPROVED";
	}

	isCloudCapable(): boolean {
		return this.mode === "CLOUD" || this.mode === "HYBRID";
	}

	isLocalCapable(): boolean {
		return this.mode === "LOCAL" || this.mode === "HYBRID";
	}

	requiresUserApiKey(): boolean {
		return this.cloudStrategy === "USER_API_KEY";
	}
}
