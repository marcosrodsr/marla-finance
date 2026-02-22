"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";
import SectionHeader from "@/components/SectionHeader";
import {
    formatEur,
    getMonthlyTotalsForYear,
    getMonthlyJointSavingsForYear,
    getMonthlyPersonalSavingsForYear,
} from "@/lib/finance";
import { Transaction, Category } from "@/types";
import { theme } from "@/lib/theme";

type AnnualChartProps = {
    transactions: Transaction[];
    categories: Category[];
    year: number;
    currentUserId?: string | null; // null = couple/general view
};

type ViewModeAnnual = "real" | "projection";

/** SVG coordinate system */
const SVG_W = 1000;
const SVG_H = 280;
const PAD_L = 68;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 36;
const CHART_W = SVG_W - PAD_L - PAD_R;
const CHART_H = SVG_H - PAD_T - PAD_B;

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function xOf(idx: number) {
    return PAD_L + (idx / 11) * CHART_W;
}
function yOf(val: number, maxVal: number) {
    if (maxVal === 0) return PAD_T + CHART_H;
    return PAD_T + CHART_H - (Math.max(0, val) / maxVal) * CHART_H;
}
function bezierPath(pts: [number, number][]): string {
    if (pts.length < 2) return "";
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[i];
        const c = pts[i + 1];
        const e = pts[Math.min(pts.length - 1, i + 2)];
        const t = 0.18;
        d += ` C${(b[0] + (c[0] - a[0]) * t).toFixed(1)},${(b[1] + (c[1] - a[1]) * t).toFixed(1)} ${(c[0] - (e[0] - b[0]) * t).toFixed(1)},${(c[1] - (e[1] - b[1]) * t).toFixed(1)} ${c[0]},${c[1]}`;
    }
    return d;
}

/** Converts a monthly values array → cumulative running totals up to curMonth, 0 beyond */
function toCumulative(monthly: number[], curMonth: number): number[] {
    let acc = 0;
    return monthly.map((v, i) => {
        if (i <= curMonth) { acc += v; return acc; }
        return 0;
    });
}

export default function AnnualChart({ transactions, categories, year, currentUserId = null }: AnnualChartProps) {
    const [mode, setMode] = useState<ViewModeAnnual>("real");
    const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

    const isPersonal = currentUserId !== null;

    const { series, maxVal, curMonth } = useMemo(() => {
        const today = new Date();
        const curMonth = today.getFullYear() === year ? today.getMonth() : (today.getFullYear() > year ? 11 : -1);
        const getSD = (kind: any) => getMonthlyTotalsForYear(transactions, year, categories, kind, currentUserId);

        // --- Raw monthly arrays ---
        const mIncome = getSD("income").map(d => d.value);
        const mFixed = getSD("fixed").map(d => d.value);
        const mRec = getSD("variable").map(d => d.value); // recurring
        const mInv = getSD("investment").map(d => d.value);

        // Joint savings: explicit shared saving transactions
        const mJoint = getMonthlyJointSavingsForYear(transactions, year, categories, currentUserId).map(d => d.value);

        // Personal surplus: income - fixed - recurring - investments - joint savings
        const mPersonal = getMonthlyPersonalSavingsForYear(transactions, year, categories, currentUserId).map(d => d.value);

        // Build series list based on view type
        const rawSeries: Array<{ id: string; name: string; monthly: number[]; color: string }> = [
            { id: "income", name: "Ingresos", monthly: mIncome, color: theme.chart.income },
            { id: "fixed", name: "Gastos Fijos", monthly: mFixed, color: theme.chart.fixed },
            { id: "recurring", name: "Gastos Recur.", monthly: mRec, color: theme.chart.variable },
            { id: "joint", name: "Ahorros Pareja", monthly: mJoint, color: theme.chart.saving },
            { id: "investment", name: "Inversión", monthly: mInv, color: theme.chart.investment },
        ];

        // Only add personal savings in personal (user-specific) views
        if (isPersonal) {
            rawSeries.push({
                id: "personal",
                name: "Ahorro Personal",
                monthly: mPersonal,
                color: "#818cf8", // indigo-400
            });
        }

        // Build cumulative values for past months
        const cumulSeries = rawSeries.map(s => ({
            ...s,
            cumul: toCumulative(s.monthly, curMonth),
        }));

        // Projection averages
        const past = Math.max(1, curMonth + 1);
        const avgOf = (arr: number[]) => arr.slice(0, past).reduce((a, b) => a + b, 0) / past;

        // Build final points for each series
        const series = cumulSeries.map(s => {
            const avg = avgOf(s.monthly);
            const lastReal = s.cumul[curMonth] ?? 0;
            return {
                id: s.id,
                name: s.name,
                color: s.color,
                data: s.cumul, // for detail panel
                points: s.cumul.map((val, i) => {
                    const future = i > curMonth;
                    if (!future) return { val, future };
                    const projected = Math.max(0, lastReal + avg * (i - curMonth));
                    return { val: projected, future };
                }),
            };
        });

        let mVal = 100;
        series.forEach(s => s.points.forEach(p => {
            if (!(mode === "real" && p.future) && p.val > mVal) mVal = p.val;
        }));

        return { series, maxVal: mVal * 1.18, curMonth };
    }, [transactions, categories, year, currentUserId, mode, isPersonal]);

    const displayMonth = hoveredMonth ?? curMonth;
    const displayIsFuture = displayMonth > curMonth;

    return (
        <Card className="flex flex-col w-full">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <SectionHeader title="Evolución y Proyección Anual" />
                <div className="flex bg-slate-800/80 border border-slate-700/50 p-1 rounded-xl gap-1">
                    {(["real", "projection"] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${mode === m ? "bg-slate-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
                        >
                            {m === "real" ? "Realidad" : "Proyección"}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Chart SVG ── */}
            <div className="w-full overflow-x-auto pb-4 overscroll-x-contain hide-scrollbar" onMouseLeave={() => setHoveredMonth(null)}>
                <div className="min-w-[600px] sm:min-w-full">
                    <svg
                        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                        preserveAspectRatio="xMidYMid meet"
                        className="w-full"
                        style={{ height: "auto", minHeight: 220, maxHeight: 320 }}
                    >
                        {/* Y grid lines + labels */}
                        {Array.from({ length: 6 }, (_, i) => {
                            const t = i / 5;
                            const val = maxVal * (1 - t);
                            const y = PAD_T + CHART_H * t;
                            return (
                                <g key={i}>
                                    <line x1={PAD_L} y1={y} x2={PAD_L + CHART_W} y2={y}
                                        stroke={i === 5 ? "#334155" : "#1e293b"}
                                        strokeWidth={i === 5 ? "1.5" : "1"}
                                        strokeDasharray={i === 0 || i === 5 ? "none" : "5 5"} />
                                    <text x={PAD_L - 10} y={y} textAnchor="end" dominantBaseline="middle"
                                        fill="#475569" fontSize="11" fontFamily="ui-sans-serif,system-ui,sans-serif">
                                        {val > 0 ? `${(val / 100).toFixed(0)}€` : "0"}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Month hover zones + X labels */}
                        {MONTHS.map((label, i) => {
                            const x = xOf(i);
                            const colW = CHART_W / 12;
                            const future = i > curMonth;
                            const isHov = hoveredMonth === i;
                            const isCur = i === curMonth;
                            return (
                                <g key={i}>
                                    <rect
                                        x={x - colW / 2} y={PAD_T}
                                        width={colW} height={CHART_H}
                                        fill={isHov ? "rgba(99,102,241,0.08)" : "transparent"}
                                        rx="4"
                                        style={{ cursor: "crosshair" }}
                                        onMouseEnter={() => {
                                            if (mode === "real" && future) return;
                                            setHoveredMonth(i);
                                        }}
                                    />
                                    {isHov && (
                                        <line x1={x} y1={PAD_T} x2={x} y2={PAD_T + CHART_H}
                                            stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" opacity={0.5} />
                                    )}
                                    {isCur && !isHov && (
                                        <rect x={x - colW / 2} y={PAD_T} width={colW} height={CHART_H}
                                            fill="rgba(99,102,241,0.04)" rx="4" />
                                    )}
                                    <text x={x} y={PAD_T + CHART_H + 22}
                                        textAnchor="middle"
                                        fill={isCur ? "#818cf8" : future ? "#374151" : "#64748b"}
                                        fontSize="12" fontFamily="ui-sans-serif,system-ui,sans-serif"
                                        fontWeight={isCur ? "700" : "400"}>
                                        {label}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Series lines + dots */}
                        {series.map(s => {
                            const realCoords: [number, number][] = [];
                            const projCoords: [number, number][] = [];

                            s.points.forEach((p, i) => {
                                const coord: [number, number] = [xOf(i), yOf(p.val, maxVal)];
                                if (i <= curMonth) realCoords.push(coord);
                                if (i >= curMonth) projCoords.push(coord);
                            });

                            return (
                                <g key={s.id}>
                                    {realCoords.length >= 2 && (
                                        <path d={bezierPath(realCoords)} fill="none"
                                            stroke={s.color} strokeWidth="2.5"
                                            strokeLinecap="round" strokeLinejoin="round" />
                                    )}
                                    {mode === "projection" && projCoords.length >= 2 && (
                                        <path d={bezierPath(projCoords)} fill="none"
                                            stroke={s.color} strokeWidth="2"
                                            strokeLinecap="round" strokeLinejoin="round"
                                            strokeDasharray="7 5" opacity={0.55} />
                                    )}
                                    {s.points.map((p, i) => {
                                        if (mode === "real" && p.future) return null;
                                        const isHov = hoveredMonth === i;
                                        return (
                                            <circle key={i}
                                                cx={xOf(i)} cy={yOf(p.val, maxVal)}
                                                r={isHov ? 5 : 3.5}
                                                fill={isHov ? s.color : "#0f172a"}
                                                stroke={s.color} strokeWidth="2"
                                                opacity={p.future ? 0.55 : 1}
                                                style={{ transition: "r 0.12s" }} />
                                        );
                                    })}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* ── Legend ── */}
            <div className="flex flex-wrap items-center justify-center gap-5 mt-1 mb-5 text-xs font-medium text-slate-400">
                {series.map(s => (
                    <div key={s.id} className="flex items-center gap-2">
                        <svg width="22" height="10" viewBox="0 0 22 10">
                            <line x1="0" y1="5" x2="14" y2="5" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" />
                            <circle cx="18" cy="5" r="3.5" fill="#0f172a" stroke={s.color} strokeWidth="2" />
                        </svg>
                        <span>{s.name}</span>
                    </div>
                ))}
            </div>

            {/* ── Monthly detail panel ── */}
            <div className="rounded-2xl border border-slate-700/40 bg-slate-800/30 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/40">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-200 tracking-tight">
                            {MONTHS[displayMonth]} {year}
                        </span>
                        {displayIsFuture && (
                            <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-2 py-0.5 rounded-full">
                                Proyectado
                            </span>
                        )}
                        <span className="text-xs text-slate-500 ml-1">(acumulado)</span>
                    </div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-widest">Detalle mensual</span>
                </div>

                <div className={`grid grid-cols-2 sm:grid-cols-3 ${isPersonal ? "lg:grid-cols-6" : "lg:grid-cols-5"} gap-px bg-slate-700/30`}>
                    {series.map(s => {
                        const val = s.points[displayMonth]?.val ?? 0;
                        return (
                            <div key={s.id} className="flex flex-col gap-2 bg-slate-900/50 px-5 py-4 hover:bg-slate-800/60 transition-colors duration-150">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                                    <span className="text-[11px] font-semibold text-slate-400 truncate">{s.name}</span>
                                </div>
                                <span className="text-[22px] font-bold text-slate-100 leading-none tabular-nums tracking-tight">
                                    {formatEur(val)}
                                </span>
                                <div className="h-0.5 rounded-full mt-1" style={{ backgroundColor: s.color, opacity: 0.4, width: '60%' }} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
}
