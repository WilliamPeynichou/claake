import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../domain/ports/agent.repository.port.js";
import type { AgentChatConfigResponseDto } from "../dtos/agent-chat-config-response.dto.js";

type RequestUser = { id: string; email?: string; role?: string };
type StoredApiKey = { provider: string };

function hasProviderKey(rawKeys: unknown, provider: string): boolean {
	if (!rawKeys) return false;
	try {
		const keys = typeof rawKeys === "string" ? JSON.parse(rawKeys) : rawKeys;
		if (!Array.isArray(keys)) return false;
		return keys.some(
			(key: StoredApiKey) =>
				typeof key.provider === "string" && key.provider.toLowerCase() === provider.toLowerCase(),
		);
	} catch {
		return false;
	}
}

function normalizeCapabilities(raw: Record<string, unknown> | null): {
	files: boolean;
	images: boolean;
} {
	return {
		files: raw?.files === true,
		images: raw?.images === true,
	};
}

@Injectable()
export class GetAgentChatConfigUseCase {
	constructor(
		@Inject(AGENT_REPOSITORY) private readonly agentRepo: AgentRepositoryPort,
		private readonly prisma: PrismaService,
	) {}

	async execute(agentId: string, user?: RequestUser): Promise<AgentChatConfigResponseDto> {
		const agent = await this.agentRepo.findById(agentId);
		if (!agent) {
			throw new NotFoundException(`Agent ${agentId} not found`);
		}

		const isOwner = user ? agent.isOwnedBy(user.id) : false;
		const canManageAgents = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
		const isVisible = agent.isPublished() || isOwner || canManageAgents;
		if (!isVisible) {
			throw new NotFoundException(`Agent ${agentId} not found`);
		}

		const provider = this.resolveProvider(agent);
		const access = await this.resolveAccess(agent, user, isOwner, canManageAgents);

		return {
			id: agent.id,
			name: agent.name,
			description: agent.description,
			image_url: agent.imageUrl,
			status: agent.status.toLowerCase(),
			mode: agent.mode.toLowerCase(),
			models: agent.models,
			provider,
			cloud_strategy: agent.cloudStrategy?.toLowerCase() ?? null,
			required_user_provider: agent.requiredUserProvider,
			welcome_message: agent.welcomeMessage,
			suggested_prompts: agent.suggestedPrompts,
			limitations: agent.limitations,
			capabilities: normalizeCapabilities(agent.capabilities),
			access,
		};
	}

	private resolveProvider(
		agent: NonNullable<Awaited<ReturnType<AgentRepositoryPort["findById"]>>>,
	): string | null {
		if (agent.requiredUserProvider) return agent.requiredUserProvider;
		if (agent.sellerApiProvider) return agent.sellerApiProvider;
		if (agent.endpointFormat) return agent.endpointFormat.toLowerCase();
		const model = agent.models[0]?.toLowerCase() ?? "";
		if (model.includes("claude")) return "anthropic";
		if (model.includes("gpt") || model.includes("openai")) return "openai";
		if (model.includes("mistral")) return "mistral";
		if (model.includes("gemini") || model.includes("google")) return "google";
		return null;
	}

	private async resolveAccess(
		agent: NonNullable<Awaited<ReturnType<AgentRepositoryPort["findById"]>>>,
		user: RequestUser | undefined,
		isOwner: boolean,
		canManageAgents: boolean,
	): Promise<AgentChatConfigResponseDto["access"]> {
		if (!user) {
			return { can_chat: false, reason: "login_required" };
		}

		if (!agent.isPublished() && !isOwner && !canManageAgents) {
			return { can_chat: false, reason: "not_published" };
		}

		if (agent.requiresUserApiKey()) {
			const provider = agent.requiredUserProvider;
			if (!provider) {
				return { can_chat: false, reason: "api_key_required" };
			}
			const dbUser = await this.prisma.user.findUnique({
				where: { id: user.id },
				select: { apiKeysEncrypted: true },
			});
			if (!hasProviderKey(dbUser?.apiKeysEncrypted, provider)) {
				return { can_chat: false, reason: "api_key_required", required_provider: provider };
			}
		}

		if (!agent.isFree() && !isOwner) {
			const [purchased, subscribed] = await Promise.all([
				this.agentRepo.hasPurchased(user.id, agent.id),
				this.agentRepo.hasActiveSubscription(user.id, agent.id),
			]);
			if (!purchased && !subscribed) {
				return { can_chat: false, reason: "purchase_required" };
			}
		}

		return { can_chat: true };
	}
}
