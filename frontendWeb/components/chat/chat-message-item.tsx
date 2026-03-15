"use client";

import type { ChatMessage } from "@claake/shared";
import { Bot, User } from "lucide-react";

interface ChatMessageItemProps {
	message: ChatMessage;
	agentName: string;
}

export function ChatMessageItem({ message, agentName }: ChatMessageItemProps) {
	const isUser = message.role === "user";

	return (
		<div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
			{!isUser && (
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
					<Bot className="h-4 w-4 text-primary" />
				</div>
			)}
			<div
				className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
					isUser ? "bg-primary text-primary-foreground" : "bg-muted"
				}`}
			>
				<p className="whitespace-pre-wrap break-words">{message.content}</p>
			</div>
			{isUser && (
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
					<User className="h-4 w-4" />
				</div>
			)}
		</div>
	);
}
