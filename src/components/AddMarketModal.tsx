"use client";

import { useState, useMemo, useRef } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { useFinance } from "@/store/finance-store";
import { normalizeText } from "@/lib/finance";
import { MarketProduct, MarketProductUsuario } from "@/types";

const ESTABLECIMIENTOS = ["Mercadona", "Lidl", "Carrefour", "Día", "Otro"];

const TIPO_USUARIO_COLORS: Record<MarketProductUsuario, string> = {
    pareja: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    marcos: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    camila: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

const TIPO_USUARIO_LABEL: Record<MarketProductUsuario, string> = {
    pareja: "Pareja",
    marcos: "Marcos",
    camila: "Camila",
};

type SelectedProduct = {
    product: MarketProduct;
    qty: number;
    priceCents: number; // editable
};

type Step = 1 | 2 | 3 | 4;

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export default function AddMarketModal({ isOpen, onClose }: Props) {
    const { marketProducts, addMarketPurchase, marketLoading } = useFinance();

    const [step, setStep] = useState<Step>(1);
    const [paidBy, setPaidBy] = useState<"marcos" | "camila" | null>(null);
    const [establecimiento, setEstablecimiento] = useState<string | null>(null);
    const [selected, setSelected] = useState<Map<string, SelectedProduct>>(new Map());
    const [search, setSearch] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const searchRef = useRef<HTMLInputElement>(null);

    const filteredProducts = useMemo(() => {
        if (!establecimiento) return [];
        const norm = normalizeText(search);
        return marketProducts.filter((p) => {
            if (p.establecimiento !== establecimiento) return false;
            if (norm && !normalizeText(p.name).includes(norm) && !normalizeText(p.tipo).includes(norm)) return false;
            return true;
        });
    }, [marketProducts, establecimiento, search]);

    const handleToggle = (product: MarketProduct) => {
        setSelected((prev) => {
            const next = new Map(prev);
            if (next.has(product.id)) {
                next.delete(product.id);
            } else {
                next.set(product.id, { product, qty: 1, priceCents: product.priceCents });
            }
            return next;
        });
    };

    const handleQty = (id: string, delta: number) => {
        setSelected((prev) => {
            const next = new Map(prev);
            const entry = next.get(id);
            if (!entry) return prev;
            const newQty = Math.max(1, entry.qty + delta);
            next.set(id, { ...entry, qty: newQty });
            return next;
        });
    };

    // Compute summary
    const summary = useMemo(() => {
        let pareja = 0, marcos = 0, camila = 0;
        selected.forEach(({ product, qty, priceCents }) => {
            const subtotal = Math.round(priceCents * qty);
            if (product.usuario === "pareja") pareja += subtotal;
            else if (product.usuario === "marcos") marcos += subtotal;
            else camila += subtotal;
        });
        return { pareja, marcos, camila, total: pareja + marcos + camila };
    }, [selected]);

    const handleClose = () => {
        setStep(1);
        setPaidBy(null);
        setEstablecimiento(null);
        setSelected(new Map());
        setSearch("");
        setNote("");
        setDate(new Date().toISOString().split("T")[0]);
        setError("");
        onClose();
    };

    const handleNext = () => {
        if (step === 1 && !paidBy) { setError("Selecciona quién pagó físicamente"); return; }
        if (step === 2 && !establecimiento) { setError("Selecciona un establecimiento"); return; }
        if (step === 3 && selected.size === 0) { setError("Selecciona al menos un producto"); return; }
        setError("");
        setStep((s) => (s + 1) as Step);
        if (step === 2) setTimeout(() => searchRef.current?.focus(), 100);
    };

    const handleSave = async () => {
        if (!paidBy || !establecimiento || selected.size === 0) return;
        setSaving(true);
        setError("");

        const items = Array.from(selected.values()).map(({ product, qty, priceCents }) => ({
            productId: product.id,
            nameSnapshot: product.name,
            priceCents,
            qty,
            tipoUsuario: product.usuario,
        }));

        try {
            await addMarketPurchase(
                {
                    date,
                    paidBy,
                    establecimiento,
                    totalCents: summary.total,
                    note: note.trim() || undefined,
                },
                items
            );
            handleClose();
        } catch {
            setError("Error al guardar la compra. Inténtalo de nuevo.");
        } finally {
            setSaving(false);
        }
    };

    const stepLabels = ["¿Quién pagó?", "Establecimiento", "Productos", "Resumen"];

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Agregar Mercado">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8 px-2">
                {stepLabels.map((label, i) => {
                    const num = (i + 1) as Step;
                    const done = step > num;
                    const active = step === num;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div className={`h-[2px] w-full rounded-full transition-all duration-300 ${done ? "bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : active ? "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.4)]" : "bg-white/10"}`} />
                            <span className={`text-[10px] uppercase tracking-widest transition-colors duration-300 ${active ? "text-blue-400 font-bold" : done ? "text-slate-400 font-medium" : "text-slate-600 font-medium"} hidden sm:block`}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Error */}
            {error && (
                <div className="text-sm text-rose-400 bg-rose-400/10 px-4 py-2 rounded-xl mb-4">
                    {error}
                </div>
            )}

            {/* ── STEP 1: Who paid ─────────────────────────────────────── */}
            {step === 1 && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-300 mb-3">
                            ⚡ ¿Quién pagó físicamente?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {(["marcos", "camila"] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPaidBy(p)}
                                    className={`px-4 py-4 rounded-2xl border transition-all font-semibold capitalize text-sm ${paidBy === p
                                        ? "bg-blue-600/20 text-blue-300 border-blue-500/50 shadow shadow-blue-500/10"
                                        : "bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:border-zinc-500"
                                        }`}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-3">
                            La deuda se dividirá automáticamente según los productos y quién los disfrute.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
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
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Nota (opcional)
                            </label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Ej: Compra semanal"
                                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ── STEP 2: Establecimiento ───────────────────────────────── */}
            {step === 2 && (
                <div className="space-y-4">
                    <label className="block text-sm font-semibold text-zinc-300 mb-3">🏪 ¿Dónde compraste?</label>
                    <div className="grid grid-cols-2 gap-3">
                        {ESTABLECIMIENTOS.map((est) => (
                            <button
                                key={est}
                                type="button"
                                onClick={() => setEstablecimiento(est)}
                                className={`px-4 py-4 rounded-2xl border transition-all font-semibold text-sm ${establecimiento === est
                                    ? "bg-violet-600/20 text-violet-300 border-violet-500/50 shadow shadow-violet-500/10"
                                    : "bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:border-zinc-500"
                                    }`}
                            >
                                {est}
                            </button>
                        ))}
                    </div>
                    {establecimiento && (
                        <p className="text-xs text-slate-500 pt-2">
                            Se mostrarán los productos de <span className="text-slate-300 font-medium">{establecimiento}</span> en el siguiente paso.
                        </p>
                    )}
                    {marketLoading && <p className="text-xs text-slate-500 italic">Cargando productos...</p>}
                </div>
            )}

            {/* ── STEP 3: Product selection ─────────────────────────────── */}
            {step === 3 && (
                <div className="space-y-3 min-h-0">
                    {/* Search */}
                    <div className="relative">
                        <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/60 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar producto..."
                            className="w-full pl-7 pr-4 py-3 bg-transparent border-b border-white/10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
                        />
                    </div>
                    {filteredProducts.length === 0 ? (
                        <p className="text-slate-500 text-sm italic text-center py-6">
                            No hay productos en este establecimiento.<br />
                            <span className="text-xs">Añádelos en MercaData → Base de datos</span>
                        </p>
                    ) : (
                        <div className="overflow-y-auto max-h-[40vh] sm:max-h-[50vh] space-y-1.5 pr-1">
                            {filteredProducts.map((product) => {
                                const sel = selected.get(product.id);
                                const isSelected = !!sel;
                                return (
                                    <div
                                        key={product.id}
                                        className={`rounded-2xl border transition-all duration-300 ${isSelected
                                            ? "bg-blue-500/[0.05] border-blue-500/40 shadow-[0_4_20px_-4px_rgba(59,130,246,0.1)]"
                                            : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                            }`}
                                    >
                                        <div
                                            className="flex items-center gap-3 p-3 cursor-pointer"
                                            onClick={() => handleToggle(product)}
                                        >
                                            {/* Checkbox */}
                                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300 ${isSelected
                                                ? "bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                                : "border-slate-600 bg-slate-800/50"
                                                }`}>
                                                {isSelected && (
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            {/* Name */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm text-slate-200 truncate tracking-tight">{product.name}</div>
                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${TIPO_USUARIO_COLORS[product.usuario]}`}>
                                                        {TIPO_USUARIO_LABEL[product.usuario]}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">{product.tipo}</span>
                                                    <span className="text-[10px] text-slate-600">·</span>
                                                    <span className="text-[10px] text-slate-500">{product.unidad}</span>
                                                </div>
                                            </div>
                                            {/* Base price */}
                                            <div className={`text-sm font-semibold shrink-0 transition-colors ${isSelected ? "text-blue-400" : "text-slate-400"}`}>
                                                {(product.priceCents / 100).toFixed(2)}€
                                            </div>
                                        </div>

                                        {/* Controls when selected */}
                                        {isSelected && sel && (
                                            <div className="flex items-center gap-3 px-3 pb-3 pt-1" onClick={(e) => e.stopPropagation()}>
                                                {/* Qty */}
                                                <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
                                                    <button onClick={() => handleQty(product.id, -1)} className="w-6 h-6 rounded-full text-slate-300 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center">−</button>
                                                    <span className="text-sm font-semibold text-slate-200 min-w-[20px] text-center">{sel.qty}</span>
                                                    <button onClick={() => handleQty(product.id, 1)} className="w-6 h-6 rounded-full text-slate-300 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center">+</button>
                                                </div>
                                                
                                                <div className="flex-1 text-right flex items-center justify-end gap-1">
                                                    <span className="text-sm font-medium text-blue-100">{(sel.priceCents / 100).toFixed(2)}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-tighter">€/u</span>
                                                </div>
                                                
                                                {/* Subtotal */}
                                                <span className="text-sm font-bold text-blue-400 min-w-[60px] text-right">
                                                    {(sel.priceCents * sel.qty / 100).toFixed(2)}€
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {/* Running total */}
                    {selected.size > 0 && (
                        <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
                            <span className="text-xs text-slate-400">{selected.size} producto{selected.size !== 1 ? "s" : ""} seleccionado{selected.size !== 1 ? "s" : ""}</span>
                            <span className="text-sm font-bold text-slate-200">{(summary.total / 100).toFixed(2)} €</span>
                        </div>
                    )}
                </div>
            )}

            {/* ── STEP 4: Summary ───────────────────────────────────────── */}
            {step === 4 && (
                <div className="space-y-6">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                        <div className="flex items-center justify-between px-4 py-3.5">
                            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Pagó</span>
                            <span className="font-semibold text-blue-300 capitalize flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                                {paidBy}
                            </span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3.5">
                            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Lugar</span>
                            <span className="font-medium text-slate-200">{establecimiento}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3.5">
                            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Fecha</span>
                            <span className="font-medium text-slate-400">{date}</span>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Reparto Automático</p>
                        <div className="space-y-2">
                            {[
                                { label: "Gasto Pareja", amount: summary.pareja, color: "text-violet-300", bg: "bg-violet-500/[0.05] border-violet-500/20" },
                                { label: "Gasto Marcos", amount: summary.marcos, color: "text-blue-300", bg: "bg-blue-500/[0.05] border-blue-500/20" },
                                { label: "Gasto Camila", amount: summary.camila, color: "text-pink-300", bg: "bg-pink-500/[0.05] border-pink-500/20" },
                            ].map(({ label, amount, color, bg }) =>
                                amount > 0 ? (
                                    <div key={label} className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border ${bg}`}>
                                        <span className="text-sm font-medium text-slate-400">{label}</span>
                                        <span className={`font-bold text-sm ${color}`}>{(amount / 100).toFixed(2)} €</span>
                                    </div>
                                ) : null
                            )}
                        </div>
                        
                        <div className="flex items-center justify-between px-5 py-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.05)] mt-4">
                            <span className="text-sm font-bold text-blue-400/80 uppercase tracking-widest">Total Gastado</span>
                            <span className="font-black text-2xl text-blue-400 drop-shadow-[0_2px_10px_rgba(59,130,246,0.4)]">{(summary.total / 100).toFixed(2)} €</span>
                        </div>
                    </div>

                    {/* Products list */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Productos ({selected.size})</p>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                            {Array.from(selected.values()).map(({ product, qty, priceCents }) => (
                                <div key={product.id} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.02]">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${product.usuario === "pareja" ? "bg-violet-400 shadow-[0_0_5px_rgba(167,139,250,0.5)]" : product.usuario === "marcos" ? "bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.5)]" : "bg-pink-400 shadow-[0_0_5px_rgba(244,114,182,0.5)]"}`} />
                                        <span className="text-slate-300 font-medium truncate tracking-tight">{product.name}</span>
                                        {qty > 1 && <span className="text-slate-500 font-semibold bg-white/5 px-1.5 rounded text-[10px] ml-1">×{qty}</span>}
                                    </div>
                                    <span className="text-slate-400 font-semibold ml-2 shrink-0">{(priceCents * qty / 100).toFixed(2)} €</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center gap-3 mt-8 pb-4">
                {step > 1 && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => { setError(""); setStep((s) => (s - 1) as Step); }}
                        className="flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] border-blue-500/10 text-blue-400/70 hover:text-blue-300 hover:border-blue-500/30 transition-all"
                    >
                        ← Atrás
                    </Button>
                )}
                {step < 4 ? (
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleNext}
                        className="flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/10"
                    >
                        Siguiente →
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="primary"
                        onClick={() => void handleSave()}
                        disabled={saving}
                        className="flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/10"
                    >
                        {saving ? "Procesando..." : "Confirmar Compra"}
                    </Button>
                )}
            </div>
        </Modal>
    );
}
