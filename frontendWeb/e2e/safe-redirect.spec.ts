import { expect, test } from "@playwright/test";
import { safeRedirectPath } from "../lib/auth/safe-redirect";

test.describe("safeRedirectPath", () => {
	test("keeps allowlisted internal destinations including query and hash", () => {
		expect(safeRedirectPath("/dashboard/settings?tab=billing#plan")).toBe(
			"/dashboard/settings?tab=billing#plan",
		);
		expect(safeRedirectPath("/chat")).toBe("/chat");
		expect(safeRedirectPath("/checkout/agent-1")).toBe("/checkout/agent-1");
		expect(safeRedirectPath("/admin/users")).toBe("/admin/users");
	});

	test("rejects absolute and protocol-relative redirects", () => {
		expect(safeRedirectPath("https://evil.example/phish")).toBe("/dashboard");
		expect(safeRedirectPath("//evil.example/phish")).toBe("/dashboard");
		expect(safeRedirectPath("///evil.example/phish")).toBe("/dashboard");
	});

	test("rejects encoded, mixed-slash and malformed bypasses", () => {
		expect(safeRedirectPath("/%2f%2fevil.example/phish")).toBe("/dashboard");
		expect(safeRedirectPath("/\\evil.example/phish")).toBe("/dashboard");
		expect(safeRedirectPath("/%5cevil.example/phish")).toBe("/dashboard");
		expect(safeRedirectPath("/%E0%A4%A")).toBe("/dashboard");
	});

	test("rejects local paths outside the post-auth allowlist", () => {
		expect(safeRedirectPath("/login")).toBe("/dashboard");
		expect(safeRedirectPath("/api/admin")).toBe("/dashboard");
		expect(safeRedirectPath("/dashboard-evil")).toBe("/dashboard");
	});

	test("uses a caller-provided fallback for missing or unsafe input", () => {
		expect(safeRedirectPath(null, "/chat")).toBe("/chat");
		expect(safeRedirectPath("https://evil.example", "/chat")).toBe("/chat");
	});
});
