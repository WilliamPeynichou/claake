import { ChatSessionEntity } from "../../domain/entities/chat-session.entity";
import type { ChatSessionWithDetails } from "../../domain/ports/chat-session.repository.port";
import { ChatSessionTransformer } from "./chat-session.transformer";

describe("ChatSessionTransformer", () => {
	it("transforms session with details to DTO", () => {
		const base = new ChatSessionEntity(
			"s1", "user-1", "agent-1", "My Chat",
			new Date("2025-03-01T10:00:00Z"),
			new Date("2025-03-01T12:00:00Z"),
		);

		const detailed: ChatSessionWithDetails = Object.assign(base, {
			agentName: "CodeBot",
			agentImageUrl: "https://img.url/bot.png",
			messageCount: 15,
			lastMessagePreview: "Hello, how can I help?",
		});

		const dto = ChatSessionTransformer.toDto(detailed);

		expect(dto.id).toBe("s1");
		expect(dto.agent_id).toBe("agent-1");
		expect(dto.agent_name).toBe("CodeBot");
		expect(dto.agent_image_url).toBe("https://img.url/bot.png");
		expect(dto.title).toBe("My Chat");
		expect(dto.message_count).toBe(15);
		expect(dto.last_message_preview).toBe("Hello, how can I help?");
		expect(dto.created_at).toBe("2025-03-01T10:00:00.000Z");
		expect(dto.updated_at).toBe("2025-03-01T12:00:00.000Z");
	});
});
