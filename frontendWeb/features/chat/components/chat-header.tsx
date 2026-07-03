"use client";

import Image from "next/image";

interface ChatHeaderAgent {
	name: string;
	description?: string | null;
	image_url?: string | null;
	models?: string[];
}

interface ChatHeaderProps {
	agent: ChatHeaderAgent | null;
}

/** En-tête du chat : avatar, nom, description et modèle courant de l'agent affiché. */
export function ChatHeader({ agent }: ChatHeaderProps) {
	if (!agent) return null;

	return (
		<div
			className="flex items-center gap-3 px-5 py-3 shrink-0"
			style={{ borderBottom: "1px solid #e8e4d8", background: "#faf9f5" }}
		>
			{agent.image_url ? (
				<Image
					src={agent.image_url}
					alt={agent.name}
					width={32}
					height={32}
					className="h-8 w-8 object-cover shrink-0"
					style={{ borderRadius: "4px" }}
				/>
			) : (
				<div
					className="h-8 w-8 shrink-0 flex items-center justify-center"
					style={{
						background: "#e8ede0",
						border: "1px solid #d0dac4",
						fontFamily: "'DM Serif Display', serif",
						fontSize: "0.9rem",
						color: "#6b7c5c",
					}}
				>
					{agent.name[0].toUpperCase()}
				</div>
			)}
			<div>
				<p
					style={{
						fontFamily: "'DM Sans', system-ui",
						fontSize: "0.875rem",
						fontWeight: 500,
						color: "#1e1c18",
					}}
				>
					{agent.name}
				</p>
				{agent.description && (
					<p
						style={{
							fontFamily: "'DM Sans', system-ui",
							fontSize: "0.72rem",
							color: "#a09a8a",
						}}
					>
						{agent.description}
					</p>
				)}
			</div>
			{agent.models?.[0] && (
				<div
					className="ml-auto"
					style={{
						fontFamily: "'DM Sans', system-ui",
						fontSize: "0.68rem",
						color: "#6b6558",
						letterSpacing: "0.05em",
						textTransform: "uppercase",
						border: "1px solid #e8e4d8",
						padding: "0.2rem 0.6rem",
					}}
				>
					{agent.models[0].split("/").pop()?.split("-").slice(0, 2).join(" ") ?? agent.models[0]}
				</div>
			)}
		</div>
	);
}
