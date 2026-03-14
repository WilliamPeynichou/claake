"use client";

import type { UserProfile } from "@agentplace/shared";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
	const [fullName, setFullName] = useState("");
	const [bio, setBio] = useState("");
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loadingProfile, setLoadingProfile] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		async function loadProfile() {
			setLoadingProfile(true);
			setError(null);

			try {
				const token = await getAccessToken();
				if (!token) {
					if (isMounted) {
						setError("Session introuvable. Reconnectez-vous pour charger votre profil.");
					}
					return;
				}

				const nextProfile = await apiClient.auth.profile(token);
				if (!isMounted) return;

				setProfile(nextProfile);
				setFullName(nextProfile.display_name ?? "");
				setBio(nextProfile.bio ?? "");
			} catch {
				if (isMounted) {
					setError("Impossible de charger votre profil.");
				}
			} finally {
				if (isMounted) {
					setLoadingProfile(false);
				}
			}
		}

		loadProfile();

		return () => {
			isMounted = false;
		};
	}, []);

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setMessage(null);
		setError(null);

		try {
			const token = await getAccessToken();
			if (!token) {
				setError("Session introuvable. Reconnectez-vous pour enregistrer votre profil.");
				return;
			}

			const updatedProfile = await apiClient.auth.updateProfile(
				{
					display_name: fullName,
					bio,
				},
				token,
			);

			setProfile(updatedProfile);
			setFullName(updatedProfile.display_name ?? "");
			setBio(updatedProfile.bio ?? "");
			setMessage("Profil mis à jour avec succès.");
		} catch {
			setError("Impossible d'enregistrer votre profil.");
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
						<form onSubmit={handleSave} className="space-y-4">
							{error && (
								<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
									{error}
								</div>
							)}
							{message && (
								<div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
									{message}
								</div>
							)}
							<div className="space-y-2">
								<Label htmlFor="fullName">Nom complet</Label>
								<Input
									id="fullName"
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
									placeholder="Jean Dupont"
									disabled={loadingProfile || saving}
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
									disabled={loadingProfile || saving}
								/>
							</div>
							<Button type="submit" disabled={loadingProfile || saving}>
								{loadingProfile ? "Chargement..." : saving ? "Enregistrement..." : "Enregistrer"}
							</Button>
						</form>
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
								<p className="text-sm font-medium">
									{profile?.role === "developer"
										? "Compte Développeur"
										: profile?.role === "admin"
											? "Compte Admin"
											: "Compte Utilisateur"}
								</p>
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
