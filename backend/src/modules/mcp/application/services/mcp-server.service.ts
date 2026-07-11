import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import {
	ENCRYPTION_SERVICE,
	type EncryptionServicePort,
} from "../../../../common/ports/encryption.port.js";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import {
	canSubmitMcpServer,
	type McpServerEntity,
} from "../../domain/entities/mcp-server.entity.js";
import {
	MCP_SERVER_REPOSITORY,
	type McpServerRepositoryPort,
} from "../../domain/ports/mcp-server.repository.port.js";
import {
	McpHttpClient,
	type McpTransportCredentials,
} from "../../infrastructure/transport/mcp-http.client.js";
import type { CreateMcpServerDto, UpdateMcpServerDto } from "../dtos/mcp-server.dto.js";

export type McpActor = { userId: string; role?: string };

@Injectable()
export class McpServerService {
	constructor(
		@Inject(MCP_SERVER_REPOSITORY) private readonly repository: McpServerRepositoryPort,
		@Inject(ENCRYPTION_SERVICE) private readonly encryption: EncryptionServicePort,
		private readonly prisma: PrismaService,
		private readonly transport: McpHttpClient,
	) {}

	async list(agentId: string, actor: McpActor) {
		await this.assertCanManageAgent(agentId, actor);
		return Promise.all(
			(await this.repository.findByAgent(agentId)).map((server) => this.response(server)),
		);
	}

	async create(agentId: string, actor: McpActor, dto: CreateMcpServerDto) {
		await this.assertCanManageAgent(agentId, actor);
		const server = await this.repository.create({
			agentId,
			name: dto.name.trim(),
			url: dto.url,
			credentialsEncrypted: dto.auth
				? this.encryption.encrypt(JSON.stringify(this.authHeaders(dto.auth)))
				: undefined,
		});
		return this.response(server);
	}

	async update(agentId: string, id: string, actor: McpActor, dto: UpdateMcpServerDto) {
		const current = await this.owned(agentId, id, actor);
		if (dto.enabled === true && current.reviewStatus !== "APPROVED") {
			throw new BadRequestException("Le serveur MCP doit être approuvé avant activation.");
		}
		const invalidatesApproval = dto.url !== undefined || dto.auth !== undefined;
		if (invalidatesApproval && current.reviewStatus === "APPROVED") {
			await this.repository.setReview(id, { status: "DRAFT", reason: null });
		}
		return this.response(
			await this.repository.update(id, {
				name: dto.name?.trim(),
				url: dto.url,
				credentialsEncrypted: dto.auth
					? this.encryption.encrypt(JSON.stringify(this.authHeaders(dto.auth)))
					: undefined,
				isActive: invalidatesApproval ? false : dto.enabled,
			}),
		);
	}

	async remove(agentId: string, id: string, actor: McpActor) {
		await this.owned(agentId, id, actor);
		await this.repository.delete(id);
	}

	async discover(agentId: string, id: string, actor: McpActor) {
		const server = await this.owned(agentId, id, actor);
		const tools = await this.transport.listTools({
			url: server.url,
			credentials: this.credentials(server),
		});
		return this.response(await this.repository.replaceTools(id, tools));
	}

	async select(agentId: string, id: string, actor: McpActor, names: string[]) {
		const server = await this.owned(agentId, id, actor);
		const available = new Set(server.tools.map((tool) => tool.name));
		if (names.some((name) => !available.has(name))) {
			throw new BadRequestException("La sélection contient un outil MCP inconnu.");
		}
		return this.response(await this.repository.selectTools(id, names));
	}

	async submit(agentId: string, id: string, actor: McpActor) {
		const server = await this.owned(agentId, id, actor);
		if (!canSubmitMcpServer(server)) {
			throw new BadRequestException("Sélectionnez au moins un outil avant soumission.");
		}
		return this.response(await this.repository.setReview(id, { status: "PENDING", reason: null }));
	}

	async pending() {
		return Promise.all(
			(await this.repository.findPending()).map((server) => this.response(server)),
		);
	}

	async review(
		id: string,
		decision: "approve" | "reject" | "suspend",
		reason: string | undefined,
		reviewerId: string,
	) {
		const server = await this.repository.findById(id);
		if (!server) throw new NotFoundException("Serveur MCP introuvable.");
		if (decision !== "suspend" && server.reviewStatus !== "PENDING") {
			throw new BadRequestException("Ce serveur MCP n'est pas en attente de revue.");
		}
		if (decision === "reject" && !reason?.trim()) {
			throw new BadRequestException("Un motif de rejet est obligatoire.");
		}
		const status =
			decision === "approve" ? "APPROVED" : decision === "reject" ? "REJECTED" : "SUSPENDED";
		return this.response(
			await this.repository.setReview(id, {
				status,
				reason: reason?.trim(),
				reviewedBy: reviewerId,
			}),
		);
	}

	private async owned(agentId: string, id: string, actor: McpActor) {
		await this.assertCanManageAgent(agentId, actor);
		const server = await this.repository.findById(id);
		if (!server || server.agentId !== agentId)
			throw new NotFoundException("Serveur MCP introuvable.");
		return server;
	}

	private async assertCanManageAgent(agentId: string, actor: McpActor) {
		const agent = await this.prisma.agent.findUnique({
			where: { id: agentId },
			select: { creatorId: true },
		});
		if (!agent) throw new NotFoundException("Agent introuvable.");
		if (
			agent.creatorId !== actor.userId &&
			actor.role !== "ADMIN" &&
			actor.role !== "SUPER_ADMIN"
		) {
			throw new ForbiddenException("Accès refusé.");
		}
	}

	private credentials(server: McpServerEntity): McpTransportCredentials | undefined {
		if (!server.credentialsEncrypted) return undefined;
		return { headers: JSON.parse(this.encryption.decrypt(server.credentialsEncrypted)) };
	}

	private authHeaders(auth: CreateMcpServerDto["auth"]): Record<string, string> | undefined {
		if (!auth || auth.type === "NONE") return undefined;
		if (auth.type === "BEARER") return { Authorization: `Bearer ${auth.token}` };
		return { [auth.header]: auth.value };
	}

	private response(server: McpServerEntity) {
		return {
			id: server.id,
			agent_id: server.agentId,
			name: server.name,
			url: server.url,
			auth_type: server.credentialsEncrypted ? "API_KEY" : "NONE",
			has_credentials: Boolean(server.credentialsEncrypted),
			review_status: server.reviewStatus,
			review_reason: server.reviewReason,
			enabled: server.isActive,
			tools: server.tools.map((tool) => ({
				id: tool.id,
				name: tool.name,
				description: tool.description,
				input_schema: tool.inputSchema,
				selected: tool.isSelected,
			})),
			created_at: server.createdAt,
			updated_at: server.updatedAt,
		};
	}
}
