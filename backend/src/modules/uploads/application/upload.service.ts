import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { UserRole } from "@prisma/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PrismaService } from "../../../prisma/prisma.service.js";

const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
	"application/pdf",
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// TODO: Create the bucket "agent-files" in Supabase dashboard with public read access
// before deploying this module.
const BUCKET = "agent-files";

@Injectable()
export class UploadService {
	private readonly supabase: SupabaseClient;

	constructor(
		private readonly prisma: PrismaService,
		private readonly config: ConfigService,
	) {
		this.supabase = createClient(
			this.config.getOrThrow<string>("SUPABASE_URL"),
			this.config.getOrThrow<string>("SUPABASE_SERVICE_ROLE_KEY"),
		);
	}

	async upload(
		file: Express.Multer.File,
		userId: string,
		opts: { agentId?: string; sessionId?: string; messageId?: string },
	) {
		await this.assertUploadTargetAccess(userId, opts);

		if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
			throw new BadRequestException(
				`Type de fichier non supporté : ${file.mimetype}. Types acceptés : JPG, PNG, WebP, GIF, PDF.`,
			);
		}
		if (file.size > MAX_SIZE_BYTES) {
			throw new BadRequestException("Fichier trop volumineux (max 10 Mo).");
		}

		const ext = extname(file.originalname).toLowerCase();
		const storagePath = `uploads/${opts.agentId ?? opts.sessionId ?? userId}/${randomUUID()}${ext}`;

		const { error: storageError } = await this.supabase.storage
			.from(BUCKET)
			.upload(storagePath, file.buffer, {
				contentType: file.mimetype,
				upsert: false,
			});

		if (storageError) {
			throw new BadRequestException(`Erreur upload Supabase : ${storageError.message}`);
		}

		const { data: publicData } = this.supabase.storage.from(BUCKET).getPublicUrl(storagePath);

		const type = file.mimetype === "application/pdf" ? "DOCUMENT" : "IMAGE";

		const record = await this.prisma.uploadedFile.create({
			data: {
				type,
				url: publicData.publicUrl,
				fileName: file.originalname,
				mimeType: file.mimetype,
				size: file.size,
				userId,
				agentId: opts.agentId ?? null,
				sessionId: opts.sessionId ?? null,
				messageId: opts.messageId ?? null,
			},
		});

		return record;
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

		return this.prisma.uploadedFile.findMany({
			where: { agentId },
			orderBy: { createdAt: "desc" },
		});
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

		return this.prisma.uploadedFile.findMany({
			where: { sessionId, userId },
			orderBy: { createdAt: "desc" },
		});
	}

	async delete(fileId: string, userId: string) {
		const file = await this.prisma.uploadedFile.findUnique({ where: { id: fileId } });
		if (!file || file.userId !== userId) {
			throw new BadRequestException("Fichier introuvable ou accès refusé.");
		}

		// Extract storage path from URL
		const url = new URL(file.url);
		const storagePath = url.pathname.split(`/object/public/${BUCKET}/`)[1];
		if (storagePath) {
			await this.supabase.storage.from(BUCKET).remove([storagePath]);
		}

		await this.prisma.uploadedFile.delete({ where: { id: fileId } });
	}

	private async assertUploadTargetAccess(
		userId: string,
		opts: { agentId?: string; sessionId?: string; messageId?: string },
	): Promise<void> {
		if (opts.sessionId) {
			const session = await this.prisma.chatSession.findUnique({
				where: { id: opts.sessionId },
				select: { userId: true },
			});
			if (!session) {
				throw new NotFoundException("Session introuvable.");
			}
			if (session.userId !== userId) {
				throw new ForbiddenException("Accès refusé.");
			}
		}

		if (opts.messageId) {
			const message = await this.prisma.chatMessage.findUnique({
				where: { id: opts.messageId },
				select: { session: { select: { userId: true } } },
			});
			if (!message) {
				throw new NotFoundException("Message introuvable.");
			}
			if (message.session.userId !== userId) {
				throw new ForbiddenException("Accès refusé.");
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
}
