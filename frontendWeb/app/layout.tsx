import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
		<html lang="fr" className={cn("font-sans", inter.variable)}>
			<body className="antialiased">
				<Header />
				<main className="min-h-[calc(100vh-8rem)]">{children}</main>
				<Footer />
			</body>
		</html>
	);
}
