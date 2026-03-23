export const translations = {
	en: {
		// Nav
		"nav.catalogue": "Catalogue",
		"nav.admin": "Admin",
		"nav.dashboard": "Dashboard",
		"nav.logout": "Log out",
		"nav.login": "Log in",
		"nav.register": "Sign up",
		"nav.administration": "Administration",

		// Hero
		"hero.badge": "The open AI agent marketplace",
		"hero.title.line1": "One click",
		"hero.title.line2": "to intelligence.",
		"hero.subtitle":
			"Discover, test and deploy AI agents built by the community. Use your own API key, right in your browser.",
		"hero.cta.explore": "Explore the catalogue",
		"hero.cta.register": "Publish an agent",
		"hero.cta.chat": "Talk to your agents",
		"hero.cta.download": "Download our app",

		// Slogan section
		"slogan.tagline": "Intelligence can be yours",
		"slogan.title": "What is an AI agent?",
		"slogan.description":
			"An agent is simply your everyday AI, expert in the domain of your choice. Whether it's writing, coding, analyzing data, or creating content — there's an agent ready to work for you.",
		"slogan.cta": "Discover how it works",

		// Pillars
		"pillars.format.title": "Open .agentjson format",
		"pillars.format.description":
			"An open, model-agnostic standard for defining and distributing AI agents.",
		"pillars.multi.title": "Multi-model",
		"pillars.multi.description":
			"Compatible with Claude, GPT-4, Gemini, Mistral and more. Bring your own API key.",
		"pillars.security.title": "Security by design",
		"pillars.security.description":
			"Declarative permissions, static analysis and sandbox for every agent.",

		// Sections
		"featured.title": "Popular agents",
		"featured.subtitle": "The most used agents by the community",
		"featured.viewAll": "View all",
		"trending.title": "Trending",
		"trending.subtitle": "Top rated agents this week",
		"categories.title": "Categories",
		"categories.subtitle": "Browse agents by category",

		// Agent card
		"agent.free": "Free",
		"agent.by": "by",
		"agent.anonymous": "Anonymous",

		// Footer
		"footer.rights": "All rights reserved.",
		"footer.description": "One click to intelligence.",
		"footer.product": "Product",
		"footer.legal": "Legal",
		"footer.contact": "Contact",
		"footer.catalogue": "Catalogue",
		"footer.publish": "Publish an agent",
		"footer.mentions": "Legal Notice",
		"footer.cgu": "Terms of Use",
		"footer.cgv": "Terms of Sale",
		"footer.privacy": "Privacy Policy",
		"footer.cookies": "Cookie Policy",
		"footer.developers": "Developer Terms",
	},
	fr: {
		// Nav
		"nav.catalogue": "Catalogue",
		"nav.admin": "Admin",
		"nav.dashboard": "Tableau de bord",
		"nav.logout": "Déconnexion",
		"nav.login": "Connexion",
		"nav.register": "S'inscrire",
		"nav.administration": "Administration",

		// Hero
		"hero.badge": "La marketplace ouverte d'agents IA",
		"hero.title.line1": "One click",
		"hero.title.line2": "to intelligence.",
		"hero.subtitle":
			"Découvrez, testez et déployez des agents IA créés par la communauté. Utilisez votre propre clé API, directement dans votre navigateur.",
		"hero.cta.explore": "Explorer le catalogue",
		"hero.cta.register": "Publier un agent",
		"hero.cta.chat": "Parlez avec vos agents",
		"hero.cta.download": "Télécharger notre app",

		// Slogan section
		"slogan.tagline": "Intelligence can be yours",
		"slogan.title": "Qu'est-ce qu'un agent IA ?",
		"slogan.description":
			"Un agent, c'est simplement votre IA de tous les jours, experte dans le domaine de votre choix. Que ce soit l'écriture, le code, l'analyse de données ou la création de contenu — il y a un agent prêt à travailler pour vous.",
		"slogan.cta": "Découvrir comment ça marche",

		// Pillars
		"pillars.format.title": "Format ouvert .agentjson",
		"pillars.format.description":
			"Un standard ouvert et agnostique pour définir et distribuer des agents IA.",
		"pillars.multi.title": "Multi-modèle",
		"pillars.multi.description":
			"Compatible Claude, GPT-4, Gemini, Mistral et plus encore. Utilisez votre propre clé API.",
		"pillars.security.title": "Sécurité par design",
		"pillars.security.description":
			"Permissions déclaratives, analyse statique et sandbox pour chaque agent.",

		// Sections
		"featured.title": "Agents populaires",
		"featured.subtitle": "Les agents les plus utilisés par la communauté",
		"featured.viewAll": "Voir tout",
		"trending.title": "Tendances",
		"trending.subtitle": "Les agents les mieux notés cette semaine",
		"categories.title": "Catégories",
		"categories.subtitle": "Parcourez les agents par catégorie",

		// Agent card
		"agent.free": "Gratuit",
		"agent.by": "par",
		"agent.anonymous": "Anonyme",

		// Footer
		"footer.rights": "Tous droits réservés.",
		"footer.description": "One click to intelligence.",
		"footer.product": "Produit",
		"footer.legal": "Légal",
		"footer.contact": "Contact",
		"footer.catalogue": "Catalogue",
		"footer.publish": "Publier un agent",
		"footer.mentions": "Mentions légales",
		"footer.cgu": "CGU",
		"footer.cgv": "CGV",
		"footer.privacy": "Confidentialité",
		"footer.cookies": "Politique cookies",
		"footer.developers": "Conditions développeur",
	},
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof (typeof translations)["en"];
