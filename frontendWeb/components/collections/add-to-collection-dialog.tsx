"use client";

import type { Collection } from "@claake/shared";
import { FolderPlus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

interface AddToCollectionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	agentId: string;
}

export function AddToCollectionDialog({ open, onOpenChange, agentId }: AddToCollectionDialogProps) {
	const { token } = useAuth();
	const [collections, setCollections] = useState<Collection[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open || !token) return;
		apiClient.collections
			.list(token)
			.then(setCollections)
			.catch(() => {});
	}, [open, token]);

	async function handleToggle(collection: Collection) {
		if (!token || loading) return;
		setLoading(true);
		try {
			if (collection.agent_ids.includes(agentId)) {
				const updated = await apiClient.collections.removeAgent(collection.id, agentId, token);
				setCollections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
			} else {
				const updated = await apiClient.collections.addAgent(collection.id, agentId, token);
				setCollections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
			}
		} catch {
			// ignore
		} finally {
			setLoading(false);
		}
	}

	async function handleCreateAndAdd() {
		if (!token) return;
		try {
			const collection = await apiClient.collections.create({ name: "Nouvelle collection" }, token);
			const updated = await apiClient.collections.addAgent(collection.id, agentId, token);
			setCollections((prev) => [updated, ...prev]);
		} catch {
			// ignore
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Ajouter &agrave; une collection</DialogTitle>
					<DialogDescription>
						S&eacute;lectionnez une collection existante ou cr&eacute;ez-en une nouvelle.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					{collections.map((col) => {
						const isIn = col.agent_ids.includes(agentId);
						return (
							<button
								key={col.id}
								type="button"
								onClick={() => handleToggle(col)}
								disabled={loading}
								className={`flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors ${
									isIn ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
								}`}
							>
								<FolderPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
								<div className="min-w-0 flex-1">
									<p className="font-medium">{col.name}</p>
									<p className="text-xs text-muted-foreground">
										{col.agent_ids.length} agent{col.agent_ids.length > 1 ? "s" : ""}
									</p>
								</div>
								{isIn && <span className="text-xs text-primary">Ajout&eacute;</span>}
							</button>
						);
					})}
					<Button variant="outline" size="sm" className="w-full" onClick={handleCreateAndAdd}>
						<Plus className="mr-2 h-4 w-4" />
						Nouvelle collection
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
