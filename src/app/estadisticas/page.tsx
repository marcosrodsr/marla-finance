"use client";

import { useState, useMemo } from "react";
import { useFinance } from "@/store/finance-store";
import {
    filterByMonthYear,
    filterByYear,
    formatEur,
    formatDate,
} from "@/lib/finance";
import PieChart from "@/components/charts/PieChart";
import Card from "@/components/Card";
import { Transaction, Category } from "@/types";

type PeriodMode = "monthly" | "annual";
type UserFilter = "all" | "marcos" | "camila";

const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const CATEGORY_PALETTE = [
    "#3b82f6", // Blue
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#6366f1", // Indigo
    "#14b8a6", // Teal
    "#ef4444", // Red
    "#a855f7", // Purple
    "#0ea5e9", // Sky
];

export default function EstadisticasPage() {
    const { transactions, categories, users, loading, error } = useFinance();

    const now = new Date();
    const [periodMode, setPeriodMode] = useState<PeriodMode>("monthly");
    const [month, setMonth] = useState(now.getMonth());
    const [year, setYear] = useState(now.getFullYear());
    const [userFilter, setUserFilter] = useState<UserFilter>("all");

    // Which categories the user has toggled OFF (excluded from view)
    const [excludedCategoryIds, setExcludedCategoryIds] = useState<Set<string>>(new Set());

    // Which category is "selected" in the pie chart (for highlight)
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    const userId: string | null = userFilter === "all" ? null : userFilter;

    // Filter by period
    const filtered = useMemo(() => {
        if (periodMode === "monthly") return filterByMonthYear(transactions, month, year);
        return filterByYear(transactions, year);
    }, [transactions, periodMode, month, year]);

    // Pre-filter by user.
    // Conjunto = only pareja txns (100%)
    // Marcos/Camila = their own txns + pareja txns (at 50%)
    const userFiltered = useMemo(() => {
        if (userFilter === "all") return filtered.filter((t) => t.userId === "pareja");
        return filtered.filter((t) => t.userId === userFilter || t.userId === "pareja");
    }, [filtered, userFilter]);

    // Simple direct aggregation:
    // - own transactions → full amount
    // - pareja transactions → 50% (only when viewing Marcos or Camila)
    const allCategoryGroups = useMemo(() => {
        const map = new Map<string, number>();
        userFiltered.forEach((tx) => {
            const amount = userFilter !== "all" && tx.userId === "pareja"
                ? Math.round(tx.amountCents / 2)
                : tx.amountCents;
            map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + amount);
        });
        return Array.from(map.entries())
            .map(([catId, total]) => {
                const category = categories.find((c) => c.id === catId);
                if (!category) return null;
                return { category, total };
            })
            .filter((g): g is { category: (typeof categories)[0]; total: number } => g !== null)
            .sort((a, b) => b.total - a.total);
    }, [userFiltered, userFilter, categories]);

    // Build a stable color map: categoryId -> color (based on sorted order of ALL categories)
    const colorMap = useMemo(() => {
        const map = new Map<string, string>();
        allCategoryGroups.forEach((g, idx) => {
            map.set(g.category.id, CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length]);
        });
        return map;
    }, [allCategoryGroups]);

    // Category groups after exclusion filter
    const visibleGroups = useMemo(
        () => allCategoryGroups.filter(g => !excludedCategoryIds.has(g.category.id)),
        [allCategoryGroups, excludedCategoryIds]
    );

    // Expense-only for pie chart
    const expenseGroups = useMemo(
        () => visibleGroups.filter(g => g.category.kind !== "income"),
        [visibleGroups]
    );

    const pieData = useMemo(() =>
        expenseGroups.map(g => ({
            id: g.category.id,
            label: g.category.label,
            value: g.total,
            icon: g.category.icon,
            color: colorMap.get(g.category.id) ?? "#6366f1",
        })),
        [expenseGroups, colorMap]
    );

    // Transactions for the selected category (detail panel)
    const selectedCategory = useMemo(
        () => categories.find(c => c.id === selectedCategoryId) ?? null,
        [categories, selectedCategoryId]
    );

    const selectedTransactions = useMemo(() =>
        selectedCategoryId
            ? userFiltered.filter(t => t.categoryId === selectedCategoryId)
            : [],
        [userFiltered, selectedCategoryId]
    );

    const toggleExclude = (categoryId: string) => {
        setExcludedCategoryIds(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) next.delete(categoryId);
            else next.add(categoryId);
            return next;
        });
        // Also clear selection if we exclude the selected category
        if (selectedCategoryId === categoryId) setSelectedCategoryId(null);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-10 h-10 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm font-medium">Cargando estadísticas…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <p className="text-red-400 font-semibold">Error al conectar con la base de datos</p>
                <p className="text-slate-500 text-sm">{error}</p>
            </div>
        );
    }

    const totalExpenses = expenseGroups.reduce((s, g) => s + g.total, 0);
    const periodLabel = periodMode === "monthly"
        ? `${MONTH_NAMES[month]} ${year}`
        : `Año ${year}`;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Estadísticas
                    </h1>
                    <p className="mt-1 text-slate-400 font-medium">
                        Análisis de gastos — {periodLabel}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Period */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-white/5">
                        {(["monthly", "annual"] as PeriodMode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => setPeriodMode(m)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                    periodMode === m ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                {m === "monthly" ? "Mensual" : "Anual"}
                            </button>
                        ))}
                    </div>

                    {/* Month navigator */}
                    {periodMode === "monthly" ? (
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-white/5">
                            <button
                                onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
                                className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all text-xs"
                            >‹</button>
                            <span className="px-2 text-xs font-semibold text-slate-200 min-w-[90px] text-center">
                                {MONTH_NAMES[month]} {year}
                            </span>
                            <button
                                onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
                                className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all text-xs"
                            >›</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-white/5">
                            <button onClick={() => setYear(y => y - 1)} className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all text-xs">‹</button>
                            <span className="px-3 text-xs font-semibold text-slate-200">{year}</span>
                            <button onClick={() => setYear(y => y + 1)} className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all text-xs">›</button>
                        </div>
                    )}

                    {/* User */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-white/5">
                        {(["all", "marcos", "camila"] as UserFilter[]).map((u) => (
                            <button
                                key={u}
                                onClick={() => setUserFilter(u)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                    userFilter === u
                                        ? u === "marcos" ? "bg-blue-600 text-white shadow-sm"
                                          : u === "camila" ? "bg-pink-600 text-white shadow-sm"
                                          : "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                {u === "all" ? "Conjunto" : u === "marcos" ? "Marcos" : "Camila"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Category filter chips */}
            {allCategoryGroups.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">
                            Filtrar categorías
                        </span>
                        {excludedCategoryIds.size > 0 && (
                            <button
                                onClick={() => setExcludedCategoryIds(new Set())}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Mostrar todas
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {allCategoryGroups.map(g => {
                            const isExcluded = excludedCategoryIds.has(g.category.id);
                            const color = colorMap.get(g.category.id) ?? "#6366f1";
                            return (
                                <button
                                    key={g.category.id}
                                    onClick={() => toggleExclude(g.category.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                                        isExcluded
                                            ? "border-white/10 text-slate-500 bg-transparent opacity-50"
                                            : "border-white/10 text-slate-200 bg-slate-800/50"
                                    }`}
                                    style={!isExcluded ? { borderColor: `${color}50`, color } : {}}
                                >
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: isExcluded ? "#4b5563" : color }} />
                                    {g.category.icon} {g.category.label}
                                    {isExcluded && <span className="ml-1 text-slate-500">✕</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Summary strip */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/40 border border-white/5 text-sm text-slate-400">
                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>
                    Total gastos en <strong className="text-slate-200">{periodLabel}</strong>
                    {userFilter !== "all" && <span> · <strong className="text-slate-200">{userFilter === "marcos" ? "Marcos" : "Camila"}</strong></span>}
                    {" "}= <strong className="text-indigo-400">{formatEur(totalExpenses)}</strong>
                    {" · "}<span>{expenseGroups.length} categorías</span>
                    {excludedCategoryIds.size > 0 && (
                        <span className="ml-2 text-amber-400/80 text-xs">(excluidas: {excludedCategoryIds.size})</span>
                    )}
                </span>
            </div>

            {/* Categorías block */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">Categorías</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Card 1: Interactive Pie Chart */}
                    <PieChart
                        title="Distribución por categoría"
                        data={pieData}
                        selectedId={selectedCategoryId}
                        onSelect={setSelectedCategoryId}
                    />

                    {/* Card 2: Detailed category breakdown */}
                    <Card>
                        {selectedCategory ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                                        <span
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: colorMap.get(selectedCategory.id) }}
                                        />
                                        {selectedCategory.icon} {selectedCategory.label}
                                    </h3>
                                    <button
                                        onClick={() => setSelectedCategoryId(null)}
                                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        ✕ Volver
                                    </button>
                                </div>

                                {/* Mini totals */}
                                <div className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-0.5">Total</p>
                                        <p className="text-lg font-bold text-white">{formatEur(selectedTransactions.reduce((s, t) => {
                                            const amt = userFilter !== "all" && t.userId === "pareja" ? Math.round(t.amountCents / 2) : t.amountCents;
                                            return s + amt;
                                        }, 0))}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-0.5">Movimientos</p>
                                        <p className="text-lg font-bold text-slate-300">{selectedTransactions.length}</p>
                                    </div>
                                </div>

                                {/* Transactions list inline */}
                                <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                                    {selectedTransactions.length === 0 ? (
                                        <p className="text-slate-500 text-sm text-center py-6">No hay movimientos en este periodo.</p>
                                    ) : (
                                        selectedTransactions.map(tx => {
                                            const user = users.find(u => u.id === tx.userId);
                                            return (
                                                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-lg shrink-0">
                                                            {selectedCategory.icon}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-slate-200 font-medium truncate">
                                                                    {tx.note || selectedCategory.label}
                                                                </span>
                                                                {user && (
                                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 ${
                                                                        user.id === "marcos" ? "border-blue-500/30 text-blue-400"
                                                                        : user.id === "camila" ? "border-pink-500/30 text-pink-400"
                                                                        : "border-slate-500/30 text-slate-400"
                                                                    }`}>
                                                                        {user.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(tx.date)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                                                        {userFilter !== "all" && tx.userId === "pareja" && (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-yellow-500/30 text-yellow-500/80">50%</span>
                                                        )}
                                                        <span className="text-sm font-bold text-slate-200">
                                                            -{formatEur(userFilter !== "all" && tx.userId === "pareja" ? Math.round(tx.amountCents / 2) : tx.amountCents)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-base font-bold text-slate-200">Top categorías</h3>
                                <div className="space-y-3">
                                    {visibleGroups.length === 0 ? (
                                        <p className="text-slate-500 text-sm text-center py-6">No hay datos</p>
                                    ) : (
                                        visibleGroups.map(g => {
                                            const color = colorMap.get(g.category.id) ?? "#6366f1";
                                            const maxTotal = Math.max(...visibleGroups.map(vg => vg.total), 100);
                                            const pct = (g.total / maxTotal) * 100;
                                            return (
                                                <div
                                                    key={g.category.id}
                                                    onClick={() => setSelectedCategoryId(g.category.id)}
                                                    className="group cursor-pointer"
                                                >
                                                    <div className="flex items-center justify-between mb-1.5 group-hover:translate-x-1 transition-transform duration-200">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="w-6 h-6 rounded-lg bg-zinc-800/50 flex items-center justify-center group-hover:bg-zinc-700/50 transition-colors shrink-0">
                                                                <span className="text-xs">{g.category.icon}</span>
                                                            </div>
                                                            <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors truncate">
                                                                {g.category.label}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">
                                                            {formatEur(g.total)}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full bg-zinc-800/30 rounded-full overflow-hidden border border-white/5">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                                            style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-600 text-center pt-1">Haz clic en una categoría o en el gráfico para ver el detalle</p>
                            </div>
                        )}
                    </Card>
                </div>
            </section>
        </div>
    );
}
