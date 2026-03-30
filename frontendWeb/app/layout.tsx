import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { I18nProvider } from "@/lib/i18n/context";
import { ThemeProvider } from "@/lib/theme/context";
import "./globals.css";

export const metadata: Metadata = {
	title: "Claake — One click to intelligence",
	description:
		"Découvrez, testez et déployez des agents IA créés par la communauté. L'intelligence à portée de clic.",
	openGraph: {
		title: "Claake — One click to intelligence",
		description:
			"Découvrez, testez et déployez des agents IA créés par la communauté. L'intelligence à portée de clic.",
		url: "https://claake.com",
		siteName: "Claake",
		locale: "fr_FR",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Claake — One click to intelligence",
		description:
			"Découvrez, testez et déployez des agents IA créés par la communauté. L'intelligence à portée de clic.",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="fr" suppressHydrationWarning>
			<body className="font-sans antialiased">
				<ThemeProvider>
					<I18nProvider>
						<Header />
						<main className="min-h-[calc(100vh-8rem)]">{children}</main>
						<Footer />
					</I18nProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
