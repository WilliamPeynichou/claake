import { AgentEntity } from "../../../agents/domain/entities/agent.entity";
import { ToolRegistryService } from "./tool-registry.service";

describe("ToolRegistryService", () => {
	let service: ToolRegistryService;
	let knowledgeService: { buildKnowledgeContext: jest.Mock };
	let originalFetch: typeof global.fetch;

	beforeEach(() => {
		knowledgeService = { buildKnowledgeContext: jest.fn() };
		service = new ToolRegistryService(knowledgeService as any);
		originalFetch = global.fetch;
		jest.useFakeTimers().setSystemTime(new Date("2026-07-09T12:00:00.000Z"));
	});

	afterEach(() => {
		global.fetch = originalFetch;
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it("prépare un catalogue figé built-in et MCP pour tout le message", async () => {
		const mcpExecute = jest.fn().mockResolvedValue({ ok: true });
		const mcpPort = {
			prepareTools: jest.fn().mockResolvedValue([
				{
					definition: {
						name: "mcp_server_search",
						description: "Recherche MCP",
						inputSchema: { type: "object" },
					},
					execute: mcpExecute,
				},
			]),
		};
		service = new ToolRegistryService(knowledgeService as any, mcpPort);
		const agent = makeAgent([{ name: "current_datetime", enabled: true }]);
		const catalogue = await service.prepare(agent, makeContext(agent));

		agent.tools.length = 0;
		expect(Object.isFrozen(catalogue)).toBe(true);
		expect(Object.isFrozen(catalogue.definitions)).toBe(true);
		expect(catalogue.definitions.map((tool) => tool.name)).toEqual([
			"current_datetime",
			"mcp_server_search",
		]);
		await expect(catalogue.execute("current_datetime", {}, 0)).resolves.toMatchObject({
			iso: "2026-07-09T12:00:00.000Z",
		});
		await expect(catalogue.execute("mcp_server_search", { query: "x" }, 1)).resolves.toEqual({
			ok: true,
		});
		expect(mcpExecute).toHaveBeenCalledWith({ query: "x" });
		expect(mcpPort.prepareTools).toHaveBeenCalledTimes(1);
	});

	it("applique le quota commun avant une tentative MCP", async () => {
		const mcpExecute = jest.fn();
		const agent = makeAgent([]);
		service = new ToolRegistryService(knowledgeService as any, {
			prepareTools: jest.fn().mockResolvedValue([
				{
					definition: { name: "mcp_tool", description: "MCP", inputSchema: {} },
					execute: mcpExecute,
				},
			]),
		});
		const catalogue = await service.prepare(agent, makeContext(agent));

		await expect(catalogue.execute("mcp_tool", {}, 5)).rejects.toThrow(
			"Tool call quota exceeded for this message",
		);
		expect(mcpExecute).not.toHaveBeenCalled();
	});

	it("applique le quota MCP dédié après trois appels MCP", async () => {
		const mcpExecute = jest.fn().mockResolvedValue({ ok: true });
		const agent = makeAgent([]);
		service = new ToolRegistryService(knowledgeService as any, {
			prepareTools: jest.fn().mockResolvedValue([
				{
					definition: { name: "mcp_tool", description: "MCP", inputSchema: {} },
					execute: mcpExecute,
				},
			]),
		});
		const catalogue = await service.prepare(agent, makeContext(agent));

		await catalogue.execute("mcp_tool", {}, 0);
		await catalogue.execute("mcp_tool", {}, 1);
		await catalogue.execute("mcp_tool", {}, 2);
		await expect(catalogue.execute("mcp_tool", {}, 3)).rejects.toThrow(
			"MCP tool call quota exceeded for this message",
		);
		expect(mcpExecute).toHaveBeenCalledTimes(3);
	});

	it("exposes enabled tool definitions only", () => {
		const definitions = service.getDefinitions(
			makeAgent([
				{ name: "current_datetime", enabled: true },
				{ name: "fetch_url", enabled: false },
			]),
		);

		expect(definitions).toHaveLength(1);
		expect(definitions[0]?.name).toBe("current_datetime");
		expect(definitions[0]?.inputSchema).toEqual({
			type: "object",
			properties: {},
			additionalProperties: false,
		});
	});

	it("executes current_datetime with configured timezone", async () => {
		const output = await service.execute(
			"current_datetime",
			{},
			makeContext(
				makeAgent([
					{ name: "current_datetime", enabled: true, config: { timezone: "Europe/Paris" } },
				]),
			),
			0,
		);

		expect(output).toEqual({ iso: "2026-07-09T12:00:00.000Z", timezone: "Europe/Paris" });
	});

	it("delegates knowledge_search to AgentKnowledgeService", async () => {
		knowledgeService.buildKnowledgeContext.mockResolvedValue("contexte utile");
		const output = await service.execute(
			"knowledge_search",
			{ query: "contrat" },
			makeContext(makeAgent([{ name: "knowledge_search", enabled: true }])),
			0,
		);

		expect(knowledgeService.buildKnowledgeContext).toHaveBeenCalledWith("agent-1", "contrat");
		expect(output).toEqual({ query: "contrat", content: "contexte utile" });
	});

	it("rejects unknown or disabled tools", async () => {
		await expect(
			service.execute("fetch_url", { url: "https://example.com" }, makeContext(makeAgent([])), 0),
		).rejects.toThrow("Tool fetch_url is not enabled for this agent");
	});

	it("rejects the 6th tool call in a message", async () => {
		await expect(
			service.execute(
				"current_datetime",
				{},
				makeContext(makeAgent([{ name: "current_datetime", enabled: true }])),
				5,
			),
		).rejects.toThrow("Tool call quota exceeded for this message");
	});

	it("rejects fetch_url when allowlist is empty or domain mismatches", async () => {
		await expect(
			service.execute(
				"fetch_url",
				{ url: "https://example.com/page" },
				makeContext(
					makeAgent([{ name: "fetch_url", enabled: true, config: { allowed_domains: [] } }]),
				),
				0,
			),
		).rejects.toThrow("URL domain is not allowlisted for this agent");

		await expect(
			service.execute(
				"fetch_url",
				{ url: "https://evil.com/page" },
				makeContext(
					makeAgent([
						{ name: "fetch_url", enabled: true, config: { allowed_domains: ["example.com"] } },
					]),
				),
				0,
			),
		).rejects.toThrow("URL domain is not allowlisted for this agent");
	});

	it("rejects private URLs through SSRF guard integration", async () => {
		await expect(
			service.execute(
				"fetch_url",
				{ url: "http://127.0.0.1/admin" },
				makeContext(
					makeAgent([
						{ name: "fetch_url", enabled: true, config: { allowed_domains: ["127.0.0.1"] } },
					]),
				),
				0,
			),
		).rejects.toThrow("Endpoint URL points to a blocked address");
	});

	it("fetches allowlisted text content and truncates to 20k chars", async () => {
		const longText = "a".repeat(20_050);
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			headers: { get: jest.fn().mockReturnValue("text/plain; charset=utf-8") },
			text: jest.fn().mockResolvedValue(longText),
		} as any);

		const output = await service.execute(
			"fetch_url",
			{ url: "https://example.com/page" },
			makeContext(
				makeAgent([
					{ name: "fetch_url", enabled: true, config: { allowed_domains: ["example.com"] } },
				]),
			),
			0,
		);

		expect((output as { content: string }).content).toHaveLength(20_000);
		expect(global.fetch).toHaveBeenCalledWith(
			"https://example.com/page",
			expect.objectContaining({ method: "GET", redirect: "error" }),
		);
	});

	it("rejects unsupported fetched content type", async () => {
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			headers: { get: jest.fn().mockReturnValue("application/octet-stream") },
			text: jest.fn().mockResolvedValue("binary"),
		} as any);

		await expect(
			service.execute(
				"fetch_url",
				{ url: "https://example.com/file" },
				makeContext(
					makeAgent([
						{ name: "fetch_url", enabled: true, config: { allowed_domains: ["example.com"] } },
					]),
				),
				0,
			),
		).rejects.toThrow("URL content type is not supported");
	});
});

function makeContext(agent: AgentEntity) {
	return { agent, userId: "user-1", sessionId: "session-1" };
}

function makeAgent(tools: any[]): AgentEntity {
	return new AgentEntity(
		"agent-1",
		"Agent",
		"agent",
		"Description",
		null,
		"dev",
		[],
		["mock"],
		"CLOUD",
		null,
		null,
		[],
		"FREE",
		0,
		1,
		"APPROVED",
		null,
		0,
		0,
		0,
		"creator-1",
		null,
		new Date(),
		new Date(),
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		[],
		[],
		null,
		null,
		null,
		[],
		null,
		[],
		tools,
	);
}
