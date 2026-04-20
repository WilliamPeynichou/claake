import { EndpointProxyProvider } from "./endpoint-proxy.provider";

// Helper to collect all chunks from an AsyncIterable
async function collectStream(iterable: AsyncIterable<string>): Promise<string[]> {
	const chunks: string[] = [];
	for await (const chunk of iterable) {
		chunks.push(chunk);
	}
	return chunks;
}

// Helper to build a mock SSE Response
function makeSseResponse(lines: string[]): Response {
	const text = lines.join("\n");
	const encoder = new TextEncoder();
	const body = new ReadableStream({
		start(controller) {
			controller.enqueue(encoder.encode(text));
			controller.close();
		},
	});
	return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

// Helper to build a mock JSON Response (Google Gemini format)
function makeJsonResponse(body: object): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}

describe("EndpointProxyProvider — validateUrl (SSRF protection)", () => {
	let provider: EndpointProxyProvider;

	beforeEach(() => {
		provider = new EndpointProxyProvider();
	});

	it("accepte une URL HTTPS valide", async () => {
		jest.spyOn(global, "fetch").mockResolvedValue(makeSseResponse(["data: [DONE]"]));

		// Should not throw for a legitimate external URL
		await expect(
			collectStream(
				provider.streamText({
					model: "gpt-4o",
					systemPrompt: null,
					messages: [],
					baseUrl: "https://api.openai.com/v1",
				} as any),
			),
		).resolves.toBeDefined();
	});

	it("rejette localhost", async () => {
		await expect(
			collectStream(
				provider.streamText({
					model: "gpt-4o",
					systemPrompt: null,
					messages: [],
					baseUrl: "https://localhost/api",
				} as any),
			),
		).rejects.toThrow("blocked address");
	});

	it("rejette 127.0.0.1 (loopback)", async () => {
		await expect(
			collectStream(
				provider.streamText({
					model: "gpt-4o",
					systemPrompt: null,
					messages: [],
					baseUrl: "https://127.0.0.1/api",
				} as any),
			),
		).rejects.toThrow("blocked address");
	});

	it("rejette 10.0.0.1 (réseau privé)", async () => {
		await expect(
			collectStream(
				provider.streamText({
					model: "gpt-4o",
					systemPrompt: null,
					messages: [],
					baseUrl: "https://10.0.0.1/api",
				} as any),
			),
		).rejects.toThrow("blocked address");
	});

	it("rejette 172.16.0.1 (réseau privé)", async () => {
		await expect(
			collectStream(
				provider.streamText({
					model: "gpt-4o",
					systemPrompt: null,
					messages: [],
					baseUrl: "https://172.16.0.1/api",
				} as any),
			),
		).rejects.toThrow("blocked address");
	});

	it("rejette 192.168.1.1 (réseau privé)", async () => {
		await expect(
			collectStream(
				provider.streamText({
					model: "gpt-4o",
					systemPrompt: null,
					messages: [],
					baseUrl: "https://192.168.1.1/api",
				} as any),
			),
		).rejects.toThrow("blocked address");
	});

	it("rejette 169.254.169.254 (AWS metadata)", async () => {
		await expect(
			collectStream(
				provider.streamText({
					model: "gpt-4o",
					systemPrompt: null,
					messages: [],
					baseUrl: "https://169.254.169.254/latest",
				} as any),
			),
		).rejects.toThrow("blocked address");
	});

	it("rejette une URL avec protocole ftp://", async () => {
		await expect(
			collectStream(
				provider.streamText({
					model: "gpt-4o",
					systemPrompt: null,
					messages: [],
					baseUrl: "ftp://api.example.com",
				} as any),
			),
		).rejects.toThrow("http or https");
	});

	it("rejette une URL invalide", async () => {
		await expect(
			collectStream(
				provider.streamText({
					model: "gpt-4o",
					systemPrompt: null,
					messages: [],
					baseUrl: "not-a-url",
				} as any),
			),
		).rejects.toThrow("Invalid endpoint URL");
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});
});

describe("EndpointProxyProvider — formats de parsing", () => {
	let provider: EndpointProxyProvider;

	beforeEach(() => {
		provider = new EndpointProxyProvider();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("format OpenAI — extrait les chunks de l'SSE", async () => {
		const sseLines = [
			`data: ${JSON.stringify({ choices: [{ delta: { content: "Bonjour" } }] })}`,
			`data: ${JSON.stringify({ choices: [{ delta: { content: " monde" } }] })}`,
			"data: [DONE]",
		];
		jest.spyOn(global, "fetch").mockResolvedValue(makeSseResponse(sseLines));

		const chunks = await collectStream(
			provider.streamText({
				model: "gpt-4o",
				systemPrompt: null,
				messages: [],
				baseUrl: "https://api.openai.com/v1",
				endpointFormat: "openai",
			} as any),
		);

		expect(chunks).toEqual(["Bonjour", " monde"]);
	});

	it("format Anthropic — extrait les chunks du content_block_delta", async () => {
		const sseLines = [
			`data: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: "Salut" } })}`,
			`data: ${JSON.stringify({ type: "message_stop" })}`,
		];
		jest.spyOn(global, "fetch").mockResolvedValue(makeSseResponse(sseLines));

		const chunks = await collectStream(
			provider.streamText({
				model: "claude-sonnet",
				systemPrompt: null,
				messages: [],
				baseUrl: "https://api.anthropic.com",
				endpointFormat: "anthropic",
			} as any),
		);

		expect(chunks).toContain("Salut");
	});

	it("format Google — parse la réponse JSON Gemini", async () => {
		const geminiResponse = {
			candidates: [{ content: { parts: [{ text: "Réponse Gemini" }] } }],
		};
		jest.spyOn(global, "fetch").mockResolvedValue(makeJsonResponse(geminiResponse));

		const chunks = await collectStream(
			provider.streamText({
				model: "gemini-pro",
				systemPrompt: null,
				messages: [],
				baseUrl: "https://generativelanguage.googleapis.com",
				endpointFormat: "google",
			} as any),
		);

		expect(chunks).toContain("Réponse Gemini");
	});
});
