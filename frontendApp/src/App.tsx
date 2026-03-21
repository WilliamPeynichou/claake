import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ChatPage } from "@/pages/chat";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	if (!user) return <Navigate to="/login" replace />;
	return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();

	if (loading) return null;
	if (user) return <Navigate to="/" replace />;
	return <>{children}</>;
}

export default function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<Routes>
					<Route
						path="/login"
						element={
							<GuestRoute>
								<LoginPage />
							</GuestRoute>
						}
					/>
					<Route
						path="/register"
						element={
							<GuestRoute>
								<RegisterPage />
							</GuestRoute>
						}
					/>
					<Route
						path="/"
						element={
							<ProtectedRoute>
								<ChatPage />
							</ProtectedRoute>
						}
					/>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</AuthProvider>
		</BrowserRouter>
	);
}
