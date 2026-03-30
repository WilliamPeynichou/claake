"use client";

import { useEffect } from "react";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
			<p className="text-6xl font-bold text-[#2a7a44]">Oups</p>
			<h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
			<p className="max-w-md text-muted-foreground">
				Quelque chose s&apos;est mal passé. Veuillez réessayer.
			</p>
			<button
				type="button"
				onClick={reset}
				className="rounded-md bg-[#2a7a44] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
			>
				Réessayer
			</button>
		</div>
	);
}
