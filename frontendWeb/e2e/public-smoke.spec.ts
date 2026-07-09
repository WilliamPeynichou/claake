import { expect, test } from "@playwright/test";

test("landing exposes primary chat and catalogue paths", async ({ page }) => {
	await page.goto("/");

	await expect(page.locator('a[href="/chat"]').first()).toBeVisible();
	await expect(page.locator('a[href="/catalogue"]').first()).toBeVisible();
});

test("catalogue page loads public search UI without credentials", async ({ page }) => {
	await page.goto("/catalogue");

	await expect(page.getByRole("heading", { name: /catalogue des agents/i })).toBeVisible();
	await expect(page.getByRole("searchbox", { name: /rechercher/i })).toBeVisible();
});

test("chat entrypoint redirects unauthenticated users to login", async ({ page }) => {
	await page.goto("/chat");

	await expect(page).toHaveURL(/login|chat/);
	await expect(page.getByText(/connect|connexion|agent/i).first()).toBeVisible();
});
