import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // Write cookies to the request so server components see them
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    // Rebuild the response so the refreshed token reaches the browser
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: do not add any logic between createServerClient and getUser().
    // A subtle mistake here causes sessions to appear broken at random.
    const { data: { user } } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    const isAuthRoute =
        pathname === "/login" || pathname.startsWith("/auth/");

    // API routes are protected by RLS — no redirect needed, just let them through
    // so the session cookie is refreshed on the way past.
    const isApiRoute = pathname.startsWith("/api/");

    if (!user && !isAuthRoute && !isApiRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    if (user && pathname === "/login") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Run on all paths except:
         * - Next.js internals (_next/static, _next/image)
         * - PWA assets (sw.js, workbox-*.js, manifest.webmanifest)
         * - Static files in /public (icons/, *.png, *.svg, *.ico)
         */
        "/((?!_next/static|_next/image|favicon\\.ico|icons/|manifest\\.webmanifest|sw\\.js|workbox-.*\\.js|.*\\.png$|.*\\.svg$).*)",
    ],
};
