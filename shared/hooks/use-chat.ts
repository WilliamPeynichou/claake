import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiClient } from "../api/client";
import type { ChatMessage, ChatSession } from "../types";

export interface UseChatOptions {
	apiClient: ApiClient;
	token: string;
	sessionId?: string | null;
	agentId?: string;
}

export interface UseChatReturn {
	messages: ChatMessage[];
	input: string;
	setInput: (value: string) => void;
	loading: boolean;
	streaming: boolean;
	error: string | null;
	sessionId: string | null;
	sessions: ChatSession[];
	sendMessage: () => Promise<void>;
	loadSession: (sessionId: string) => Promise<void>;
	createSession: (agentId: string) => Promise<string>;
	deleteSession: (sessionId: string) => Promise<void>;
	refreshSessions: () => Promise<void>;
}

export function useChat({ apiClient, token, sessionId: initialSessionId, agentId }: UseChatOptions): UseChatReturn {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [streaming, setStreaming] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
	const [sessions, setSessions] = useState<ChatSession[]>([]);
	const sessionIdRef = useRef(sessionId);
	sessionIdRef.current = sessionId;

	const refreshSessions = useCallback(async () => {
		try {
			const result = await apiClient.chat.listSessions(token);
			setSessions(result.sessions);
		} catch {
			// Silently fail
		}
	}, [apiClient, token]);

	useEffect(() => {
		refreshSessions();
	}, [refreshSessions]);

	const loadSession = useCallback(
		async (sid: string) => {
			setSessionId(sid);
			setLoading(true);
			setError(null);
			try {
				const result = await apiClient.chat.getMessages(sid, token);
				setMessages(result.messages);
			} catch {
				setError("Impossible de charger les messages.");
			} finally {
				setLoading(false);
			}
		},
		[apiClient, token],
	);

	const createSession = useCallback(
		async (aid: string): Promise<string> => {
			const result = await apiClient.chat.createSession(aid, token);
			setSessionId(result.id);
			setMessages([]);
			await refreshSessions();
			return result.id;
		},
		[apiClient, token, refreshSessions],
	);

	const deleteSession = useCallback(
		async (sid: string) => {
			await apiClient.chat.deleteSession(sid, token);
			if (sessionIdRef.current === sid) {
				setSessionId(null);
				setMessages([]);
			}
			await refreshSessions();
		},
		[apiClient, token, refreshSessions],
	);

	const sendMessage = useCallback(async () => {
		const trimmed = input.trim();
		if (!trimmed) return;

		let currentSessionId = sessionIdRef.current;

		// Create session if none exists
		if (!currentSessionId && agentId) {
			try {
				currentSessionId = await createSession(agentId);
			} catch {
				setError("Impossible de créer la session.");
				return;
			}
		}

		if (!currentSessionId) {
			setError("Aucune session active. Sélectionnez un agent.");
			return;
		}

		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "user",
			content: trimmed,
			created_at: new Date().toISOString(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setStreaming(true);
		setError(null);

		// Create a placeholder assistant message for streaming
		const assistantId = crypto.randomUUID();
		const assistantMessage: ChatMessage = {
			id: assistantId,
			role: "assistant",
			content: "",
			created_at: new Date().toISOString(),
		};
		setMessages((prev) => [...prev, assistantMessage]);

		try {
			const res = await apiClient.chat.sendMessageSSE(currentSessionId, trimmed, token);

			if (!res.ok) {
				const errBody = await res.json().catch(() => ({}));
				throw new Error(errBody.error ?? `Erreur ${res.status}`);
			}

			const reader = res.body!.getReader();
			const decoder = new TextDecoder();
			let buffer = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";

				for (const line of lines) {
					if (!line.startsWith("data: ")) continue;
					const data = line.slice(6).trim();
					if (!data) continue;

					try {
						const parsed = JSON.parse(data);
						if (parsed.chunk) {
							setMessages((prev) =>
								prev.map((m) =>
									m.id === assistantId
										? { ...m, content: m.content + parsed.chunk }
										: m,
								),
							);
						}
						if (parsed.done && parsed.message) {
							// Replace placeholder with final persisted message
							setMessages((prev) =>
								prev.map((m) =>
									m.id === assistantId ? { ...parsed.message, id: parsed.message.id } : m,
								),
							);
						}
						if (parsed.error) {
							setError(parsed.error);
						}
					} catch {
						// Skip unparseable
					}
				}
			}

			await refreshSessions();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur de connexion.");
			// Remove empty assistant message on error
			setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content));
		} finally {
			setStreaming(false);
		}
	}, [input, agentId, apiClient, token, createSession, refreshSessions]);

	return {
		messages,
		input,
		setInput,
		loading,
		streaming,
		error,
		sessionId,
		sessions,
		sendMessage,
		loadSession,
		createSession,
		deleteSession,
		refreshSessions,
	};
}
