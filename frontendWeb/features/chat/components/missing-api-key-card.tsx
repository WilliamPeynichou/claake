"use client";

interface MissingApiKeyCardProps {
	requiredProvider?: string;
	onAddKey: () => void;
}

/**
 * Bandeau actionnable affiché quand `AgentChatConfig.access.reason === "api_key_required"`.
 * Le backend décide si la clé est requise ; ce composant se contente de guider l'utilisateur.
 */
export function MissingApiKeyCard({ requiredProvider, onAddKey }: MissingApiKeyCardProps) {
	return (
		<div className="mx-4 mt-4 flex items-center justify-between gap-3 border px-4 py-3 text-sm">
			<span>Cet agent nécessite une clé API {requiredProvider ?? "IA"} pour être utilisé.</span>
			<button
				type="button"
				onClick={onAddKey}
				className="shrink-0 px-3 py-2"
				style={{ background: "#6b7c5c", color: "#faf9f5" }}
			>
				Ajouter une clé
			</button>
		</div>
	);
}
