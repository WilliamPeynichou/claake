import { McpServerService } from "./mcp-server.service.js";

const baseServer = {
	id: "s-1",
	agentId: "a-1",
	name: "Server",
	url: "https://mcp.example.com",
	credentialsEncrypted: "enc",
	reviewStatus: "APPROVED" as const,
	reviewReason: null,
	isActive: true,
	tools: [],
	createdAt: new Date(),
	updatedAt: new Date(),
};

function makeService(server = baseServer) {
	const repository = {
		findByAgent: jest.fn(),
		findPending: jest.fn(),
		findById: jest.fn().mockResolvedValue(server),
		create: jest.fn().mockImplementation(async (data) => ({ ...server, ...data })),
		update: jest.fn().mockImplementation(async (_id, data) => ({ ...server, ...data })),
		delete: jest.fn(),
		replaceTools: jest.fn(),
		selectTools: jest.fn(),
		setReview: jest.fn().mockResolvedValue({ ...server, reviewStatus: "DRAFT" }),
	};
	const encryption = {
		encrypt: jest.fn((value: string) => `enc:${value}`),
		decrypt: jest.fn((value: string) => value.slice(4)),
	};
	const prisma = {
		agent: { findUnique: jest.fn().mockResolvedValue({ creatorId: "u-1" }) },
	};
	const transport = { listTools: jest.fn(), callTool: jest.fn(), initialize: jest.fn() };
	const service = new McpServerService(
		// biome-ignore lint/suspicious/noExplicitAny: test doubles
		repository as any,
		// biome-ignore lint/suspicious/noExplicitAny: test doubles
		encryption as any,
		// biome-ignore lint/suspicious/noExplicitAny: test doubles
		prisma as any,
		// biome-ignore lint/suspicious/noExplicitAny: test doubles
		transport as any,
	);
	return { service, repository, encryption };
}

const actor = { userId: "u-1" };

describe("McpServerService", () => {
	it("clears credentials when auth type is NONE", async () => {
		const { service, repository, encryption } = makeService();
		await service.update("a-1", "s-1", actor, { auth: { type: "NONE" } });
		expect(encryption.encrypt).not.toHaveBeenCalled();
		expect(repository.update).toHaveBeenCalledWith(
			"s-1",
			expect.objectContaining({ credentialsEncrypted: null }),
		);
	});

	it("does not store credentials on create with auth NONE", async () => {
		const { service, repository, encryption } = makeService();
		await service.create("a-1", actor, {
			name: "Server",
			url: "https://mcp.example.com",
			auth: { type: "NONE" },
		});
		expect(encryption.encrypt).not.toHaveBeenCalled();
		expect(repository.create).toHaveBeenCalledWith(
			expect.not.objectContaining({ credentialsEncrypted: expect.anything() }),
		);
	});

	it("encrypts bearer auth as an Authorization header", async () => {
		const { service, encryption } = makeService();
		await service.update("a-1", "s-1", actor, { auth: { type: "BEARER", token: "t0k" } });
		expect(encryption.encrypt).toHaveBeenCalledWith(
			JSON.stringify({ Authorization: "Bearer t0k" }),
		);
	});

	it("rejects bearer auth without token and api key auth without header/value", async () => {
		const { service } = makeService();
		await expect(service.update("a-1", "s-1", actor, { auth: { type: "BEARER" } })).rejects.toThrow(
			"token bearer",
		);
		await expect(
			service.update("a-1", "s-1", actor, { auth: { type: "API_KEY", header: "X-Key" } }),
		).rejects.toThrow("API_KEY");
	});

	it("resets a PENDING server to DRAFT when url changes", async () => {
		const { service, repository } = makeService({ ...baseServer, reviewStatus: "PENDING" });
		await service.update("a-1", "s-1", actor, { url: "https://other.example.com" });
		expect(repository.setReview).toHaveBeenCalledWith("s-1", { status: "DRAFT", reason: null });
		expect(repository.update).toHaveBeenCalledWith(
			"s-1",
			expect.objectContaining({ isActive: false }),
		);
	});

	it("keeps DRAFT status untouched when url changes", async () => {
		const { service, repository } = makeService({ ...baseServer, reviewStatus: "DRAFT" });
		await service.update("a-1", "s-1", actor, { url: "https://other.example.com" });
		expect(repository.setReview).not.toHaveBeenCalled();
	});
});
