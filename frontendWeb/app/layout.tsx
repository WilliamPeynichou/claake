import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { I18nProvider } from "@/lib/i18n/context";
import { ThemeProvider } from "@/lib/theme/context";
import "./globals.css";

export const metadata: Metadata = {
	title: "Claake — One click to intelligence",
	description:
		"Discover, test and deploy AI agents built by the community. Intelligence can be yours.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
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
