import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Transaction } from "@/types";

type Params = { params: Promise<{ id: string }> };

// PUT /api/transactions/:id
export async function PUT(req: NextRequest, { params }: Params) {
    const { id } = await params;
    const body = await req.json() as Partial<Transaction>;

    const { data, error } = await supabase
        .from("transactions")
        .update({
            date: body.date,
            user_id: body.userId,
            category_id: body.categoryId,
            amount_cents: body.amountCents,
            note: body.note ?? null,
            is_shared: body.isShared ?? false,
            paid_by: body.paidBy ?? null,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const row = data as Record<string, unknown>;
    const tx: Transaction = {
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

    return NextResponse.json(tx);
}

// DELETE /api/transactions/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
    const { id } = await params;

    const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
