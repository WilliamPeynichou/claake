import { canSubmitMcpServer, type McpServerEntity } from "./mcp-server.entity";

const server = (status: McpServerEntity["reviewStatus"], selected: boolean): McpServerEntity => ({
	id: "server",
	agentId: "agent",
	name: "Test",
	url: "https://example.com/mcp",
	credentialsEncrypted: null,
	reviewStatus: status,
	reviewReason: null,
	isActive: false,
	submittedAt: null,
	reviewedAt: null,
	reviewedBy: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	tools: [
		{
			id: "tool",
			serverId: "server",
			name: "search",
			description: null,
			inputSchema: {},
			isSelected: selected,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	],
});

describe("MCP review transitions", () => {
	it("allows a draft with selected tools to be submitted", () =>
		expect(canSubmitMcpServer(server("DRAFT", true))).toBe(true));
	it("rejects submission without selected tools", () =>
		expect(canSubmitMcpServer(server("DRAFT", false))).toBe(false));
	it("rejects submission from an approved server", () =>
		expect(canSubmitMcpServer(server("APPROVED", true))).toBe(false));
});
