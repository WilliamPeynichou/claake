"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
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

		async function load() {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			setState({
				user: session?.user ?? null,
				token: session?.access_token ?? null,
				loading: false,
				role: session?.user?.user_metadata?.role ?? null,
			});
		}

		load();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setState({
				user: session?.user ?? null,
				token: session?.access_token ?? null,
				loading: false,
				role: session?.user?.user_metadata?.role ?? null,
			});
		});

		return () => subscription.unsubscribe();
	}, []);

	return state;
}
