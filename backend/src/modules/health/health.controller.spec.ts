import { ServiceUnavailableException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { HealthController } from "./health.controller";

const mockPrisma = { $queryRaw: jest.fn() };

describe("HealthController", () => {
	let controller: HealthController;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			controllers: [HealthController],
			providers: [{ provide: PrismaService, useValue: mockPrisma }],
		}).compile();

		controller = module.get(HealthController);
		jest.clearAllMocks();
	});

	it("retourne { status: 'ok' } quand la base de données est accessible", async () => {
		mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);

		const result = await controller.check();

		expect(result).toEqual({ status: "ok" });
	});

	it("lance ServiceUnavailableException quand la base de données est inaccessible", async () => {
		mockPrisma.$queryRaw.mockRejectedValue(new Error("Connection refused"));

		await expect(controller.check()).rejects.toThrow(ServiceUnavailableException);
	});
});
