import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Category } from "@/types";

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json() as Partial<Category>;

        // Build update object based on what's provided
        const updates: Record<string, any> = {};
        if (body.label !== undefined) updates.label = body.label;
        if (body.icon !== undefined) updates.icon = body.icon;
        if (body.kind !== undefined) updates.kind = body.kind;
        if (body.scope !== undefined) updates.scope = body.scope;
        if (body.limitMonthly !== undefined) updates.limit_monthly = body.limitMonthly;
        if (body.order !== undefined) updates.order = body.order;
        if (body.isActive !== undefined) updates.is_active = body.isActive;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("categories")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("DB update error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            id: data.id,
            label: data.label,
            icon: data.icon,
            kind: data.kind,
            scope: data.scope,
            limitMonthly: data.limit_monthly ?? undefined,
            order: data.order ?? 0,
            isActive: data.is_active ?? true,
        });
    } catch (e) {
        console.error("Error formatting or parsing category update:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        // Perform Soft Delete
        const { error } = await supabase
            .from("categories")
            .update({ is_active: false })
            .eq("id", id);

        if (error) {
            console.error("DB soft delete error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
