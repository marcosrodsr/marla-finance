import { useState, useMemo, useEffect, useRef } from "react";
import { Transaction, Category, User } from "@/types";
import Modal from "./Modal";
import TransactionsList from "./TransactionsList";
import { formatEur, normalizeText } from "@/lib/finance";
import XIcon from "./icons/XIcon";

type SummaryDetailsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    transactions: Transaction[];
    categories: Category[];
    users: User[];
    contextUserId?: string | null;
    onEdit?: (tx: Transaction) => void;
};

export default function SummaryDetailsModal({
    isOpen,
    onClose,
    title,
    transactions,
    categories,
    users,
    contextUserId,
    onEdit
}: SummaryDetailsModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

    const filteredTransactions = useMemo(() => {
        const normalizedSearch = normalizeText(searchQuery);
        return transactions.filter(tx => {
            const category = categories.find(c => c.id === tx.categoryId);
            const matchesSearch = !searchQuery || 
                (tx.note && normalizeText(tx.note).includes(normalizedSearch)) ||
                (category && normalizeText(category.label).includes(normalizedSearch));
            
            const matchesCategory = selectedCategoryId === "all" || tx.categoryId === selectedCategoryId;
            return matchesSearch && matchesCategory;
        });
    }, [transactions, searchQuery, selectedCategoryId, categories]);

    const totalCents = useMemo(() => {
        return filteredTransactions.reduce((acc, tx) => {
            const cat = categories.find(c => c.id === tx.categoryId);
            // Apply split logic if contextUserId is provided
            const isSharedSplit = contextUserId &&
                tx.userId === "pareja" &&
                cat?.kind !== "saving" &&
                cat?.kind !== "investment";
            return acc + (isSharedSplit ? Math.round(tx.amountCents / 2) : tx.amountCents);
        }, 0);
    }, [filteredTransactions, categories, contextUserId]);

    const uniqueCategoryIds = useMemo(() => {
        return Array.from(new Set(transactions.map(tx => tx.categoryId)));
    }, [transactions]);

    const modalCategories = useMemo(() => {
        return categories.filter(cat => uniqueCategoryIds.includes(cat.id))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [categories, uniqueCategoryIds]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
        >
            <div className="space-y-6 sm:space-y-8 pb-20">
                {/* Summary Header - Minimalist & Airy */}
                <div className="flex border-b border-white/[0.05] pb-8 mb-2">
                    <div className="flex-1">
                        <p className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-500 mb-1.5">Total del Periodo</p>
                        <p className="text-3xl sm:text-4xl font-black text-white tracking-tighter">{formatEur(totalCents)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-500 mb-1.5">Movimientos</p>
                        <p className="text-xl sm:text-2xl font-black text-slate-300 tracking-tighter">{filteredTransactions.length}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="space-y-3 px-1">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Bar */}
                        <div className="relative group flex-1">
                            <input
                                type="text"
                                placeholder="Buscar transacciones..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-b border-white/10 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-white transition-all font-bold"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Category Dropdown */}
                        <div className="relative group w-full sm:w-64">
                            <Dropdown
                                value={selectedCategoryId}
                                onChange={setSelectedCategoryId}
                                options={[
                                    { id: "all", label: "Todas las categorías", icon: "📊" },
                                    ...modalCategories
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Detalle del historial</h4>
                        {(searchQuery || selectedCategoryId !== "all") && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedCategoryId("all");
                                }}
                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider transition-colors"
                            >
                                Limpiar Filtros
                            </button>
                        )}
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                        <TransactionsList
                            transactions={filteredTransactions}
                            categories={categories}
                            users={users}
                            contextUserId={contextUserId}
                            onEdit={(tx) => {
                                onEdit?.(tx);
                                onClose(); // Close modal when editing to show edit modal
                            }}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
}

// --- Internal Dropdown Component ---
function Dropdown({ 
    value, 
    onChange, 
    options 
}: { 
    value: string; 
    onChange: (val: string) => void; 
    options: { id: string; label: string; icon: string }[] 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(o => o.id === value) || options[0];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center justify-between gap-3 bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white transition-all duration-300
                    ${isOpen ? 'bg-white/10 shadow-2xl shadow-white/5' : 'hover:bg-white/5'}
                `}
            >
                <div className="flex items-center gap-2 truncate">
                    <span className="text-base shrink-0">{selectedOption.icon}</span>
                    <span className="truncate font-bold tracking-tight">{selectedOption.label}</span>
                </div>
                <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-[100] mt-2 w-full bg-slate-900/95 border border-indigo-500/20 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
                        {options.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                    onChange(opt.id);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 text-left
                                    ${opt.id === value 
                                        ? 'bg-indigo-500/10 text-indigo-400 font-bold' 
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }
                                `}
                            >
                                <span className="text-base shrink-0">{opt.icon}</span>
                                <span className="truncate">{opt.label}</span>
                                {opt.id === value && (
                                    <div className="ml-auto">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
