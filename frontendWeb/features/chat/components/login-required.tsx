"use client";

interface LoginRequiredProps {
	onLogin: () => void;
}

/** État plein écran quand `AgentChatConfig.access.reason === "login_required"`. */
export function LoginRequired({ onLogin }: LoginRequiredProps) {
	return (
		<div
			className="flex flex-1 flex-col items-center justify-center gap-4"
			style={{ background: "#faf9f5" }}
		>
			<p style={{ fontFamily: "'DM Sans', system-ui", fontSize: "0.875rem", color: "#a09a8a" }}>
				Connectez-vous pour accéder au chat.
			</p>
			<button
				type="button"
				onClick={onLogin}
				className="px-6 py-2"
				style={{
					background: "#6b7c5c",
					color: "#faf9f5",
					border: "1px solid #6b7c5c",
					fontFamily: "'DM Sans', system-ui",
					fontSize: "0.85rem",
					letterSpacing: "0.05em",
				}}
			>
				Se connecter
			</button>
		</div>
	);
}
