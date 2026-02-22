import { useState, useMemo } from "react";
import { Transaction, Category } from "@/types";
import { formatEur } from "@/lib/finance";
import { FIXED_NAMES } from "@/lib/finance";
import { theme } from "@/lib/theme";

const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const DAY_NAMES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

type Props = {
    transactions: Transaction[];
    categories: Category[];
    initialMonth?: number;
    initialYear?: number;
    onClose: () => void;
};

function kindColor(kind: string, name: string): string {
    if (kind === "income") return "#34d399";
    if (kind === "saving") return "#a78bfa";
    if (kind === "investment") return "#60a5fa";
    if (FIXED_NAMES.includes(name)) return "#f97316";
    return "#64748b";
}

export default function TransactionCalendar({ transactions, categories, initialMonth, initialYear, onClose }: Props) {
    const now = new Date();
    const [viewMonth, setViewMonth] = useState(initialMonth ?? now.getMonth());
    const [viewYear, setViewYear] = useState(initialYear ?? now.getFullYear());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const goBack = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
        setSelectedDay(null);
    };
    const goFwd = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
        setSelectedDay(null);
    };

    // Build calendar cell data
    const { cells, txsByDay } = useMemo(() => {
        const monthStart = new Date(viewYear, viewMonth, 1);
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

        // Monday-based: 0=Mon … 6=Sun
        const firstDow = (monthStart.getDay() + 6) % 7;

        // Filter transactions for this month/year
        const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
        const monthTxs = transactions.filter(tx => tx.date?.startsWith(monthStr));

        // Group by day number
        const byDay: Record<number, Transaction[]> = {};
        monthTxs.forEach(tx => {
            const d = parseInt(tx.date.split("-")[2]);
            if (!byDay[d]) byDay[d] = [];
            byDay[d].push(tx);
        });

        // Build grid cells (null = padding)
        const cells: (number | null)[] = [
            ...Array(firstDow).fill(null),
            ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
        ];
        // Pad to full weeks
        while (cells.length % 7 !== 0) cells.push(null);

        return { cells, txsByDay: byDay };
    }, [transactions, viewMonth, viewYear]);

    const selectedTxs = selectedDay ? (txsByDay[selectedDay] || []) : [];
    const today = new Date();
    const isToday = (d: number) => d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

    // Compute day total (expense = negative, income = positive)
    const dayTotal = (d: number) => {
        const txs = txsByDay[d] || [];
        let total = 0;
        txs.forEach(tx => {
            const cat = categories.find(c => c.id === tx.categoryId);
            if (!cat) return;
            total += cat.kind === "income" ? tx.amountCents : -tx.amountCents;
        });
        return total;
    };

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <button
                        onClick={goBack}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/60 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all"
                    >
                        ‹
                    </button>
                    <div className="text-center">
                        <p className="text-xl font-bold text-white tracking-tight">
                            {MONTH_NAMES[viewMonth]} {viewYear}
                        </p>
                    </div>
                    <button
                        onClick={goFwd}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/60 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all"
                    >
                        ›
                    </button>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                        ×
                    </button>
                </div>

                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 px-4 pb-1">
                    {DAY_NAMES.map(d => (
                        <div key={d} className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider py-1">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 px-4 gap-px">
                    {cells.map((day, idx) => {
                        if (!day) return <div key={`pad-${idx}`} />;
                        const txs = txsByDay[day] || [];
                        const total = dayTotal(day);
                        const isSelected = selectedDay === day;
                        const hasData = txs.length > 0;
                        const dots = txs.slice(0, 4).map(tx => {
                            const cat = categories.find(c => c.id === tx.categoryId);
                            return cat ? kindColor(cat.kind, cat.label) : "#64748b";
                        });

                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(isSelected ? null : day)}
                                className={`
                                    relative flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-150 group
                                    ${isSelected ? "bg-indigo-600/20 ring-1 ring-indigo-500/40" : "hover:bg-white/5"}
                                    ${isToday(day) ? "ring-1 ring-indigo-400/60" : ""}
                                `}
                            >
                                <span className={`text-sm font-semibold mb-1 ${isToday(day) ? "text-indigo-400" : isSelected ? "text-white" : "text-slate-300"}`}>
                                    {day}
                                </span>

                                {/* Dot indicators */}
                                {hasData && (
                                    <div className="flex gap-0.5 flex-wrap justify-center mb-0.5">
                                        {dots.map((color, i) => (
                                            <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                        ))}
                                    </div>
                                )}

                                {/* Net daily amount */}
                                {hasData && (
                                    <span className={`text-[9px] font-bold tabular-nums ${total >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {total >= 0 ? "+" : ""}{(total / 100).toFixed(0)}€
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Selected day detail */}
                {selectedDay && (
                    <div className="mt-4 mx-4 mb-4 rounded-2xl border border-white/10 bg-slate-800/50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-200">
                                {selectedDay} {MONTH_NAMES[viewMonth]}
                            </span>
                            <span className="text-xs text-slate-500">{selectedTxs.length} movimiento{selectedTxs.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
                            {selectedTxs.map(tx => {
                                const cat = categories.find(c => c.id === tx.categoryId);
                                const color = cat ? kindColor(cat.kind, cat.label) : "#64748b";
                                const isIncome = cat?.kind === "income";
                                return (
                                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                                        <span className="text-xl">{cat?.icon || "📝"}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-200 truncate">{cat?.label || "Desconocido"}</p>
                                            {tx.note && <p className="text-xs text-slate-500 truncate">{tx.note}</p>}
                                        </div>
                                        <span className={`text-sm font-bold tabular-nums ${isIncome ? "text-emerald-400" : "text-slate-300"}`}>
                                            {isIncome ? "+" : "-"}{formatEur(tx.amountCents)}
                                        </span>
                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {!selectedDay && (
                    <p className="text-center text-slate-600 text-xs py-4">
                        Toca un día para ver sus movimientos
                    </p>
                )}
            </div>
        </div>
    );
}
