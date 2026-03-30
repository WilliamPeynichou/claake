import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage as ChatMessageType } from "@claake/shared";

interface Props { message: ChatMessageType; agentName?: string | null; isStreaming?: boolean; }

export function ChatMessage({ message, agentName, isStreaming }: Props) {
	const isUser = message.role === "user";
	const initials = isUser ? "V" : (agentName?.[0]?.toUpperCase() ?? "A");
	return (
		<div className={`flex gap-3 px-6 py-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
			<div className="h-7 w-7 shrink-0 flex items-center justify-center text-xs font-medium"
				style={{ background: isUser ? "#6b7c5c" : "#e8e4d8", color: isUser ? "#faf9f5" : "#6b6558" }}>
				{initials}
			</div>
			<div className="max-w-[72%] px-4 py-3 text-sm"
				style={{ background: isUser ? "#e8ede0" : "#f3f0e8", color: "#1e1c18", lineHeight: "1.7",
					border: `1px solid ${isUser ? "#d0dac4" : "#e8e4d8"}`,
					fontFamily: "'DM Sans', system-ui, sans-serif" }}>
				{isUser ? (
					<p className="whitespace-pre-wrap">{message.content}</p>
				) : (
					<div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:font-normal prose-code:before:content-none prose-code:after:content-none">
						<ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
						{isStreaming && (
							<span className="inline-block ml-0.5 h-4 w-0.5 animate-pulse align-text-bottom"
								style={{ background: "#6b7c5c" }} />
						)}
					</div>
				)}
			</div>
		</div>
	);
}
