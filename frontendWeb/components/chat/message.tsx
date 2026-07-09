"use client";

import type { ChatMessage as ChatMessageType, ChatToolEvent } from "@claake/shared";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
	message: ChatMessageType;
	agentName?: string | null;
	agentInitial?: string;
	isStreaming?: boolean;
}

export function Message({
	message,
	agentName: _agentName,
	agentInitial: _agentInitial,
	isStreaming,
}: Props) {
	const isUser = message.role === "user";

	if (isUser) {
		return (
			<div className="flex justify-end px-4 py-1">
				<div
					className="max-w-[75%] px-4 py-3"
					style={{
						background: "#e8ede0",
						border: "1px solid #d0dac4",
						color: "#1e1c18",
						fontSize: "0.875rem",
						lineHeight: "1.6",
						fontFamily: "'DM Sans', system-ui, sans-serif",
						borderRadius: "16px 16px 4px 16px",
					}}
				>
					<p className="whitespace-pre-wrap">{message.content}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex gap-3 px-4 py-1">
			<Image
				src="/logoClaakeGreen.png"
				alt="Claake"
				width={28}
				height={28}
				className="shrink-0 mt-0.5"
				style={{ height: "auto", borderRadius: "4px" }}
			/>
			<div
				className="flex-1 min-w-0"
				style={{
					color: "#1e1c18",
					fontSize: "0.875rem",
					lineHeight: "1.7",
					fontFamily: "'DM Sans', system-ui, sans-serif",
				}}
			>
				{message.tool_events?.length ? <ToolEvents events={message.tool_events} /> : null}
				<div
					className="prose prose-sm max-w-none"
					style={
						{
							"--tw-prose-body": "#1e1c18",
							"--tw-prose-headings": "#1e1c18",
							"--tw-prose-code": "#4e5c42",
							"--tw-prose-pre-bg": "#f3f0e8",
						} as React.CSSProperties
					}
				>
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						components={{
							code({ className, children, ...props }) {
								const isBlock = className?.includes("language-");
								if (isBlock) {
									return (
										<code
											className={className}
											style={{
												background: "#f3f0e8",
												border: "1px solid #e8e4d8",
												padding: "0.1em 0.3em",
												borderRadius: "3px",
												fontSize: "0.82em",
												color: "#4e5c42",
											}}
											{...props}
										>
											{children}
										</code>
									);
								}
								return (
									<code
										style={{
											background: "#f3f0e8",
											border: "1px solid #e8e4d8",
											padding: "0.1em 0.3em",
											borderRadius: "3px",
											fontSize: "0.82em",
											color: "#4e5c42",
										}}
										{...props}
									>
										{children}
									</code>
								);
							},
							pre({ children }) {
								return (
									<pre
										style={{
											background: "#f3f0e8",
											border: "1px solid #e8e4d8",
											padding: "1rem",
											overflowX: "auto",
											borderRadius: "4px",
											fontSize: "0.82em",
										}}
									>
										{children}
									</pre>
								);
							},
						}}
					>
						{message.content}
					</ReactMarkdown>
				</div>
				{isStreaming && (
					<span
						className="inline-block ml-0.5 h-4 w-0.5 animate-pulse align-text-bottom"
						style={{ background: "#6b7c5c" }}
					/>
				)}
			</div>
		</div>
	);
}

function ToolEvents({ events }: { events: ChatToolEvent[] }) {
	const calls = events.filter((event) => event.type === "tool_call");
	if (calls.length === 0) return null;
	return (
		<div className="mb-2 flex flex-col gap-1">
			{calls.map((event) => (
				<div
					key={event.id}
					className="inline-flex w-fit items-center gap-2 border px-2 py-1 text-xs"
					style={{ borderColor: "#d0dac4", background: "#f3f0e8", color: "#6b6558" }}
				>
					<span>L'agent utilise l'outil</span>
					<strong style={{ color: "#4e5c42" }}>{event.name}</strong>
				</div>
			))}
		</div>
	);
}
