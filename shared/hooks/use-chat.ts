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
	pendingFileIds: string[];
	addPendingFile: (fileId: string) => void;
	removePendingFile: (fileId: string) => void;
	sendMessage: () => Promise<void>;
	retry: () => Promise<void>;
	canRetry: boolean;
	loadSession: (sessionId: string) => Promise<void>;
	createSession: (agentId: string) => Promise<string>;
	deleteSession: (sessionId: string) => Promise<void>;
	refreshSessions: () => Promise<void>;
}

export function useChat({
	apiClient,
	token,
	sessionId: initialSessionId,
	agentId,
}: UseChatOptions): UseChatReturn {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [streaming, setStreaming] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
	const [sessions, setSessions] = useState<ChatSession[]>([]);
	const [pendingFileIds, setPendingFileIds] = useState<string[]>([]);
	const sessionIdRef = useRef(sessionId);
	sessionIdRef.current = sessionId;
	const lastPayloadRef = useRef<{ content: string; fileIds: string[] } | null>(null);
	const [canRetry, setCanRetry] = useState(false);

	const addPendingFile = useCallback((fileId: string) => {
		setPendingFileIds((prev) => [...prev, fileId]);
	}, []);

	const removePendingFile = useCallback((fileId: string) => {
		setPendingFileIds((prev) => prev.filter((id) => id !== fileId));
	}, []);

	const refreshSessions = useCallback(async () => {
		try {
			const result = await apiClient.chat.listSessions(token, 50);
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

	const runStream = useCallback(
		async (currentSessionId: string, content: string, fileIds: string[]) => {
			lastPayloadRef.current = { content, fileIds };
			setStreaming(true);
			setError(null);
			setCanRetry(false);

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
				const res = await apiClient.chat.sendMessageSSE(
					currentSessionId,
					content,
					token,
					fileIds.length ? fileIds : undefined,
				);

				if (!res.ok) {
					const errBody = await res.json().catch(() => ({}));
					throw new Error(errBody.error?.message ?? errBody.message ?? `Erreur ${res.status}`);
				}

				if (!res.body) {
					throw new Error("Réponse vide du serveur.");
				}

				const reader = res.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";
				let receivedDone = false;

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() ?? "";

					for (const line of lines) {
						try {
							if (line.startsWith("0:")) {
								const chunk = JSON.parse(line.slice(2));
								setMessages((prev) =>
									prev.map((m) =>
										m.id === assistantId ? { ...m, content: m.content + chunk } : m,
									),
								);
								continue;
							}

							if (line.startsWith("d:")) {
								receivedDone = true;
								continue;
							}

							if (line.startsWith("3:")) {
								setError(JSON.parse(line.slice(2)));
								continue;
							}

							if (line.startsWith("data: ")) {
								const data = line.slice(6).trim();
								if (!data) continue;
								const parsed = JSON.parse(data);
								if (parsed.chunk) {
									setMessages((prev) =>
										prev.map((m) =>
											m.id === assistantId ? { ...m, content: m.content + parsed.chunk } : m,
										),
									);
								}
								if (parsed.done) {
									receivedDone = true;
									if (parsed.message) {
										setMessages((prev) =>
											prev.map((m) =>
												m.id === assistantId ? { ...parsed.message, id: parsed.message.id } : m,
											),
										);
									}
								}
								if (parsed.error) {
									setError(parsed.error);
								}
							}
						} catch {
							// Skip unparseable
						}
					}
				}

				// Stream ended without a done event — connection was cut mid-response
				if (!receivedDone) {
					setMessages((prev) =>
						prev.map((m) =>
							m.id === assistantId && m.content
								? { ...m, content: `${m.content}\n\n*(réponse interrompue)*` }
								: m,
						),
					);
				}

				await refreshSessions();
			} catch (err) {
				setError(err instanceof Error ? err.message : "Erreur de connexion.");
				setCanRetry(true);
				// Remove empty assistant message on error
				setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content));
			} finally {
				setStreaming(false);
			}
		},
		[apiClient, token, refreshSessions],
	);

	const sendMessage = useCallback(async () => {
		const trimmed = input.trim();
		if (!trimmed && pendingFileIds.length === 0) return;

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

		const fileIdsToSend = [...pendingFileIds];
		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setPendingFileIds([]);

		await runStream(currentSessionId, trimmed, fileIdsToSend);
	}, [input, pendingFileIds, agentId, createSession, runStream]);

	const retry = useCallback(async () => {
		const last = lastPayloadRef.current;
		const currentSessionId = sessionIdRef.current;
		if (!last || !currentSessionId) return;
		await runStream(currentSessionId, last.content, last.fileIds);
	}, [runStream]);

	return {
		messages,
		input,
		setInput,
		loading,
		streaming,
		error,
		sessionId,
		sessions,
		pendingFileIds,
		addPendingFile,
		removePendingFile,
		sendMessage,
		retry,
		canRetry,
		loadSession,
		createSession,
		deleteSession,
		refreshSessions,
	};
}
