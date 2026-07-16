import { validate } from "class-validator";
import { CreateAgentDto } from "./create-agent.dto";

function validDto(): CreateAgentDto {
	return Object.assign(new CreateAgentDto(), {
		name: "Agent",
		slug: "agent",
		description: "Description",
		category: "productivite",
		tags: [],
		models: ["gpt-4o"],
	});
}

describe("CreateAgentDto security bounds", () => {
	it.each([
		["name", "x".repeat(81)],
		["description", "x".repeat(1001)],
		["long_description", "x".repeat(5001)],
		["system_prompt", "x".repeat(10001)],
		["output_format", "x".repeat(2001)],
	])("rejects oversized %s", async (field, value) => {
		const dto = validDto();
		Object.assign(dto, { [field]: value });
		const errors = await validate(dto);
		expect(errors.some((error) => error.property === field)).toBe(true);
	});

	it("rejects oversized agent collections", async () => {
		const dto = validDto();
		dto.tags = Array.from({ length: 21 }, (_, index) => `tag-${index}`);
		dto.models = Array.from({ length: 11 }, (_, index) => `model-${index}`);
		dto.tools = Array.from({ length: 11 }, () => ({}));
		const errors = await validate(dto);
		const fields = errors.map((error) => error.property);
		expect(fields).toEqual(expect.arrayContaining(["tags", "models", "tools"]));
	});
});
