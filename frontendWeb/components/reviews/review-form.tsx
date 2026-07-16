"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

interface ReviewFormProps {
	agentId: string;
	onReviewCreated?: () => void;
}

export function ReviewForm({ agentId, onReviewCreated }: ReviewFormProps) {
	const { token } = useAuth();
	const [rating, setRating] = useState(0);
	const [hoverRating, setHoverRating] = useState(0);
	const [comment, setComment] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	if (!token) return null;
	if (success) {
		return (
			<div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
				Merci pour votre avis !
			</div>
		);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!token || rating === 0) return;
		setSubmitting(true);
		setError(null);
		try {
			await apiClient.reviews.create(
				agentId,
				{ rating, comment: comment.trim() || undefined },
				token,
			);
			setSuccess(true);
			onReviewCreated?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de la soumission");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4 rounded-md border p-4">
			<p className="text-sm font-medium">Donner votre avis</p>
			{error && (
				<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
			)}
			<div className="flex items-center gap-1">
				{[1, 2, 3, 4, 5].map((n) => (
					<button
						key={n}
						type="button"
						onClick={() => setRating(n)}
						onMouseEnter={() => setHoverRating(n)}
						onMouseLeave={() => setHoverRating(0)}
						className="p-0.5"
					>
						<Star
							className={`h-6 w-6 ${
								n <= (hoverRating || rating)
									? "fill-yellow-400 text-yellow-400"
									: "text-muted-foreground/30"
							}`}
						/>
					</button>
				))}
				{rating > 0 && <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>}
			</div>
			<Textarea
				value={comment}
				onChange={(e) => setComment(e.target.value)}
				placeholder="Votre commentaire (optionnel)..."
				rows={3}
				maxLength={2000}
			/>
			<Button type="submit" size="sm" disabled={submitting || rating === 0}>
				{submitting ? "Envoi..." : "Publier"}
			</Button>
		</form>
	);
}
