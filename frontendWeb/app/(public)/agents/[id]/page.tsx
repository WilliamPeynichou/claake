export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold">Agent {id}</h1>
			<p className="mt-4 text-muted-foreground">D&eacute;tail de l&apos;agent.</p>
		</div>
	);
}
