"use client";

import type { Agent, ChatMessage } from "@claake/shared";
import { AlertCircle, Bot } from "lucide-react";
import { useEffect, useRef } from "react";
import { ChatMessageItem } from "@/components/chat/chat-message-item";

interface ChatMainProps {
	messages: ChatMessage[];
	loading: boolean;
	streaming: boolean;
	error: string | null;
	selectedAgent: Agent | null;
	sessionId: string | null;
}

export function ChatMain({
	messages,
	loading,
	streaming,
	error,
	selectedAgent,
	sessionId,
}: ChatMainProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Empty state — no agent selected
	if (!selectedAgent) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
				<Bot className="h-16 w-16 text-muted-foreground/20" />
				<h3 className="mt-4 text-lg font-medium">Bienvenue sur le Chat</h3>
				<p className="mt-1 max-w-sm text-sm">
					Sélectionnez un agent dans la barre latérale ou démarrez une nouvelle conversation.
				</p>
			</div>
		);
	}

	// Agent selected but no messages yet
	if (messages.length === 0 && !loading) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
				<Bot className="h-12 w-12 text-muted-foreground/30" />
				<p className="mt-4 text-sm">
					Envoyez un message pour commencer la conversation avec{" "}
					<strong>{selectedAgent.name}</strong>.
				</p>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto px-4 py-4">
			<div className="mx-auto max-w-3xl space-y-4">
				{messages.map((msg) => (
					<ChatMessageItem key={msg.id} message={msg} agentName={selectedAgent.name} />
				))}

				{loading && (
					<div className="flex gap-3">
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
							<Bot className="h-4 w-4 text-primary" />
						</div>
						<div className="rounded-lg bg-muted px-4 py-2">
							<div className="flex gap-1">
								<span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" />
								<span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
								<span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
							</div>
						</div>
					</div>
				)}

				{error && (
					<div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
						<AlertCircle className="h-4 w-4 shrink-0" />
						{error}
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>
		</div>
	);
}
