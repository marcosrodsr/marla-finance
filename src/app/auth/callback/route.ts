import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // `next` lets the caller request a specific post-login destination
    const next = searchParams.get("next") ?? "/dashboard";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // In production, respect the forwarded host to avoid redirect loops
            // behind a reverse proxy (Vercel, etc.)
            const forwardedHost = request.headers.get("x-forwarded-host");
            const isLocalEnv = process.env.NODE_ENV === "development";

            if (isLocalEnv || !forwardedHost) {
                return NextResponse.redirect(`${origin}${next}`);
            }

            return NextResponse.redirect(`https://${forwardedHost}${next}`);
        }
    }

    // Something went wrong — send back to login with an error flag
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}
