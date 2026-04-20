export default function ChatLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="fixed inset-0 flex" style={{ zIndex: 100, background: "#faf9f5" }}>
			{children}
		</div>
	);
}
