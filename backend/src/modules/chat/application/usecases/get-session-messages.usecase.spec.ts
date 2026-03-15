import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ChatMessageEntity } from "../../domain/entities/chat-message.entity";
import { ChatSessionEntity } from "../../domain/entities/chat-session.entity";
import { CHAT_SESSION_REPOSITORY } from "../../domain/ports/chat-session.repository.port";
import { GetSessionMessagesUseCase } from "./get-session-messages.usecase";

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

describe("GetSessionMessagesUseCase", () => {
	let useCase: GetSessionMessagesUseCase;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				GetSessionMessagesUseCase,
				{ provide: CHAT_SESSION_REPOSITORY, useValue: mockRepo },
			],
		}).compile();

		useCase = module.get(GetSessionMessagesUseCase);
		jest.clearAllMocks();
	});

	it("returns messages for owned session", async () => {
		const session = new ChatSessionEntity(
			"s1", "user-1", "agent-1", null, new Date(), new Date(),
		);
		const messages = [
			new ChatMessageEntity("m1", "s1", "USER", "TEXT", "Hello", null, null, new Date()),
			new ChatMessageEntity("m2", "s1", "ASSISTANT", "TEXT", "Hi!", null, null, new Date()),
		];

		mockRepo.findById.mockResolvedValue(session);
		mockRepo.getMessages.mockResolvedValue({ messages, total: 2 });

		const result = await useCase.execute("s1", "user-1");

		expect(result.messages).toHaveLength(2);
		expect(result.total).toBe(2);
		expect(result.messages[0].role).toBe("user");
		expect(result.messages[1].role).toBe("assistant");
	});

	it("throws NotFoundException for unknown session", async () => {
		mockRepo.findById.mockResolvedValue(null);

		await expect(useCase.execute("x", "user-1")).rejects.toThrow(NotFoundException);
	});

	it("throws ForbiddenException for non-owner", async () => {
		const session = new ChatSessionEntity(
			"s1", "other-user", "agent-1", null, new Date(), new Date(),
		);
		mockRepo.findById.mockResolvedValue(session);

		await expect(useCase.execute("s1", "user-1")).rejects.toThrow(ForbiddenException);
	});

	it("passes pagination params", async () => {
		const session = new ChatSessionEntity(
			"s1", "user-1", "agent-1", null, new Date(), new Date(),
		);
		mockRepo.findById.mockResolvedValue(session);
		mockRepo.getMessages.mockResolvedValue({ messages: [], total: 0 });

		await useCase.execute("s1", "user-1", 10, 5);

		expect(mockRepo.getMessages).toHaveBeenCalledWith("s1", 10, 5);
	});
});
