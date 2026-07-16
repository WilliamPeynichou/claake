import { validate } from "class-validator";
import { IsPublicUrl } from "./is-public-url.validator";

const mockLookup = jest.fn();
jest.mock("node:dns/promises", () => ({
	lookup: (...args: unknown[]) => mockLookup(...args),
}));

class TestDto {
	@IsPublicUrl()
	url!: string;
}

async function validateUrl(url: string): Promise<boolean> {
	const dto = new TestDto();
	dto.url = url;
	const errors = await validate(dto);
	return errors.length === 0;
}

describe("IsPublicUrl", () => {
	beforeEach(() => {
		mockLookup.mockReset();
		mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
	});

	it("accepts a public URL whose hostname resolves to a public address", async () => {
		await expect(validateUrl("https://api.example.com/v1")).resolves.toBe(true);
		expect(mockLookup).toHaveBeenCalledWith("api.example.com", { all: true, verbatim: true });
	});

	it("rejects syntactically invalid or non-http URLs without resolving DNS", async () => {
		await expect(validateUrl("ftp://example.com")).resolves.toBe(false);
		await expect(validateUrl("not a url")).resolves.toBe(false);
		await expect(validateUrl("https://user:pass@example.com")).resolves.toBe(false);
		expect(mockLookup).not.toHaveBeenCalled();
	});

	it("rejects literal private and loopback IPs without resolving DNS", async () => {
		await expect(validateUrl("http://127.0.0.1:3001")).resolves.toBe(false);
		await expect(validateUrl("http://10.0.0.5")).resolves.toBe(false);
		await expect(validateUrl("http://[::1]:8080")).resolves.toBe(false);
		expect(mockLookup).not.toHaveBeenCalled();
	});

	it("rejects hostnames resolving to a blocked address", async () => {
		mockLookup.mockResolvedValue([{ address: "192.168.1.10", family: 4 }]);
		await expect(validateUrl("https://internal.example.com")).resolves.toBe(false);
	});

	it("rejects hostnames resolving to a mix of public and blocked addresses", async () => {
		mockLookup.mockResolvedValue([
			{ address: "93.184.216.34", family: 4 },
			{ address: "169.254.169.254", family: 4 },
		]);
		await expect(validateUrl("https://rebind.example.com")).resolves.toBe(false);
	});

	it("rejects hostnames that cannot be resolved", async () => {
		mockLookup.mockRejectedValue(new Error("ENOTFOUND"));
		await expect(validateUrl("https://unknown.example.com")).resolves.toBe(false);
	});
});
