"use client";

import { useState } from "react";
import { useFinance } from "@/store/finance-store";
import {
    filterByMonthYear,
    filterByYear,
    filterByUser,
    filterByKind,
} from "@/lib/finance";
import { ViewMode, MonthYear, CategoryKind, Transaction } from "@/types";
import Card from "@/components/Card";
import TransactionsList from "@/components/TransactionsList";
import MonthYearSelector from "@/components/MonthYearSelector";
import AddPaymentModal from "@/components/AddPaymentModal";
import TransactionCalendar from "@/components/TransactionCalendar";

export default function TransactionsPage() {
    const { transactions, categories, users } = useFinance();

    const [activeTab, setActiveTab] = useState<"general" | "marcos" | "camila">("general");
    const [viewMode, setViewMode] = useState<ViewMode>("monthly");
    const [date, setDate] = useState<MonthYear>(() => {
        const now = new Date();
        return { month: now.getMonth(), year: now.getFullYear() };
    });

    const [kind, setKind] = useState<CategoryKind | null>(null);
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);

    // Filtering logic remains identical
    let filtered = viewMode === "monthly"
        ? filterByMonthYear(transactions, date.month, date.year)
        : filterByYear(transactions, date.year);

    if (activeTab === "marcos") filtered = filterByUser(filtered, "marcos");
    if (activeTab === "camila") filtered = filterByUser(filtered, "camila");

    if (kind) filtered = filterByKind(filtered, categories, kind);
    if (categoryId) filtered = filtered.filter((t) => t.categoryId === categoryId);

    const kindLabels: Record<CategoryKind, string> = {
        fixed: "Fijos",
        variable: "Variables",
        saving: "Ahorros",
        investment: "Inversiones",
        income: "Ingresos",
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Movimientos</h1>
                    <p className="mt-1 text-slate-400 font-medium">Histórico completo de transacciones</p>
                </div>

                <MonthYearSelector
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    selectedDate={date}
                    setSelectedDate={setDate}
                />
            </div>

            {/* Tabs - Premium Segmented Control */}
            <div className="bg-slate-900/50 p-1 rounded-2xl inline-flex border border-white/5">
                {["general", "marcos", "camila"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`
                            px-6 py-2 rounded-xl text-sm font-semibold capitalize transition-all duration-300
                            ${activeTab === tab
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                            }
                        `}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Kind Filter */}
                <div className="flex flex-wrap gap-2 flex-1">
                    <button
                        onClick={() => setKind(null)}
                        className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${kind === null
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-slate-800/40 text-slate-400 border-white/5 hover:border-white/10"
                            }`}
                    >
                        Todos
                    </button>
                    {(["fixed", "variable", "income", "saving", "investment"] as CategoryKind[]).map((k) => (
                        <button
                            key={k}
                            onClick={() => setKind(k)}
                            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${kind === k
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-slate-800/40 text-slate-400 border-white/5 hover:border-white/10"
                                }`}
                        >
                            {kindLabels[k]}
                        </button>
                    ))}
                </div>

                {/* Category Dropdown */}
                <div className="w-full lg:w-64">
                    <div className="relative">
                        <select
                            value={categoryId || ""}
                            onChange={(e) => setCategoryId(e.target.value || null)}
                            className="w-full appearance-none px-4 py-2.5 rounded-xl bg-slate-800/40 border border-white/5 text-slate-300 text-sm focus:outline-none focus:border-blue-500/50 cursor-pointer hover:bg-slate-800/60 transition-colors"
                        >
                            <option value="">Todas las categorías</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Table/List */}
            <Card>
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                                {filtered.length} Resultados
                            </h2>
                        </div>
                        <button
                            onClick={() => setShowCalendar(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/60 border border-white/5 text-slate-400 hover:text-white hover:border-white/15 hover:bg-slate-700/60 transition-all ml-2"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Calendario
                        </button>
                    </div>
                </div>

                <TransactionsList
                    transactions={filtered}
                    categories={categories}
                    users={users}
                    onEdit={setEditingTx}
                />
            </Card>

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
