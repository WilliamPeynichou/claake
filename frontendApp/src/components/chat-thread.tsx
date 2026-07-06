import type { ChatMessage as ChatMessageType } from "@claake/shared";
import { RefreshCcw } from "lucide-react";
import { useEffect, useRef } from "react";
import { ChatMessage } from "./chat-message";

interface Props {
	messages: ChatMessageType[];
	streaming: boolean;
	error?: string | null;
	agentName?: string | null;
	welcomeMessage?: string | null;
	suggestedPrompts?: string[];
	onUsePrompt?: (prompt: string) => void;
	onRetry?: () => void;
	canRetry?: boolean;
}

export function ChatThread({
	messages,
	streaming,
	error,
	agentName,
	welcomeMessage,
	suggestedPrompts = [],
	onUsePrompt,
	onRetry,
	canRetry = false,
}: Props) {
	const bottomRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	});

	if (messages.length === 0 && !streaming) {
		return (
			<div
				className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center"
				style={{ background: "#faf9f5" }}
			>
				<div
					className="flex h-12 w-12 items-center justify-center"
					style={{ background: "#e8ede0", border: "1px solid #d0dac4" }}
				>
					<span
						style={{
							fontFamily: "'DM Serif Display', serif",
							fontSize: "1.25rem",
							color: "#6b7c5c",
						}}
					>
						{agentName?.[0]?.toUpperCase() ?? "A"}
					</span>
				</div>
				<p
					style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "#1e1c18" }}
				>
					{agentName ?? "Sélectionnez un agent"}
				</p>
				<p className="max-w-xl text-sm" style={{ color: "#766f62" }}>
					{welcomeMessage ?? "Démarrez la conversation"}
				</p>
				{suggestedPrompts.length > 0 && (
					<div className="mt-4 flex max-w-2xl flex-wrap justify-center gap-2">
						{suggestedPrompts.map((prompt) => (
							<button
								key={prompt}
								type="button"
								onClick={() => onUsePrompt?.(prompt)}
								className="border px-3 py-2 text-xs transition-colors"
								style={{ borderColor: "#d0dac4", color: "#6b7c5c", background: "#f3f0e8" }}
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
		<div className="flex-1 overflow-y-auto py-4" style={{ background: "#faf9f5" }}>
			{messages.map((msg, i) => (
				<ChatMessage
					key={msg.id}
					message={msg}
					agentName={agentName}
					isStreaming={streaming && i === messages.length - 1 && msg.role === "assistant"}
				/>
			))}
			{streaming && messages[messages.length - 1]?.role !== "assistant" && (
				<div className="flex gap-3 px-6 py-3">
					<div
						className="flex h-7 w-7 shrink-0 items-center justify-center text-xs"
						style={{ background: "#e8e4d8", color: "#6b6558" }}
					>
						{agentName?.[0]?.toUpperCase() ?? "A"}
					</div>
					<div className="px-4 py-3" style={{ background: "#f3f0e8", border: "1px solid #e8e4d8" }}>
						<span className="inline-flex gap-1">
							{[0, 1, 2].map((j) => (
								<span
									key={j}
									className="h-1.5 w-1.5 animate-bounce rounded-full"
									style={{ background: "#a09a8a", animationDelay: `${j * 150}ms` }}
								/>
							))}
						</span>
					</div>
				</div>
			)}
			{error && (
				<div
					className="mx-6 my-2 flex items-center justify-between gap-3 px-4 py-3 text-sm"
					style={{ background: "#fdf5f5", border: "1px solid #e8c4c4", color: "#c44" }}
				>
					<span>{error}</span>
					{canRetry && onRetry && (
						<button
							type="button"
							onClick={onRetry}
							className="inline-flex items-center gap-1 text-xs"
						>
							<RefreshCcw className="h-3.5 w-3.5" /> Réessayer
						</button>
					)}
				</div>
			)}
			<div ref={bottomRef} />
		</div>
	);
}
