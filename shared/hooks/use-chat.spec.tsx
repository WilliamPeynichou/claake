// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "../api/client";
import { useChat } from "./use-chat";

function createApiClient(sendMessageSSE: ApiClient["chat"]["sendMessageSSE"]): ApiClient {
	return {
		chat: {
			listSessions: vi.fn().mockResolvedValue({ sessions: [], total: 0 }),
			sendMessageSSE,
		},
	} as unknown as ApiClient;
}

function createPendingResponse(signal: AbortSignal, firstChunk = '0:"Bonjour"\n') {
	const encoder = new TextEncoder();
	let readCount = 0;
	return {
		ok: true,
		body: {
			getReader: () => ({
				read: () => {
					if (readCount++ === 0 && firstChunk) {
						return Promise.resolve({ done: false, value: encoder.encode(firstChunk) });
					}
					return new Promise((_, reject) => {
						if (signal.aborted) {
							reject(new DOMException("Aborted", "AbortError"));
							return;
						}
						signal.addEventListener(
							"abort",
							() => reject(new DOMException("Aborted", "AbortError")),
							{ once: true },
						);
					});
				},
			}),
		},
	} as Response;
}

describe("useChat stop", () => {
	it("aborts active SSE, keeps partial content, and does not enable retry", async () => {
		let capturedSignal: AbortSignal | undefined;
		const sendMessageSSE = vi.fn(async (_sid, _content, _token, _files, signal) => {
			capturedSignal = signal;
			return createPendingResponse(signal as AbortSignal);
		});
		const { result } = renderHook(() =>
			useChat({ apiClient: createApiClient(sendMessageSSE), token: "token", sessionId: "session" }),
		);

		act(() => result.current.setInput("Question"));
		let sending = Promise.resolve();
		act(() => {
			sending = result.current.sendMessage();
		});
		await waitFor(() => expect(result.current.messages.at(-1)?.content).toBe("Bonjour"));

		act(() => result.current.stop());
		await waitFor(() => expect(result.current.streaming).toBe(false));
		await sending;

		expect(capturedSignal?.aborted).toBe(true);
		expect(result.current.streaming).toBe(false);
		expect(result.current.error).toBeNull();
		expect(result.current.canRetry).toBe(false);
		await waitFor(() =>
			expect(result.current.messages.at(-1)?.content).toContain("réponse arrêtée"),
		);
	});

	it("aborts active SSE when unmounted", async () => {
		let capturedSignal: AbortSignal | undefined;
		const sendMessageSSE = vi.fn(async (_sid, _content, _token, _files, signal) => {
			capturedSignal = signal;
			return createPendingResponse(signal as AbortSignal, "");
		});
		const { result, unmount } = renderHook(() =>
			useChat({ apiClient: createApiClient(sendMessageSSE), token: "token", sessionId: "session" }),
		);

		act(() => result.current.setInput("Question"));
		let sending = Promise.resolve();
		act(() => {
			sending = result.current.sendMessage();
		});
		await waitFor(() => expect(capturedSignal).toBeDefined());
		act(() => unmount());
		await sending;

		expect(capturedSignal?.aborted).toBe(true);
	});
});
