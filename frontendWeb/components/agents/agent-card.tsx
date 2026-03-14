"use client";

import type { Agent } from "@agentplace/shared";
import { Bot, Download, Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";

interface AgentCardProps {
	agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
	const { t } = useI18n();

	return (
		<Link href={`/agents/${agent.id}`}>
			<Card className="h-full border-border/60 transition-all hover:border-brand/40">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="flex h-12 w-12 items-center justify-center border border-brand/20 bg-brand-subtle">
							<Bot className="h-6 w-6 text-brand" />
						</div>
						<Badge variant="secondary" className="text-xs">
							{agent.pricing_model === "free" ? t("agent.free") : `${agent.price}€`}
						</Badge>
					</div>
					<div className="mt-3">
						<h3 className="font-sans text-sm font-medium leading-tight">{agent.name}</h3>
						<p className="mt-1 text-xs text-muted-foreground">
							{t("agent.by")} {agent.creator_name ?? t("agent.anonymous")}
						</p>
					</div>
				</CardHeader>
				<CardContent className="pb-3">
					<p className="line-clamp-2 text-sm text-muted-foreground">{agent.description}</p>
					<div className="mt-3 flex flex-wrap gap-1">
						{agent.tags.slice(0, 3).map((tag) => (
							<Badge key={tag} variant="outline" className="text-xs">
								{tag}
							</Badge>
						))}
					</div>
				</CardContent>
				<CardFooter className="text-xs text-muted-foreground">
					<div className="flex w-full items-center justify-between">
						<div className="flex items-center gap-1">
							<Star className="h-3.5 w-3.5 fill-current text-yellow-500" />
							<span>{agent.rating.toFixed(1)}</span>
							<span className="text-muted-foreground/60">({agent.review_count})</span>
						</div>
						<div className="flex items-center gap-1">
							<Download className="h-3.5 w-3.5" />
							<span>{agent.download_count}</span>
						</div>
					</div>
				</CardFooter>
			</Card>
		</Link>
	);
}
