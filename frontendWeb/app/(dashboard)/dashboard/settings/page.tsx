"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

export default function SettingsPage() {
	const { token } = useAuth();
	const [fullName, setFullName] = useState("");
	const [bio, setBio] = useState("");
	const [saving, setSaving] = useState(false);
	const [loading, setLoading] = useState(true);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Load current profile
	useEffect(() => {
		if (!token) return;
		apiClient.auth
			.profile(token)
			.then((profile) => {
				setFullName(profile.display_name ?? "");
				setBio(profile.bio ?? "");
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [token]);

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		if (!token) return;

		setSaving(true);
		setMessage(null);
		setError(null);

		try {
			await apiClient.auth.updateProfile(
				{
					display_name: fullName || null,
					bio: bio || null,
				} as any,
				token,
			);
			setMessage("Profil mis à jour avec succès.");
		} catch {
			setError("Erreur lors de la mise à jour du profil.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div>
			<h1 className="text-3xl font-bold">Paramètres</h1>
			<p className="mt-2 text-muted-foreground">Gérez les paramètres de votre compte.</p>

			<div className="mt-8 max-w-2xl space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Profil</CardTitle>
						<CardDescription>Mettez à jour vos informations personnelles.</CardDescription>
					</CardHeader>
					<CardContent>
						{loading ? (
							<p className="text-sm text-muted-foreground">Chargement...</p>
						) : (
							<form onSubmit={handleSave} className="space-y-4">
								{message && (
									<div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
										{message}
									</div>
								)}
								{error && (
									<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
										{error}
									</div>
								)}
								<div className="space-y-2">
									<Label htmlFor="fullName">Nom complet</Label>
									<Input
										id="fullName"
										value={fullName}
										onChange={(e) => setFullName(e.target.value)}
										placeholder="Jean Dupont"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="bio">Bio</Label>
									<Textarea
										id="bio"
										value={bio}
										onChange={(e) => setBio(e.target.value)}
										placeholder="Parlez-nous de vous..."
										rows={3}
									/>
								</div>
								<Button type="submit" disabled={saving}>
									{saving ? "Enregistrement..." : "Enregistrer"}
								</Button>
							</form>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Type de compte</CardTitle>
						<CardDescription>
							Passez à un compte développeur pour publier des agents.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium">Compte Utilisateur</p>
								<p className="text-xs text-muted-foreground">Peut utiliser et tester des agents</p>
							</div>
							<Button variant="outline">Passer développeur</Button>
						</div>
					</CardContent>
				</Card>

				<Separator />

				<Card className="border-destructive/50">
					<CardHeader>
						<CardTitle className="text-destructive">Zone de danger</CardTitle>
						<CardDescription>Actions irréversibles sur votre compte.</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="destructive">Supprimer mon compte</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
