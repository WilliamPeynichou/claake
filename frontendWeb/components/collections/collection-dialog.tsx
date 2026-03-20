"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CollectionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: { name: string; description?: string; is_public?: boolean }) => void;
	initialData?: { name: string; description?: string; is_public?: boolean };
}

export function CollectionDialog({
	open,
	onOpenChange,
	onSubmit,
	initialData,
}: CollectionDialogProps) {
	const [name, setName] = useState(initialData?.name ?? "");
	const [description, setDescription] = useState(initialData?.description ?? "");
	const [isPublic, setIsPublic] = useState(initialData?.is_public ?? false);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) return;
		onSubmit({
			name: name.trim(),
			description: description.trim() || undefined,
			is_public: isPublic,
		});
		setName("");
		setDescription("");
		setIsPublic(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{initialData ? "Modifier la collection" : "Nouvelle collection"}
					</DialogTitle>
					<DialogDescription>
						Organisez vos agents en collections personnalis&eacute;es.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="col-name">Nom</Label>
						<Input
							id="col-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ma collection"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="col-desc">Description</Label>
						<Textarea
							id="col-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Description optionnelle..."
							rows={2}
						/>
					</div>
					<div className="flex items-center gap-2">
						<input
							id="col-public"
							type="checkbox"
							checked={isPublic}
							onChange={(e) => setIsPublic(e.target.checked)}
							className="h-4 w-4 rounded border-gray-300"
						/>
						<Label htmlFor="col-public" className="text-sm">
							Collection publique
						</Label>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Annuler
						</Button>
						<Button type="submit" disabled={!name.trim()}>
							{initialData ? "Enregistrer" : "Cr\u00e9er"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
