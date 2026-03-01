"use client";

import { useState, useMemo } from "react";
import { useFinance } from "@/store/finance-store";
import {
    filterByMonthYear,
    filterByYear,
    calculateTotals,
    groupByCategory,
    getDailyTotals,
    getMonthlyTotalsForYear,
    formatEur,
    getAccumulatedSavings,
    getWeeksOfMonth,
    getCurrentWeekIdx
} from "@/lib/finance";
import { ViewMode, MonthYear, Transaction } from "@/types";
import { theme } from "@/lib/theme";
import StatCard from "@/components/StatCard";
import Card from "@/components/Card";
import TransactionsList from "@/components/TransactionsList";
import MonthYearSelector from "@/components/MonthYearSelector";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import WeeklyBarChart from "@/components/charts/WeeklyBarChart";
import AnnualChart from "@/components/charts/AnnualChart";
import AddPaymentModal from "@/components/AddPaymentModal";
import TransactionCalendar from "@/components/TransactionCalendar";

export default function DashboardPage() {
    const { transactions, categories, users, loading, error } = useFinance();

    const [viewMode, setViewMode] = useState<ViewMode>("monthly");
    const [date, setDate] = useState<MonthYear>(() => {
        const now = new Date();
        return { month: now.getMonth(), year: now.getFullYear() };
    });

    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);

    // Manage Selected Week for the Whole Dashboard
    const weeks = useMemo(() => getWeeksOfMonth(date.year, date.month), [date.year, date.month]);
    const [selectedWeekIdx, setSelectedWeekIdx] = useState(() => getCurrentWeekIdx(weeks, date.month, date.year));

    // Filter based on view mode
    const filtered = useMemo(() => {
        const fullMonth = filterByMonthYear(transactions, date.month, date.year);
        if (viewMode !== "monthly") return filterByYear(transactions, date.year);

        const currentWeek = weeks[selectedWeekIdx] || weeks[0];
        return fullMonth.filter((t: Transaction) => {
            if (!t.date) return false;
            const dateStr = t.date.split('T')[0];
            const tDay = parseInt(dateStr.split('-')[2], 10);

            const cat = categories.find(c => c.id === t.categoryId);
            const isFixedOrIncome = cat?.kind === 'fixed' || cat?.kind === 'income';

            // Fixed/Income always from Day 1. Others up to current week.
            if (isFixedOrIncome) return true;
            return tDay <= currentWeek.endDay;
        });
    }, [transactions, viewMode, date, selectedWeekIdx, weeks, categories]);

    const upToDay = viewMode === "monthly" ? (weeks[selectedWeekIdx]?.endDay || 31) : 31;

    // Calculate Totals (Couple View - No userId)
    const { income, fixed, recurring, invested, spent, balance } = calculateTotals(filtered, categories, null);

    // Joint savings YTD (explicit shared saving transactions, cumulative up to current week)
    const jointSavingsYTD = useMemo(() => {
        let total = 0;
        transactions.forEach((tx: Transaction) => {
            if (!tx.date) return;
            const [yStr, mStr, dStr] = tx.date.split('T')[0].split('-');
            const tYear = parseInt(yStr), tMonth = parseInt(mStr) - 1, tDay = parseInt(dStr);
            if (tYear !== date.year) return;
            if (tMonth > date.month) return;
            if (tMonth === date.month && tDay > upToDay) return;
            const cat = categories.find(c => c.id === tx.categoryId);
            if (cat?.kind === 'saving' && cat.scope === 'shared')
                total += tx.amountCents;
        });
        return total;
    }, [transactions, date, upToDay, categories]);

    // Charts Data
    const chartData = viewMode === "monthly"
        ? {
            spent: getDailyTotals(filtered, date.month, date.year, categories, "variable", null),
            income: getDailyTotals(filtered, date.month, date.year, categories, "income", null),
        }
        : {
            spent: getMonthlyTotalsForYear(transactions, date.year, categories, "variable", null),
            income: getMonthlyTotalsForYear(transactions, date.year, categories, "income", null),
        };

    const lineSeries = [
        { name: "Ingresos", data: chartData.income, color: theme.chart.earned },
        { name: "Gastos (Var)", data: chartData.spent, color: theme.chart.spent },
    ];

    // Top Categories
    const categoryGroups = groupByCategory(filtered, categories, null);
    const topCategories = categoryGroups.slice(0, 5).map(g => ({
        label: g.category.label,
        value: g.total,
        icon: g.category.icon,
        color: g.limitStatus === 'exceeded' ? '#ef4444' : (theme.chart[g.category.kind] || theme.chart.variable), // Red if exceeded
        limitStatus: g.limitStatus
    }));

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-10 h-10 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm font-medium">Cargando datos financieros…</p>
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

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Dashboard General</h1>
                    <p className="mt-1 text-slate-400 font-medium">Resumen financiero conjunto</p>
                </div>

                <MonthYearSelector
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    selectedDate={date}
                    setSelectedDate={setDate}
                />
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
                <StatCard
                    label="Ingresos"
                    value={formatEur(income)}
                    trend="up"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                />
                <StatCard
                    label="Gastos Fijos"
                    value={formatEur(fixed)}
                    trend="down"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                />
                <StatCard
                    label="Gastos Recur."
                    value={formatEur(recurring)}
                    trend="down"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>}
                />
                <StatCard
                    label="Ah. Pareja"
                    value={formatEur(jointSavingsYTD)}
                    trend="up"
                    subtitle="Acumulado Año"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                    label="Inversiones"
                    value={formatEur(invested)}
                    trend="up"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                />
                <StatCard
                    label="Disponible"
                    value={formatEur(balance)}
                    trend={balance > 0 ? "up" : "down"}
                    subtitle="Neto mensual"
                />
            </div>

            {/* Main Charts Section (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:min-h-[350px]">
                <div className="lg:col-span-2 flex flex-col">
                    {viewMode === "monthly" ? (
                        <WeeklyBarChart
                            title="Flujo de caja semanal"
                            transactions={transactions}
                            categories={categories}
                            month={date.month}
                            year={date.year}
                            selectedWeekIdx={selectedWeekIdx}
                            onWeekChange={setSelectedWeekIdx}
                        />
                    ) : (
                        <AnnualChart
                            transactions={transactions}
                            categories={categories}
                            year={date.year}
                        />
                    )}
                </div>

                <div className="flex flex-col">
                    <BarChart
                        title="Top Categorías"
                        data={topCategories}
                    />
                </div>
            </div>

            {/* Recent Transactions Full Width - current month only */}
            <div className="grid grid-cols-1">
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-200">Últimos movimientos</h3>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowCalendar(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/60 border border-white/5 text-slate-400 hover:text-white hover:border-white/15 hover:bg-slate-700/60 transition-all"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Calendario
                            </button>
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Este mes</span>
                        </div>
                    </div>
                    <TransactionsList
                        transactions={filterByMonthYear(transactions, date.month, date.year)}
                        categories={categories}
                        users={users}
                        limit={8}
                        onEdit={setEditingTx}
                    />
                </Card>
            </div>

            <AddPaymentModal
                isOpen={!!editingTx}
                onClose={() => setEditingTx(null)}
                initialData={editingTx}
            />

            {showCalendar && (
                <TransactionCalendar
                    transactions={transactions}
                    categories={categories}
                    initialMonth={date.month}
                    initialYear={date.year}
                    onClose={() => setShowCalendar(false)}
                />
            )}
        </div>
    );
}
