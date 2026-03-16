export function baseLayout(content: string): string {
	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f8f9fa; }
		.container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
		.card { background: #fff; border-radius: 8px; padding: 32px; }
		.logo { color: #2a7a44; font-size: 24px; font-weight: 700; margin-bottom: 24px; }
		.footer { margin-top: 32px; text-align: center; color: #999; font-size: 12px; }
		h1 { color: #111; font-size: 20px; margin: 0 0 16px; }
		p { color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 12px; }
		.btn { display: inline-block; padding: 10px 24px; background: #2a7a44; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; }
	</style>
</head>
<body>
	<div class="container">
		<div class="card">
			<div class="logo">Claake</div>
			${content}
		</div>
		<div class="footer">
			&copy; ${new Date().getFullYear()} Claake. Tous droits r&eacute;serv&eacute;s.
		</div>
	</div>
</body>
</html>`;
}
