"use client";

import Link from "next/link";
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

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const supabase = createClient();
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
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

	if (success) {
		return (
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Email envoyé</CardTitle>
					<CardDescription>
						Si un compte existe avec l&apos;adresse <strong>{email}</strong>, vous recevrez un lien
						pour réinitialiser votre mot de passe.
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
				<CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
				<CardDescription>
					Entrez votre adresse email pour recevoir un lien de réinitialisation.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
					)}
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
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Envoi..." : "Envoyer le lien"}
					</Button>
				</form>
			</CardContent>
			<CardFooter className="justify-center">
				<p className="text-sm text-muted-foreground">
					<Link href="/login" className="font-medium text-foreground hover:underline">
						Retour à la connexion
					</Link>
				</p>
			</CardFooter>
		</Card>
	);
}
