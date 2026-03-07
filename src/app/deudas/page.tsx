"use client";

import { useState, useMemo } from "react";
import { useFinance } from "@/store/finance-store";
import { calculateSharedDebt, formatEur, formatDate } from "@/lib/finance";
import { Transaction } from "@/types";
import MonthYearSelector from "@/components/MonthYearSelector";
import Card from "@/components/Card";
import AddPaymentModal from "@/components/AddPaymentModal";
import ExcelJS from "exceljs";

// ── Mobile Card ────────────────────────────────────────────────────────
function SharedExpenseCard({
    txId,
    categoryIcon,
    categoryLabel,
    note,
    date,
    totalCents,
    eachShareCents,
    marcosSaldo,
    paidBy,
    accentColor,
    onEdit,
    onDelete,
    deleteConfirmId,
}: {
    txId: string;
    categoryIcon: string;
    categoryLabel: string;
    note?: string;
    date: string;
    totalCents: number;
    eachShareCents: number;
    marcosSaldo: number;
    paidBy: "marcos" | "camila";
    accentColor: "blue" | "pink";
    onEdit: () => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    deleteConfirmId: string | null;
}) {
    const isDeleting = deleteConfirmId === txId;
    const blue = accentColor === "blue";
    const accentText = blue ? "text-blue-400" : "text-pink-400";
    const accentBg = blue ? "bg-blue-500/10 border-blue-500/20" : "bg-pink-500/10 border-pink-500/20";

    return (
        <div
            onClick={onEdit}
            className={`cursor-pointer rounded-2xl border p-3.5 transition-all active:scale-[0.98] ${isDeleting ? "bg-red-500/10 border-red-500/30" : `${accentBg}`}`}
        >
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800/40 flex items-center justify-center text-lg shrink-0">
                        {categoryIcon}
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-200 truncate leading-tight">{categoryLabel}</div>
                        {note && <div className="text-[10px] text-slate-400 truncate mt-0.5">{note}</div>}
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(txId, e); }}
                    className={`shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all ${isDeleting
                        ? "bg-red-500 text-white shadow-md shadow-red-500/30"
                        : "bg-white/5 text-slate-400 active:text-red-400"
                        }`}
                >
                    {isDeleting ? "✓ Confirm" : "Eliminar"}
                </button>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                <div className="text-xs text-slate-500 font-medium bg-white/5 px-2 py-1 rounded-md">
                    {formatDate(date)}
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mb-0.5">Pagado</div>
                        <div className="text-xs font-semibold text-slate-300">{formatEur(totalCents)}</div>
                    </div>
                    <div className="w-px h-6 bg-white/5" />
                    <div className="text-right">
                        <div className={`text-[9px] uppercase tracking-widest font-bold ${accentText} opacity-80 mb-0.5`}>Deuda</div>
                        <div className={`text-sm font-black tracking-tight ${accentText}`}>{formatEur(eachShareCents)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Desktop table row ──────────────────────────────────────────────────
function SharedExpenseRow({
    txId,
    categoryIcon,
    categoryLabel,
    note,
    date,
    totalCents,
    eachShareCents,
    marcosSaldo,
    paidBy,
    accentColor,
    onEdit,
    onDelete,
    deleteConfirmId,
    setDeleteConfirmId,
}: {
    txId: string;
    categoryIcon: string;
    categoryLabel: string;
    note?: string;
    date: string;
    totalCents: number;
    eachShareCents: number;
    marcosSaldo: number;
    paidBy: "marcos" | "camila";
    accentColor: "blue" | "pink";
    onEdit: () => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    deleteConfirmId: string | null;
    setDeleteConfirmId: (id: string | null) => void;
}) {
    const isDeleting = deleteConfirmId === txId;
    const blue = accentColor === "blue";

    return (
        <tr
            onClick={onEdit}
            className={`group cursor-pointer transition-colors ${isDeleting ? "bg-red-500/10" : "hover:bg-white/[0.03]"}`}
        >
            <td className="py-2.5 pr-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">{categoryIcon}</span>
                    <div className="min-w-0">
                        <div className="font-semibold text-[11px] text-slate-200 truncate">{categoryLabel}</div>
                        {note && <div className="text-[10px] text-slate-500 truncate max-w-[100px]">{note}</div>}
                    </div>
                </div>
            </td>
            <td className="py-2.5 px-2 text-[10px] text-slate-500 whitespace-nowrap">{formatDate(date)}</td>
            <td className="py-2.5 text-right text-[11px] font-medium text-slate-200">{formatEur(totalCents)}</td>
            <td className={`py-2.5 text-right text-[11px] font-bold pl-2 ${blue ? "text-blue-400" : "text-pink-400"}`}>
                {formatEur(eachShareCents)}
            </td>
            <td className="py-2.5 pl-3 text-right">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(txId, e); }}
                    className={`text-[10px] font-medium transition-all duration-200 px-2 py-0.5 rounded whitespace-nowrap
                        ${isDeleting
                            ? "bg-red-500 text-white shadow-lg shadow-red-500/40"
                            : "invisible group-hover:visible text-slate-500 hover:text-red-400"
                        }`}
                >
                    {isDeleting ? "Confirmar" : "Eliminar"}
                </button>
            </td>
        </tr>
    );
}




// Full-table row (detailed table at the bottom)
function FullSharedRow({
    txId,
    categoryIcon,
    categoryLabel,
    note,
    date,
    totalCents,
    eachShareCents,
    marcosSaldo,
    paidBy,
    onEdit,
    onDelete,
    deleteConfirmId,
}: {
    txId: string;
    categoryIcon: string;
    categoryLabel: string;
    note?: string;
    date: string;
    totalCents: number;
    eachShareCents: number;
    marcosSaldo: number;
    paidBy: "marcos" | "camila";
    onEdit: () => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    deleteConfirmId: string | null;
}) {
    const isDeleting = deleteConfirmId === txId;

    return (
        <tr
            onClick={onEdit}
            className={`group cursor-pointer transition-colors ${isDeleting ? "bg-red-500/10" : "hover:bg-white/[0.02]"}`}
        >
            <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                    <span className="text-base">{categoryIcon}</span>
                    <div className="min-w-0">
                        <div className="font-semibold text-slate-200 truncate">{categoryLabel}</div>
                        {note && <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{note}</div>}
                    </div>
                </div>
            </td>
            <td className="py-3 pr-4 text-slate-400 whitespace-nowrap hidden sm:table-cell">{formatDate(date)}</td>
            <td className="py-3 pr-4 text-right font-semibold text-slate-200">{formatEur(totalCents)}</td>
            <td className="py-3 pr-4 text-center">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${paidBy === "marcos"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-pink-500/10 text-pink-400 border-pink-500/20"
                    }`}>
                    {paidBy === "marcos" ? "Marcos" : "Camila"}
                </span>
            </td>
            <td className="py-3 pr-4 text-right text-slate-400">{formatEur(eachShareCents)}</td>
            <td className={`py-3 pr-3 text-right font-bold ${marcosSaldo > 0 ? "text-blue-400" : "text-pink-400"}`}>
                {marcosSaldo > 0
                    ? `Camila → ${formatEur(eachShareCents)}`
                    : `Marcos → ${formatEur(eachShareCents)}`}
            </td>
            <td className="py-3">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(txId, e); }}
                    className={`text-[10px] font-medium transition-all duration-200 px-2 py-0.5 rounded whitespace-nowrap
                        ${isDeleting
                            ? "bg-red-500 text-white shadow-lg shadow-red-500/40"
                            : "invisible group-hover:visible text-slate-500 hover:text-red-400"
                        }`}
                >
                    {isDeleting ? "Confirmar" : "Eliminar"}
                </button>
            </td>
        </tr>
    );
}

// ── Excel cell helper ──────────────────────────────────────────────────────────
function xlCell(
    ws: ExcelJS.Worksheet,
    addr: string,
    value: ExcelJS.CellValue,
    opts?: { bold?: boolean; size?: number; color?: string; fill?: string; align?: ExcelJS.Alignment["horizontal"]; border?: boolean; }
) {
    const c = ws.getCell(addr);
    c.value = value;
    c.font = { name: "Calibri", bold: opts?.bold ?? false, size: opts?.size ?? 11, color: { argb: opts?.color ?? "FF1E293B" } };
    c.alignment = { horizontal: opts?.align ?? "left", vertical: "middle" };
    if (opts?.fill) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.fill } };
    if (opts?.border) {
        const b = { style: "thin" as const, color: { argb: "FFE2E8F0" } };
        c.border = { top: b, bottom: b, left: b, right: b };
    }
    return c;
}

export default function DeudasPage() {
    const { transactions, categories, users, deleteTransaction } = useFinance();

    const now = new Date();
    const [selectedDate, setSelectedDate] = useState({ month: now.getMonth(), year: now.getFullYear() });
    const [viewMode, setViewMode] = useState<"monthly" | "annual">("monthly");
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const summary = useMemo(
        () => calculateSharedDebt(transactions, categories, [], selectedDate.month, selectedDate.year),
        [transactions, categories, selectedDate]
    );

    const personalStats = useMemo(() => {
        const filtered = transactions.filter((tx) => {
            const d = new Date(tx.date);
            return d.getFullYear() === selectedDate.year && d.getMonth() === selectedDate.month;
        });
        const stats = {
            marcos: { spent: 0, sharedPaid: 0, owedToThem: 0 },
            camila: { spent: 0, sharedPaid: 0, owedToThem: 0 },
        };
        filtered.forEach((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);
            if (cat?.kind === "income") return;
            if (tx.userId === "marcos") {
                stats.marcos.spent += tx.amountCents;
            } else if (tx.userId === "camila") {
                stats.camila.spent += tx.amountCents;
            } else if (tx.userId === "pareja" && tx.paidBy) {
                if (tx.paidBy === "marcos") {
                    stats.marcos.sharedPaid += tx.amountCents;
                    stats.marcos.owedToThem += Math.round(tx.amountCents / 2);
                } else {
                    stats.camila.sharedPaid += tx.amountCents;
                    stats.camila.owedToThem += Math.round(tx.amountCents / 2);
                }
            }
        });
        return stats;
    }, [transactions, categories, selectedDate]);

    const marcosRows = summary.rows.filter((r) => r.paidBy === "marcos");
    const camilaRows = summary.rows.filter((r) => r.paidBy === "camila");

    const marcosTotalSharedPaid = marcosRows.reduce((a, r) => a + r.totalCents, 0);
    const marcosTotalOwed = marcosRows.reduce((a, r) => a + r.eachShareCents, 0);
    const camilaTotalSharedPaid = camilaRows.reduce((a, r) => a + r.totalCents, 0);
    const camilaTotalOwed = camilaRows.reduce((a, r) => a + r.eachShareCents, 0);

    const periodLabel = new Date(selectedDate.year, selectedDate.month, 1).toLocaleDateString("es-ES", {
        month: "long", year: "numeric",
    });

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (deleteConfirmId === id) {
            deleteTransaction(id);
            setDeleteConfirmId(null);
        } else {
            setDeleteConfirmId(id);
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    const handleEdit = (txId: string) => {
        const tx = transactions.find((t) => t.id === txId);
        if (tx) setEditingTx(tx);
    };

    // ── Excel Export ──────────────────────────────────────────────────────────
    const handleExportExcel = async () => {
        const wb = new ExcelJS.Workbook();
        wb.creator = "Marla Finance"; wb.created = new Date();
        const DARK = "FF0F172A", DARK2 = "FF1E293B", SLATE = "FF94A3B8", WHITE = "FFF8FAFC";
        const BLUE_H = "FF1D4ED8", PINK_H = "FFBE185D", BLUE_L = "FFEFF6FF", PINK_L = "FFFFF1F2";
        const AMBER = "FFD97706", GREEN = "FF059669", GRAY_H = "FF334155", GRAY_R = "FFF1F5F9";

        // Sheet 1: Resumen
        const ws1 = wb.addWorksheet("Resumen", { properties: { tabColor: { argb: "FF3B82F6" } } });
        ws1.columns = [{ width: 4 }, { width: 32 }, { width: 22 }, { width: 4 }];
        ws1.mergeCells("B1:C1");
        xlCell(ws1, "B1", `REPARTICIÓN DE DEUDAS — ${periodLabel.toUpperCase()}`, { bold: true, size: 16, color: WHITE, fill: BLUE_H, align: "center" });
        ws1.getRow(1).height = 36;
        ws1.mergeCells("B3:C3");
        xlCell(ws1, "B3", "BALANCE NETO", { bold: true, size: 11, color: SLATE, fill: DARK2, align: "center" });
        ws1.getRow(3).height = 22;
        const netLabel = summary.debtor === null ? "✅ Estáis en paz"
            : `${summary.debtor === "camila" ? "Camila" : "Marcos"} debe a ${summary.debtor === "camila" ? "Marcos" : "Camila"}`;
        ws1.mergeCells("B4:C4");
        const nc = ws1.getCell("B4");
        nc.value = netLabel + (summary.debtor !== null ? `   ${(summary.debtorOwes / 100).toFixed(2)} €` : "");
        nc.font = { name: "Calibri", bold: true, size: 13, color: { argb: WHITE } };
        nc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: summary.debtor === null ? GREEN : AMBER } };
        nc.alignment = { horizontal: "center", vertical: "middle" };
        ws1.getRow(4).height = 30;
        ws1.getRow(6).height = 24;
        ws1.mergeCells("B6:C6");
        xlCell(ws1, "B6", "MARCOS", { bold: true, size: 12, color: WHITE, fill: BLUE_H, align: "center" });
        [["Gastos individuales", personalStats.marcos.spent], ["Gastos compartidos pagados", personalStats.marcos.sharedPaid], ["Camila le debe", personalStats.marcos.owedToThem]].forEach(([label, val], i) => {
            const row = 7 + i, isLast = i === 2;
            xlCell(ws1, `B${row}`, label as string, { bold: isLast, fill: isLast ? BLUE_L : WHITE, color: DARK2, border: true });
            xlCell(ws1, `C${row}`, `${((val as number) / 100).toFixed(2)} €`, { bold: isLast, fill: isLast ? BLUE_L : WHITE, color: isLast ? BLUE_H : DARK2, align: "right", border: true });
            ws1.getRow(row).height = 20;
        });
        ws1.getRow(11).height = 24;
        ws1.mergeCells("B11:C11");
        xlCell(ws1, "B11", "CAMILA", { bold: true, size: 12, color: WHITE, fill: PINK_H, align: "center" });
        [["Gastos individuales", personalStats.camila.spent], ["Gastos compartidos pagados", personalStats.camila.sharedPaid], ["Marcos le debe", personalStats.camila.owedToThem]].forEach(([label, val], i) => {
            const row = 12 + i, isLast = i === 2;
            xlCell(ws1, `B${row}`, label as string, { bold: isLast, fill: isLast ? PINK_L : WHITE, color: DARK2, border: true });
            xlCell(ws1, `C${row}`, `${((val as number) / 100).toFixed(2)} €`, { bold: isLast, fill: isLast ? PINK_L : WHITE, color: isLast ? PINK_H : DARK2, align: "right", border: true });
            ws1.getRow(row).height = 20;
        });

        // Sheet 2: Detalle
        const ws2 = wb.addWorksheet("Detalle Compartidos", { properties: { tabColor: { argb: "FFEC4899" } } });
        ws2.columns = [{ width: 4 }, { width: 14 }, { width: 24 }, { width: 28 }, { width: 16 }, { width: 12 }, { width: 16 }, { width: 18 }, { width: 18 }, { width: 4 }];
        ws2.mergeCells("B1:I1");
        xlCell(ws2, "B1", `GASTOS COMPARTIDOS — ${periodLabel.toUpperCase()}`, { bold: true, size: 14, color: WHITE, fill: DARK, align: "center" });
        ws2.getRow(1).height = 32;
        const hdrs = ["Fecha", "Concepto", "Nota", "Total Pagado (€)", "Pagó", "Parte c/u", "Camila debe", "Marcos debe"];
        const hCols = ["B", "C", "D", "E", "F", "G", "H", "I"];
        hdrs.forEach((h, i) => { xlCell(ws2, `${hCols[i]}3`, h, { bold: true, size: 10, color: WHITE, fill: GRAY_H, align: "center", border: true }); });
        ws2.getRow(3).height = 22;
        summary.rows.forEach((r, idx) => {
            const rowNum = 4 + idx, bg = idx % 2 === 1 ? GRAY_R : WHITE;
            const rowData: [string, string][] = [[r.date, "center"], [r.categoryLabel, "left"], [r.note ?? "", "left"], [`${(r.totalCents / 100).toFixed(2)} €`, "right"], [r.paidBy === "marcos" ? "Marcos" : "Camila", "center"], [`${(r.eachShareCents / 100).toFixed(2)} €`, "right"], [r.marcosSaldo > 0 ? `${(r.eachShareCents / 100).toFixed(2)} €` : "", "right"], [r.marcosSaldo < 0 ? `${(r.eachShareCents / 100).toFixed(2)} €` : "", "right"]];
            rowData.forEach(([val, align], i) => {
                const isDebt = (i === 6 && val !== "") || (i === 7 && val !== "");
                xlCell(ws2, `${hCols[i]}${rowNum}`, val, { fill: bg, color: isDebt ? (i === 6 ? BLUE_H : PINK_H) : DARK2, align: align as ExcelJS.Alignment["horizontal"], bold: isDebt, border: true });
            });
            ws2.getRow(rowNum).height = 18;
        });
        const totRow = 4 + summary.rows.length + 1;
        ws2.mergeCells(`B${totRow}:D${totRow}`);
        xlCell(ws2, `B${totRow}`, "TOTAL", { bold: true, size: 11, color: WHITE, fill: GRAY_H, align: "center", border: true });
        xlCell(ws2, `E${totRow}`, `${(summary.rows.reduce((a, r) => a + r.totalCents, 0) / 100).toFixed(2)} €`, { bold: true, fill: GRAY_H, color: WHITE, align: "right", border: true });
        xlCell(ws2, `F${totRow}`, "", { fill: GRAY_H, border: true });
        xlCell(ws2, `G${totRow}`, `${(summary.rows.reduce((a, r) => a + r.eachShareCents, 0) / 100).toFixed(2)} €`, { bold: true, fill: GRAY_H, color: WHITE, align: "right", border: true });
        xlCell(ws2, `H${totRow}`, `${(marcosTotalOwed / 100).toFixed(2)} €`, { bold: true, fill: BLUE_L, color: BLUE_H, align: "right", border: true });
        xlCell(ws2, `I${totRow}`, `${(camilaTotalOwed / 100).toFixed(2)} €`, { bold: true, fill: PINK_L, color: PINK_H, align: "right", border: true });
        ws2.getRow(totRow).height = 22;

        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `deudas-${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, "0")}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!users) return null;
    if (users.length === 0 || categories.length === 0) {
        return <div className="flex items-center justify-center h-64 text-slate-400">Cargando...</div>;
    }

    const { rows, debtor, debtorOwes } = summary;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Repartición de Deudas</h1>
                    <p className="text-sm text-slate-400 mt-1">Balance interno de gastos compartidos entre Marcos y Camila</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <MonthYearSelector
                        viewMode={viewMode} setViewMode={setViewMode}
                        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
                    />
                    <button
                        onClick={() => void handleExportExcel()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all whitespace-nowrap"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0-3-3m3 3 3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Exportar Excel
                    </button>
                </div>
            </div>

            {/* Net Balance Banner */}
            <div className={`rounded-3xl border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${debtor === null ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                <div>
                    {debtor === null ? (
                        <><p className="text-emerald-400 font-bold text-lg">✅ Estáis en paz</p><p className="text-slate-400 text-sm mt-0.5">No hay deudas pendientes este periodo</p></>
                    ) : (
                        <><p className="text-amber-400 font-bold text-lg">{debtor === "camila" ? "Camila le debe a Marcos" : "Marcos le debe a Camila"}</p><p className="text-slate-400 text-sm mt-0.5">Balance neto del periodo seleccionado</p></>
                    )}
                </div>
                {debtor !== null && <div className="text-3xl font-bold tracking-tight text-amber-300">{formatEur(debtorOwes)}</div>}
            </div>

            {/* Individual Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* MARCOS */}
                <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6 flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-lg">M</div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-200">Marcos</h2>
                            <p className="text-xs text-slate-500">Vista individual — {periodLabel}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between py-2.5 border-b border-white/5">
                            <span className="text-sm text-slate-400">Gastos individuales</span>
                            <span className="font-bold text-slate-200">{formatEur(personalStats.marcos.spent)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5 border-b border-white/5">
                            <span className="text-sm text-slate-400">Total gastos compartidos pagados</span>
                            <span className="font-bold text-slate-200">{formatEur(marcosTotalSharedPaid)}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-blue-600/15 border border-blue-500/20 mt-1">
                            <div>
                                <p className="text-xs text-blue-400/70 font-semibold uppercase tracking-widest">Camila le debe</p>
                                <p className="text-xs text-slate-500 mt-0.5">{marcosRows.length} gastos compartidos</p>
                            </div>
                            <span className="font-black text-2xl text-blue-300">{formatEur(marcosTotalOwed)}</span>
                        </div>
                    </div>
                    {marcosRows.length > 0 && (
                        <div className="mt-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Gastos compartidos que pagó — click para editar</p>

                            {/* Mobile Grid */}
                            <div className="flex flex-col gap-2 sm:hidden">
                                {marcosRows.map((r) => (
                                    <SharedExpenseCard
                                        key={r.txId}
                                        txId={r.txId}
                                        categoryIcon={r.categoryIcon}
                                        categoryLabel={r.categoryLabel}
                                        note={r.note}
                                        date={r.date}
                                        totalCents={r.totalCents}
                                        eachShareCents={r.eachShareCents}
                                        marcosSaldo={r.marcosSaldo}
                                        paidBy={r.paidBy as "marcos" | "camila"}
                                        accentColor="blue"
                                        onEdit={() => handleEdit(r.txId)}
                                        onDelete={handleDelete}
                                        deleteConfirmId={deleteConfirmId}
                                    />
                                ))}
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-slate-500 uppercase tracking-wider border-b border-white/10 text-[9px]">
                                            <th className="pb-2 font-bold text-left">Concepto</th>
                                            <th className="pb-2 font-bold px-2">Fecha</th>
                                            <th className="pb-2 font-bold text-right">T. Pagado</th>
                                            <th className="pb-2 font-bold text-right pl-2">T. Deuda</th>
                                            <th className="pb-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {marcosRows.map((r) => (
                                            <SharedExpenseRow
                                                key={r.txId}
                                                txId={r.txId}
                                                categoryIcon={r.categoryIcon}
                                                categoryLabel={r.categoryLabel}
                                                note={r.note}
                                                date={r.date}
                                                totalCents={r.totalCents}
                                                eachShareCents={r.eachShareCents}
                                                marcosSaldo={r.marcosSaldo}
                                                paidBy={r.paidBy as "marcos" | "camila"}
                                                accentColor="blue"
                                                onEdit={() => handleEdit(r.txId)}
                                                onDelete={handleDelete}
                                                deleteConfirmId={deleteConfirmId}
                                                setDeleteConfirmId={setDeleteConfirmId}
                                            />
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-blue-500/20">
                                            <td colSpan={2} className="pt-2 font-bold text-slate-500 uppercase tracking-tighter text-[9px]">TOTAL</td>
                                            <td className="pt-2 text-right font-bold text-slate-200 text-[11px]">{formatEur(marcosTotalSharedPaid)}</td>
                                            <td className="pt-2 text-right font-black text-blue-300 pl-2 text-[11px]">{formatEur(marcosTotalOwed)}</td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                    {marcosRows.length === 0 && <p className="text-xs text-slate-500 italic text-center py-4">Marcos no ha pagado gastos compartidos este periodo</p>}
                </div>

                {/* CAMILA */}
                <div className="rounded-3xl border border-pink-500/20 bg-pink-500/5 p-6 flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center font-bold text-lg">C</div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-200">Camila</h2>
                            <p className="text-xs text-slate-500">Vista individual — {periodLabel}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between py-2.5 border-b border-white/5">
                            <span className="text-sm text-slate-400">Gastos individuales</span>
                            <span className="font-bold text-slate-200">{formatEur(personalStats.camila.spent)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5 border-b border-white/5">
                            <span className="text-sm text-slate-400">Total gastos compartidos pagados</span>
                            <span className="font-bold text-slate-200">{formatEur(camilaTotalSharedPaid)}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-pink-600/15 border border-pink-500/20 mt-1">
                            <div>
                                <p className="text-xs text-pink-400/70 font-semibold uppercase tracking-widest">Marcos le debe</p>
                                <p className="text-xs text-slate-500 mt-0.5">{camilaRows.length} gastos compartidos</p>
                            </div>
                            <span className="font-black text-2xl text-pink-300">{formatEur(camilaTotalOwed)}</span>
                        </div>
                    </div>
                    {camilaRows.length > 0 && (
                        <div className="mt-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Gastos compartidos que pagó — click para editar</p>

                            {/* Mobile Grid */}
                            <div className="flex flex-col gap-2 sm:hidden">
                                {camilaRows.map((r) => (
                                    <SharedExpenseCard
                                        key={r.txId}
                                        txId={r.txId}
                                        categoryIcon={r.categoryIcon}
                                        categoryLabel={r.categoryLabel}
                                        note={r.note}
                                        date={r.date}
                                        totalCents={r.totalCents}
                                        eachShareCents={r.eachShareCents}
                                        marcosSaldo={r.marcosSaldo}
                                        paidBy={r.paidBy as "marcos" | "camila"}
                                        accentColor="pink"
                                        onEdit={() => handleEdit(r.txId)}
                                        onDelete={handleDelete}
                                        deleteConfirmId={deleteConfirmId}
                                    />
                                ))}
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-slate-500 uppercase tracking-wider border-b border-white/10 text-[9px]">
                                            <th className="pb-2 font-bold text-left">Concepto</th>
                                            <th className="pb-2 font-bold px-2">Fecha</th>
                                            <th className="pb-2 font-bold text-right">T. Pagado</th>
                                            <th className="pb-2 font-bold text-right pl-2">T. Deuda</th>
                                            <th className="pb-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {camilaRows.map((r) => (
                                            <SharedExpenseRow
                                                key={r.txId}
                                                txId={r.txId}
                                                categoryIcon={r.categoryIcon}
                                                categoryLabel={r.categoryLabel}
                                                note={r.note}
                                                date={r.date}
                                                totalCents={r.totalCents}
                                                eachShareCents={r.eachShareCents}
                                                marcosSaldo={r.marcosSaldo}
                                                paidBy={r.paidBy as "marcos" | "camila"}
                                                accentColor="pink"
                                                onEdit={() => handleEdit(r.txId)}
                                                onDelete={handleDelete}
                                                deleteConfirmId={deleteConfirmId}
                                                setDeleteConfirmId={setDeleteConfirmId}
                                            />
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-pink-500/20">
                                            <td colSpan={2} className="pt-2 font-bold text-slate-500 uppercase tracking-tighter text-[9px]">TOTAL</td>
                                            <td className="pt-2 text-right font-bold text-slate-200 text-[11px]">{formatEur(camilaTotalSharedPaid)}</td>
                                            <td className="pt-2 text-right font-black text-pink-300 pl-2 text-[11px]">{formatEur(camilaTotalOwed)}</td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                    {camilaRows.length === 0 && <p className="text-xs text-slate-500 italic text-center py-4">Camila no ha pagado gastos compartidos este periodo</p>}
                </div>
            </div>

            {/* Full Shared Expenses Table */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-200">Detalle Completo — Gastos Compartidos</h2>
                    <span className="text-xs text-slate-500 uppercase tracking-widest">{rows.length} gastos · click para editar</span>
                </div>

                {rows.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm italic">
                        No hay gastos compartidos con pagador registrado en este periodo.
                        <br /><span className="text-xs mt-1 block">Edita los gastos de &quot;pareja&quot; y asigna quién pagó para que aparezcan aquí.</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
                                    <th className="text-left pb-3 pr-4">Concepto</th>
                                    <th className="text-left pb-3 pr-4 hidden sm:table-cell">Fecha</th>
                                    <th className="text-right pb-3 pr-4">Total Pagado</th>
                                    <th className="text-center pb-3 pr-4">Pagó</th>
                                    <th className="text-right pb-3 pr-4">Parte c/u</th>
                                    <th className="text-right pb-3 pr-3">Saldo</th>
                                    <th className="pb-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {rows.map((row) => (
                                    <FullSharedRow
                                        key={row.txId}
                                        txId={row.txId}
                                        categoryIcon={row.categoryIcon}
                                        categoryLabel={row.categoryLabel}
                                        note={row.note}
                                        date={row.date}
                                        totalCents={row.totalCents}
                                        eachShareCents={row.eachShareCents}
                                        marcosSaldo={row.marcosSaldo}
                                        paidBy={row.paidBy as "marcos" | "camila"}
                                        onEdit={() => handleEdit(row.txId)}
                                        onDelete={handleDelete}
                                        deleteConfirmId={deleteConfirmId}
                                    />
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-white/10">
                                    <td colSpan={2} className="pt-4 text-xs font-bold text-slate-400 uppercase tracking-widest pr-4">Total Pagado</td>
                                    <td className="pt-4 text-right font-bold text-slate-200 pr-4">{formatEur(rows.reduce((a, r) => a + r.totalCents, 0))}</td>
                                    <td /><td className="pt-4 text-right font-bold text-slate-200 pr-4">{formatEur(rows.reduce((a, r) => a + r.eachShareCents, 0))}</td>
                                    <td /><td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </Card>

            {/* Edit Modal */}
            <AddPaymentModal
                isOpen={editingTx !== null}
                onClose={() => setEditingTx(null)}
                initialData={editingTx}
            />
        </div>
    );
}
