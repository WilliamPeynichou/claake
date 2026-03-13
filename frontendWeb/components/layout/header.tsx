"use client";

import type { User } from "@supabase/supabase-js";
import { Bot, LayoutDashboard, LogOut, Menu, Shield, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function Header() {
	const [user, setUser] = useState<User | null>(null);
	const [mobileOpen, setMobileOpen] = useState(false);

	useEffect(() => {
		const supabase = createClient();
		supabase.auth.getUser().then(({ data }) => {
			setUser(data.user);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, []);

	async function handleLogout() {
		const supabase = createClient();
		await supabase.auth.signOut();
		setUser(null);
		window.location.href = "/";
	}

	const isAdmin = user?.user_metadata?.role === "admin";

	return (
		<header className="border-b">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-8">
					<Link href="/" className="flex items-center gap-2 text-xl font-bold">
						<Bot className="h-6 w-6" />
						AgentPlace
					</Link>
					<nav className="hidden items-center gap-6 md:flex">
						<Link href="/catalogue" className="text-sm text-muted-foreground hover:text-foreground">
							Catalogue
						</Link>
					</nav>
				</div>

				{/* Desktop nav */}
				<div className="hidden items-center gap-3 md:flex">
					{user ? (
						<>
							{isAdmin && (
								<Button variant="ghost" size="sm" asChild>
									<Link href="/admin">
										<Shield className="mr-1 h-4 w-4" />
										Admin
									</Link>
								</Button>
							)}
							<Button variant="ghost" size="sm" asChild>
								<Link href="/dashboard">
									<LayoutDashboard className="mr-1 h-4 w-4" />
									Dashboard
								</Link>
							</Button>
							<Button variant="ghost" size="sm" onClick={handleLogout}>
								<LogOut className="mr-1 h-4 w-4" />
								Déconnexion
							</Button>
						</>
					) : (
						<>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/login">Connexion</Link>
							</Button>
							<Button size="sm" asChild>
								<Link href="/register">S&apos;inscrire</Link>
							</Button>
						</>
					)}
				</div>

				{/* Mobile hamburger */}
				<button type="button" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
					{mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
				</button>
			</div>

			{/* Mobile menu */}
			{mobileOpen && (
				<div className="border-t p-4 md:hidden">
					<nav className="flex flex-col gap-3">
						<Link
							href="/catalogue"
							className="text-sm hover:underline"
							onClick={() => setMobileOpen(false)}
						>
							Catalogue
						</Link>
						{user ? (
							<>
								<Link
									href="/dashboard"
									className="text-sm hover:underline"
									onClick={() => setMobileOpen(false)}
								>
									Dashboard
								</Link>
								{isAdmin && (
									<Link
										href="/admin"
										className="text-sm hover:underline"
										onClick={() => setMobileOpen(false)}
									>
										Administration
									</Link>
								)}
								<button
									type="button"
									className="text-left text-sm hover:underline"
									onClick={() => {
										handleLogout();
										setMobileOpen(false);
									}}
								>
									Déconnexion
								</button>
							</>
						) : (
							<>
								<Link
									href="/login"
									className="text-sm hover:underline"
									onClick={() => setMobileOpen(false)}
								>
									Connexion
								</Link>
								<Link
									href="/register"
									className="text-sm hover:underline"
									onClick={() => setMobileOpen(false)}
								>
									S&apos;inscrire
								</Link>
							</>
						)}
					</nav>
				</div>
			)}
		</header>
	);
}
