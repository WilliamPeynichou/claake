"use client";

import { Heart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

interface FavoriteButtonProps {
	agentId: string;
	size?: "sm" | "default" | "icon";
}

export function FavoriteButton({ agentId, size = "icon" }: FavoriteButtonProps) {
	const { token } = useAuth();
	const [favorited, setFavorited] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!token) return;
		apiClient.favorites
			.check(agentId, token)
			.then((res) => setFavorited(res.favorited))
			.catch(() => {});
	}, [token, agentId]);

	const handleToggle = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (!token || loading) return;
			setLoading(true);
			try {
				const result = await apiClient.favorites.toggle(agentId, token);
				setFavorited(result.favorited);
			} catch {
				// ignore
			} finally {
				setLoading(false);
			}
		},
		[token, agentId, loading],
	);

	if (!token) return null;

	return (
		<Button
			variant="ghost"
			size={size}
			onClick={handleToggle}
			disabled={loading}
			className="shrink-0"
			aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
		>
			<Heart
				className={`h-4 w-4 ${favorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
			/>
		</Button>
	);
}
