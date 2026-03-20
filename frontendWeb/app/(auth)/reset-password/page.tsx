"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
	const router = useRouter();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		if (password !== confirmPassword) {
			setError("Les mots de passe ne correspondent pas.");
			return;
		}

		if (password.length < 8) {
			setError("Le mot de passe doit contenir au moins 8 caractères.");
			return;
		}

		setLoading(true);

		try {
			const supabase = createClient();
			const { error } = await supabase.auth.updateUser({ password });

			if (error) {
				setError(error.message);
			} else {
				setSuccess(true);
				setTimeout(() => router.push("/dashboard"), 2000);
			}
		} catch {
			setError("Une erreur inattendue est survenue.");
		} finally {
			setLoading(false);
		}
	}

	if (success) {
		return (
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Mot de passe mis à jour</CardTitle>
					<CardDescription>
						Votre mot de passe a été réinitialisé avec succès. Redirection en cours...
					</CardDescription>
				</CardHeader>
				<CardFooter className="justify-center">
					<Button variant="outline" asChild>
						<Link href="/dashboard">Aller au tableau de bord</Link>
					</Button>
				</CardFooter>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
				<CardDescription>Choisissez un nouveau mot de passe pour votre compte.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
					)}
					<div className="space-y-2">
						<Label htmlFor="password">Nouveau mot de passe</Label>
						<Input
							id="password"
							type="password"
							placeholder="Min. 8 caractères"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={8}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
						<Input
							id="confirmPassword"
							type="password"
							placeholder="••••••••"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
						/>
					</div>
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Mise à jour..." : "Réinitialiser le mot de passe"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
