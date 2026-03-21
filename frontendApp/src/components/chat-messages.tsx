import type { ChatMessage } from "@claake/shared";
import { Bot, Loader2, MessageSquare, User } from "lucide-react";
import { useEffect, useRef } from "react";

interface ChatMessagesProps {
	messages: ChatMessage[];
	loading: boolean;
	streaming: boolean;
	error: string | null;
	agentName: string | null;
}

export function ChatMessages({
	messages,
	loading,
	streaming,
	error,
	agentName,
}: ChatMessagesProps) {
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, streaming]);

	if (!agentName) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
				<MessageSquare className="h-12 w-12 opacity-20" />
				<p className="text-sm">Sélectionnez un agent pour commencer</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col overflow-y-auto">
			{messages.length === 0 && (
				<div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
					<Bot className="h-12 w-12 text-primary/30" />
					<p className="text-sm">
						Démarrez une conversation avec <strong>{agentName}</strong>
					</p>
				</div>
			)}

			<div className="mx-auto w-full max-w-3xl space-y-4 p-4">
				{messages.map((msg) => (
					<div
						key={msg.id}
						className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
					>
						{msg.role !== "user" && (
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
								<Bot className="h-4 w-4 text-primary" />
							</div>
						)}
						<div
							className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
								msg.role === "user"
									? "bg-primary text-primary-foreground"
									: "bg-muted text-foreground"
							}`}
						>
							<div className="whitespace-pre-wrap">{msg.content}</div>
							{msg.role === "assistant" && streaming && msg.content === "" && (
								<div className="flex gap-1 py-1">
									<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
									<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
									<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
								</div>
							)}
						</div>
						{msg.role === "user" && (
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent">
								<User className="h-4 w-4" />
							</div>
						)}
					</div>
				))}
				<div ref={bottomRef} />
			</div>

			{error && (
				<div className="mx-auto w-full max-w-3xl px-4 pb-2">
					<div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{error}
					</div>
				</div>
			)}
		</div>
	);
}
