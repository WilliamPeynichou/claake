import { ChatSessionEntity } from "./chat-session.entity";

describe("ChatSessionEntity", () => {
	const session = new ChatSessionEntity(
		"session-1",
		"user-1",
		"agent-1",
		"My Chat",
		new Date("2025-01-01"),
		new Date("2025-01-02"),
	);

	describe("isOwnedBy", () => {
		it("returns true for the owner", () => {
			expect(session.isOwnedBy("user-1")).toBe(true);
		});

		it("returns false for another user", () => {
			expect(session.isOwnedBy("user-2")).toBe(false);
		});
	});

	describe("generateTitle", () => {
		it("returns the full message if <= 50 chars", () => {
			expect(ChatSessionEntity.generateTitle("Hello world")).toBe("Hello world");
		});

		it("truncates long messages to 47 chars + ellipsis", () => {
			const longMsg = "A".repeat(80);
			const title = ChatSessionEntity.generateTitle(longMsg);
			expect(title.length).toBe(50);
			expect(title).toBe(`${"A".repeat(47)}...`);
		});

		it("trims whitespace", () => {
			expect(ChatSessionEntity.generateTitle("  hello  ")).toBe("hello");
		});

		it("handles exactly 50 chars", () => {
			const msg = "A".repeat(50);
			expect(ChatSessionEntity.generateTitle(msg)).toBe(msg);
		});
	});
});
