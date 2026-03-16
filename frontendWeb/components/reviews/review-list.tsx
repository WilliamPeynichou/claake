"use client";

import type { Review } from "@claake/shared";
import { BadgeCheck, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";

interface ReviewListProps {
	agentId: string;
	refreshKey?: number;
}

export function ReviewList({ agentId, refreshKey }: ReviewListProps) {
	const [reviews, setReviews] = useState<Review[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const limit = 5;

	useEffect(() => {
		apiClient.reviews
			.list(agentId, page, limit)
			.then((res) => {
				setReviews(res.reviews);
				setTotal(res.total);
			})
			.catch(() => {});
	}, [agentId, page, refreshKey]);

	const totalPages = Math.ceil(total / limit);

	if (reviews.length === 0 && total === 0) {
		return (
			<p className="text-sm text-muted-foreground">Aucun avis pour le moment.</p>
		);
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">{total} avis</p>
			{reviews.map((review) => (
				<div key={review.id} className="rounded-md border p-4">
					<div className="flex items-start justify-between">
						<div>
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium">
									{review.user_name ?? "Utilisateur"}
								</span>
								{review.verified_purchase && (
									<Badge variant="secondary" className="text-xs">
										<BadgeCheck className="mr-1 h-3 w-3" />
										Achat v&eacute;rifi&eacute;
									</Badge>
								)}
								{review.verified_interaction && (
									<Badge variant="outline" className="text-xs">
										<BadgeCheck className="mr-1 h-3 w-3" />
										Utilis&eacute;
									</Badge>
								)}
							</div>
							<div className="mt-1 flex items-center gap-0.5">
								{[1, 2, 3, 4, 5].map((n) => (
									<Star
										key={n}
										className={`h-3.5 w-3.5 ${
											n <= review.rating
												? "fill-yellow-400 text-yellow-400"
												: "text-muted-foreground/20"
										}`}
									/>
								))}
							</div>
						</div>
						<span className="text-xs text-muted-foreground">
							{new Date(review.created_at).toLocaleDateString("fr-FR")}
						</span>
					</div>
					{review.comment && (
						<p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
					)}
				</div>
			))}

			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<span className="text-xs text-muted-foreground">
						{page}/{totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={page >= totalPages}
						onClick={() => setPage((p) => p + 1)}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			)}
		</div>
	);
}
