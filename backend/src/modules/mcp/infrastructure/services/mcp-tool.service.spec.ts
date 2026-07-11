import { McpToolService } from "./mcp-tool.service";

describe("McpToolService", () => {
	const repository = {
		findByAgent: jest.fn(),
		findById: jest.fn(),
	};
	const encryption = { decrypt: jest.fn().mockReturnValue('{"Authorization":"Bearer secret"}') };
	const transport = { callTool: jest.fn() };
	const service = new McpToolService(repository as never, encryption as never, transport as never);

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
