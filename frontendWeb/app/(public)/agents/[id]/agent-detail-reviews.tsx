"use client";

import { useState } from "react";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";

interface AgentDetailReviewsProps {
	agentId: string;
}

export function AgentDetailReviews({ agentId }: AgentDetailReviewsProps) {
	const [refreshKey, setRefreshKey] = useState(0);

	return (
		<div className="space-y-6">
			<h2 className="text-xl font-semibold">Avis</h2>
			<ReviewForm
				agentId={agentId}
				onReviewCreated={() => setRefreshKey((k) => k + 1)}
			/>
			<ReviewList agentId={agentId} refreshKey={refreshKey} />
		</div>
	);
}
