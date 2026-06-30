"use client";

import type { AgentCategory } from "@claake/shared";
import {
	BarChart3,
	Code,
	GraduationCap,
	Megaphone,
	Palette,
	PenTool,
	Sparkles,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	Zap,
	Code,
	PenTool,
	BarChart3,
	Palette,
	Megaphone,
	GraduationCap,
	Sparkles,
};

interface CategoryCardProps {
	category: AgentCategory;
}

export function CategoryCard({ category }: CategoryCardProps) {
	const Icon = iconMap[category.icon] ?? Sparkles;

	return (
		<Link href={`/catalogue?category=${category.slug}`}>
			<Card className="border-border/60 transition-all hover:border-brand/40">
				<CardContent className="flex items-center gap-4 p-4">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center border border-brand/20 bg-brand-subtle">
						<Icon className="h-5 w-5 text-brand" />
					</div>
					<div>
						<h3 className="font-sans text-sm font-medium">{category.name}</h3>
						<p className="text-xs text-muted-foreground">{category.description}</p>
						<p className="mt-1 text-xs font-medium text-brand">
							{category.agent_count} agent{category.agent_count > 1 ? "s" : ""}
						</p>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
