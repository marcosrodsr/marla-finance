"use client";

import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { useFinance } from "@/store/finance-store";
import { formatEur, parseToAmountCents, formatDate, BASE_PERSONAL_DEBT_CENTS } from "@/lib/finance";
import { DebtAdjustment } from "@/types";

type DebtManagementModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export default function DebtManagementModal({ isOpen, onClose }: DebtManagementModalProps) {
    const { debtAdjustments, addDebtAdjustment, updateDebtAdjustment, deleteDebtAdjustment } = useFinance();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [direction, setDirection] = useState<DebtAdjustment["direction"]>("marcos_to_camila");
    const [error, setError] = useState("");

    const totalAdjustments = debtAdjustments.reduce((acc, adj) => {
        return acc + (adj.direction === "marcos_to_camila" ? -adj.amountCents : adj.amountCents);
    }, 0);

    const currentBalance = BASE_PERSONAL_DEBT_CENTS + totalAdjustments;

    const resetForm = () => {
        setDescription("");
        setAmount("");
        setDate(new Date().toISOString().split('T')[0]);
        setDirection("marcos_to_camila");
        setError("");
    };

    const handleEdit = (adj: DebtAdjustment) => {
        setEditingId(adj.id);
        setDescription(adj.description);
        setAmount((adj.amountCents / 100).toString().replace(".", ","));
        setDate(adj.date);
        setDirection(adj.direction);
        setIsAdding(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const amountCents = parseToAmountCents(amount);
        if (!amountCents || amountCents <= 0) {
            setError("Monto inválido");
            return;
        }

        if (!description.trim()) {
            setError("Descripción requerida");
            return;
        }

        const data = {
            description: description.trim(),
            amountCents,
            date,
            direction,
        };

        try {
            if (editingId) {
                await updateDebtAdjustment(editingId, data);
            } else {
                await addDebtAdjustment(data);
            }
            setIsAdding(false);
            setEditingId(null);
            resetForm();
        } catch (err) {
            setError("Error al guardar");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestión de Deuda Personal">
            <div className="space-y-6">
                {/* Balance Header */}
                <div className="bg-slate-800/40 border border-white/5 rounded-3xl p-6 text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Deuda Pendiente (Camila → Marcos)</p>
                    <p className={`text-4xl font-black tracking-tight ${currentBalance > 0 ? "text-pink-400" : "text-emerald-400"}`}>
                        {formatEur(currentBalance)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-2 italic">Base inicial: {formatEur(BASE_PERSONAL_DEBT_CENTS)}</p>
                </div>

                {!isAdding ? (
                    <>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-200">Historial de Pagos</h3>
                            <button
                                onClick={() => { resetForm(); setIsAdding(true); }}
                                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                + Agregar Pago
                            </button>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                            {debtAdjustments.length === 0 ? (
                                <p className="text-center py-8 text-slate-500 text-sm italic">No hay pagos registrados</p>
                            ) : (
                                debtAdjustments.map((adj) => (
                                    <div key={adj.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group">
                                        <div>
                                            <p className="text-sm font-bold text-slate-200">{adj.description}</p>
                                            <p className="text-[10px] text-slate-500">{formatDate(adj.date)}</p>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div>
                                                <p className={`text-sm font-black ${adj.direction === "marcos_to_camila" ? "text-emerald-400" : "text-pink-400"}`}>
                                                    {adj.direction === "marcos_to_camila" ? "-" : "+"}{formatEur(adj.amountCents)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(adj)} className="text-slate-400 hover:text-blue-400 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => deleteDebtAdjustment(adj.id)} className="text-slate-400 hover:text-red-400 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 bg-white/5 border border-white/5 rounded-3xl p-6">
                        <h3 className="text-sm font-bold text-slate-200 mb-4">{editingId ? "Editar Pago" : "Nuevo Pago"}</h3>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Tipo de Movimiento</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDirection("marcos_to_camila")}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${direction === "marcos_to_camila" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-800/40 text-slate-500 border-white/5"}`}
                                >
                                    Camila paga a Marcos
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDirection("camila_to_marcos")}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${direction === "camila_to_marcos" ? "bg-pink-500/20 text-pink-400 border-pink-500/30" : "bg-slate-800/40 text-slate-500 border-white/5"}`}
                                >
                                    Nueva deuda
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Descripción</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ej: Pago mensual"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-200 text-sm focus:outline-none focus:border-blue-500/50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Monto (€)</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-200 text-sm focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-200 text-sm focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                        </div>

                        {error && <p className="text-xs text-red-400 text-center">{error}</p>}

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="secondary" onClick={() => { setIsAdding(false); setEditingId(null); }} className="flex-1 py-2 text-xs">Cancelar</Button>
                            <Button type="submit" variant="primary" className="flex-1 py-2 text-xs">{editingId ? "Actualizar" : "Guardar"}</Button>
                        </div>
                    </form>
                )}

                <div className="pt-4 flex justify-center">
                    <Button variant="secondary" onClick={onClose} className="px-8 py-2 text-xs">Cerrar</Button>
                </div>
            </div>
        </Modal>
    );
}
