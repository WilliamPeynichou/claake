"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export function Footer() {
	const { t } = useI18n();

	return (
		<footer className="border-t border-border/40 py-12">
			<div className="container mx-auto px-4">
				<div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
					{/* Brand */}
					<div className="space-y-3">
						<p className="font-semibold text-foreground">Claake</p>
						<p className="text-sm text-muted-foreground leading-relaxed">
							{t("footer.description")}
						</p>
					</div>

					{/* Product */}
					<div className="space-y-3">
						<p className="label-caps text-muted-foreground">{t("footer.product")}</p>
						<ul className="space-y-2">
							<li>
								<Link
									href="/catalogue"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{t("footer.catalogue")}
								</Link>
							</li>
							<li>
								<Link
									href="/dashboard/publish"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{t("footer.publish")}
								</Link>
							</li>
						</ul>
					</div>

					{/* Legal */}
					<div className="space-y-3">
						<p className="label-caps text-muted-foreground">{t("footer.legal")}</p>
						<ul className="space-y-2">
							<li>
								<Link
									href="/legal/mentions-legales"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{t("footer.mentions")}
								</Link>
							</li>
							<li>
								<Link
									href="/legal/cgu"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{t("footer.cgu")}
								</Link>
							</li>
							<li>
								<Link
									href="/legal/cgv"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{t("footer.cgv")}
								</Link>
							</li>
							<li>
								<Link
									href="/legal/confidentialite"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{t("footer.privacy")}
								</Link>
							</li>
							<li>
								<Link
									href="/legal/cookies"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{t("footer.cookies")}
								</Link>
							</li>
							<li>
								<Link
									href="/legal/conditions-developpeur"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{t("footer.developers")}
								</Link>
							</li>
						</ul>
					</div>

					{/* Contact */}
					<div className="space-y-3">
						<p className="label-caps text-muted-foreground">{t("footer.contact")}</p>
						<ul className="space-y-2">
							<li>
								<a
									href="mailto:claake@contact.com"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									Email
								</a>
							</li>
							<li>
								<a
									href="https://twitter.com/claake"
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									Twitter / X
								</a>
							</li>
							<li>
								<a
									href="https://github.com/claake"
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									GitHub
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-10 pt-6 border-t border-border/40 text-center">
					<p className="label-caps text-muted-foreground">
						&copy; {new Date().getFullYear()} Claake. {t("footer.rights")}
					</p>
				</div>
			</div>
		</footer>
	);
}
