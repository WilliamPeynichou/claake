import { useCallback, useRef, useState } from "react";
import type { ApiClient } from "../api/client";
import { MAX_SANDBOX_INTERACTIONS } from "../lib/constants";
import type { Agent, ChatMessage } from "../types";

export interface UseChatOptions {
	agent: Agent;
	apiClient: ApiClient;
	apiKey?: string;
}

export interface UseChatReturn {
	messages: ChatMessage[];
	input: string;
	setInput: (value: string) => void;
	loading: boolean;
	error: string | null;
	sandboxCount: number;
	sandboxLimitReached: boolean;
	sendMessage: () => Promise<void>;
	clearMessages: () => void;
}

export function useChat({ agent, apiClient, apiKey }: UseChatOptions): UseChatReturn {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sandboxCount, setSandboxCount] = useState(0);
	const messagesRef = useRef(messages);
	messagesRef.current = messages;

	const sandboxLimitReached = !apiKey && sandboxCount >= MAX_SANDBOX_INTERACTIONS;

	const sendMessage = useCallback(async () => {
		const trimmed = input.trim();
		if (!trimmed) return;

		if (sandboxLimitReached) {
			setError(
				"Vous avez atteint la limite de 3 interactions sandbox. Ajoutez votre clé API pour continuer.",
			);
			return;
		}

		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "user",
			content: trimmed,
			timestamp: new Date().toISOString(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setLoading(true);
		setError(null);

		try {
			const data = await apiClient.chat.send({
				agent_id: agent.id,
				message: userMessage.content,
				api_key: apiKey || undefined,
				history: messagesRef.current.map((m) => ({ role: m.role, content: m.content })),
				system_prompt: agent.long_description ?? agent.description,
				model: agent.model,
			});

			const assistantMessage: ChatMessage = {
				id: crypto.randomUUID(),
				role: "assistant",
				content: data.content ?? "Réponse reçue.",
				timestamp: new Date().toISOString(),
			};

			setMessages((prev) => [...prev, assistantMessage]);

			if (!apiKey) {
				setSandboxCount((c) => c + 1);
			}
		} catch {
			setError("Impossible de contacter le serveur.");
		} finally {
			setLoading(false);
		}
	}, [input, apiKey, agent, apiClient, sandboxLimitReached]);

	const clearMessages = useCallback(() => {
		setMessages([]);
		setError(null);
	}, []);

	return {
		messages,
		input,
		setInput,
		loading,
		error,
		sandboxCount,
		sandboxLimitReached,
		sendMessage,
		clearMessages,
	};
}
