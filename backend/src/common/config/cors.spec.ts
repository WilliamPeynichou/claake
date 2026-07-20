import { createCorsOptions } from "./cors.js";

describe("createCorsOptions", () => {
	it("allows exact browser and Tauri development origins", () => {
		const options = createCorsOptions({ NODE_ENV: "development" });

		expect(options.origin).toEqual(
			expect.arrayContaining([
				"http://localhost:5173",
				"http://127.0.0.1:5173",
				"tauri://localhost",
				"http://tauri.localhost",
			]),
		);
	});

	it("allows only the web and Tauri origins in production", () => {
		const options = createCorsOptions({
			NODE_ENV: "production",
			WEB_URL: "https://claake.com/",
		});

		expect(options.origin).toEqual([
			"tauri://localhost",
			"http://tauri.localhost",
			"https://claake.com",
		]);
	});

	it("requires WEB_URL in production", () => {
		expect(() => createCorsOptions({ NODE_ENV: "production" })).toThrow(
			"WEB_URL is required in production for CORS",
		);
	});

	it.each([
		"http://claake.com",
		"https://user:password@claake.com",
		"https://claake.com/path",
		"https://claake.com?query=true",
		"https://claake.com#fragment",
	])("rejects unsafe production WEB_URL %s", (webUrl) => {
		expect(() => createCorsOptions({ NODE_ENV: "production", WEB_URL: webUrl })).toThrow();
	});
});
