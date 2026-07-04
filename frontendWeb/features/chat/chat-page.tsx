"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ChatShell } from "./chat-shell";

function ChatPageLoading() {
	return (
		<div className="flex flex-1 items-center justify-center" style={{ background: "#faf9f5" }}>
			<span style={{ fontFamily: "'DM Sans', system-ui", fontSize: "0.85rem", color: "#a09a8a" }}>
				Chargement…
			</span>
		</div>
	);
}

function ChatPageInner() {
	const params = useParams();
	const searchParams = useSearchParams();
	const agentId = params.agentId as string;
	const testMode = searchParams.get("test") === "1";
	return <ChatShell agentId={agentId} testMode={testMode} />;
}

/** Point d'entrée de la route `/chat/[agentId]`. Reste volontairement fin. */
export function ChatPage() {
	return (
		<Suspense fallback={<ChatPageLoading />}>
			<ChatPageInner />
		</Suspense>
	);
}
