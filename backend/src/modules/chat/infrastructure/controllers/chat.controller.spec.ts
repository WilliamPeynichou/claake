import { ChatController } from "./chat.controller";

type StreamResponse = {
	chunks: string[];
	ended: boolean;
	setHeader: jest.Mock;
	flushHeaders: jest.Mock;
	write: jest.Mock;
	end: jest.Mock;
};

function responseDouble(): StreamResponse {
	const response: StreamResponse = {
		chunks: [],
		ended: false,
		setHeader: jest.fn(),
		flushHeaders: jest.fn(),
		write: jest.fn((chunk: string) => response.chunks.push(chunk)),
		end: jest.fn(() => {
			response.ended = true;
		}),
	};
	return response;
}

describe("ChatController stream error redaction", () => {
	it("returns a generic message and never exposes provider details", async () => {
		const providerSecret = "vendor rejected sk_test_shorttoken";
		const failingStream = (async function* (shouldYield: boolean) {
			if (shouldYield) yield { type: "text" as const, delta: "" };
			throw new Error(providerSecret);
		})(false);
		const sendMessage = {
			execute: jest.fn().mockResolvedValue({
				stream: failingStream,
				onComplete: jest.fn(),
			}),
		};
		const controller = new ChatController(
			{} as never,
			{} as never,
			{} as never,
			sendMessage as never,
			{} as never,
			{} as never,
			{} as never,
		);
		const logSpy = jest.spyOn(
			(controller as never as { logger: { warn: (value: string) => void } }).logger,
			"warn",
		);
		const response = responseDouble();

		await controller.sendMsg(
			"session-1",
			{ content: "Bonjour" },
			{ user: { id: "user-1", email: "user@example.test", role: "USER" } } as never,
			response as never,
		);

		const payload = response.chunks.join("");
		expect(payload).toContain("La réponse IA est momentanément indisponible.");
		expect(payload).not.toContain(providerSecret);
		expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[REDACTED]"));
		expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining(providerSecret));
		expect(response.ended).toBe(true);
	});
});
