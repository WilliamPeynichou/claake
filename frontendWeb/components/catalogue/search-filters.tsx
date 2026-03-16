"use client";

import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface SearchFiltersProps {
	pricingModel: string;
	onPricingModelChange: (value: string) => void;
	mode: string;
	onModeChange: (value: string) => void;
	sortBy: string;
	onSortByChange: (value: string) => void;
}

export function SearchFilters({
	pricingModel,
	onPricingModelChange,
	mode,
	onModeChange,
	sortBy,
	onSortByChange,
}: SearchFiltersProps) {
	return (
		<div className="flex flex-wrap items-end gap-4">
			<div className="space-y-1">
				<Label className="text-xs">Prix</Label>
				<Select value={pricingModel} onValueChange={(v) => onPricingModelChange(v ?? "all")}>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder="Tous" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Tous</SelectItem>
						<SelectItem value="free">Gratuit</SelectItem>
						<SelectItem value="one_time">Achat unique</SelectItem>
						<SelectItem value="subscription">Abonnement</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-1">
				<Label className="text-xs">Mode</Label>
				<Select value={mode} onValueChange={(v) => onModeChange(v ?? "all")}>
					<SelectTrigger className="w-[130px]">
						<SelectValue placeholder="Tous" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Tous</SelectItem>
						<SelectItem value="local">Local</SelectItem>
						<SelectItem value="cloud">Cloud</SelectItem>
						<SelectItem value="hybrid">Hybride</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-1">
				<Label className="text-xs">Trier par</Label>
				<Select value={sortBy} onValueChange={(v) => onSortByChange(v ?? "newest")}>
					<SelectTrigger className="w-[150px]">
						<SelectValue placeholder="Plus r&eacute;cents" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="newest">Plus r&eacute;cents</SelectItem>
						<SelectItem value="popularity">Popularit&eacute;</SelectItem>
						<SelectItem value="rating">Meilleure note</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
