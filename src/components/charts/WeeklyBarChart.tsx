"use client";

import { useState, useMemo, useEffect } from "react";
import Card from "@/components/Card";
import SectionHeader from "@/components/SectionHeader";
import { formatEur, calculateTotals, getWeeksOfMonth, getCurrentWeekIdx } from "@/lib/finance";
import { Transaction, Category } from "@/types";
import { theme } from "@/lib/theme";

type WeeklyBarChartProps = {
    title: string;
    transactions: Transaction[];
    categories: Category[];
    month: number;
    year: number;
    currentUserId?: string | null;
    selectedWeekIdx?: number;
    onWeekChange?: (idx: number) => void;
};

export default function WeeklyBarChart({
    title,
    transactions,
    categories,
    month,
    year,
    currentUserId = null,
    selectedWeekIdx: controlledIdx,
    onWeekChange
}: WeeklyBarChartProps) {

    const weeks = useMemo(() => getWeeksOfMonth(year, month), [year, month]);

    // Internal state only fallback if not controlled
    const [internalIdx, setInternalIdx] = useState(() => getCurrentWeekIdx(weeks, month, year));

    const activeIdx = controlledIdx !== undefined ? controlledIdx : internalIdx;
    const setActiveIdx = onWeekChange || setInternalIdx;

    useEffect(() => {
        if (controlledIdx === undefined) {
            setInternalIdx(getCurrentWeekIdx(weeks, month, year));
        }
    }, [month, year, weeks, controlledIdx]);

    const safeIdx = Math.min(activeIdx, weeks.length - 1);
    const selectedWeek = weeks[safeIdx] || weeks[0];

    // Filtramos las transacciones por la semana seleccionada o si son fijos/ingresos
    const weeklyTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (!t.date) return false;
            // Evitar problemas de timezone: "2026-02-15T00:00:00Z" -> "2026-02-15"
            const dateStr = t.date.split('T')[0];
            const [yStr, mStr, dStr] = dateStr.split('-');
            const tYear = parseInt(yStr, 10);
            const tMonth = parseInt(mStr, 10) - 1; // 0-indexed
            const tDay = parseInt(dStr, 10);

            // Siempre deben pertenecer al mes y año actual
            if (tYear !== year || tMonth !== month) return false;

            const cat = categories.find(c => c.id === t.categoryId);
            const isFixedOrIncome = cat?.kind === 'fixed' || cat?.kind === 'income';

            // Si es Fijo o Ingreso, lo mostramos independientemente del día (como si hubiese sido en semana 1 y se arrastra)
            if (isFixedOrIncome) {
                return true;
            }

            // Para el resto (Variables, Ahorros, Inversiones), evaluamos de forma acumulativa hasta la semana actual
            return (
                tDay >= 1 &&
                tDay <= selectedWeek.endDay
            );
        });
    }, [transactions, month, year, selectedWeek, categories]);

    // Recalcular los totales siempre que cambien los datos semanales
    const totals = useMemo(() =>
        calculateTotals(weeklyTransactions, categories, currentUserId),
        [weeklyTransactions, categories, currentUserId]
    );

    // Joint savings (explicit shared saving txs)
    const jointSavings = useMemo(() => {
        let js = 0;
        weeklyTransactions.forEach(tx => {
            const cat = categories.find(c => c.id === tx.categoryId);
            if (cat?.kind === 'saving' && cat.scope === 'shared' && (!currentUserId || tx.userId === currentUserId)) {
                js += tx.amountCents;
            }
        });
        return js;
    }, [weeklyTransactions, categories, currentUserId]);

    // Accumulate joint + personal surplus from previous months of this year
    const prevAccumulated = useMemo(() => {
        const prevTxs = transactions.filter(t => {
            if (!t.date) return false;
            const [yStr, mStr] = t.date.split('T')[0].split('-');
            return parseInt(yStr) === year && parseInt(mStr) - 1 < month;
        });

        let prevJoint = 0;
        let prevPersonalSurplus = 0;
        // month by month to get surplus
        for (let m = 0; m < month; m++) {
            const mStart = new Date(year, m, 1).toISOString().split('T')[0];
            const mEnd = new Date(year, m + 1, 0).toISOString().split('T')[0];
            const mTxs = prevTxs.filter(t => t.date >= mStart && t.date <= mEnd);
            const mt = calculateTotals(mTxs, categories, currentUserId);
            let mJS = 0;
            mTxs.forEach(tx => {
                const cat = categories.find(c => c.id === tx.categoryId);
                if (cat?.kind === 'saving' && cat.scope === 'shared' && (!currentUserId || tx.userId === currentUserId))
                    mJS += tx.amountCents;
            });
            prevJoint += mJS;
            prevPersonalSurplus += Math.max(0, mt.income - mt.fixed - mt.recurring - mt.invested - mJS);
        }
        return { prevJoint, prevPersonalSurplus };
    }, [transactions, year, month, categories, currentUserId]);

    // Current week cumulative values
    const MAX_Y_CENTS = 399400;
    const currentMonthSurplus = totals.income - totals.fixed - totals.recurring - totals.invested - jointSavings;
    const dynamicJoint = Math.max(0, prevAccumulated.prevJoint + jointSavings);
    const dynamicPersonal = Math.max(0, prevAccumulated.prevPersonalSurplus + currentMonthSurplus);

    // Data points for the bar chart
    const dataPoints = [
        { label: "Gastos Fijos", value: totals.fixed, color: theme.chart.fixed },
        { label: "Gastos Recur.", value: totals.recurring, color: theme.chart.variable },
        { label: "Ingresos", value: totals.income, color: theme.chart.income },
        { label: "Ah. Pareja", value: dynamicJoint, color: theme.chart.saving },
        ...(currentUserId ? [{ label: "Ah. Personal", value: dynamicPersonal, color: "#818cf8" }] : []),
        { label: "Inversión", value: totals.invested, color: theme.chart.investment },
    ];

    return (
        <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <SectionHeader title={title} />

                {/* Botones de Semanas */}
                <div className="flex flex-wrap gap-2">
                    {weeks.map((w, i) => (
                        <button
                            key={w.label}
                            onClick={() => setActiveIdx(w.idx)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${safeIdx === w.idx
                                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-transparent"
                                }`}
                        >
                            {w.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenedor del Gráfico de Barras Verticales */}
            <div className="relative w-full h-[280px] flex items-end pt-8 pb-8 px-2 sm:px-6">
                {/* Líneas de cuadrícula (Grid lines) */}
                <div className="absolute inset-x-0 bottom-8 top-8 flex flex-col justify-between pointer-events-none z-0">
                    {[1, 0.75, 0.5, 0.25, 0].map((t) => {
                        const val = MAX_Y_CENTS * t;
                        return (
                            <div key={t} className="w-full flex items-center h-0 relative pl-12 sm:pl-16">
                                <span className="absolute left-0 w-12 sm:w-16 text-right pr-2 text-[10px] text-slate-500 -translate-y-1/2 overflow-visible">
                                    {val > 0 ? (val / 100).toFixed(0) + " €" : "0"}
                                </span>
                                <div className="flex-1 border-t border-dashed border-slate-700/50" />
                            </div>
                        );
                    })}
                </div>

                {/* Barras */}
                <div className="w-full h-full flex justify-between items-end z-10 gap-2 sm:gap-6 pl-10 sm:pl-16">
                    {dataPoints.map((dp, i) => {
                        // Limitar la altura al 100% (MAX_Y_CENTS) si superara límite, aunque se dibuja usando ese MAX
                        const percentage = Math.min((dp.value / MAX_Y_CENTS) * 100, 100);

                        return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                {/* Tooltip on Hover */}
                                <div className="absolute -top-8 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg whitespace-nowrap z-20">
                                    {dp.label}: {formatEur(dp.value)}
                                </div>

                                {/* Barra (Vertical) */}
                                <div className="w-full h-full max-w-[40px] bg-slate-800/50 rounded-t-sm relative flex items-end justify-center overflow-hidden">
                                    <div
                                        className="w-full rounded-t-sm transition-all duration-500 ease-out"
                                        style={{
                                            height: `${percentage}%`,
                                            backgroundColor: dp.color,
                                            boxShadow: `0 0 10px ${dp.color}40`
                                        }}
                                    />
                                </div>

                                {/* Valor numérico (Euros) visible directamente */}
                                <div
                                    className="absolute w-full flex justify-center text-[9px] sm:text-[11px] font-bold text-slate-200 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-20 pointer-events-none transition-all duration-500 ease-out"
                                    style={{ bottom: `calc(${percentage}% + 6px)` }}
                                >
                                    {dp.value > 0 ? (dp.value / 100).toFixed(0) + "€" : ""}
                                </div>

                                {/* Etiqueta X (Label) */}
                                <div className="absolute -bottom-6 text-[10px] sm:text-xs font-medium text-slate-400 text-center truncate w-full">
                                    {dp.label.split(" ")[0]}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="mt-4 flex justify-end px-4 sm:px-10 text-[10px] sm:text-xs text-slate-500">
                <span>{selectedWeek.startDay} al {selectedWeek.endDay} {new Date(year, month).toLocaleString('es-ES', { month: 'short' })}</span>
            </div>
        </Card>
    );
}
