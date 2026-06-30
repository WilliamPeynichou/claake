import { ChatMessageEntity } from "./chat-message.entity";

describe("ChatMessageEntity", () => {
	describe("isText", () => {
		it("returns true for TEXT content type", () => {
			const msg = new ChatMessageEntity(
				"msg-1",
				"session-1",
				"USER",
				"TEXT",
				"Hello",
				null,
				null,
				new Date(),
			);
			expect(msg.isText()).toBe(true);
		});

		it("returns false for IMAGE content type", () => {
			const msg = new ChatMessageEntity(
				"msg-1",
				"session-1",
				"USER",
				"IMAGE",
				"",
				"https://img.url",
				null,
				new Date(),
			);
			expect(msg.isText()).toBe(false);
		});
	});

	describe("isMedia", () => {
		it("returns true for IMAGE", () => {
			const msg = new ChatMessageEntity(
				"msg-1",
				"session-1",
				"USER",
				"IMAGE",
				"",
				"https://img.url",
				null,
				new Date(),
			);
			expect(msg.isMedia()).toBe(true);
		});

		it("returns true for VIDEO", () => {
			const msg = new ChatMessageEntity(
				"msg-1",
				"session-1",
				"USER",
				"VIDEO",
				"",
				"https://vid.url",
				null,
				new Date(),
			);
			expect(msg.isMedia()).toBe(true);
		});

		it("returns false for TEXT", () => {
			const msg = new ChatMessageEntity(
				"msg-1",
				"session-1",
				"USER",
				"TEXT",
				"Hello",
				null,
				null,
				new Date(),
			);
			expect(msg.isMedia()).toBe(false);
		});
	});
});
