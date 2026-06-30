import { ChatMessageEntity } from "../../domain/entities/chat-message.entity";
import { ChatMessageTransformer } from "./chat-message.transformer";

describe("ChatMessageTransformer", () => {
	it("transforms message entity to DTO", () => {
		const entity = new ChatMessageEntity(
			"msg-1",
			"session-1",
			"USER",
			"TEXT",
			"Hello world",
			null,
			null,
			new Date("2025-03-01T10:00:00Z"),
		);

		const dto = ChatMessageTransformer.toDto(entity);

		expect(dto.id).toBe("msg-1");
		expect(dto.session_id).toBe("session-1");
		expect(dto.role).toBe("user");
		expect(dto.content_type).toBe("text");
		expect(dto.content).toBe("Hello world");
		expect(dto.media_url).toBeNull();
		expect(dto.metadata).toBeNull();
		expect(dto.created_at).toBe("2025-03-01T10:00:00.000Z");
	});

	it("includes media_url and metadata when present", () => {
		const entity = new ChatMessageEntity(
			"msg-2",
			"session-1",
			"ASSISTANT",
			"IMAGE",
			"",
			"https://img.url/photo.png",
			{ width: 800, height: 600 },
			new Date("2025-03-01T11:00:00Z"),
		);

		const dto = ChatMessageTransformer.toDto(entity);

		expect(dto.role).toBe("assistant");
		expect(dto.content_type).toBe("image");
		expect(dto.media_url).toBe("https://img.url/photo.png");
		expect(dto.metadata).toEqual({ width: 800, height: 600 });
	});
});
