"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import Button from "./Button";
import ChipSelect from "./ChipSelect";
import { useFinance } from "@/store/finance-store";
import { parseToAmountCents, formatEur } from "@/lib/finance";
import { Transaction } from "@/types";

type AddPaymentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Transaction | null;
};

export default function AddPaymentModal({ isOpen, onClose, initialData }: AddPaymentModalProps) {
    const { users, categories, addTransaction, updateTransaction } = useFinance();

    const [userId, setUserId] = useState<string | null>(null);
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [note, setNote] = useState("");
    const [error, setError] = useState("");

    // Load initial data when available
    useEffect(() => {
        if (initialData) {
            setUserId(initialData.userId);
            setCategoryId(initialData.categoryId);
            setAmount((initialData.amountCents / 100).toString().replace(".", ","));
            setDate(initialData.date);
            setNote(initialData.note || "");
        } else {
            // Reset defaults
            if (!isOpen) { // Only reset when closing/opening fresh
                setUserId(null); // Or keep previous? Better reset
                setCategoryId(null);
                setAmount("");
                setDate(new Date().toISOString().split('T')[0]);
                setNote("");
            }
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!userId) {
            setError("Selecciona quién paga");
            return;
        }

        if (!categoryId) {
            setError("Selecciona un tipo de pago");
            return;
        }

        const amountCents = parseToAmountCents(amount);
        if (!amountCents || amountCents <= 0) {
            setError("Introduce un monto válido");
            return;
        }

        if (!date) {
            setError("Selecciona una fecha");
            return;
        }

        const txData = {
            userId,
            categoryId,
            amountCents,
            date,
            note: note.trim() || undefined,
            isShared: initialData?.isShared // Preserve isShared flag if present in initialData
        };

        if (initialData && initialData.id) {
            updateTransaction(initialData.id, txData);
        } else {
            addTransaction(txData);
        }

        handleClose();
    };

    const handleClose = () => {
        setError("");
        if (!initialData) {
            setAmount("");
            setNote("");
        }
        onClose();
    }

    const isEdit = !!initialData?.id;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "Editar pago" : "Agregar pago"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* User selection */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        ¿Quién paga? *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {users.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => setUserId(user.id)}
                                className={`
                  px-4 py-3 rounded-xl border transition-all duration-200 font-medium
                  ${userId === user.id
                                        ? "bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-sm"
                                        : "bg-zinc-800/50 text-zinc-300 border-zinc-700 hover:border-zinc-600"
                                    }
                `}
                            >
                                {user.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Category selection */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Tipo de pago *
                    </label>
                    <ChipSelect
                        options={categories}
                        selected={categoryId}
                        onSelect={setCategoryId}
                    />
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Monto (€) *
                    </label>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="12,34"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Date */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Fecha *
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-50 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Note */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Nota (opcional)
                    </label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Ej: Cena con amigos"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="text-sm text-rose-400 bg-rose-400/10 px-4 py-2 rounded-xl">
                        {error}
                    </div>
                )}

                {/* Submit */}
                <Button type="submit" variant="primary" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white">
                    {isEdit ? "Guardar cambios" : "Guardar pago"}
                </Button>
            </form>
        </Modal>
    );
}
