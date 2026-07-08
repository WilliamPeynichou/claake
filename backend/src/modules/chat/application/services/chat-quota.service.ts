import {
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
	Optional,
	PayloadTooLargeException,
} from "@nestjs/common";
import {
	CHAT_SESSION_REPOSITORY,
	type ChatSessionRepositoryPort,
} from "../../domain/ports/chat-session.repository.port.js";

export const CHAT_QUOTA_SERVICE = Symbol("CHAT_QUOTA_SERVICE");

/** Per-user chat quota limits. Defaults may be overridden via CHAT_QUOTA_* env vars. */
export interface ChatQuotaLimits {
	messagesPerMinute: number;
	messagesPerDay: number;
	maxPromptChars: number;
	maxHistoryMessages: number;
}

function readLimit(envName: string, fallback: number): number {
	const raw = process.env[envName];
	const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const DEFAULT_CHAT_QUOTAS: ChatQuotaLimits = {
	messagesPerMinute: readLimit("CHAT_QUOTA_MESSAGES_PER_MINUTE", 20),
	messagesPerDay: readLimit("CHAT_QUOTA_MESSAGES_PER_DAY", 300),
	maxPromptChars: readLimit("CHAT_QUOTA_MAX_PROMPT_CHARS", 12000),
	maxHistoryMessages: readLimit("CHAT_QUOTA_MAX_HISTORY_MESSAGES", 100),
};

/**
 * Enforce simple per-user chat quotas as a business rule (backend = source of truth).
 * Complements the HTTP throttler; here windows are longer and scoped per user.
 */
@Injectable()
export class ChatQuotaService {
	private readonly limits: ChatQuotaLimits;

	constructor(
		@Inject(CHAT_SESSION_REPOSITORY) private readonly chatRepo: ChatSessionRepositoryPort,
		@Optional() limits?: ChatQuotaLimits,
	) {
		this.limits = limits ?? DEFAULT_CHAT_QUOTAS;
	}

	get maxHistoryMessages(): number {
		return this.limits.maxHistoryMessages;
	}

	/** Throws an actionable error if the user is over quota or the prompt is too large. */
	async assertWithinQuota(userId: string, promptChars: number): Promise<void> {
		if (promptChars > this.limits.maxPromptChars) {
			throw new PayloadTooLargeException(
				`Message trop long (max ${this.limits.maxPromptChars} caractères).`,
			);
		}

		const now = Date.now();
		const oneMinuteAgo = new Date(now - 60_000);
		const startOfDay = new Date(now - 24 * 60 * 60_000);

		const [lastMinute, lastDay] = await Promise.all([
			this.chatRepo.countUserMessagesSince(userId, oneMinuteAgo),
			this.chatRepo.countUserMessagesSince(userId, startOfDay),
		]);

		if (lastMinute >= this.limits.messagesPerMinute) {
			throw new HttpException(
				`Limite de ${this.limits.messagesPerMinute} messages par minute atteinte, réessayez dans un instant.`,
				HttpStatus.TOO_MANY_REQUESTS,
			);
		}
		if (lastDay >= this.limits.messagesPerDay) {
			throw new HttpException(
				`Limite quotidienne de ${this.limits.messagesPerDay} messages atteinte, réessayez plus tard.`,
				HttpStatus.TOO_MANY_REQUESTS,
			);
		}
	}
}
