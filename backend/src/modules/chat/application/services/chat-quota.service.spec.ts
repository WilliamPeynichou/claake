import { HttpException, HttpStatus, PayloadTooLargeException } from "@nestjs/common";
import type { ChatSessionRepositoryPort } from "../../domain/ports/chat-session.repository.port";
import { type ChatQuotaLimits, ChatQuotaService } from "./chat-quota.service";

const LIMITS: ChatQuotaLimits = {
	messagesPerMinute: 3,
	messagesPerDay: 10,
	maxPromptChars: 50,
	maxHistoryMessages: 40,
};

function makeService(counts: { minute: number; day: number }) {
	const countUserMessagesSince = jest.fn(async (_userId: string, since: Date) => {
		const secondsAgo = (Date.now() - since.getTime()) / 1000;
		return secondsAgo <= 61 ? counts.minute : counts.day;
	});
	const repo = { countUserMessagesSince } as unknown as ChatSessionRepositoryPort;
	return { service: new ChatQuotaService(repo, LIMITS), countUserMessagesSince };
}

describe("ChatQuotaService", () => {
	it("passe sous les limites", async () => {
		const { service } = makeService({ minute: 1, day: 5 });
		await expect(service.assertWithinQuota("user-1", 10)).resolves.toBeUndefined();
	});

	it("refuse un prompt trop long (413)", async () => {
		const { service } = makeService({ minute: 0, day: 0 });
		await expect(service.assertWithinQuota("user-1", 51)).rejects.toBeInstanceOf(
			PayloadTooLargeException,
		);
	});

	it("refuse au-delà de la limite par minute (429)", async () => {
		const { service } = makeService({ minute: 3, day: 5 });
		await expect(service.assertWithinQuota("user-1", 10)).rejects.toMatchObject({
			status: HttpStatus.TOO_MANY_REQUESTS,
		});
	});

	it("refuse au-delà de la limite quotidienne (429)", async () => {
		const { service } = makeService({ minute: 0, day: 10 });
		await expect(service.assertWithinQuota("user-1", 10)).rejects.toBeInstanceOf(HttpException);
	});

	it("expose la limite d'historique", () => {
		const { service } = makeService({ minute: 0, day: 0 });
		expect(service.maxHistoryMessages).toBe(40);
	});

	it("ne compte pas le prompt avant d'interroger les fenêtres", async () => {
		const { service, countUserMessagesSince } = makeService({ minute: 5, day: 5 });
		await expect(service.assertWithinQuota("user-1", 999)).rejects.toBeInstanceOf(
			PayloadTooLargeException,
		);
		expect(countUserMessagesSince).not.toHaveBeenCalled();
	});
});
