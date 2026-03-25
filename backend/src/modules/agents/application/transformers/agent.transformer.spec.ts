import { AgentEntity } from "../../domain/entities/agent.entity";
import { AgentTransformer } from "./agent.transformer";

describe("AgentTransformer", () => {
	it("transforms entity to DTO with correct field mapping", () => {
		const entity = new AgentEntity(
			"id-1",
			"My Agent",
			"my-agent",
			"Description",
			"Long desc",
			"coding",
			["ai", "ml"],
			["claude-sonnet-4-20250514"],
			"CLOUD",
			"https://config.url",
			"https://image.url",
			["https://ss1.png"],
			"FREE",
			0,
			1,
			"APPROVED",
			null,
			100,
			4.5,
			10,
			"creator-1",
			"John Doe",
			new Date("2025-06-01T00:00:00Z"),
			new Date("2025-06-02T00:00:00Z"),
			"System prompt",
		);

		const dto = AgentTransformer.toDto(entity);

		expect(dto.id).toBe("id-1");
		expect(dto.name).toBe("My Agent");
		expect(dto.slug).toBe("my-agent");
		expect(dto.long_description).toBe("Long desc");
		expect(dto.image_url).toBe("https://image.url");
		expect(dto.config_url).toBe("https://config.url");
		expect(dto.pricing_model).toBe("free");
		expect(dto.mode).toBe("cloud");
		expect(dto.status).toBe("approved");
		expect(dto.download_count).toBe(100);
		expect(dto.review_count).toBe(10);
		expect(dto.creator_id).toBe("creator-1");
		expect(dto.creator_name).toBe("John Doe");
		expect(dto.created_at).toBe("2025-06-01T00:00:00.000Z");
		expect(dto.updated_at).toBe("2025-06-02T00:00:00.000Z");
	});

	it("lowercases enum values", () => {
		const entity = new AgentEntity(
			"id",
			"n",
			"s",
			"d",
			null,
			"cat",
			[],
			[],
			"HYBRID",
			null,
			null,
			[],
			"ONE_TIME",
			9.99,
			1,
			"PENDING",
			null,
			0,
			0,
			0,
			"u",
			null,
			new Date(),
			new Date(),
		);

		const dto = AgentTransformer.toDto(entity);

		expect(dto.mode).toBe("hybrid");
		expect(dto.pricing_model).toBe("one_time");
		expect(dto.status).toBe("pending");
	});
});
