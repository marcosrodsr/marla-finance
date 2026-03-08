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

export async function GET() {
    const { data, error } = await supabase
        .from("debt_adjustments")
        .select("*")
        .order("date", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data ?? []).map(mapToDebtAdjustment));
}

export async function POST(req: NextRequest) {
    const body = await req.json() as Partial<DebtAdjustment>;

    const { data, error } = await supabase
        .from("debt_adjustments")
        .insert({
            id: body.id,
            date: body.date,
            description: body.description,
            amount_cents: body.amountCents,
            direction: body.direction,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapToDebtAdjustment(data as Record<string, unknown>), { status: 201 });
}
