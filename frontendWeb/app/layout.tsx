import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import "./globals.css";

export const metadata: Metadata = {
	title: "AgentPlace",
	description: "Marketplace d'agents IA",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="fr">
			<body className="font-sans antialiased">
				<Header />
				<main className="min-h-[calc(100vh-8rem)]">{children}</main>
				<Footer />
			</body>
		</html>
	);
}
