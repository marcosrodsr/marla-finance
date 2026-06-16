import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MarketPurchase, MarketPurchaseItem } from "@/types";

function mapItem(row: Record<string, unknown>): MarketPurchaseItem {
    return {
        id: row.id as string,
        purchaseId: row.purchase_id as string,
        productId: (row.product_id as string) ?? null,
        nameSnapshot: row.name_snapshot as string,
        priceCents: row.price_cents as number,
        qty: Number(row.qty),
        tipoUsuario: row.tipo_usuario as MarketPurchaseItem["tipoUsuario"],
    };
}

function mapPurchase(row: Record<string, unknown>, items: MarketPurchaseItem[] = []): MarketPurchase {
    return {
        id: row.id as string,
        createdAt: row.created_at as string,
        date: (row.date as string).split("T")[0],
        paidBy: row.paid_by as "marcos" | "camila",
        establecimiento: row.establecimiento as string,
        totalCents: row.total_cents as number,
        note: (row.note as string) ?? undefined,
        items,
    };
}

// GET /api/market-purchases — list all purchases with items embedded
export async function GET() {
    const supabase = await createClient();
    const { data: purchases, error: pErr } = await supabase
        .from("market_purchases")
        .select("*")
        .order("date", { ascending: false });

    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

    if (!purchases || purchases.length === 0) return NextResponse.json([]);

    const ids = (purchases as Record<string, unknown>[]).map((p) => p.id as string);
    const { data: items, error: iErr } = await supabase
        .from("market_purchase_items")
        .select("*")
        .in("purchase_id", ids);

    if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

    const itemMap = new Map<string, MarketPurchaseItem[]>();
    ((items ?? []) as Record<string, unknown>[]).forEach((row) => {
        const item = mapItem(row);
        if (!itemMap.has(item.purchaseId)) itemMap.set(item.purchaseId, []);
        itemMap.get(item.purchaseId)!.push(item);
    });

    const result = (purchases as Record<string, unknown>[]).map((p) =>
        mapPurchase(p, itemMap.get(p.id as string) ?? [])
    );

    return NextResponse.json(result);
}

// POST /api/market-purchases — create purchase + items + linked transactions
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const body = await req.json() as {
        purchase: Omit<MarketPurchase, "id" | "createdAt" | "items">;
        items: Omit<MarketPurchaseItem, "id" | "purchaseId">[];
        transactions: Array<{
            id: string;
            date: string;
            userId: string;
            categoryId: string;
            amountCents: number;
            paidBy: string;
            note?: string;
        }>;
    };

    // 1. Insert purchase
    const purchaseId = `mp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const { data: purchaseData, error: pErr } = await supabase
        .from("market_purchases")
        .insert({
            id: purchaseId,
            date: body.purchase.date,
            paid_by: body.purchase.paidBy,
            establecimiento: body.purchase.establecimiento,
            total_cents: body.purchase.totalCents,
            note: body.purchase.note ?? null,
        })
        .select()
        .single();

    if (pErr) {
        console.error("[POST /market-purchases] Insert purchase error:", pErr);
        return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    // 2. Insert items
    if (body.items.length > 0) {
        const itemRows = body.items.map((item, i) => ({
            id: `mpi-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
            purchase_id: purchaseId,
            product_id: item.productId ?? null,
            name_snapshot: item.nameSnapshot,
            price_cents: item.priceCents,
            qty: item.qty,
            tipo_usuario: item.tipoUsuario,
        }));

        const { error: iErr } = await supabase.from("market_purchase_items").insert(itemRows);
        if (iErr) {
            console.error("[POST /market-purchases] Insert items error:", iErr);
            return NextResponse.json({ error: iErr.message }, { status: 500 });
        }
    }

    // 3. Insert transactions linked to this purchase
    if (body.transactions.length > 0) {
        const txRows = body.transactions.map((tx) => ({
            id: tx.id,
            date: tx.date,
            user_id: tx.userId,
            category_id: tx.categoryId,
            amount_cents: tx.amountCents,
            paid_by: tx.paidBy,
            note: tx.note ?? null,
            market_purchase_id: purchaseId,
            is_shared: tx.userId === "pareja",
            is_settled: false,
        }));

        const { error: txErr } = await supabase.from("transactions").insert(txRows);
        if (txErr) {
            console.error("[POST /market-purchases] Insert transactions error:", txErr);
            return NextResponse.json({ error: txErr.message }, { status: 500 });
        }
    }

    // Fetch full purchase with items to return
    const { data: items } = await supabase
        .from("market_purchase_items")
        .select("*")
        .eq("purchase_id", purchaseId);

    const mappedItems = ((items ?? []) as Record<string, unknown>[]).map(mapItem);
    return NextResponse.json(
        mapPurchase(purchaseData as Record<string, unknown>, mappedItems),
        { status: 201 }
    );
}
