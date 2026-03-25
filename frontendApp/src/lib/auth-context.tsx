import type { UserProfile } from "@claake/shared";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { apiClient } from "./api";
import { supabase } from "./supabase";

interface AuthContextType {
	user: User | null;
	session: Session | null;
	profile: UserProfile | null;
	token: string;
	loading: boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, password: string, displayName: string) => Promise<void>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);

	const token = session?.access_token ?? "";

	const loadProfile = useCallback(async (accessToken: string) => {
		try {
			const p = await apiClient.auth.profile(accessToken);
			setProfile(p);
		} catch {
			setProfile(null);
		}
	}, []);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session: s } }) => {
			setSession(s);
			setUser(s?.user ?? null);
			if (s?.access_token) loadProfile(s.access_token);
			setLoading(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, s) => {
			setSession(s);
			setUser(s?.user ?? null);
			if (s?.access_token) loadProfile(s.access_token);
			else setProfile(null);
		});

		return () => subscription.unsubscribe();
	}, [loadProfile]);

	const signIn = async (email: string, password: string) => {
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) throw error;
	};

	const signUp = async (email: string, password: string, displayName: string) => {
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: { data: { display_name: displayName } },
		});
		if (error) throw error;
	};

	const signOut = async () => {
		await supabase.auth.signOut();
		setProfile(null);
	};

	return (
		<AuthContext.Provider
			value={{ user, session, profile, token, loading, signIn, signUp, signOut }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
