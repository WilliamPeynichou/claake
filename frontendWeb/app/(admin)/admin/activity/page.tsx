"use client";

import type { ActivityLog } from "@claake/shared";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

const ACTION_LABELS: Record<string, string> = {
	"agent.approved": "Agent approuv\u00e9",
	"agent.rejected": "Agent rejet\u00e9",
	"user.role_changed": "R\u00f4le modifi\u00e9",
	"review.created": "Avis cr\u00e9\u00e9",
	"review.deleted": "Avis supprim\u00e9",
	"payment.confirmed": "Paiement confirm\u00e9",
};

export default function AdminActivityPage() {
	const { token } = useAuth();
	const [logs, setLogs] = useState<ActivityLog[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [actionFilter, setActionFilter] = useState("all");
	const limit = 20;

	useEffect(() => {
		if (!token) return;
		apiClient.activity
			.list(token, {
				action: actionFilter !== "all" ? actionFilter : undefined,
				page,
				limit,
			})
			.then((res) => {
				setLogs(res.logs);
				setTotal(res.total);
			})
			.catch(() => {});
	}, [token, page, actionFilter]);

	const totalPages = Math.ceil(total / limit);

	return (
		<div>
			<h1 className="text-3xl font-bold">Journal d&apos;activit&eacute;</h1>
			<p className="mt-2 text-muted-foreground">
				Historique des actions administratives sur la plateforme.
			</p>

			<div className="mt-6 flex items-center gap-4">
				<Select value={actionFilter} onValueChange={(v) => setActionFilter(v ?? "all")}>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="Toutes les actions" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Toutes les actions</SelectItem>
						<SelectItem value="agent.approved">Agent approuv&eacute;</SelectItem>
						<SelectItem value="agent.rejected">Agent rejet&eacute;</SelectItem>
						<SelectItem value="user.role_changed">R&ocirc;le modifi&eacute;</SelectItem>
						<SelectItem value="review.deleted">Avis supprim&eacute;</SelectItem>
					</SelectContent>
				</Select>
				<span className="text-sm text-muted-foreground">{total} entr&eacute;e(s)</span>
			</div>

			<div className="mt-4 rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Date</TableHead>
							<TableHead>Action</TableHead>
							<TableHead>Acteur</TableHead>
							<TableHead>Cible</TableHead>
							<TableHead>D&eacute;tails</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{logs.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center text-muted-foreground">
									<Activity className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
									Aucune activit&eacute; enregistr&eacute;e.
								</TableCell>
							</TableRow>
						) : (
							logs.map((log) => (
								<TableRow key={log.id}>
									<TableCell className="text-xs">
										{new Date(log.created_at).toLocaleString("fr-FR")}
									</TableCell>
									<TableCell>
										<Badge variant="outline" className="text-xs">
											{ACTION_LABELS[log.action] ?? log.action}
										</Badge>
									</TableCell>
									<TableCell className="text-sm">{log.actor_email}</TableCell>
									<TableCell className="font-mono text-xs">
										{log.target_type}/{log.target_id.slice(0, 8)}
									</TableCell>
									<TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
										{log.metadata ? JSON.stringify(log.metadata).slice(0, 100) : "\u2014"}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{totalPages > 1 && (
				<div className="mt-4 flex items-center justify-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<span className="text-sm text-muted-foreground">
						{page} / {totalPages}
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
