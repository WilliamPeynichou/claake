export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
			<div className="w-full max-w-md space-y-6 px-4">{children}</div>
		</div>
	);
}
