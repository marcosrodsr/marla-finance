import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Transaction } from "@/types";

// Map DB row → our Transaction type
function mapToTransaction(row: Record<string, unknown>): Transaction {
    return {
        id: row.id as string,
        createdAt: row.created_at as string,
        date: (row.date as string).split("T")[0],
        userId: row.user_id as string,
        categoryId: (row.category_id as string) ?? "",
        amountCents: row.amount_cents as number,
        note: (row.note as string) ?? undefined,
        isShared: (row.is_shared as boolean) ?? false,
        paidBy: (row.paid_by as "marcos" | "camila") ?? undefined,
    };
}

// GET /api/transactions
export async function GET() {
    const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transactions = (data ?? []).map(mapToTransaction);
    return NextResponse.json(transactions);
}

// POST /api/transactions
export async function POST(req: NextRequest) {
    const body = await req.json() as Partial<Transaction>;

    const { data, error } = await supabase
        .from("transactions")
        .insert({
            id: body.id,
            date: body.date,
            user_id: body.userId,
            category_id: body.categoryId,
            amount_cents: body.amountCents,
            note: body.note ?? null,
            is_shared: body.isShared ?? false,
            paid_by: body.paidBy ?? null,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapToTransaction(data as Record<string, unknown>), { status: 201 });
}
