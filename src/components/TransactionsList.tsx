import { Transaction, Category, User } from "@/types";
import { formatEur, formatDate } from "@/lib/finance";
import { useState } from "react";
import { useFinance } from "@/store/finance-store";

type TransactionsListProps = {
    transactions: Transaction[];
    categories: Category[];
    users: User[];
    limit?: number;
    onEdit?: (tx: Transaction) => void;
    contextUserId?: string | null;
};

export default function TransactionsList({
    transactions,
    categories,
    users,
    limit,
    onEdit,
    contextUserId
}: TransactionsListProps) {
    const { deleteTransaction } = useFinance();
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const displayed = limit ? transactions.slice(0, limit) : transactions;

    if (displayed.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 text-sm italic">
                No hay movimientos registrados en este periodo.
            </div>
        );
    }

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (deleteConfirmId === id) {
            deleteTransaction(id);
            setDeleteConfirmId(null);
        } else {
            setDeleteConfirmId(id);
            setTimeout(() => setDeleteConfirmId(null), 3000); // clear after 3s
        }
    };

    return (
        <div className="space-y-1">
            {displayed.map((tx, index) => {
                const category = categories.find((c) => c.id === tx.categoryId) || {
                    id: "unknown",
                    label: "Desconocido",
                    icon: "❓",
                    kind: "variable",
                    scope: "individual"
                };
                const user = users.find((u) => u.id === tx.userId);
                const isDeleting = deleteConfirmId === tx.id;

                // Split Logic: Shared expenses are split 50/50, but Savings/Investments show full contribution
                const isSharedSplit = contextUserId &&
                    tx.userId === "pareja" &&
                    category?.kind !== "saving" &&
                    category?.kind !== "investment";
                const displayAmount = isSharedSplit ? Math.round(tx.amountCents / 2) : tx.amountCents;

                return (
                    <div
                        key={tx.id}
                        onClick={() => onEdit && onEdit(tx)}
                        className={`
                            group flex items-center justify-between p-3 sm:p-4 rounded-xl transition-all duration-200 cursor-pointer
                            ${isDeleting ? "bg-red-500/10 border border-red-500/20" : "hover:bg-white/[0.03] border border-transparent hover:border-white/5"}
                        `}
                    >
                        {/* Internal grid for alignment */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            {/* Icon */}
                            <div className={`
                                w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg sm:text-xl shadow-lg shrink-0
                                ${category?.kind === 'income' ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10' :
                                    category?.kind === 'investment' ? 'bg-violet-500/10 text-violet-500 shadow-violet-500/10' :
                                        'bg-slate-800/50 text-slate-200 shadow-black/20'}
                            `}>
                                {category?.icon || "📝"}
                            </div>

                            {/* Metadata */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm sm:text-base text-slate-200 truncate">
                                        {category?.label || "Desconocido"}
                                    </span>
                                    {isSharedSplit && (
                                        <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full border border-yellow-500/30 text-yellow-500/80 font-medium shrink-0">
                                            50%
                                        </span>
                                    )}
                                    {user && !contextUserId && (
                                        <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${user.id === 'marcos'
                                            ? 'border-blue-500/30 text-blue-400'
                                            : user.id === 'camila' ? 'border-pink-500/30 text-pink-400' : 'border-slate-500/30 text-slate-400'
                                            }`}>
                                            {user.name}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                                    <span className="text-[10px] sm:text-xs text-slate-500 shrink-0">{formatDate(tx.date)}</span>
                                    {tx.note && (
                                        <>
                                            <span className="text-slate-700 shrink-0">•</span>
                                            <span className="text-[10px] sm:text-xs text-slate-500 truncate max-w-[100px] sm:max-w-[150px]">{tx.note}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex flex-col items-end gap-1 ml-2 sm:ml-4 text-right shrink-0">
                            <div className={`font-bold text-sm sm:text-base tracking-tight ${category?.kind === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                                {category?.kind === 'income' ? '+' : '-'} {formatEur(displayAmount)}
                            </div>

                            {/* Actions - Always visible on mobile, hover on desktop */}
                            <div className="h-6 flex items-center justify-end">
                                <button
                                    onClick={(e) => handleDelete(tx.id, e)}
                                    className={`
                                        text-[10px] sm:text-xs font-medium transition-all duration-200 px-2 py-0.5 rounded
                                        ${isDeleting
                                            ? "bg-red-500 text-white shadow-lg shadow-red-500/40"
                                            : "visible lg:invisible lg:opacity-0 group-hover:visible group-hover:opacity-100 text-slate-500 hover:text-red-400 lg:hover:bg-red-500/10"
                                        }
                                    `}
                                >
                                    {isDeleting ? "Confirmar" : "Eliminar"}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
