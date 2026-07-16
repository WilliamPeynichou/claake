import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ENCRYPTION_SERVICE } from "../../../../common/ports/encryption.port";
import { AgentEntity } from "../../../agents/domain/entities/agent.entity";
import { AnthropicProvider } from "../../infrastructure/providers/anthropic.provider";
import { EndpointProxyProvider } from "../../infrastructure/providers/endpoint-proxy.provider";
import { MockProvider } from "../../infrastructure/providers/mock.provider";
import { OpenAIProvider } from "../../infrastructure/providers/openai.provider";
import { ExecutionStrategyResolver } from "./execution-strategy.resolver";
import { MANAGE_API_KEYS_USE_CASE } from "./manage-api-keys.port";

const mockAnthropic = { streamText: jest.fn() };
const mockOpenai = { streamText: jest.fn() };
const mockEndpointProxy = { streamText: jest.fn() };
const mockMockProvider = { streamText: jest.fn() };
const mockEncryption = { encrypt: jest.fn(), decrypt: jest.fn().mockReturnValue("decrypted-key") };
const mockApiKeys = { getDecryptedKeyForProvider: jest.fn() };

function makeAgent(
	overrides: {
		models?: string[];
		mode?: string;
		cloudStrategy?: string | null;
		endpointUrl?: string | null;
		endpointFormat?: string | null;
		sellerApiKeyEncrypted?: string | null;
		sellerApiProvider?: string | null;
		requiredUserProvider?: string | null;
	} = {},
): AgentEntity {
	return new AgentEntity(
		"agent-1",
		"Test Agent",
		"test-agent",
		"desc",
		null,
		"coding",
		["ai"],
		overrides.models ?? ["claude-sonnet-4-20250514"],
		overrides.mode ?? "CLOUD",
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
		"System prompt",
		overrides.cloudStrategy !== undefined ? overrides.cloudStrategy : "SELLER_ENDPOINT",
		overrides.endpointUrl !== undefined ? overrides.endpointUrl : "https://api.example.com",
		overrides.endpointFormat !== undefined ? overrides.endpointFormat : "openai",
		overrides.sellerApiKeyEncrypted !== undefined ? overrides.sellerApiKeyEncrypted : null,
		overrides.sellerApiProvider !== undefined ? overrides.sellerApiProvider : null,
		overrides.requiredUserProvider !== undefined ? overrides.requiredUserProvider : null,
	);
}

describe("ExecutionStrategyResolver", () => {
	let resolver: ExecutionStrategyResolver;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				ExecutionStrategyResolver,
				{ provide: AnthropicProvider, useValue: mockAnthropic },
				{ provide: OpenAIProvider, useValue: mockOpenai },
				{ provide: EndpointProxyProvider, useValue: mockEndpointProxy },
				{ provide: MockProvider, useValue: mockMockProvider },
				{ provide: ENCRYPTION_SERVICE, useValue: mockEncryption },
				{ provide: MANAGE_API_KEYS_USE_CASE, useValue: mockApiKeys },
			],
		}).compile();

		resolver = module.get(ExecutionStrategyResolver);
		jest.clearAllMocks();
		mockEncryption.decrypt.mockReturnValue("decrypted-key");
	});

	it("retourne MockProvider pour un agent avec modèle 'mock'", async () => {
		const agent = makeAgent({ models: ["mock"] });

		const result = await resolver.resolve(agent, "user-1");

		expect(result.provider).toBe(mockMockProvider);
	});

	it("SELLER_ENDPOINT retourne EndpointProxyProvider avec baseUrl et format", async () => {
		const agent = makeAgent({
			cloudStrategy: "SELLER_ENDPOINT",
			endpointUrl: "https://api.example.com",
			endpointFormat: "openai",
		});

		const result = await resolver.resolve(agent, "user-1");

		expect(result.provider).toBe(mockEndpointProxy);
		expect(result.extraParams).toMatchObject({
			baseUrl: "https://api.example.com",
			endpointFormat: "openai",
		});
	});

	it("SELLER_ENDPOINT sans endpointUrl lance BadRequestException", async () => {
		const agent = makeAgent({
			cloudStrategy: "SELLER_ENDPOINT",
			endpointUrl: null,
			endpointFormat: null,
		});

		await expect(resolver.resolve(agent, "user-1")).rejects.toThrow(BadRequestException);
	});

	it("SELLER_API_KEY déchiffre la clé et retourne le bon provider", async () => {
		const agent = makeAgent({
			cloudStrategy: "SELLER_API_KEY",
			sellerApiKeyEncrypted: "enc-key",
			sellerApiProvider: "anthropic",
		});

		await resolver.resolve(agent, "user-1");

		expect(mockEncryption.decrypt).toHaveBeenCalledWith("enc-key");
	});

	it("SELLER_API_KEY avec provider anthropic retourne AnthropicProvider", async () => {
		const agent = makeAgent({
			cloudStrategy: "SELLER_API_KEY",
			sellerApiKeyEncrypted: "enc-key",
			sellerApiProvider: "anthropic",
		});

		const result = await resolver.resolve(agent, "user-1");

		expect(result.provider).toBe(mockAnthropic);
		expect(result.extraParams).toMatchObject({ apiKey: "decrypted-key" });
	});

	it("SELLER_API_KEY avec provider openai retourne OpenAIProvider", async () => {
		const agent = makeAgent({
			cloudStrategy: "SELLER_API_KEY",
			sellerApiKeyEncrypted: "enc-key",
			sellerApiProvider: "openai",
		});

		const result = await resolver.resolve(agent, "user-1");

		expect(result.provider).toBe(mockOpenai);
	});

	it("USER_API_KEY récupère la clé de l'utilisateur", async () => {
		mockApiKeys.getDecryptedKeyForProvider.mockResolvedValue("user-api-key");
		const agent = makeAgent({
			cloudStrategy: "USER_API_KEY",
			requiredUserProvider: "openai",
		});

		const result = await resolver.resolve(agent, "user-1");

		expect(mockApiKeys.getDecryptedKeyForProvider).toHaveBeenCalledWith("user-1", "openai");
		expect(result.extraParams).toMatchObject({ apiKey: "user-api-key" });
	});

	it("USER_API_KEY sans clé configurée lance BadRequestException", async () => {
		mockApiKeys.getDecryptedKeyForProvider.mockResolvedValue(null);
		const agent = makeAgent({
			cloudStrategy: "USER_API_KEY",
			requiredUserProvider: "openai",
		});

		await expect(resolver.resolve(agent, "user-1")).rejects.toThrow(BadRequestException);
	});

	it("agent LOCAL sans cloud capability lance BadRequestException", async () => {
		const agent = makeAgent({ mode: "LOCAL", cloudStrategy: null });

		await expect(resolver.resolve(agent, "user-1")).rejects.toThrow(BadRequestException);
	});

	it("agent cloud sans cloudStrategy lance BadRequestException", async () => {
		const agent = makeAgent({ mode: "CLOUD", cloudStrategy: null });

		await expect(resolver.resolve(agent, "user-1")).rejects.toThrow(BadRequestException);
	});
});
