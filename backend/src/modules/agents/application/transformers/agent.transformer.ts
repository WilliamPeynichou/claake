import type { AgentEntity } from "../../domain/entities/agent.entity.js";
import type { AgentResponseDto } from "../dtos/agent-response.dto.js";

export class AgentTransformer {
	static toDto(entity: AgentEntity): AgentResponseDto {
		return {
			id: entity.id,
			name: entity.name,
			slug: entity.slug,
			description: entity.description,
			long_description: entity.longDescription,
			category: entity.category,
			tags: entity.tags,
			models: entity.models,
			mode: entity.mode.toLowerCase(),
			config_url: entity.configUrl,
			image_url: entity.imageUrl,
			screenshots: entity.screenshots,
			pricing_model: entity.pricingModel.toLowerCase(),
			price: entity.price,
			credit_cost: entity.creditCost,
			status: entity.status.toLowerCase(),
			permissions: entity.permissions,
			download_count: entity.downloadCount,
			rating: entity.rating,
			review_count: entity.reviewCount,
			creator_id: entity.creatorId,
			creator_name: entity.creatorName,
			created_at: entity.createdAt.toISOString(),
			updated_at: entity.updatedAt.toISOString(),
			system_prompt: entity.systemPrompt,
			welcome_message: entity.welcomeMessage,
			suggested_prompts: entity.suggestedPrompts,
			limitations: entity.limitations,
			model_settings: entity.modelSettings,
			capabilities: entity.capabilities,
			variables: entity.variables,
			few_shot_examples: entity.fewShotExamples,
			output_format: entity.outputFormat,
			quality_checklist: entity.qualityChecklist,
			cloud_strategy: entity.cloudStrategy?.toLowerCase() ?? null,
			endpoint_format: entity.endpointFormat?.toLowerCase() ?? null,
			required_user_provider: entity.requiredUserProvider,
			docker_image: entity.dockerImage,
			download_url: entity.downloadUrl,
		};
	}
}
