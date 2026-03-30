export default function ChatLayout({ children }: { children: React.ReactNode }) {
	return <div className="-mx-6 -my-6 flex h-[calc(100vh-4rem)] overflow-hidden">{children}</div>;
}
