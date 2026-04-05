import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
    const { id: purchaseId, itemId } = await params;

    // 1. Delete the item
    const { error: delErr } = await supabase
        .from("market_purchase_items")
        .delete()
        .eq("id", itemId)
        .eq("purchase_id", purchaseId);

    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    // 2. Fetch remaining items for this purchase
    const { data: remainingItems, error: itemsErr } = await supabase
        .from("market_purchase_items")
        .select("price_cents, qty, tipo_usuario")
        .eq("purchase_id", purchaseId);

    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

    // 3. Recalculate totals
    let newParejaTotal = 0;
    let newMarcosTotal = 0;
    let newCamilaTotal = 0;
    let newTotalCents = 0;

    const items = remainingItems as Record<string, unknown>[];
    for (const item of items) {
        const subtotal = Number(item.price_cents) * Number(item.qty);
        newTotalCents += subtotal;
        if (item.tipo_usuario === "pareja") newParejaTotal += subtotal;
        else if (item.tipo_usuario === "marcos") newMarcosTotal += subtotal;
        else if (item.tipo_usuario === "camila") newCamilaTotal += subtotal;
    }

    // 4. Update purchase total
    const { error: updateErr } = await supabase
        .from("market_purchases")
        .update({ total_cents: newTotalCents })
        .eq("id", purchaseId);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // 5. Update linked transactions
    // The previous implementation created up to 3 transactions (pareja, marcos, camila) for a purchase.
    // If a type's total becomes 0, we delete the transaction. Otherwise, we update the amount.
    const { data: txs, error: txErr } = await supabase
        .from("transactions")
        .select("id, user_id")
        .eq("market_purchase_id", purchaseId);

    if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });
    const transactions = txs as Record<string, unknown>[];

    for (const tx of transactions) {
        const userId = tx.user_id as string;
        const txId = tx.id as string;

        let newAmount = 0;
        if (userId === "pareja") newAmount = newParejaTotal;
        else if (userId === "marcos") newAmount = newMarcosTotal;
        else if (userId === "camila") newAmount = newCamilaTotal;

        if (newAmount > 0) {
            await supabase
                .from("transactions")
                .update({ amount_cents: newAmount })
                .eq("id", txId);
        } else {
            // No more items for this user, delete the transaction
            await supabase
                .from("transactions")
                .delete()
                .eq("id", txId);
        }
    }

    // In case someone added items of a new type via UI later (not implemented yet, but good constraint)
    // we would ideally create missing transactions but current UI doesn't allow adding to existing purchases so this is fine.

    return NextResponse.json({ success: true, newTotalCents });
}
