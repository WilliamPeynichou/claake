"use client";

import type { Agent, AgentCategory } from "@claake/shared";
import { getFeaturedAgents, getTrendingAgents } from "@claake/shared";
import { ArrowRight, Bot, Download, MessageSquare, Puzzle, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AgentCard } from "@/components/agents/agent-card";
import { CategoryCard } from "@/components/agents/category-card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";

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
	const pageRef = useRevealOnScroll();
	const [agents, setAgents] = useState<Agent[]>([]);
	const [categories, setCategories] = useState<AgentCategory[]>([]);
	const [loadingAgents, setLoadingAgents] = useState(true);

	useEffect(() => {
		setLoadingAgents(true);
		apiClient.agents
			.list({ limit: 50 })
			.then((res) => setAgents(res.agents))
			.catch(() => {})
			.finally(() => setLoadingAgents(false));
		apiClient.categories
			.list()
			.then(setCategories)
			.catch(() => {});
	}, []);

	const featured = getFeaturedAgents(agents);
	const trending = getTrendingAgents(agents);

	return (
		<div ref={pageRef}>
			{/* Hero */}
			<section className="grain-overlay relative overflow-hidden border-b border-border/40">
				<div className="container mx-auto flex flex-col items-center px-4 py-14 lg:py-20 text-center">
					<span className="label-caps text-brand">{t("hero.badge")}</span>
					<h1
						className="mt-4 font-display text-5xl tracking-tight sm:text-6xl lg:text-7xl"
						style={{ lineHeight: 1.1 }}
					>
						<span className="block">{t("hero.title.line1")}</span>
						<span className="block">
							<em className="text-brand">{t("hero.title.line2")}</em>
						</span>
					</h1>
					<p className="mt-5 max-w-xl text-lg text-muted-foreground" style={{ lineHeight: 1.7 }}>
						{t("hero.subtitle")}
					</p>
					<div className="mt-8 flex flex-col items-center gap-4">
						{/* CTA principal */}
						<Button
							size="lg"
							asChild
							className="border border-brand bg-brand px-8 py-6 text-base text-primary-foreground hover:bg-brand-dark"
						>
							<Link href="/chat">
								<MessageSquare className="mr-2 h-5 w-5" />
								{t("hero.cta.chat")}
							</Link>
						</Button>

						{/* CTAs secondaires */}
						<div className="flex items-center gap-5">
							<Button
								size="lg"
								variant="outline"
								asChild
								className="border-border hover:border-brand hover:text-brand"
							>
								<Link href="/catalogue">
									{t("hero.cta.explore")}
									<ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
							<Link
								href="/download"
								className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand"
							>
								<Download className="h-4 w-4" />
								{t("hero.cta.download")}
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Popular Agents Carousel */}
			<section className="border-b border-border/40 overflow-hidden">
				<div className="container mx-auto px-4 py-10">
					<div className="text-center reveal">
						<span className="label-caps text-muted-foreground">{t("featured.subtitle")}</span>
						<h2 className="mt-2 font-display text-2xl sm:text-3xl">{t("featured.title")}</h2>
					</div>
					<div className="mt-6 flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
						{loadingAgents && featured.length === 0 ? (
							Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="min-w-[280px] h-48 animate-pulse rounded bg-muted flex-shrink-0" />
							))
						) : (
							featured.map((agent, i) => (
								<div
									key={agent.id}
									className={`min-w-[280px] max-w-[320px] flex-shrink-0 snap-start reveal reveal-delay-${(i % 4) + 1}`}
								>
									<AgentCard agent={agent} />
								</div>
							))
						)}
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
							<span className="label-caps text-brand-light reveal">{t("slogan.tagline")}</span>
							<h2
								className="mt-6 font-display text-3xl sm:text-4xl lg:text-5xl reveal reveal-delay-1"
								style={{ lineHeight: 1.1 }}
							>
								{t("slogan.title")}
							</h2>
						</div>
						<div className="flex flex-col justify-center lg:col-span-7">
							<p
								className="max-w-prose text-lg reveal reveal-delay-2"
								style={{ lineHeight: 1.7, color: "hsl(var(--muted-foreground))" }}
							>
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
						{
							icon: Puzzle,
							titleKey: "pillars.format.title" as const,
							descKey: "pillars.format.description" as const,
						},
						{
							icon: Bot,
							titleKey: "pillars.multi.title" as const,
							descKey: "pillars.multi.description" as const,
						},
						{
							icon: Shield,
							titleKey: "pillars.security.title" as const,
							descKey: "pillars.security.description" as const,
						},
					].map(({ icon: Icon, titleKey, descKey }, i) => (
						<div key={titleKey} className={`reveal reveal-delay-${i + 1}`}>
							<div className="flex h-12 w-12 items-center justify-center border border-brand/20 bg-brand-subtle">
								<Icon className="h-5 w-5 text-brand" />
							</div>
							<h3 className="mt-4 font-display text-lg">{t(titleKey)}</h3>
							<p
								className="mt-2 max-w-prose text-sm text-muted-foreground"
								style={{ lineHeight: 1.7 }}
							>
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
						<span className="label-caps text-muted-foreground">{t("trending.subtitle")}</span>
						<h2 className="mt-2 font-display text-2xl sm:text-3xl">{t("trending.title")}</h2>
					</div>
					<div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{loadingAgents && trending.length === 0 ? (
							Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className="h-48 animate-pulse rounded bg-muted" />
							))
						) : (
							trending.map((agent, i) => (
								<div key={agent.id} className={`reveal reveal-delay-${(i % 4) + 1}`}>
									<AgentCard agent={agent} />
								</div>
							))
						)}
					</div>
				</div>
			</section>

			{/* Categories */}
			<section>
				<div className="container mx-auto px-4 py-12">
					<div className="reveal">
						<span className="label-caps text-muted-foreground">{t("categories.subtitle")}</span>
						<h2 className="mt-2 font-display text-2xl sm:text-3xl">{t("categories.title")}</h2>
					</div>
					<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{categories.map((cat, i) => (
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
