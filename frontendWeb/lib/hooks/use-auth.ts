"use client";

import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

interface AuthState {
	user: User | null;
	token: string | null;
	loading: boolean;
	role: string | null;
}

export function useAuth(): AuthState {
	const [state, setState] = useState<AuthState>({
		user: null,
		token: null,
		loading: true,
		role: null,
	});

	useEffect(() => {
		const supabase = createClient();
		let mounted = true;

		async function setStateFromSession(session: Session | null) {
			let role = session?.user?.app_metadata?.role ?? null;
			if (session?.access_token) {
				try {
					const profile = await apiClient.auth.profile(session.access_token);
					role = profile.role;
				} catch {
					// Keep metadata role as a fallback if the profile endpoint is temporarily unavailable.
				}
			}
			if (!mounted) return;
			setState({
				user: session?.user ?? null,
				token: session?.access_token ?? null,
				loading: false,
				role,
			});
		}

		async function load() {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			await setStateFromSession(session);
		}

		load();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			void setStateFromSession(session);
		});

		return () => {
			mounted = false;
			subscription.unsubscribe();
		};
	}, []);

	return state;
}
