"use client";

import { useI18n } from "@/lib/i18n/context";

export function Footer() {
	const { t } = useI18n();

	return (
		<footer className="border-t border-border/40 py-8">
			<div className="container mx-auto px-4 text-center">
				<p className="label-caps text-muted-foreground">
					&copy; {new Date().getFullYear()} Claake. {t("footer.rights")}
				</p>
			</div>
		</footer>
	);
}
