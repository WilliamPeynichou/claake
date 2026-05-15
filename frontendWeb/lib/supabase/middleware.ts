import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				for (const { name, value } of cookiesToSet) {
					request.cookies.set(name, value);
				}
				supabaseResponse = NextResponse.next({
					request,
				});
				for (const { name, value, options } of cookiesToSet) {
					supabaseResponse.cookies.set(name, value, options);
				}
			},
		},
	});

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const pathname = request.nextUrl.pathname;

	// Routes requiring authentication
	const protectedRoutes = ["/dashboard", "/chat", "/checkout"];
	const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

	if (isProtected && !user) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		url.searchParams.set("redirect", pathname);
		return NextResponse.redirect(url);
	}

	// Protect admin routes at the edge only by requiring authentication.
	// Fine-grained roles/permissions are enforced by the backend API, using the DB role.
	if (pathname.startsWith("/admin")) {
		if (!user) {
			const url = request.nextUrl.clone();
			url.pathname = "/login";
			return NextResponse.redirect(url);
		}
	}

	// Redirect logged-in users away from auth pages
	if ((pathname === "/login" || pathname === "/register") && user) {
		const url = request.nextUrl.clone();
		url.pathname = "/dashboard";
		return NextResponse.redirect(url);
	}

	return supabaseResponse;
}
