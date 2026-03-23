import type { ChatMessage } from "@claake/shared";
import { Loader2, Sparkles, User } from "lucide-react";
import { useEffect, useRef } from "react";

interface ChatMessagesProps {
	messages: ChatMessage[];
	loading: boolean;
	streaming: boolean;
	error: string | null;
	agentName: string | null;
	onResumeConversation?: () => void;
	onStartWithAgent?: () => void;
}

export function ChatMessages({
	messages,
	loading,
	streaming,
	error,
	agentName,
	onResumeConversation,
	onStartWithAgent,
}: ChatMessagesProps) {
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, streaming]);

	if (!agentName) {
		return (
			<div
				className="flex flex-1 flex-col items-center justify-center gap-8 px-8"
				style={{ background: "#faf9f5" }}
			>
				{/* Logo grand */}
				<img
					src="/logo.png"
					alt="Claake"
					style={{ height: 56, opacity: 0.9 }}
				/>

				{/* Titre */}
				<div className="text-center" style={{ maxWidth: "480px" }}>
					<h1
						style={{
							fontFamily: "'DM Serif Display', Georgia, serif",
							fontSize: "clamp(2rem, 4vw, 3rem)",
							fontWeight: 400,
							color: "#1e1c18",
							lineHeight: 1.15,
							letterSpacing: "-0.02em",
						}}
					>
						Welcome to Claake
					</h1>
					<p
						className="mt-4 text-base leading-relaxed"
						style={{ color: "#6b6558" }}
					>
						Select a conversation or choose an agent<br />from the sidebar to get started.
					</p>
				</div>

				{/* Hint cards */}
				<div className="flex gap-3">
					<button
						type="button"
						onClick={onResumeConversation}
						className="border px-4 py-3 text-sm transition-all"
						style={{ borderColor: "#e8e4d8", color: "#6b6558", background: "#f3f0e8" }}
						onMouseEnter={(e) => {
							(e.currentTarget as HTMLButtonElement).style.borderColor = "#2a7a44";
							(e.currentTarget as HTMLButtonElement).style.color = "#2a7a44";
						}}
						onMouseLeave={(e) => {
							(e.currentTarget as HTMLButtonElement).style.borderColor = "#e8e4d8";
							(e.currentTarget as HTMLButtonElement).style.color = "#6b6558";
						}}
					>
						Resume a conversation
					</button>
					<button
						type="button"
						onClick={onStartWithAgent}
						className="border px-4 py-3 text-sm transition-all"
						style={{ borderColor: "#e8e4d8", color: "#6b6558", background: "#f3f0e8" }}
						onMouseEnter={(e) => {
							(e.currentTarget as HTMLButtonElement).style.borderColor = "#2a7a44";
							(e.currentTarget as HTMLButtonElement).style.color = "#2a7a44";
						}}
						onMouseLeave={(e) => {
							(e.currentTarget as HTMLButtonElement).style.borderColor = "#e8e4d8";
							(e.currentTarget as HTMLButtonElement).style.color = "#6b6558";
						}}
					>
						Start with an agent
					</button>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex flex-1 items-center justify-center" role="status" aria-label="Loading" style={{ background: "#faf9f5" }}>
				<Loader2 className="h-5 w-5 animate-spin" style={{ color: "#766f62" }} />
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col overflow-y-auto" role="log" aria-live="polite" aria-label="Conversation" style={{ background: "#faf9f5" }}>
			{messages.length === 0 && (
				<div className="flex flex-1 flex-col items-center justify-center gap-5">
					<div
						className="flex h-14 w-14 items-center justify-center"
						style={{ background: "#e8f2ec" }}
					>
						<Sparkles className="h-6 w-6" style={{ color: "#2a7a44" }} />
					</div>
					<div className="text-center">
						<p
							className="text-xl"
							style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: "#1e1c18", fontWeight: 400 }}
						>
							{agentName}
						</p>
						<p className="mt-2 text-sm" style={{ color: "#a09a8a" }}>
							Send a message below to start
						</p>
					</div>
				</div>
			)}

			<div className="mx-auto w-full max-w-3xl space-y-8 px-6 py-6">
				{messages.map((msg) => (
					<div
						key={msg.id}
						className={`flex gap-4 ${msg.role === "user" ? "justify-end" : ""}`}
					>
						{msg.role !== "user" && (
							<div
								className="flex h-8 w-8 shrink-0 items-center justify-center"
								style={{ background: "#e8f2ec" }}
							>
								<Sparkles className="h-4 w-4" style={{ color: "#2a7a44" }} />
							</div>
						)}
						<div
							className="max-w-[78%] px-6 py-4 text-sm leading-relaxed"
							style={
								msg.role === "user"
									? { background: "#f3f0e8", color: "#1e1c18", border: "1px solid #e8e4d8" }
									: { background: "#faf9f5", color: "#1e1c18", border: "1px solid #e8e4d8", borderLeft: "3px solid #2a7a44" }
							}
						>
							<div className="whitespace-pre-wrap">{msg.content}</div>
							{msg.role === "assistant" && streaming && msg.content === "" && (
								<div className="flex gap-1.5 py-1">
									<span className="h-1.5 w-1.5 animate-bounce" style={{ background: "#766f62", borderRadius: "50%", animationDelay: "0ms" }} />
									<span className="h-1.5 w-1.5 animate-bounce" style={{ background: "#766f62", borderRadius: "50%", animationDelay: "150ms" }} />
									<span className="h-1.5 w-1.5 animate-bounce" style={{ background: "#766f62", borderRadius: "50%", animationDelay: "300ms" }} />
								</div>
							)}
						</div>
						{msg.role === "user" && (
							<div
								className="flex h-8 w-8 shrink-0 items-center justify-center"
								style={{ background: "#f3f0e8", border: "1px solid #e8e4d8" }}
							>
								<User className="h-4 w-4" style={{ color: "#6b6558" }} />
							</div>
						)}
					</div>
				))}
				<div ref={bottomRef} />
			</div>

			{error && (
				<div className="mx-auto w-full max-w-3xl px-6 pb-4">
					<div
						role="alert"
						className="border px-4 py-3 text-sm"
						style={{ borderColor: "#c0392b", color: "#c0392b", background: "rgba(192,57,43,0.06)" }}
					>
						{error}
					</div>
				</div>
			)}
		</div>
	);
}
