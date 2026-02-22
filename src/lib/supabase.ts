import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Database types (match our Supabase tables) ---
export type DbTransaction = {
    id: string;
    created_at: string;
    date: string;
    user_id: string;
    category_id: string | null;
    amount_cents: number;
    note: string | null;
    is_shared: boolean;
};

export type DbCategory = {
    id: string;
    label: string;
    icon: string;
    kind: string;
    scope: string;
    limit_monthly: number | null;
};
