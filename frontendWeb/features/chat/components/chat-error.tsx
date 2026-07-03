"use client";

interface ChatErrorProps {
	message: string;
	canRetry: boolean;
	onRetry: () => void;
}

/** Bandeau d'erreur de génération avec action de réessai. */
export function ChatError({ message, canRetry, onRetry }: ChatErrorProps) {
	return (
		<div className="mx-4 mt-4 flex items-center justify-between gap-3 border px-4 py-3 text-sm text-red-700">
			<span>{message}</span>
			{canRetry && (
				<button
					type="button"
					onClick={onRetry}
					className="shrink-0 px-3 py-2"
					style={{ background: "#6b7c5c", color: "#faf9f5" }}
				>
					Réessayer
				</button>
			)}
		</div>
	);
}
