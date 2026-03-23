import { Eye, EyeOff, Loader2 } from "lucide-react";
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
			<div className="flex min-h-screen flex-col items-center justify-center px-8" style={{ background: "#faf9f5" }}>
				<div className="w-full max-w-md space-y-6 text-center">
					<img src="/logo.png" alt="Claake" style={{ height: 40, margin: "0 auto" }} />
					<div>
						<h1
							className="text-4xl"
							style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: "#1e1c18", fontWeight: 400 }}
						>
							Vérifiez votre email
						</h1>
						<p className="mt-3 text-base" style={{ color: "#6b6558" }}>
							Un lien de confirmation a été envoyé à{" "}
							<span className="font-medium" style={{ color: "#1e1c18" }}>{email}</span>.
						</p>
					</div>
					<Link
						to="/login"
						className="inline-block text-sm font-medium tracking-widest uppercase transition-colors"
						style={{ color: "#2a7a44" }}
					>
						Retour à la connexion
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen" style={{ background: "#faf9f5" }}>
			{/* Bande verte latérale */}
			<div
				className="hidden w-2 lg:block"
				style={{ background: "#2a7a44" }}
			/>

			<main className="flex flex-1 flex-col items-center justify-center px-8 py-16">
				<div className="w-full max-w-md space-y-10">
					{/* Logo + titre */}
					<div className="space-y-4">
						<img src="/logo.png" alt="Claake" style={{ height: 40 }} />
						<div>
							<h1
								className="text-4xl"
								style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: "#1e1c18", fontWeight: 400 }}
							>
								Créer un compte
							</h1>
							<p className="mt-2 text-base" style={{ color: "#6b6558" }}>
								Rejoignez Claake et publiez vos agents IA
							</p>
						</div>
					</div>

					<form onSubmit={handleSubmit} className="space-y-5">
						{error && (
							<div
								role="alert"
								className="border p-4 text-sm"
								style={{ borderColor: "#c0392b", color: "#c0392b", background: "rgba(192,57,43,0.06)" }}
							>
								{error}
							</div>
						)}

						<div className="space-y-2">
							<label
								htmlFor="displayName"
								className="block text-xs font-medium tracking-widest uppercase"
								style={{ color: "#6b6558" }}
							>
								Nom d'affichage
							</label>
							<input
								id="displayName"
								type="text"
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								required
								className="w-full border px-4 py-3.5 text-base outline-none transition-colors focus:border-[#2a7a44]"
								style={{ background: "#f3f0e8", borderColor: "#e8e4d8", color: "#1e1c18" }}
								placeholder="Votre nom"
							/>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="email"
								className="block text-xs font-medium tracking-widest uppercase"
								style={{ color: "#6b6558" }}
							>
								Email
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full border px-4 py-3.5 text-base outline-none transition-colors focus:border-[#2a7a44]"
								style={{ background: "#f3f0e8", borderColor: "#e8e4d8", color: "#1e1c18" }}
								placeholder="vous@exemple.com"
							/>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="password"
								className="block text-xs font-medium tracking-widest uppercase"
								style={{ color: "#6b6558" }}
							>
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
									className="w-full border px-4 py-3.5 pr-12 text-base outline-none transition-colors focus:border-[#2a7a44]"
									style={{ background: "#f3f0e8", borderColor: "#e8e4d8", color: "#1e1c18" }}
									placeholder="••••••••"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
									style={{ color: "#766f62" }}
								>
									{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
								</button>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="flex w-full items-center justify-center gap-3 border px-6 py-4 text-sm font-medium tracking-widest uppercase transition-all disabled:opacity-50"
							style={{ borderColor: "#2a7a44", color: "#2a7a44", background: "transparent" }}
							onMouseEnter={(e) => {
								(e.currentTarget as HTMLButtonElement).style.background = "#2a7a44";
								(e.currentTarget as HTMLButtonElement).style.color = "#faf9f5";
							}}
							onMouseLeave={(e) => {
								(e.currentTarget as HTMLButtonElement).style.background = "transparent";
								(e.currentTarget as HTMLButtonElement).style.color = "#2a7a44";
							}}
						>
							{loading && <Loader2 className="h-4 w-4 animate-spin" />}
							Créer mon compte
						</button>
					</form>

					<p className="text-base" style={{ color: "#6b6558" }}>
						Déjà un compte ?{" "}
						<Link
							to="/login"
							className="font-medium transition-colors"
							style={{ color: "#2a7a44" }}
						>
							Se connecter
						</Link>
					</p>
				</div>
			</main>
		</div>
	);
}
