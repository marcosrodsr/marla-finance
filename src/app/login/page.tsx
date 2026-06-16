"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError("Email o contraseña incorrectos.");
            setLoading(false);
            return;
        }

        // router.refresh() forces Next.js to re-run server components and middleware
        // so the session cookie is picked up immediately.
        router.push("/dashboard");
        router.refresh();
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="glass-panel rounded-3xl p-8 sm:p-10 w-full max-w-sm">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
                        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Marla Finance</h1>
                    <p className="mt-1 text-sm text-slate-400">Inicia sesión para continuar</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="email"
                            className="block text-xs font-semibold text-slate-400 uppercase tracking-wider"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className="input-premium w-full rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-600"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="password"
                            className="block text-xs font-semibold text-slate-400 uppercase tracking-wider"
                        >
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="input-premium w-full rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-600"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2.5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full inline-flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-200 rounded-xl px-5 py-3 active:scale-95 disabled:opacity-50 disabled:pointer-events-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:from-blue-500 hover:to-indigo-500 border border-transparent"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Entrando…
                            </>
                        ) : (
                            "Entrar"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
