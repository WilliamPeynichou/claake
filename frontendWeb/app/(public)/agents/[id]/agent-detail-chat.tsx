"use client";

import type { Agent } from "@agentplace/shared";
import { ChatInterface } from "@/components/chat/chat-interface";

interface AgentDetailChatProps {
	agent: Agent;
}

export function AgentDetailChat({ agent }: AgentDetailChatProps) {
	return <ChatInterface agent={agent} />;
}
