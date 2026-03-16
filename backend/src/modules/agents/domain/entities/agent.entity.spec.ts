import { AgentEntity } from "./agent.entity";

function makeAgent(overrides: Partial<ConstructorParameters<typeof AgentEntity>> = [] as any): AgentEntity {
	const defaults: ConstructorParameters<typeof AgentEntity> = [
		"agent-1",
		"Test Agent",
		"test-agent",
		"A test agent",
		"Long description",
		"coding",
		["ai", "test"],
		["claude-sonnet-4-20250514"],
		"CLOUD",
		null,
		null,
		[],
		"FREE",
		0,
		1,
		"APPROVED",
		null,
		100,
		4.5,
		10,
		"user-1",
		"John Doe",
		new Date("2025-01-01"),
		new Date("2025-01-02"),
		"You are a helpful assistant",
	];
	const args = [...defaults] as ConstructorParameters<typeof AgentEntity>;
	if (overrides[0] !== undefined) args[0] = overrides[0] as string;
	return new AgentEntity(...args);
}

describe("AgentEntity", () => {
	const agent = makeAgent();

	describe("isOwnedBy", () => {
		it("returns true for the creator", () => {
			expect(agent.isOwnedBy("user-1")).toBe(true);
		});

		it("returns false for another user", () => {
			expect(agent.isOwnedBy("user-2")).toBe(false);
		});
	});

	describe("isFree", () => {
		it("returns true for FREE pricing model", () => {
			expect(agent.isFree()).toBe(true);
		});

		it("returns false for paid pricing model", () => {
			const paidAgent = new AgentEntity(
				"id", "name", "slug", "desc", null, "cat", [], [],
				"CLOUD", null, null, [], "ONE_TIME", 9.99, 1, "APPROVED",
				null, 0, 0, 0, "u1", null, new Date(), new Date(),
			);
			expect(paidAgent.isFree()).toBe(false);
		});
	});

	describe("isPublished", () => {
		it("returns true for APPROVED status", () => {
			expect(agent.isPublished()).toBe(true);
		});

		it("returns false for PENDING status", () => {
			const pending = new AgentEntity(
				"id", "name", "slug", "desc", null, "cat", [], [],
				"CLOUD", null, null, [], "FREE", 0, 1, "PENDING",
				null, 0, 0, 0, "u1", null, new Date(), new Date(),
			);
			expect(pending.isPublished()).toBe(false);
		});
	});

	describe("systemPrompt", () => {
		it("stores the system prompt", () => {
			expect(agent.systemPrompt).toBe("You are a helpful assistant");
		});

		it("defaults to null", () => {
			const noPrompt = new AgentEntity(
				"id", "name", "slug", "desc", null, "cat", [], [],
				"CLOUD", null, null, [], "FREE", 0, 1, "APPROVED",
				null, 0, 0, 0, "u1", null, new Date(), new Date(),
			);
			expect(noPrompt.systemPrompt).toBeNull();
		});
	});
});
