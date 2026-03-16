"use client";

import { AI_PROVIDERS } from "@claake/shared";
import { useApiKeys } from "@claake/shared/hooks";
import { Key, Plus, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

export default function ApiKeysPage() {
	const { token } = useAuth();
	const { keys, addKey, removeKey } = useApiKeys(apiClient, token);
	const [showForm, setShowForm] = useState(false);
	const [provider, setProvider] = useState("anthropic");
	const [label, setLabel] = useState("");
	const [keyValue, setKeyValue] = useState("");

	async function handleAddKey() {
		if (!keyValue.trim()) return;
		await addKey(provider, label, keyValue);
		setProvider("anthropic");
		setLabel("");
		setKeyValue("");
		setShowForm(false);
	}

	return (
		<div>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Clés API</h1>
					<p className="mt-2 text-muted-foreground">
						Gérez vos clés API pour interagir avec les agents IA.
					</p>
				</div>
				<Button onClick={() => setShowForm(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Ajouter une clé
				</Button>
			</div>

			<div className="mt-4 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
				<Shield className="h-4 w-4 shrink-0" />
				Vos clés API sont chiffrées et stockées de manière sécurisée côté serveur.
			</div>

			{showForm && (
				<Card className="mt-6">
					<CardHeader>
						<CardTitle className="text-lg">Nouvelle clé API</CardTitle>
						<CardDescription>Ajoutez une clé API pour utiliser les agents IA.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Fournisseur</Label>
							<select
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								value={provider}
								onChange={(e) => setProvider(e.target.value)}
							>
								{AI_PROVIDERS.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="keyLabel">Label (optionnel)</Label>
							<Input
								id="keyLabel"
								placeholder="ex: Ma clé perso"
								value={label}
								onChange={(e) => setLabel(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="keyValue">Clé API</Label>
							<Input
								id="keyValue"
								type="password"
								placeholder="sk-..."
								value={keyValue}
								onChange={(e) => setKeyValue(e.target.value)}
							/>
						</div>
						<div className="flex gap-2">
							<Button onClick={handleAddKey}>Enregistrer</Button>
							<Button variant="outline" onClick={() => setShowForm(false)}>
								Annuler
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			<div className="mt-6 space-y-3">
				{keys.length === 0 && !showForm ? (
					<div className="flex flex-col items-center justify-center rounded-md border py-16 text-center">
						<Key className="h-12 w-12 text-muted-foreground/30" />
						<h3 className="mt-4 text-lg font-semibold">Aucune clé API</h3>
						<p className="mt-2 max-w-sm text-sm text-muted-foreground">
							Ajoutez une clé API pour utiliser les agents IA qui nécessitent votre propre clé.
						</p>
					</div>
				) : (
					keys.map((k) => (
						<Card key={k.id}>
							<CardContent className="flex items-center justify-between p-4">
								<div className="flex items-center gap-3">
									<Key className="h-5 w-5 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">
											{k.label} — <span className="text-muted-foreground">{k.provider}</span>
										</p>
										<p className="font-mono text-xs text-muted-foreground">{k.key_preview}</p>
									</div>
								</div>
								<Button variant="ghost" size="icon" onClick={() => removeKey(k.id)}>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}
