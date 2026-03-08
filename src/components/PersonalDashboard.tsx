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
    getCurrentWeekIdx,
    calculateSharedDebt,
    BASE_PERSONAL_DEBT_CENTS
} from "@/lib/finance";
import { ViewMode, MonthYear, Transaction, CategoryKind } from "@/types";
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
import CategoryDetailsModal from "@/components/CategoryDetailsModal";
import { Category } from "@/types";

type PersonalDashboardProps = {
    userId: string;
    userName: string;
};

export default function PersonalDashboard({ userId, userName }: PersonalDashboardProps) {
    const { transactions, categories, users, debtAdjustments } = useFinance();

    const [viewMode, setViewMode] = useState<ViewMode>("monthly");
    const [date, setDate] = useState<MonthYear>(() => {
        const now = new Date();
        return { month: now.getMonth(), year: now.getFullYear() };
    });

    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [kind, setKind] = useState<CategoryKind | null>(null);
    const [categoryId, setCategoryId] = useState<string | null>(null);

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

    // Category modal state
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const selectedCategory = useMemo(() =>
        categories.find(c => c.id === selectedCategoryId) || null,
        [selectedCategoryId, categories]);
    const categoryTransactions = useMemo(() =>
        filtered.filter(t => t.categoryId === selectedCategoryId),
        [filtered, selectedCategoryId]);

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

    const savingsPersonal = getAccumulatedSavings(transactions, categories, date.year, date.month, userId, upToDay, debtAdjustments);
    // sharedDebtSummary is used to show the "netCents" (shared expenses only)

    const sharedDebtSummary = useMemo(() => {
        return calculateSharedDebt(transactions, categories, [], date.month, date.year);
    }, [transactions, categories, date]);

    const personalDebtBalance = useMemo(() => {
        const totalAdjustments = debtAdjustments.reduce((acc, adj) => {
            return acc + (adj.direction === "marcos_to_camila" ? -adj.amountCents : adj.amountCents);
        }, 0);
        return BASE_PERSONAL_DEBT_CENTS + totalAdjustments;
    }, [debtAdjustments]);

    // Shared Debt for current month
    const sharedDebt = userId === "camila" ? (sharedDebtSummary.netCents > 0 ? sharedDebtSummary.netCents : 0) : (sharedDebtSummary.netCents < 0 ? Math.abs(sharedDebtSummary.netCents) : 0);
    const sharedCredit = userId === "marcos" ? (sharedDebtSummary.netCents > 0 ? sharedDebtSummary.netCents : 0) : (sharedDebtSummary.netCents < 0 ? Math.abs(sharedDebtSummary.netCents) : 0);

    // Filtered transactions for the movements list (Month + User + Filters)
    const movementTransactions = useMemo(() => {
        const monthTxs = filterByMonthYear(userTransactions, date.month, date.year);
        let result = monthTxs;
        if (kind) {
            result = result.filter(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                return cat?.kind === kind;
            });
        }
        if (categoryId) {
            result = result.filter(t => t.categoryId === categoryId);
        }
        return result;
    }, [userTransactions, date.month, date.year, kind, categoryId, categories]);

    const userDebtAdjustments = useMemo(() => {
        return debtAdjustments.filter(adj => {
            const d = new Date(adj.date);
            return d.getMonth() === date.month && d.getFullYear() === date.year;
        });
    }, [debtAdjustments, date.month, date.year]);

    const kindLabels: Record<CategoryKind, string> = {
        fixed: "Fijos",
        variable: "Variables",
        saving: "Ahorros",
        investment: "Inversiones",
        income: "Ingresos",
    };
    const categoryGroups = groupByCategory(filtered, categories, userId);
    const topCategories = categoryGroups.map(g => ({
        id: g.category.id,
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
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard label="Ingresos" value={formatEur(income)} trend="up" />
                <StatCard label="Gastos Fijos" value={formatEur(fixed)} trend="down" />
                <StatCard label="Gastos Recur." value={formatEur(recurring)} trend="down" />
                <StatCard label="Ah. Personal" value={formatEur(savingsPersonal)} subtitle="Acumulado Año" />
                <StatCard label="Inversiones" value={formatEur(invested)} />

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

                <StatCard
                    label={sharedDebt > 0 ? "Deuda Mes" : (sharedCredit > 0 ? "Crédito Mes" : "Al día (Mes)")}
                    value={formatEur(sharedDebt || sharedCredit)}
                    subtitle="Gastos compartidos"
                    trend={sharedDebt > 0 ? "down" : (sharedCredit > 0 ? "up" : "neutral")}
                />

                <StatCard
                    label={userId === "camila" ? "Deuda Marcos" : "Deuda Camila"}
                    value={formatEur(personalDebtBalance)}
                    subtitle="Personal (Histórico)"
                    trend="neutral"
                />
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
                        onRowClick={(p) => setSelectedCategoryId(p.id)}
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

                {/* Filters Toolbar */}
                <div className="flex flex-col lg:flex-row gap-6 mb-8 p-4 rounded-2xl bg-slate-800/20 border border-white/5">
                    {/* Kind Filter */}
                    <div className="flex flex-wrap gap-2 flex-1">
                        <button
                            onClick={() => setKind(null)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-300 ${kind === null
                                ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                                : "bg-slate-800/40 text-slate-400 border-white/5 hover:border-white/10 hover:text-slate-200"
                                }`}
                        >
                            Todos
                        </button>
                        {(["fixed", "variable", "income", "saving", "investment"] as CategoryKind[]).map((k) => (
                            <button
                                key={k}
                                onClick={() => setKind(k)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-300 ${kind === k
                                    ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                                    : "bg-slate-800/40 text-slate-400 border-white/5 hover:border-white/10 hover:text-slate-200"
                                    }`}
                            >
                                {kindLabels[k]}
                            </button>
                        ))}
                    </div>

                    {/* Category Dropdown */}
                    <div className="w-full lg:w-64">
                        <div className="relative group">
                            <select
                                value={categoryId || ""}
                                onChange={(e) => setCategoryId(e.target.value || null)}
                                className="w-full appearance-none px-4 py-2.5 rounded-xl bg-slate-800/40 border border-white/5 text-slate-300 text-sm font-medium focus:outline-none focus:border-blue-500/50 cursor-pointer hover:bg-slate-800/60 transition-all"
                            >
                                <option value="">Todas las categorías</option>
                                {categories
                                    .filter(c => !kind || c.kind === kind)
                                    .map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.icon} {cat.label}
                                        </option>
                                    ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 group-hover:text-slate-300 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <TransactionsList
                    transactions={movementTransactions}
                    categories={categories}
                    users={users}
                    limit={10}
                    onEdit={setEditingTx}
                    contextUserId={userId}
                />
            </Card>

            {/* Debt Payments History */}
            {userDebtAdjustments.length > 0 && (
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-200">Pagos de Deuda Personal</h3>
                        <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Este mes</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
                                    <th className="text-left pb-3 pr-4">Concepto</th>
                                    <th className="text-left pb-3 pr-4">Fecha</th>
                                    <th className="text-right pb-3 pr-4">Monto</th>
                                    <th className="text-center pb-3">Tipo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {userDebtAdjustments.map((adj) => (
                                    <tr key={adj.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 pr-4 text-slate-200 font-medium">{adj.description}</td>
                                        <td className="py-3 pr-4 text-slate-400">{new Date(adj.date).toLocaleDateString("es-ES")}</td>
                                        <td className="py-3 pr-4 text-right font-bold text-slate-200">{formatEur(adj.amountCents)}</td>
                                        <td className="py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${adj.direction === (userId === "marcos" ? "camila_to_marcos" : "marcos_to_camila")
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                }`}>
                                                {adj.direction === (userId === "marcos" ? "camila_to_marcos" : "marcos_to_camila") ? "Pagado" : "Recibido"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

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

            <CategoryDetailsModal
                isOpen={!!selectedCategoryId}
                onClose={() => setSelectedCategoryId(null)}
                category={selectedCategory}
                transactions={categoryTransactions}
                categories={categories}
                users={users}
                contextUserId={userId}
                onEdit={setEditingTx}
            />
        </div>
    );
}
