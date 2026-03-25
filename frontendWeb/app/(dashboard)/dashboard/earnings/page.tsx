"use client";

import type { CreatorEarnings } from "@claake/shared";
import { DollarSign, Loader2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

export default function EarningsPage() {
	const { token } = useAuth();
	const [data, setData] = useState<CreatorEarnings | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!token) return;
		apiClient.payments
			.earnings(token)
			.then(setData)
			.catch(() => setError("Impossible de charger les revenus."))
			.finally(() => setLoading(false));
	}, [token]);

	if (loading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="py-16 text-center">
				<p className="text-muted-foreground">{error}</p>
			</div>
		);
	}

	return (
		<div>
			<h1 className="text-3xl font-bold">Revenus</h1>
			<p className="mt-2 text-muted-foreground">Suivez vos gains et commissions sur vos agents.</p>

			{/* Stats cards */}
			<div className="mt-8 grid gap-4 sm:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{(data?.total_earnings ?? 0).toFixed(2)} &euro;</p>
						<p className="text-xs text-muted-foreground">Montant net après commission Claake</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Ventes totales</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{data?.total_sales ?? 0}</p>
						<p className="text-xs text-muted-foreground">
							{(data?.total_sales ?? 0) < 100
								? `${100 - (data?.total_sales ?? 0)} ventes avant le palier 14%`
								: "Palier 14% atteint"}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Commission Claake</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">
							{(data?.total_platform_fees ?? 0).toFixed(2)} &euro;
						</p>
						<p className="text-xs text-muted-foreground">
							20% &lt; 100 ventes &bull; 14% &ge; 100 ventes
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Commission history */}
			<Card className="mt-8">
				<CardHeader>
					<CardTitle>Historique des commissions</CardTitle>
					<CardDescription>Détail de chaque vente et commission appliquée.</CardDescription>
				</CardHeader>
				<CardContent>
					{!data?.commissions.length ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							Aucune vente pour le moment.
						</p>
					) : (
						<div className="space-y-3">
							{data.commissions.map((c) => (
								<div key={c.id}>
									<div className="flex items-center justify-between text-sm">
										<div className="flex items-center gap-3">
											<Badge variant="outline">#{c.sale_number}</Badge>
											<span className="text-muted-foreground">
												{new Date(c.created_at).toLocaleDateString("fr-FR")}
											</span>
										</div>
										<div className="flex items-center gap-4 text-right">
											<div>
												<span className="text-muted-foreground">Total : </span>
												<span className="font-medium">{c.amount.toFixed(2)} &euro;</span>
											</div>
											<div>
												<span className="text-muted-foreground">Commission : </span>
												<span className="text-destructive">
													-{c.platform_fee.toFixed(2)} &euro;
												</span>
												<span className="ml-1 text-xs text-muted-foreground">
													({(c.commission_rate * 100).toFixed(0)}%)
												</span>
											</div>
											<div>
												<span className="font-semibold text-green-600 dark:text-green-400">
													+{c.creator_payout.toFixed(2)} &euro;
												</span>
											</div>
										</div>
									</div>
									<Separator className="mt-3" />
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
