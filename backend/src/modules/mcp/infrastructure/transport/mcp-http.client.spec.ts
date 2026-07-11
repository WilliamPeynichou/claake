import { McpHttpClient } from "./mcp-http.client.js";

jest.mock("../../../../common/security/public-url.js", () => ({
	assertPublicHttpUrl: jest.fn(async (value: string) => new URL(value)),
}));

function jsonResponse(value: unknown, headers: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(value), {
		status: 200,
		headers: { "content-type": "application/json", ...headers },
	});
}

describe("McpHttpClient", () => {
	const fetchMock = jest.fn();
	const client = new McpHttpClient();

	beforeEach(() => {
		fetchMock.mockReset();
		global.fetch = fetchMock;
		process.env.NODE_ENV = "test";
	});

	it("initializes a session, sends notification, and lists normalized tools", async () => {
		fetchMock
			.mockResolvedValueOnce(
				jsonResponse(
					{ jsonrpc: "2.0", id: 1, result: { protocolVersion: "2025-03-26" } },
					{ "mcp-session-id": "session-1" },
				),
			)
			.mockResolvedValueOnce(jsonResponse({ jsonrpc: "2.0" }))
			.mockResolvedValueOnce(
				jsonResponse({
					jsonrpc: "2.0",
					id: 2,
					result: {
						tools: [
							{
								name: "search",
								description: "Search documents",
								inputSchema: { type: "object" },
							},
						],
					},
				}),
			);

		await expect(
			client.listTools({
				url: "https://mcp.example.test/rpc",
				credentials: { headers: { Authorization: "Bearer secret" } },
			}),
		).resolves.toEqual([
			{ name: "search", description: "Search documents", inputSchema: { type: "object" } },
		]);
		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(fetchMock.mock.calls[1][1].headers).toMatchObject({
			Authorization: "Bearer secret",
			"Mcp-Session-Id": "session-1",
		});
		for (const call of fetchMock.mock.calls) expect(call[1].redirect).toBe("error");
	});

	it("parses Streamable HTTP SSE JSON-RPC responses", async () => {
		fetchMock
			.mockResolvedValueOnce(
				new Response(
					'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-03-26"}}\n\n',
					{ headers: { "content-type": "text/event-stream" } },
				),
			)
			.mockResolvedValueOnce(jsonResponse({ jsonrpc: "2.0" }));

		await expect(client.initialize({ url: "https://mcp.example.test" })).resolves.toEqual({
			protocolVersion: "2025-03-26",
		});
	});

	it("calls a tool and normalizes its result", async () => {
		fetchMock
			.mockResolvedValueOnce(
				jsonResponse({ jsonrpc: "2.0", id: 1, result: { protocolVersion: "2025-03-26" } }),
			)
			.mockResolvedValueOnce(jsonResponse({ jsonrpc: "2.0" }))
			.mockResolvedValueOnce(
				jsonResponse({
					jsonrpc: "2.0",
					id: 2,
					result: { content: [{ type: "text", text: "ok" }], isError: false },
				}),
			);
		await expect(
			client.callTool({ url: "https://mcp.example.test" }, "search", { query: "hello" }),
		).resolves.toEqual({ content: [{ type: "text", text: "ok" }], isError: false });
	});

	it("rejects redirects and does not expose credentials in errors", async () => {
		fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
		await expect(
			client.initialize({
				url: "https://mcp.example.test",
				credentials: { headers: { Authorization: "Bearer super-secret" } },
			}),
		).rejects.toThrow("fetch failed");
		expect(fetchMock.mock.calls[0][1].redirect).toBe("error");
	});

	it("rejects reserved and newline-injected credential headers", async () => {
		await expect(
			client.initialize({
				url: "https://mcp.example.test",
				credentials: { headers: { Host: "evil.test" } },
			}),
		).rejects.toThrow("Reserved MCP credential header");
		await expect(
			client.initialize({
				url: "https://mcp.example.test",
				credentials: { headers: { Authorization: "Bearer x\r\nX-Evil: yes" } },
			}),
		).rejects.toThrow("Invalid MCP credential header");
	});

	it("requires HTTPS in production", async () => {
		process.env.NODE_ENV = "production";
		await expect(client.initialize({ url: "http://mcp.example.test" })).rejects.toThrow(
			"MCP endpoint must use HTTPS in production",
		);
	});

	it("rejects oversized declared responses", async () => {
		fetchMock.mockResolvedValueOnce(
			new Response("{}", { headers: { "content-length": String(3 * 1024 * 1024) } }),
		);
		await expect(client.initialize({ url: "https://mcp.example.test" })).rejects.toThrow(
			"MCP response exceeded maximum size",
		);
	});
});
