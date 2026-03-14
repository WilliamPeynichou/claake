"use client";

import { ArrowRight, Bot, Puzzle, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { AgentCard } from "@/components/agents/agent-card";
import { CategoryCard } from "@/components/agents/category-card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { AGENT_CATEGORIES, getFeaturedAgents, getTrendingAgents } from "@/lib/mock-data";

function useRevealOnScroll() {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const targets = el.querySelectorAll(".reveal");
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add("visible");
						observer.unobserve(entry.target);
					}
				}
			},
			{ threshold: 0.15 },
		);
		for (const target of targets) observer.observe(target);
		return () => observer.disconnect();
	}, []);

	return ref;
}

export default function HomePage() {
	const { t } = useI18n();
	const featured = getFeaturedAgents();
	const trending = getTrendingAgents();
	const pageRef = useRevealOnScroll();

	return (
		<div ref={pageRef}>
			{/* Hero */}
			<section className="grain-overlay relative overflow-hidden border-b border-border/40">
				<div className="container mx-auto flex flex-col items-center px-4 py-14 lg:py-20 text-center">
					<span className="label-caps text-brand">
						{t("hero.badge")}
					</span>
					<h1 className="mt-4 font-display text-5xl tracking-tight sm:text-6xl lg:text-7xl" style={{ lineHeight: 1.1 }}>
						<span className="block">{t("hero.title.line1")}</span>
						<span className="block">
							<em className="text-brand">{t("hero.title.line2")}</em>
						</span>
					</h1>
					<p className="mt-5 max-w-xl text-lg text-muted-foreground" style={{ lineHeight: 1.7 }}>
						{t("hero.subtitle")}
					</p>
					<div className="mt-6 flex gap-4">
						<Button size="lg" asChild className="border border-brand bg-brand text-primary-foreground hover:bg-brand-dark">
							<Link href="/catalogue">
								{t("hero.cta.explore")}
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button size="lg" variant="outline" asChild className="border-border hover:border-brand hover:text-brand">
							<Link href="/dashboard/agents/new">{t("hero.cta.register")}</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Popular Agents Carousel */}
			<section className="border-b border-border/40 overflow-hidden">
				<div className="container mx-auto px-4 py-10">
					<div className="text-center reveal">
						<span className="label-caps text-muted-foreground">
							{t("featured.subtitle")}
						</span>
						<h2 className="mt-2 font-display text-2xl sm:text-3xl">
							{t("featured.title")}
						</h2>
					</div>
					<div className="mt-6 flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
						{featured.map((agent, i) => (
							<div key={agent.id} className={`min-w-[280px] max-w-[320px] flex-shrink-0 snap-start reveal reveal-delay-${(i % 4) + 1}`}>
								<AgentCard agent={agent} />
							</div>
						))}
					</div>
					<div className="mt-4 flex justify-center">
						<Link
							href="/catalogue"
							className="label-caps inline-flex items-center gap-2 text-brand transition-colors hover:text-brand-dark"
						>
							{t("featured.viewAll")} <ArrowRight className="h-4 w-4" />
						</Link>
					</div>
				</div>
			</section>

			{/* Slogan / What is an AI agent — signature section */}
			<section className="bg-foreground text-background">
				<div className="container mx-auto px-4 py-12 lg:py-16">
					<div className="grid gap-8 lg:grid-cols-12">
						<div className="lg:col-span-5">
							<span className="label-caps text-brand-light reveal">
								{t("slogan.tagline")}
							</span>
							<h2 className="mt-6 font-display text-3xl sm:text-4xl lg:text-5xl reveal reveal-delay-1" style={{ lineHeight: 1.1 }}>
								{t("slogan.title")}
							</h2>
						</div>
						<div className="flex flex-col justify-center lg:col-span-7">
							<p className="max-w-prose text-lg reveal reveal-delay-2" style={{ lineHeight: 1.7, color: "hsl(var(--muted-foreground))" }}>
								{t("slogan.description")}
							</p>
							<div className="mt-8 reveal reveal-delay-3">
								<Link
									href="/catalogue"
									className="label-caps inline-flex items-center gap-2 text-brand-light transition-colors hover:text-brand"
								>
									{t("slogan.cta")}
									<ArrowRight className="h-4 w-4" />
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Pillars */}
			<section className="border-b border-border/40">
				<div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-3">
					{[
						{ icon: Puzzle, titleKey: "pillars.format.title" as const, descKey: "pillars.format.description" as const },
						{ icon: Bot, titleKey: "pillars.multi.title" as const, descKey: "pillars.multi.description" as const },
						{ icon: Shield, titleKey: "pillars.security.title" as const, descKey: "pillars.security.description" as const },
					].map(({ icon: Icon, titleKey, descKey }, i) => (
						<div key={titleKey} className={`reveal reveal-delay-${i + 1}`}>
							<div className="flex h-12 w-12 items-center justify-center border border-brand/20 bg-brand-subtle">
								<Icon className="h-5 w-5 text-brand" />
							</div>
							<h3 className="mt-4 font-display text-lg">{t(titleKey)}</h3>
							<p className="mt-2 max-w-prose text-sm text-muted-foreground" style={{ lineHeight: 1.7 }}>
								{t(descKey)}
							</p>
						</div>
					))}
				</div>
			</section>

	
			{/* Trending */}
			<section className="border-b border-border/40 bg-card">
				<div className="container mx-auto px-4 py-12">
					<div className="reveal">
						<span className="label-caps text-muted-foreground">
							{t("trending.subtitle")}
						</span>
						<h2 className="mt-2 font-display text-2xl sm:text-3xl">
							{t("trending.title")}
						</h2>
					</div>
					<div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{trending.map((agent, i) => (
							<div key={agent.id} className={`reveal reveal-delay-${(i % 4) + 1}`}>
								<AgentCard agent={agent} />
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Categories */}
			<section>
				<div className="container mx-auto px-4 py-12">
					<div className="reveal">
						<span className="label-caps text-muted-foreground">
							{t("categories.subtitle")}
						</span>
						<h2 className="mt-2 font-display text-2xl sm:text-3xl">
							{t("categories.title")}
						</h2>
					</div>
					<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{AGENT_CATEGORIES.map((cat, i) => (
							<div key={cat.id} className={`reveal reveal-delay-${(i % 4) + 1}`}>
								<CategoryCard category={cat} />
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
