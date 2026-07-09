import { AnthropicProvider } from "./anthropic.provider";
import { OpenAIProvider } from "./openai.provider";

describe("native provider tool calling", () => {
	const originalFetch = global.fetch;

	afterEach(() => {
		global.fetch = originalFetch;
		jest.restoreAllMocks();
	});

	it("AnthropicProvider executes tool_use and feeds tool_result back in a second turn", async () => {
		const fetchMock = jest
			.fn()
			.mockResolvedValueOnce(
				streamResponse([
					{
						type: "content_block_start",
						content_block: { type: "tool_use", id: "tool-1", name: "current_datetime" },
					},
					{ type: "content_block_delta", delta: { type: "input_json_delta", partial_json: "{}" } },
					{ type: "content_block_stop" },
					{ type: "message_delta", delta: { stop_reason: "tool_use" } },
				]),
			)
			.mockResolvedValueOnce(
				streamResponse([
					{ type: "content_block_delta", delta: { type: "text_delta", text: "Il est midi." } },
					{ type: "message_delta", delta: { stop_reason: "end_turn" } },
				]),
			);
		global.fetch = fetchMock as any;
		const executeTool = jest.fn().mockResolvedValue({ iso: "2026-07-09T12:00:00.000Z" });

		const events = [];
		for await (const event of new AnthropicProvider().streamEvents(baseParams(executeTool))) {
			events.push(event);
		}

		expect(executeTool).toHaveBeenCalledWith({ id: "tool-1", name: "current_datetime", input: {} });
		expect(events).toEqual([
			{ type: "tool_call", id: "tool-1", name: "current_datetime", input: {} },
			{
				type: "tool_result",
				id: "tool-1",
				name: "current_datetime",
				output: { iso: "2026-07-09T12:00:00.000Z" },
			},
			{ type: "text", delta: "Il est midi." },
			{ type: "done" },
		]);
		expect(
			JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)).messages.at(-1).content[0],
		).toEqual({
			type: "tool_result",
			tool_use_id: "tool-1",
			content: JSON.stringify({ iso: "2026-07-09T12:00:00.000Z" }),
		});
	});

	it("OpenAIProvider executes function tool_calls and feeds role=tool back", async () => {
		const fetchMock = jest
			.fn()
			.mockResolvedValueOnce(
				streamResponse([
					{
						choices: [
							{
								delta: {
									tool_calls: [
										{
											index: 0,
											id: "call-1",
											function: { name: "current_datetime", arguments: "{}" },
										},
									],
								},
							},
						],
					},
					{ choices: [{ finish_reason: "tool_calls", delta: {} }] },
				]),
			)
			.mockResolvedValueOnce(
				streamResponse([
					{ choices: [{ delta: { content: "Il est midi." } }] },
					{ choices: [{ finish_reason: "stop", delta: {} }] },
				]),
			);
		global.fetch = fetchMock as any;
		const executeTool = jest.fn().mockResolvedValue({ iso: "2026-07-09T12:00:00.000Z" });

		const events = [];
		for await (const event of new OpenAIProvider().streamEvents(baseParams(executeTool))) {
			events.push(event);
		}

		expect(executeTool).toHaveBeenCalledWith({ id: "call-1", name: "current_datetime", input: {} });
		expect(events).toEqual([
			{ type: "tool_call", id: "call-1", name: "current_datetime", input: {} },
			{
				type: "tool_result",
				id: "call-1",
				name: "current_datetime",
				output: { iso: "2026-07-09T12:00:00.000Z" },
			},
			{ type: "text", delta: "Il est midi." },
			{ type: "done" },
		]);
		expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)).messages.at(-1)).toEqual({
			role: "tool",
			tool_call_id: "call-1",
			content: JSON.stringify({ iso: "2026-07-09T12:00:00.000Z" }),
		});
	});
});

function baseParams(
	executeTool: (call: { id: string; name: string; input: unknown }) => Promise<unknown>,
) {
	return {
		model: "test-model",
		systemPrompt: "system",
		messages: [{ role: "user", content: "date ?" }],
		apiKey: "key",
		baseUrl: "https://api.example.com",
		tools: [{ name: "current_datetime", description: "Date", inputSchema: { type: "object" } }],
		executeTool,
	};
}

function streamResponse(payloads: unknown[]): Response {
	const body =
		payloads.map((payload) => `data: ${JSON.stringify(payload)}\n\n`).join("") + "data: [DONE]\n\n";
	return {
		ok: true,
		body: new ReadableStream({
			start(controller) {
				controller.enqueue(new TextEncoder().encode(body));
				controller.close();
			},
		}),
	} as Response;
}
