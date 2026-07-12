import { McpCircuitBreakerService } from "./mcp-circuit-breaker.service.js";
import { McpToolService } from "./mcp-tool.service";

describe("McpToolService", () => {
	const repository = {
		findByAgent: jest.fn(),
		findById: jest.fn(),
	};
	const encryption = { decrypt: jest.fn().mockReturnValue('{"Authorization":"Bearer secret"}') };
	const transport = { callTool: jest.fn() };
	const circuitBreaker = new McpCircuitBreakerService();
	const service = new McpToolService(
		repository as never,
		encryption as never,
		transport as never,
		circuitBreaker,
	);

	beforeEach(() => jest.clearAllMocks());

	it("exposes only selected approved active tool snapshots", async () => {
		repository.findByAgent.mockResolvedValue([
			server({ reviewStatus: "APPROVED", isActive: true, tools: [tool({ isSelected: true })] }),
			server({ reviewStatus: "PENDING", isActive: true, tools: [tool({ isSelected: true })] }),
		]);

		const prepared = await service.prepareTools("agent-1");

		expect(prepared).toHaveLength(1);
		expect(prepared[0]?.definition.name).toBe("mcp_server1_search");
	});

	it("deduplicates aliases when sanitized tool names collide", async () => {
		repository.findByAgent.mockResolvedValue([
			server({
				tools: [
					tool({ id: "tool-1", name: "a".repeat(40), isSelected: true }),
					tool({ id: "tool-2", name: `${"a".repeat(38)}bc`, isSelected: true }),
				],
			}),
		]);

		const prepared = await service.prepareTools("agent-1");
		const names = prepared.map((item) => item.definition.name);

		expect(new Set(names).size).toBe(2);
		expect(names[1]).toBe(`${names[0]}_2`);
	});

	it("revalidates server state before call and never calls revoked tools", async () => {
		const active = server({ tools: [tool({ isSelected: true })] });
		repository.findByAgent.mockResolvedValue([active]);
		repository.findById.mockResolvedValue({ ...active, isActive: false });
		const [prepared] = await service.prepareTools("agent-1");

		await expect(prepared?.execute({ query: "contract" })).rejects.toThrow(
			"MCP tool is no longer available",
		);
		expect(transport.callTool).not.toHaveBeenCalled();
	});

	it("calls remote tool with decrypted headers and bounds large result", async () => {
		const active = server({
			credentialsEncrypted: "encrypted",
			tools: [tool({ isSelected: true })],
		});
		repository.findByAgent.mockResolvedValue([active]);
		repository.findById.mockResolvedValue(active);
		transport.callTool.mockResolvedValue({ content: [{ type: "text", text: "x".repeat(21_000) }] });
		const [prepared] = await service.prepareTools("agent-1");

		await expect(prepared?.execute({ query: "contract" })).resolves.toMatchObject({
			truncated: true,
		});
		expect(transport.callTool).toHaveBeenCalledWith(
			{
				url: "https://mcp.example.test",
				credentials: { headers: { Authorization: "Bearer secret" } },
			},
			"search",
			{ query: "contract" },
		);
	});

	it("opens the circuit after three transport failures and blocks further calls", async () => {
		const active = server({ id: "server-cb", tools: [tool({ isSelected: true })] });
		repository.findByAgent.mockResolvedValue([active]);
		repository.findById.mockResolvedValue(active);
		transport.callTool.mockRejectedValue(new Error("MCP endpoint returned HTTP 503"));
		const [prepared] = await service.prepareTools("agent-1");

		for (let attempt = 0; attempt < 3; attempt++) {
			await expect(prepared?.execute({ query: "x" })).rejects.toThrow("HTTP 503");
		}
		await expect(prepared?.execute({ query: "x" })).rejects.toThrow(
			"MCP server is temporarily unavailable",
		);
		expect(transport.callTool).toHaveBeenCalledTimes(3);
	});
});

function tool(overrides: Record<string, unknown> = {}) {
	return {
		id: "tool-1",
		serverId: "server-1",
		name: "search",
		description: "Search documents",
		inputSchema: { type: "object" },
		isSelected: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

function server(overrides: Record<string, unknown> = {}) {
	return {
		id: "server-1",
		agentId: "agent-1",
		name: "Search MCP",
		url: "https://mcp.example.test",
		credentialsEncrypted: null,
		reviewStatus: "APPROVED",
		reviewReason: null,
		isActive: true,
		submittedAt: null,
		reviewedAt: null,
		reviewedBy: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		tools: [],
		...overrides,
	};
}
