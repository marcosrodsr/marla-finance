import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MarketProduct } from "@/types";

function mapToProduct(row: Record<string, unknown>): MarketProduct {
    return {
        id: row.id as string,
        createdAt: row.created_at as string,
        name: row.name as string,
        priceCents: row.price_cents as number,
        tipo: row.tipo as MarketProduct["tipo"],
        usuario: row.usuario as MarketProduct["usuario"],
        establecimiento: row.establecimiento as string,
        unidad: (row.unidad as MarketProduct["unidad"]) ?? "unidad",
        isActive: (row.is_active as boolean) ?? true,
    };
}

// PUT /api/market-products/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;
    const body = await req.json() as Partial<MarketProduct>;

    const { data, error } = await supabase
        .from("market_products")
        .update({
            name: body.name,
            price_cents: body.priceCents,
            tipo: body.tipo,
            usuario: body.usuario,
            establecimiento: body.establecimiento,
            unidad: body.unidad,
            is_active: body.isActive,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(mapToProduct(data as Record<string, unknown>));
}

// DELETE /api/market-products/[id] — soft delete (is_active = false)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;

    const { error } = await supabase
        .from("market_products")
        .update({ is_active: false })
        .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
