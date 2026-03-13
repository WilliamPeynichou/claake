"use client";

import type { User } from "@supabase/supabase-js";
import { Globe, LayoutDashboard, LogOut, Menu, Moon, Shield, Sun, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme/context";

export function Header() {
	const [user, setUser] = useState<User | null>(null);
	const [mobileOpen, setMobileOpen] = useState(false);
	const { t, locale, setLocale } = useI18n();
	const { theme, toggleTheme } = useTheme();

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
		<header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-8">
					<Link href="/" className="flex items-center gap-2">
						<Image
							src="/logo.png"
							alt="Claake"
							width={110}
							height={32}
							priority
							className="dark:brightness-0 dark:invert"
						/>
					</Link>
					<nav className="hidden items-center gap-6 md:flex">
						<Link
							href="/catalogue"
							className="label-caps text-muted-foreground transition-colors hover:text-foreground"
						>
							{t("nav.catalogue")}
						</Link>
					</nav>
				</div>

				{/* Desktop nav */}
				<div className="hidden items-center gap-2 md:flex">
					{/* Language toggle */}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setLocale(locale === "en" ? "fr" : "en")}
						title={locale === "en" ? "Passer en français" : "Switch to English"}
					>
						<Globe className="h-4 w-4" />
						<span className="ml-1 text-xs font-medium uppercase">{locale}</span>
					</Button>

					{/* Dark mode toggle */}
					<Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
						{theme === "light" ? (
							<Moon className="h-4 w-4" />
						) : (
							<Sun className="h-4 w-4" />
						)}
					</Button>

					{user ? (
						<>
							{isAdmin && (
								<Button variant="ghost" size="sm" asChild>
									<Link href="/admin">
										<Shield className="mr-1 h-4 w-4" />
										{t("nav.admin")}
									</Link>
								</Button>
							)}
							<Button variant="ghost" size="sm" asChild>
								<Link href="/dashboard">
									<LayoutDashboard className="mr-1 h-4 w-4" />
									{t("nav.dashboard")}
								</Link>
							</Button>
							<Button variant="ghost" size="sm" onClick={handleLogout}>
								<LogOut className="mr-1 h-4 w-4" />
								{t("nav.logout")}
							</Button>
						</>
					) : (
						<>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/login">{t("nav.login")}</Link>
							</Button>
							<Button size="sm" asChild>
								<Link href="/register">{t("nav.register")}</Link>
							</Button>
						</>
					)}
				</div>

				{/* Mobile hamburger */}
				<div className="flex items-center gap-2 md:hidden">
					<Button variant="ghost" size="icon" onClick={toggleTheme}>
						{theme === "light" ? (
							<Moon className="h-4 w-4" />
						) : (
							<Sun className="h-4 w-4" />
						)}
					</Button>
					<button type="button" onClick={() => setMobileOpen(!mobileOpen)}>
						{mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
					</button>
				</div>
			</div>

			{/* Mobile menu */}
			{mobileOpen && (
				<div className="border-t p-4 md:hidden">
					<nav className="flex flex-col gap-3">
						<Link
							href="/catalogue"
							className="label-caps hover:text-brand"
							onClick={() => setMobileOpen(false)}
						>
							{t("nav.catalogue")}
						</Link>
						<button
							type="button"
							className="label-caps text-left"
							onClick={() => {
								setLocale(locale === "en" ? "fr" : "en");
								setMobileOpen(false);
							}}
						>
							{locale === "en" ? "Français" : "English"}
						</button>
						{user ? (
							<>
								<Link
									href="/dashboard"
									className="label-caps hover:text-brand"
									onClick={() => setMobileOpen(false)}
								>
									{t("nav.dashboard")}
								</Link>
								{isAdmin && (
									<Link
										href="/admin"
										className="label-caps hover:text-brand"
										onClick={() => setMobileOpen(false)}
									>
										{t("nav.administration")}
									</Link>
								)}
								<button
									type="button"
									className="label-caps text-left hover:text-brand"
									onClick={() => {
										handleLogout();
										setMobileOpen(false);
									}}
								>
									{t("nav.logout")}
								</button>
							</>
						) : (
							<>
								<Link
									href="/login"
									className="label-caps hover:text-brand"
									onClick={() => setMobileOpen(false)}
								>
									{t("nav.login")}
								</Link>
								<Link
									href="/register"
									className="label-caps hover:text-brand"
									onClick={() => setMobileOpen(false)}
								>
									{t("nav.register")}
								</Link>
							</>
						)}
					</nav>
				</div>
			)}
		</header>
	);
}
