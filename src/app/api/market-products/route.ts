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

// GET /api/market-products
export async function GET() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("market_products")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map(mapToProduct));
}

// POST /api/market-products
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const body = await req.json() as Partial<MarketProduct>;

    const { data, error } = await supabase
        .from("market_products")
        .insert({
            id: body.id,
            name: body.name,
            price_cents: body.priceCents ?? 0,
            tipo: body.tipo,
            usuario: body.usuario,
            establecimiento: body.establecimiento,
            unidad: body.unidad ?? "unidad",
            is_active: body.isActive ?? true,
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(mapToProduct(data as Record<string, unknown>), { status: 201 });
}
