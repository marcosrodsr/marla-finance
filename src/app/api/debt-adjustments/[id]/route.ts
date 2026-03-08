import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { DebtAdjustment } from "@/types";

function mapToDebtAdjustment(row: Record<string, unknown>): DebtAdjustment {
    return {
        id: row.id as string,
        createdAt: row.created_at as string,
        date: (row.date as string).split("T")[0],
        description: row.description as string,
        amountCents: row.amount_cents as number,
        direction: row.direction as DebtAdjustment["direction"],
    };
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await req.json() as Partial<DebtAdjustment>;

    const { data, error } = await supabase
        .from("debt_adjustments")
        .update({
            date: body.date,
            description: body.description,
            amount_cents: body.amountCents,
            direction: body.direction,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapToDebtAdjustment(data as Record<string, unknown>));
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const { error } = await supabase
        .from("debt_adjustments")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
}
