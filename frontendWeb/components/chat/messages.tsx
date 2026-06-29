"use client";

import type { ChatMessage as ChatMessageType } from "@claake/shared";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Message } from "./message";

interface MessagesProps {
	messages: ChatMessageType[];
	streaming: boolean;
	error?: string | null;
	agentName?: string | null;
	agentInitial?: string;
	welcomeMessage?: string | null;
	suggestedPrompts?: string[];
	onSuggestedPrompt?: (prompt: string) => void;
}

export function Messages({
	messages,
	streaming,
	error,
	agentName,
	agentInitial,
	welcomeMessage,
	suggestedPrompts = [],
	onSuggestedPrompt,
}: MessagesProps) {
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	});

	if (messages.length === 0 && !streaming) {
		return (
			<div
				className="flex flex-1 flex-col items-center justify-center gap-4"
				style={{ background: "#faf9f5" }}
			>
				<Image
					src="/logoClaakeGreen.png"
					alt="Claake"
					width={80}
					height={80}
					style={{ height: "auto", opacity: 0.85 }}
				/>
				<div className="text-center">
					<p
						style={{
							fontFamily: "'DM Serif Display', serif",
							fontSize: "1.25rem",
							color: "#1e1c18",
							fontWeight: 400,
						}}
					>
						{agentName ?? "Sélectionnez un agent"}
					</p>
					<p
						className="mx-auto max-w-xl"
						style={{
							fontFamily: "'DM Sans', system-ui",
							fontSize: "0.8rem",
							color: "#a09a8a",
							marginTop: "0.25rem",
							lineHeight: 1.6,
						}}
					>
						{welcomeMessage || "Démarrez la conversation"}
					</p>
				</div>
				{suggestedPrompts.length > 0 && (
					<div className="flex max-w-2xl flex-wrap justify-center gap-2 px-4">
						{suggestedPrompts.map((prompt) => (
							<button
								key={prompt}
								type="button"
								onClick={() => onSuggestedPrompt?.(prompt)}
								className="rounded-full border px-3 py-2 text-xs transition-colors hover:bg-[#e8ede0]"
								style={{ borderColor: "#e8e4d8", color: "#6b6558" }}
							>
								{prompt}
							</button>
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto" style={{ background: "#faf9f5" }}>
			<div className="max-w-3xl mx-auto py-6 flex flex-col gap-2">
				{messages.map((msg, i) => (
					<Message
						key={msg.id}
						message={msg}
						agentName={agentName}
						agentInitial={agentInitial}
						isStreaming={streaming && i === messages.length - 1 && msg.role === "assistant"}
					/>
				))}

				{/* Thinking dots when streaming starts */}
				{streaming && messages[messages.length - 1]?.role !== "assistant" && (
					<div className="flex gap-3 px-4 py-1">
						<Image
							src="/logoClaakeGreen.png"
							alt="Claake"
							width={28}
							height={28}
							style={{ height: "auto", borderRadius: "4px" }}
						/>
						<div className="flex items-center gap-1 pt-1">
							{[0, 1, 2].map((j) => (
								<span
									key={j}
									className="h-1.5 w-1.5 rounded-full animate-bounce"
									style={{
										background: "#a09a8a",
										animationDelay: `${j * 150}ms`,
									}}
								/>
							))}
						</div>
					</div>
				)}

				{error && (
					<div
						className="mx-4 px-4 py-3 text-sm"
						style={{
							background: "#fdf5f5",
							border: "1px solid #e8c4c4",
							color: "#c44444",
							fontFamily: "'DM Sans', system-ui",
						}}
					>
						{error}
					</div>
				)}

				<div ref={bottomRef} />
			</div>
		</div>
	);
}
