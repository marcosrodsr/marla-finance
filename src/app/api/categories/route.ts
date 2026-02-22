import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Category } from "@/types";

function mapToCategory(row: Record<string, unknown>): Category {
    return {
        id: row.id as string,
        label: row.label as string,
        icon: row.icon as string,
        kind: row.kind as Category["kind"],
        scope: row.scope as Category["scope"],
        limitMonthly: (row.limit_monthly as number) ?? undefined,
    };
}

// GET /api/categories
export async function GET() {
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("label");

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data ?? []).map(mapToCategory));
}

// POST /api/categories
export async function POST(req: NextRequest) {
    const body = await req.json() as Partial<Category>;

    const { data, error } = await supabase
        .from("categories")
        .insert({
            id: body.id,
            label: body.label,
            icon: body.icon,
            kind: body.kind,
            scope: body.scope,
            limit_monthly: body.limitMonthly ?? null,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapToCategory(data as Record<string, unknown>), { status: 201 });
}
