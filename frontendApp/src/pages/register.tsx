import { Bot, Eye, EyeOff, Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

export function RegisterPage() {
	const { signUp } = useAuth();
	const [displayName, setDisplayName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await signUp(email, password, displayName);
			setSuccess(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de l'inscription");
		} finally {
			setLoading(false);
		}
	}

	if (success) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<div className="w-full max-w-sm space-y-4 text-center">
					<div className="flex justify-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
							<Bot className="h-6 w-6 text-primary-foreground" />
						</div>
					</div>
					<h1 className="text-xl font-bold">Vérifiez votre email</h1>
					<p className="text-sm text-muted-foreground">
						Un lien de confirmation a été envoyé à <strong>{email}</strong>.
					</p>
					<Link to="/login" className="inline-block text-sm text-primary hover:underline">
						Retour à la connexion
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-sm space-y-6">
				<div className="flex flex-col items-center gap-2">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
						<Bot className="h-6 w-6 text-primary-foreground" />
					</div>
					<h1 className="text-2xl font-bold">Créer un compte</h1>
					<p className="text-sm text-muted-foreground">Rejoignez Claake</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
					)}

					<div className="space-y-2">
						<label htmlFor="displayName" className="text-sm font-medium">
							Nom d'affichage
						</label>
						<input
							id="displayName"
							type="text"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							required
							className="w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
							placeholder="Votre nom"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="email" className="text-sm font-medium">
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
							placeholder="vous@exemple.com"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="password" className="text-sm font-medium">
							Mot de passe
						</label>
						<div className="relative">
							<input
								id="password"
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={6}
								className="w-full rounded-lg border bg-card px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary"
								placeholder="••••••••"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
					>
						{loading && <Loader2 className="h-4 w-4 animate-spin" />}
						S'inscrire
					</button>
				</form>

				<p className="text-center text-sm text-muted-foreground">
					Déjà un compte ?{" "}
					<Link to="/login" className="text-primary hover:underline">
						Se connecter
					</Link>
				</p>
			</div>
		</div>
	);
}
