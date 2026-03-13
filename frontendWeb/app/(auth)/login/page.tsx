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

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleLogin(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const supabase = createClient();
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) {
				setError(error.message);
			} else {
				router.push("/dashboard");
				router.refresh();
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

	return (
		<Card>
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">Connexion</CardTitle>
				<CardDescription>Connectez-vous à votre compte AgentPlace</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleLogin} className="space-y-4">
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
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="password">Mot de passe</Label>
							<Link
								href="/forgot-password"
								className="text-xs text-muted-foreground hover:underline"
							>
								Mot de passe oublié ?
							</Link>
						</div>
						<Input
							id="password"
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Connexion..." : "Se connecter"}
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
					Pas encore de compte ?{" "}
					<Link href="/register" className="font-medium text-foreground hover:underline">
						S&apos;inscrire
					</Link>
				</p>
			</CardFooter>
		</Card>
	);
}
