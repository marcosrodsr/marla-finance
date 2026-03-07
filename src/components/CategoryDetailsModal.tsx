"use client";

import { Transaction, Category, User } from "@/types";
import Modal from "./Modal";
import TransactionsList from "./TransactionsList";
import { formatEur } from "@/lib/finance";

type CategoryDetailsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    category: Category | null;
    transactions: Transaction[];
    categories: Category[];
    users: User[];
    contextUserId?: string | null;
    onEdit?: (tx: Transaction) => void;
};

export default function CategoryDetailsModal({
    isOpen,
    onClose,
    category,
    transactions,
    categories,
    users,
    contextUserId,
    onEdit
}: CategoryDetailsModalProps) {
    if (!category) return null;

    const totalCents = transactions.reduce((acc, tx) => {
        // Apply split logic if contextUserId is provided
        const isSharedSplit = contextUserId &&
            tx.userId === "pareja" &&
            category.kind !== "saving" &&
            category.kind !== "investment";
        return acc + (isSharedSplit ? Math.round(tx.amountCents / 2) : tx.amountCents);
    }, 0);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${category.icon} ${category.label}`}
        >
            <div className="space-y-4 sm:space-y-6 pb-20">
                {/* Summary Header */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-0.5 sm:mb-1">Total Periodo</p>
                        <p className="text-xl sm:text-2xl font-bold text-white leading-none truncate">{formatEur(totalCents)}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-0.5 sm:mb-1">Movimientos</p>
                        <p className="text-lg sm:text-xl font-bold text-slate-300 leading-none">{transactions.length}</p>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-2 sm:space-y-3">
                    <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Detalle de gastos</h4>
                    <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                            <div className="p-1">
                                <TransactionsList
                                    transactions={transactions}
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
                </div>
            </div>
        </Modal>
    );
}
