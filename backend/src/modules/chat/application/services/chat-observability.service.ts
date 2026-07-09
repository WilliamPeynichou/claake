import { Injectable, Logger } from "@nestjs/common";

type ChatTelemetryBase = {
	sessionId: string;
	agentId: string;
	userId: string;
	provider: string;
	model: string;
	contentLength?: number;
	attachmentCount?: number;
};

type ChatTelemetryResult = ChatTelemetryBase & {
	durationMs: number;
	outputLength?: number;
};

@Injectable()
export class ChatObservabilityService {
	private readonly logger = new Logger("ChatObservability");

	recordMessageStarted(event: ChatTelemetryBase): void {
		this.log("chat.message.started", event);
	}

	recordProviderSuccess(event: ChatTelemetryResult): void {
		this.log("chat.provider.success", event);
	}

	recordProviderError(event: ChatTelemetryResult & { error: string }): void {
		this.log("chat.provider.error", event, "warn");
	}

	recordAssistantMessageSaved(event: ChatTelemetryResult): void {
		this.log("chat.message.completed", event);
	}

	private log(
		event: string,
		payload: Record<string, unknown>,
		level: "log" | "warn" = "log",
	): void {
		const safePayload = {
			event,
			...payload,
			userId: this.hashIdentifier(String(payload.userId ?? "")),
		};
		this.logger[level](JSON.stringify(safePayload));
	}

	private hashIdentifier(value: string): string {
		let hash = 0;
		for (let index = 0; index < value.length; index += 1) {
			hash = (hash << 5) - hash + value.charCodeAt(index);
			hash |= 0;
		}
		return `u_${Math.abs(hash).toString(16)}`;
	}
}
