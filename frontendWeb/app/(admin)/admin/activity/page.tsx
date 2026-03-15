"use client";

import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminActivityPage() {
	return (
		<div>
			<h1 className="text-3xl font-bold">Activité</h1>
			<p className="mt-2 text-muted-foreground">Journal d&apos;activité de la plateforme.</p>

			<Card className="mt-8">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Activity className="h-5 w-5" />
						Journal d&apos;activité
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<Activity className="h-12 w-12 text-muted-foreground/30" />
						<h3 className="mt-4 text-lg font-semibold">Bientôt disponible</h3>
						<p className="mt-2 max-w-sm text-sm text-muted-foreground">
							Le journal d&apos;activité (connexions, créations d&apos;agents, achats, modérations)
							sera disponible dans une prochaine version.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
