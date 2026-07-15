import { randomUUID } from "node:crypto";
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";
import type { UserRole } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service.js";
import { normalizeAgentCapabilities } from "../../agents/domain/agent-capabilities.js";
import { validateUploadFile } from "./upload-file.validator.js";
import { UploadStorageService } from "./upload-storage.service.js";

@Injectable()
export class UploadService {
	private readonly logger = new Logger(UploadService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly storage: UploadStorageService,
	) {}

	async upload(
		file: Express.Multer.File,
		userId: string,
		opts: { agentId?: string; sessionId?: string; messageId?: string },
	) {
		await this.assertUploadTargetAccess(userId, opts);

		const validatedFile = validateUploadFile(file);
		if (opts.sessionId) {
			await this.assertAgentAcceptsFile(opts.sessionId, validatedFile.type);
		}
		const storagePath = `uploads/${userId}/${opts.agentId ?? opts.sessionId ?? "unattached"}/${randomUUID()}${validatedFile.extension}`;

		try {
			await this.storage.uploadPrivateObject(storagePath, file.buffer, validatedFile.mimeType);
		} catch (error) {
			this.logger.warn(
				`Private upload storage error for user=${userId}: ${error instanceof Error ? error.message : "unknown"}`,
			);
			throw new BadRequestException("Erreur lors de l'enregistrement du fichier.");
		}

		let record: Awaited<ReturnType<PrismaService["uploadedFile"]["create"]>>;
		try {
			record = await this.prisma.uploadedFile.create({
				data: {
					type: validatedFile.type,
					url: storagePath,
					fileName: file.originalname,
					mimeType: validatedFile.mimeType,
					size: file.buffer.length,
					userId,
					agentId: opts.agentId ?? null,
					sessionId: opts.sessionId ?? null,
					messageId: opts.messageId ?? null,
				},
			});
		} catch (error) {
			// Storage write succeeded but DB persistence failed: remove the orphan immediately.
			try {
				await this.storage.removePrivateObjects([storagePath]);
			} catch (cleanupError) {
				this.logger.error(
					`Orphan upload cleanup failed path=${storagePath}: ${cleanupError instanceof Error ? cleanupError.message : "unknown"}`,
				);
			}
			throw error;
		}

		return this.withSignedUrl(record);
	}

	async listForAgent(agentId: string, userId: string, role: UserRole) {
		const agent = await this.prisma.agent.findUnique({
			where: { id: agentId },
			select: { creatorId: true },
		});
		if (!agent) {
			throw new NotFoundException("Agent introuvable.");
		}
		if (agent.creatorId !== userId && role !== "ADMIN" && role !== "SUPER_ADMIN") {
			throw new ForbiddenException("Accès refusé.");
		}

		const files = await this.prisma.uploadedFile.findMany({
			where: { agentId },
			orderBy: { createdAt: "desc" },
		});
		return Promise.all(files.map((file) => this.withSignedUrl(file)));
	}

	async listForSession(sessionId: string, userId: string) {
		const session = await this.prisma.chatSession.findUnique({
			where: { id: sessionId },
			select: { userId: true },
		});
		if (!session) {
			throw new NotFoundException("Session introuvable.");
		}
		if (session.userId !== userId) {
			throw new ForbiddenException("Accès refusé.");
		}

		const files = await this.prisma.uploadedFile.findMany({
			where: { sessionId, userId },
			orderBy: { createdAt: "desc" },
		});
		return Promise.all(files.map((file) => this.withSignedUrl(file)));
	}

	async delete(fileId: string, userId: string) {
		const file = await this.prisma.uploadedFile.findUnique({ where: { id: fileId } });
		if (!file || file.userId !== userId) {
			throw new BadRequestException("Fichier introuvable ou accès refusé.");
		}

		if (file.url) {
			await this.storage.removePrivateObjects([file.url]);
		}

		await this.prisma.uploadedFile.delete({ where: { id: fileId } });
	}

	async createSignedUrl(storagePath: string): Promise<string> {
		try {
			return await this.storage.createSignedUrl(storagePath);
		} catch (error) {
			this.logger.warn(
				`Signed URL creation failed for upload path=${storagePath}: ${error instanceof Error ? error.message : "unknown"}`,
			);
			throw new BadRequestException("Impossible de préparer l'accès temporaire au fichier.");
		}
	}

	private async assertUploadTargetAccess(
		userId: string,
		opts: { agentId?: string; sessionId?: string; messageId?: string },
	): Promise<void> {
		if (opts.sessionId) {
			const session = await this.prisma.chatSession.findUnique({
				where: { id: opts.sessionId },
				select: { userId: true, agentId: true },
			});
			if (!session) {
				throw new NotFoundException("Session introuvable.");
			}
			if (session.userId !== userId) {
				throw new ForbiddenException("Accès refusé.");
			}
			if (opts.agentId && session.agentId !== opts.agentId) {
				throw new BadRequestException("Agent et session incohérents.");
			}
		}

		if (opts.messageId) {
			const message = await this.prisma.chatMessage.findUnique({
				where: { id: opts.messageId },
				select: { sessionId: true, session: { select: { userId: true } } },
			});
			if (!message) {
				throw new NotFoundException("Message introuvable.");
			}
			if (message.session.userId !== userId) {
				throw new ForbiddenException("Accès refusé.");
			}
			if (opts.sessionId && message.sessionId !== opts.sessionId) {
				throw new BadRequestException("Message et session incohérents.");
			}
		}

		if (opts.agentId) {
			const agent = await this.prisma.agent.findUnique({
				where: { id: opts.agentId },
				select: { creatorId: true },
			});
			if (!agent) {
				throw new NotFoundException("Agent introuvable.");
			}
			if (agent.creatorId !== userId) {
				throw new ForbiddenException("Accès refusé.");
			}
		}
	}

	private async assertAgentAcceptsFile(
		sessionId: string,
		fileType: "IMAGE" | "DOCUMENT",
	): Promise<void> {
		const session = await this.prisma.chatSession.findUnique({
			where: { id: sessionId },
			select: { agent: { select: { capabilities: true } } },
		});
		const rawCapabilities = (session?.agent?.capabilities ?? null) as Record<
			string,
			unknown
		> | null;
		const capabilities = normalizeAgentCapabilities(rawCapabilities);

		if (fileType === "IMAGE" && !capabilities.images) {
			throw new BadRequestException("Cet agent n'accepte pas les images.");
		}
		if (fileType === "DOCUMENT" && !capabilities.files) {
			throw new BadRequestException("Cet agent n'accepte pas les fichiers.");
		}
	}

	private async withSignedUrl<T extends { url: string }>(file: T): Promise<T> {
		return { ...file, url: await this.createSignedUrl(file.url) };
	}
}
