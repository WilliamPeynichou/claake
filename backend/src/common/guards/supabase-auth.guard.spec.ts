import type { ExecutionContext } from "@nestjs/common";
import { OptionalSupabaseAuthGuard } from "./optional-supabase-auth.guard";
import { SupabaseAuthGuard } from "./supabase-auth.guard";

const mockGetUser = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
	createClient: jest.fn(() => ({
		auth: {
			getUser: mockGetUser,
		},
	})),
}));

type MockRequest = {
	headers: Record<string, string | undefined>;
	user?: { id: string; email: string; role: string };
};

function createContext(request: MockRequest): ExecutionContext {
	return {
		switchToHttp: () => ({
			getRequest: () => request,
		}),
	} as unknown as ExecutionContext;
}

function createConfig() {
	return {
		getOrThrow: jest.fn((key: string) => `test-${key}`),
	};
}

function createPrisma(role = "USER") {
	return {
		user: {
			upsert: jest.fn().mockResolvedValue({ role }),
		},
	};
}

describe("Supabase auth guards — first-login role hardening", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetUser.mockResolvedValue({
			data: {
				user: {
					id: "user-1",
					email: "user@example.test",
					app_metadata: { role: "SUPER_ADMIN" },
				},
			},
			error: null,
		});
	});

	it("crée toujours un nouvel utilisateur authentifié avec le rôle local USER, même si app_metadata revendique SUPER_ADMIN", async () => {
		const prisma = createPrisma("USER");
		const guard = new SupabaseAuthGuard(createConfig() as any, prisma as any);
		const request: MockRequest = { headers: { authorization: "Bearer valid-token" } };

		await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

		expect(prisma.user.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "user-1" },
				create: expect.objectContaining({
					id: "user-1",
					email: "user@example.test",
					role: "USER",
				}),
				update: {},
				select: { role: true },
			}),
		);
		expect(request.user).toEqual({ id: "user-1", email: "user@example.test", role: "USER" });
	});

	it("OptionalSupabaseAuthGuard applique le même durcissement sur la création locale", async () => {
		const prisma = createPrisma("USER");
		const guard = new OptionalSupabaseAuthGuard(createConfig() as any, prisma as any);
		const request: MockRequest = { headers: { authorization: "Bearer valid-token" } };

		await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

		expect(prisma.user.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				create: expect.objectContaining({ role: "USER" }),
			}),
		);
		expect(request.user?.role).toBe("USER");
	});

	it("ne réécrit pas le rôle déjà présent en base, source d'autorité backend", async () => {
		const prisma = createPrisma("ADMIN");
		const guard = new SupabaseAuthGuard(createConfig() as any, prisma as any);
		const request: MockRequest = { headers: { authorization: "Bearer valid-token" } };

		await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

		expect(prisma.user.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				update: {},
			}),
		);
		expect(request.user?.role).toBe("ADMIN");
	});
});
