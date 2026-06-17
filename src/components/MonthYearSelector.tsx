"use client";
import { useState } from "react";
import { ViewMode, MonthYear } from "@/types";
import { useFinance } from "@/store/finance-store";
import PlusIcon from "./icons/PlusIcon";

type MonthYearSelectorProps = {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    selectedDate: MonthYear;
    setSelectedDate: (date: MonthYear) => void;
};

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function MonthYearSelector({
    viewMode,
    setViewMode,
    selectedDate,
    setSelectedDate,
}: MonthYearSelectorProps) {
    const { setCategoryModalOpen } = useFinance();
    const [isOpen, setIsOpen] = useState(false);

    // Generate available years (current and previous)
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1];

    const handleMonthSelect = (monthIndex: number) => {
        setSelectedDate({ ...selectedDate, month: monthIndex });
        setIsOpen(false);
    };

    const handleYearSelect = (year: number) => {
        setSelectedDate({ ...selectedDate, year });
    };

    return (
        <div className="relative z-50 bg-[#0f172a]/40 backdrop-blur-md px-3 py-3 sm:px-1.5 sm:py-1.5 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">

                {/* Fila 1 mobile: Tabs full-width + botón "+" touch-friendly */}
                <div className="flex items-center gap-2">
                    <div className="flex flex-1 bg-[#020617]/50 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setViewMode("monthly")}
                            className={`flex-1 text-center py-2 sm:py-1.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${viewMode === "monthly"
                                ? "text-white bg-blue-600 shadow-lg shadow-blue-500/20"
                                : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setViewMode("annual")}
                            className={`flex-1 text-center py-2 sm:py-1.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${viewMode === "annual"
                                ? "text-white bg-blue-600 shadow-lg shadow-blue-500/20"
                                : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            Anual
                        </button>
                    </div>

                    {/* Botón "+" solo ícono en mobile (44×44px), oculto en desktop */}
                    <button
                        onClick={() => setCategoryModalOpen(true)}
                        className="sm:hidden flex items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 active:scale-95 transition-all"
                        title="Nueva Categoría"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* Fila 2 mobile: Selector de mes + botones de año en la misma fila */}
                <div className="flex gap-2 items-center">
                    {viewMode === "monthly" && (
                        <div className="relative flex-1 sm:flex-none">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="w-full sm:w-auto sm:min-w-[120px] px-4 py-2.5 sm:py-1.5 bg-[#1e293b]/50 hover:bg-[#1e293b]/80 border border-white/5 rounded-xl text-sm font-medium text-slate-200 flex items-center justify-between gap-2 transition-colors"
                            >
                                <span>{MONTHS[selectedDate.month]}</span>
                                <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                                    <div className="absolute top-full mt-2 left-0 w-48 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 p-1.5 grid grid-cols-1 max-h-60 overflow-y-auto backdrop-blur-xl">
                                        {MONTHS.map((m, i) => (
                                            <button
                                                key={m}
                                                onClick={() => handleMonthSelect(i)}
                                                className={`px-3 py-2.5 text-left rounded-lg text-sm transition-colors ${selectedDate.month === i
                                                    ? "bg-blue-500/10 text-blue-400 font-medium"
                                                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex gap-1 bg-[#1e293b]/30 p-1 rounded-xl border border-white/5">
                        {years.map((y) => (
                            <button
                                key={y}
                                onClick={() => handleYearSelect(y)}
                                className={`px-3 py-2 sm:py-1 rounded-lg text-sm font-medium transition-all ${selectedDate.year === y
                                    ? "bg-white/10 text-white shadow-sm border border-white/5"
                                    : "text-slate-500 hover:text-slate-300"
                                    }`}
                            >
                                {y}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Separador + botón "+" con texto para desktop */}
                <div className="hidden sm:flex items-center gap-3">
                    <div className="w-[1px] h-6 bg-white/10 mx-1" />
                    <button
                        onClick={() => setCategoryModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[11px] hover:bg-blue-500/20 active:scale-95 transition-all shadow-sm shadow-blue-500/5 group"
                        title="Nueva Categoría"
                    >
                        <PlusIcon className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" />
                        <span>Categoría</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
