"use client";

import { useState, useMemo } from "react";
import { useFinance } from "@/store/finance-store";
import {
    filterByMonthYear,
    filterByYear,
    getPersonalViewTransactions,
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
import WeeklyBarChart from "@/components/charts/WeeklyBarChart";
import AnnualChart from "@/components/charts/AnnualChart";
import BarChart from "@/components/charts/BarChart";
import AddPaymentModal from "@/components/AddPaymentModal";
import TransactionCalendar from "@/components/TransactionCalendar";

type PersonalDashboardProps = {
    userId: string;
    userName: string;
};

export default function PersonalDashboard({ userId, userName }: PersonalDashboardProps) {
    const { transactions, categories, users } = useFinance();

    const [viewMode, setViewMode] = useState<ViewMode>("monthly");
    const [date, setDate] = useState<MonthYear>(() => {
        const now = new Date();
        return { month: now.getMonth(), year: now.getFullYear() };
    });

    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);

    // Filter by user and date (Include Shared)
    const userTransactions = getPersonalViewTransactions(transactions, userId, categories);

    // Manage Selected Week for the Whole Dashboard
    const weeks = useMemo(() => getWeeksOfMonth(date.year, date.month), [date.year, date.month]);
    const [selectedWeekIdx, setSelectedWeekIdx] = useState(() => getCurrentWeekIdx(weeks, date.month, date.year));

    // Filter monthly based on selection
    const filtered = useMemo(() => {
        const fullMonth = filterByMonthYear(userTransactions, date.month, date.year);
        if (viewMode !== "monthly") return filterByYear(userTransactions, date.year);

        const currentWeek = weeks[selectedWeekIdx] || weeks[0];
        return fullMonth.filter(t => {
            const dateStr = t.date.split('T')[0];
            const tDay = parseInt(dateStr.split('-')[2], 10);

            const cat = categories.find(c => c.id === t.categoryId);
            const isFixedOrIncome = cat?.kind === 'fixed' || cat?.kind === 'income';

            // Fixed/Income always from Day 1. Others up to current week.
            if (isFixedOrIncome) return true;
            return tDay <= currentWeek.endDay;
        });
    }, [userTransactions, viewMode, date, selectedWeekIdx, weeks, categories]);

    const upToDay = viewMode === "monthly" ? (weeks[selectedWeekIdx]?.endDay || 31) : 31;

    // Calculate Totals for CURRENT VIEW
    const { income, fixed, recurring, invested } = calculateTotals(filtered, categories, userId);

    // YTD cumulative savings — computed from all transactions up to the current selection
    const savingsJoint = useMemo(() => {
        // Sum of all explicit joint saving txs by this user YTD up to current week/month
        let total = 0;
        transactions.forEach((tx: Transaction) => {
            if (!tx.date) return;
            const [yStr, mStr, dStr] = tx.date.split('T')[0].split('-');
            const tYear = parseInt(yStr), tMonth = parseInt(mStr) - 1, tDay = parseInt(dStr);
            if (tYear !== date.year) return;
            if (tMonth > date.month) return;
            if (tMonth === date.month && tDay > upToDay) return;
            const cat = categories.find(c => c.id === tx.categoryId);
            if (cat?.kind === 'saving' && cat.scope === 'shared' && tx.userId === userId)
                total += tx.amountCents;
        });
        return total;
    }, [transactions, date, upToDay, categories, userId]);

    const savingsPersonal = getAccumulatedSavings(transactions, categories, date.year, date.month, userId, upToDay);


    // Top Categories
    const categoryGroups = groupByCategory(filtered, categories, userId);
    const topCategories = categoryGroups.slice(0, 5).map(g => ({
        label: g.category.label,
        value: g.total,
        icon: g.category.icon,
        color: theme.chart[g.category.kind] || theme.chart.variable,
        limitStatus: g.limitStatus
    }));

    // Find Joint Savings Category for the "Add" button
    const jointSavingsCategory = categories.find(c => c.kind === "saving" && c.scope === "shared");

    const handleAddJointSavings = () => {
        if (jointSavingsCategory) {
            // Use the 1st of the currently selected month so it appears in the current view
            const viewDate = new Date(date.year, date.month, 1);
            // Adjust for timezone offset to avoid previous day? 
            // Using logic: new Date(Y, M, 1) creates local time. toISOString() uses UTC.
            // If local is UTC+1, midnight local is 23:00 previous day UTC.
            // Safe bet: set hours to 12.
            viewDate.setHours(12);

            setEditingTx({
                id: "", // New
                createdAt: "",
                date: viewDate.toISOString().split('T')[0],
                userId: userId, // I am paying
                categoryId: jointSavingsCategory.id,
                amountCents: 0,
                note: "Aportación Ahorro Pareja",
                isShared: true
            } as Transaction);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">Hola, {userName}</h1>
                    <p className="mt-1 text-slate-400 font-medium">Resumen personal detallado</p>
                </div>

                <MonthYearSelector
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    selectedDate={date}
                    setSelectedDate={setDate}
                />
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Ingresos" value={formatEur(income)} trend="up" />
                <StatCard label="Gastos Fijos" value={formatEur(fixed)} trend="down" />
                <StatCard label="Gastos Recur." value={formatEur(recurring)} trend="down" />
                <StatCard label="Ah. Personal" value={formatEur(savingsPersonal)} subtitle="Acumulado Año" />

                <StatCard
                    label="Ah. Pareja"
                    value={formatEur(savingsJoint)}
                    subtitle="Acumulado Año"
                    onClick={handleAddJointSavings}
                    icon={
                        <div className="flex items-center gap-1 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-[10px] font-bold uppercase tracking-wider">+ Aportar</span>
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                    }
                />

                <StatCard label="Inversiones" value={formatEur(invested)} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:min-h-[350px]">
                <div className="lg:col-span-2 flex flex-col">
                    {viewMode === "monthly" ? (
                        <WeeklyBarChart
                            title="Flujo de caja semanal"
                            transactions={userTransactions}
                            categories={categories}
                            month={date.month}
                            year={date.year}
                            currentUserId={userId}
                            selectedWeekIdx={selectedWeekIdx}
                            onWeekChange={setSelectedWeekIdx}
                        />
                    ) : (
                        <AnnualChart
                            transactions={userTransactions}
                            categories={categories}
                            year={date.year}
                            currentUserId={userId}
                        />
                    )}
                </div>
                <div className="flex flex-col">
                    <BarChart
                        title="Tus Top Gastos"
                        data={topCategories}
                    />
                </div>
            </div>

            {/* Recent Transactions - current month only in dashboard */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-200">Tus Movimientos</h3>
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
                        <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Este mes</div>
                    </div>
                </div>
                <TransactionsList
                    transactions={filterByMonthYear(userTransactions, date.month, date.year)}
                    categories={categories}
                    users={users}
                    limit={10}
                    onEdit={setEditingTx}
                    contextUserId={userId}
                />
            </Card>

            <AddPaymentModal
                isOpen={!!editingTx}
                onClose={() => setEditingTx(null)}
                initialData={editingTx}
            />

            {showCalendar && (
                <TransactionCalendar
                    transactions={userTransactions}
                    categories={categories}
                    initialMonth={date.month}
                    initialYear={date.year}
                    onClose={() => setShowCalendar(false)}
                />
            )}
        </div>
    );
}
