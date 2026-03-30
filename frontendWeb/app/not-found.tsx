"use client";

import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
			<p className="text-6xl font-bold text-[#2a7a44]">404</p>
			<h1 className="text-2xl font-semibold">Page introuvable</h1>
			<p className="max-w-md text-muted-foreground">
				Cette page n&apos;existe pas ou a été déplacée.
			</p>
			<Link
				href="/"
				className="rounded-md bg-[#2a7a44] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
			>
				Retour à l&apos;accueil
			</Link>
		</div>
	);
}
