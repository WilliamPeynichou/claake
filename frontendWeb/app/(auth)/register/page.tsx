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
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
	const _router = useRouter();
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [accountType, setAccountType] = useState<"user" | "developer">("user");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	async function handleRegister(e: React.FormEvent) {
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
			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						full_name: fullName,
						role: accountType,
					},
				},
			});

			if (error) {
				setError(error.message);
			} else {
				setSuccess(true);
			}
		} catch {
			setError("Une erreur inattendue est survenue.");
		} finally {
			setLoading(false);
		}
	}

	async function handleOAuthLogin(provider: "github" | "google") {
		const supabase = createClient();
		await supabase.auth.signInWithOAuth({
			provider,
			options: { redirectTo: `${window.location.origin}/auth/callback` },
		});
	}

	if (success) {
		return (
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
					<CardDescription>
						Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez sur le lien
						pour activer votre compte.
					</CardDescription>
				</CardHeader>
				<CardFooter className="justify-center">
					<Button variant="outline" asChild>
						<Link href="/login">Retour à la connexion</Link>
					</Button>
				</CardFooter>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">Inscription</CardTitle>
				<CardDescription>Créez votre compte AgentPlace</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleRegister} className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
					)}
					<div className="space-y-2">
						<Label htmlFor="fullName">Nom complet</Label>
						<Input
							id="fullName"
							type="text"
							placeholder="Jean Dupont"
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="vous@exemple.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Mot de passe</Label>
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
					<div className="space-y-2">
						<Label>Type de compte</Label>
						<div className="grid grid-cols-2 gap-3">
							<button
								type="button"
								onClick={() => setAccountType("user")}
								className={`rounded-md border p-3 text-left text-sm transition-colors ${
									accountType === "user"
										? "border-primary bg-primary/5"
										: "border-input hover:bg-accent"
								}`}
							>
								<div className="font-medium">Utilisateur</div>
								<div className="text-xs text-muted-foreground">
									Découvrir et utiliser des agents
								</div>
							</button>
							<button
								type="button"
								onClick={() => setAccountType("developer")}
								className={`rounded-md border p-3 text-left text-sm transition-colors ${
									accountType === "developer"
										? "border-primary bg-primary/5"
										: "border-input hover:bg-accent"
								}`}
							>
								<div className="font-medium">Développeur</div>
								<div className="text-xs text-muted-foreground">
									Publier et distribuer des agents
								</div>
							</button>
						</div>
					</div>
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Inscription..." : "Créer un compte"}
					</Button>
				</form>

				<div className="relative my-6">
					<Separator />
					<span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
						ou continuer avec
					</span>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<Button variant="outline" onClick={() => handleOAuthLogin("github")}>
						GitHub
					</Button>
					<Button variant="outline" onClick={() => handleOAuthLogin("google")}>
						Google
					</Button>
				</div>
			</CardContent>
			<CardFooter className="justify-center">
				<p className="text-sm text-muted-foreground">
					Déjà un compte ?{" "}
					<Link href="/login" className="font-medium text-foreground hover:underline">
						Se connecter
					</Link>
				</p>
			</CardFooter>
		</Card>
	);
}
