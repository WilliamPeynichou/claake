"use client";

import { useEffect } from "react";

export default function GlobalError({
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
		<html lang="fr">
			<body
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "100vh",
					gap: "1.5rem",
					textAlign: "center",
					padding: "1rem",
					fontFamily: "system-ui, sans-serif",
				}}
			>
				<p style={{ fontSize: "3rem", fontWeight: "bold", color: "#2a7a44" }}>Erreur critique</p>
				<h1 style={{ fontSize: "1.5rem", fontWeight: "600" }}>
					Une erreur inattendue s&apos;est produite
				</h1>
				<button
					type="button"
					onClick={reset}
					style={{
						background: "#2a7a44",
						color: "white",
						border: "none",
						borderRadius: "6px",
						padding: "0.625rem 1.5rem",
						fontSize: "0.875rem",
						fontWeight: "500",
						cursor: "pointer",
					}}
				>
					Réessayer
				</button>
			</body>
		</html>
	);
}
