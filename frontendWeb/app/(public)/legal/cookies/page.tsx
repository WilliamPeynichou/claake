export default function CookiesPage() {
	return (
		<article className="prose prose-neutral dark:prose-invert max-w-none">
			<p className="text-sm text-muted-foreground">Dernière mise à jour : mars 2026</p>

			<h1>Politique cookies</h1>

			<h2>1. Qu'est-ce qu'un cookie ?</h2>
			<p>
				Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone,
				tablette) lors de la visite d'un site web. Il permet au site de mémoriser des informations
				sur votre visite, comme votre langue préférée et d'autres paramètres, afin de vous offrir
				une meilleure expérience.
			</p>
			<p>
				Les cookies peuvent être déposés par le site visité (cookies « propriétaires ») ou par des
				tiers (cookies « tiers »).
			</p>

			<h2>2. Cookies utilisés par Claake</h2>

			<h3>2.1 Cookies strictement nécessaires</h3>
			<p>
				Ces cookies sont indispensables au fonctionnement de la Plateforme. Ils ne peuvent pas être
				désactivés. Aucun consentement n'est requis.
			</p>
			<table>
				<thead>
					<tr>
						<th>Nom</th>
						<th>Émetteur</th>
						<th>Finalité</th>
						<th>Durée</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>
							<code>sb-access-token</code>
						</td>
						<td>Supabase</td>
						<td>Session d'authentification</td>
						<td>1 heure</td>
					</tr>
					<tr>
						<td>
							<code>sb-refresh-token</code>
						</td>
						<td>Supabase</td>
						<td>Renouvellement de session</td>
						<td>60 jours</td>
					</tr>
					<tr>
						<td>
							<code>__Secure-next-auth.session-token</code>
						</td>
						<td>Claake</td>
						<td>Authentification Next.js</td>
						<td>Session</td>
					</tr>
				</tbody>
			</table>

			<h3>2.2 Cookies de préférences</h3>
			<p>
				Ces cookies permettent de mémoriser vos préférences d'affichage (thème clair/sombre, langue
				interface). Ils sont déposés sans consentement explicite car strictement nécessaires à
				l'expérience utilisateur.
			</p>
			<table>
				<thead>
					<tr>
						<th>Nom</th>
						<th>Émetteur</th>
						<th>Finalité</th>
						<th>Durée</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>
							<code>claake-theme</code>
						</td>
						<td>Claake</td>
						<td>Préférence thème clair/sombre</td>
						<td>1 an</td>
					</tr>
					<tr>
						<td>
							<code>claake-locale</code>
						</td>
						<td>Claake</td>
						<td>Préférence de langue</td>
						<td>1 an</td>
					</tr>
				</tbody>
			</table>

			<h3>2.3 Cookies analytiques</h3>
			<p>
				Ces cookies permettent de mesurer l'audience de la Plateforme et d'améliorer nos services.
				Ils nécessitent votre consentement.
			</p>
			<table>
				<thead>
					<tr>
						<th>Nom</th>
						<th>Émetteur</th>
						<th>Finalité</th>
						<th>Durée</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>
							<code>[ANALYTICS_COOKIE_NAME]</code>
						</td>
						<td>[ANALYTICS_PROVIDER]</td>
						<td>Mesure d'audience, statistiques d'utilisation</td>
						<td>13 mois</td>
					</tr>
				</tbody>
			</table>

			<h3>2.4 Clés API dans le stockage local (localStorage)</h3>
			<p>
				La Plateforme utilise le stockage local (localStorage) du navigateur pour stocker vos clés
				API de manière sécurisée sur votre appareil. Ces données ne sont pas des cookies et ne sont
				pas transmises à nos serveurs. Elles restent sur votre terminal.
			</p>
			<ul>
				<li>
					<code>claake-api-keys</code> : clés API chiffrées pour les modèles IA (Anthropic, OpenAI,
					etc.)
				</li>
			</ul>

			<h2>3. Gestion des cookies</h2>

			<h3>3.1 Via la bannière de consentement</h3>
			<p>
				Lors de votre première visite, une bannière vous permet d'accepter ou de refuser les cookies
				non essentiels. Vous pouvez modifier vos préférences à tout moment en cliquant sur « Gérer
				les cookies » en bas de page.
			</p>

			<h3>3.2 Via les paramètres de votre navigateur</h3>
			<p>
				Vous pouvez également contrôler les cookies via les paramètres de votre navigateur.
				Attention : la désactivation de certains cookies peut altérer le fonctionnement de la
				Plateforme.
			</p>
			<ul>
				<li>
					<strong>Chrome :</strong> Paramètres &gt; Confidentialité et sécurité &gt; Cookies
				</li>
				<li>
					<strong>Firefox :</strong> Paramètres &gt; Vie privée et sécurité &gt; Cookies
				</li>
				<li>
					<strong>Safari :</strong> Préférences &gt; Confidentialité &gt; Cookies
				</li>
				<li>
					<strong>Edge :</strong> Paramètres &gt; Cookies et autorisations de site
				</li>
			</ul>

			<h2>4. Consentement</h2>
			<p>
				Conformément aux recommandations de la CNIL et au règlement ePrivacy, votre consentement est
				recueilli avant le dépôt de tout cookie non essentiel. Ce consentement est :
			</p>
			<ul>
				<li>Libre (refus aussi simple qu'acceptation) ;</li>
				<li>Éclairé (information claire sur chaque finalité) ;</li>
				<li>Spécifique (par catégorie de cookie) ;</li>
				<li>Révocable à tout moment.</li>
			</ul>

			<h2>5. Contact</h2>
			<p>
				Pour toute question relative à notre utilisation des cookies, contactez notre DPO à :{" "}
				<a href="mailto:williampeynichou@claake.com">williampeynichou@claake.com</a>
			</p>
		</article>
	);
}
