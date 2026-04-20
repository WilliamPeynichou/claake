import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ChatSessionEntity } from "../../domain/entities/chat-session.entity";
import { CHAT_SESSION_REPOSITORY } from "../../domain/ports/chat-session.repository.port";
import { DeleteSessionUseCase } from "./delete-session.usecase";

const mockRepo = {
	create: jest.fn(),
	findById: jest.fn(),
	findByUser: jest.fn(),
	findByUserAndAgent: jest.fn(),
	updateTitle: jest.fn(),
	delete: jest.fn(),
	addMessage: jest.fn(),
	getMessages: jest.fn(),
};

describe("DeleteSessionUseCase", () => {
	let useCase: DeleteSessionUseCase;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [DeleteSessionUseCase, { provide: CHAT_SESSION_REPOSITORY, useValue: mockRepo }],
		}).compile();

		useCase = module.get(DeleteSessionUseCase);
		jest.clearAllMocks();
	});

	it("deletes a session owned by the user", async () => {
		const session = new ChatSessionEntity(
			"s1",
			"user-1",
			"agent-1",
			"Title",
			new Date(),
			new Date(),
		);
		mockRepo.findById.mockResolvedValue(session);

		await useCase.execute("s1", "user-1");

		expect(mockRepo.delete).toHaveBeenCalledWith("s1");
	});

	it("throws NotFoundException when session does not exist", async () => {
		mockRepo.findById.mockResolvedValue(null);

		await expect(useCase.execute("x", "user-1")).rejects.toThrow(NotFoundException);
	});

	it("throws ForbiddenException when user does not own session", async () => {
		const session = new ChatSessionEntity(
			"s1",
			"other-user",
			"agent-1",
			null,
			new Date(),
			new Date(),
		);
		mockRepo.findById.mockResolvedValue(session);

		await expect(useCase.execute("s1", "user-1")).rejects.toThrow(ForbiddenException);
		expect(mockRepo.delete).not.toHaveBeenCalled();
	});
});
