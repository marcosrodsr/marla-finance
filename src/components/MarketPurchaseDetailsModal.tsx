"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { useFinance } from "@/store/finance-store";
import { normalizeText, formatEur } from "@/lib/finance";
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
    productId: string | null;
    nameSnapshot: string;
    tipoUsuario: MarketProductUsuario;
    tipo?: string | null;
    qty: number;
    priceCents: number;
    unidad?: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    marketPurchaseId: string | null;
};

export default function MarketPurchaseDetailsModal({ isOpen, onClose, marketPurchaseId }: Props) {
    const { marketProducts, marketPurchases, updateMarketPurchase, deleteMarketPurchase, deleteMarketPurchaseItem } = useFinance();

    const purchase = useMemo(
        () => marketPurchases.find((p) => p.id === marketPurchaseId),
        [marketPurchases, marketPurchaseId]
    );

    const [paidBy, setPaidBy] = useState<"marcos" | "camila" | null>(null);
    const [establecimiento, setEstablecimiento] = useState<string>("");
    const [selected, setSelected] = useState<Map<string, SelectedProduct>>(new Map());
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Search for adding new products
    const [search, setSearch] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    // Initialize state from existing purchase
    useEffect(() => {
        if (isOpen && purchase) {
            setPaidBy(purchase.paidBy);
            setEstablecimiento(purchase.establecimiento);
            setDate(purchase.date);
            setNote(purchase.note ?? "");
            
            const initialMap = new Map<string, SelectedProduct>();
            purchase.items.forEach((item, idx) => {
                const baseId = item.productId || `item-${idx}-${item.nameSnapshot}`;
                const key = `${baseId}-${item.tipoUsuario}`;
                // Try to find the product in marketProducts to get its unidad
                const productInfo = marketProducts.find(p => p.id === item.productId);
                initialMap.set(key, { ...item, unidad: productInfo?.unidad });
            });
            setSelected(initialMap);
            setSearch("");
        }
    }, [isOpen, purchase]);

    // Handle editing existing items
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

    const handlePriceChange = (id: string, val: string) => {
        setSelected((prev) => {
            const next = new Map(prev);
            const entry = next.get(id);
            if (!entry) return prev;
            const cleaned = val.replace(",", ".");
            const parsed = parseFloat(cleaned);
            if (!isNaN(parsed) && parsed >= 0) {
                next.set(id, { ...entry, priceCents: Math.round(parsed * 100) });
            }
            return next;
        });
    };

    const handleRemove = async (id: string) => {
        const item = selected.get(id);
        if (!item || !purchase) return;

        if (confirm(`¿Eliminar "${item.nameSnapshot}" de esta compra?`)) {
            // Optimistic local update
            setSelected((prev) => {
                const next = new Map(prev);
                next.delete(id);
                return next;
            });

            // Find if this specific item (product + user) exists in the DB purchase
            const existingItem = purchase.items.find(it => 
                (it.productId === item.productId || it.nameSnapshot === item.nameSnapshot) && 
                it.tipoUsuario === item.tipoUsuario
            );
            
            if (existingItem) {
                await deleteMarketPurchaseItem(purchase.id, existingItem.id);
            }
        }
    };

    // Handle adding new items
    const filteredProductsToAdd = useMemo(() => {
        if (!search.trim()) return [];
        const norm = normalizeText(search);
        return marketProducts.filter((p) => {
             // We can have the same product for different users, so we don't hide it unless it's already there for ALL users (complex) 
             // or just let them add it and it will overwrite?
             // Better: don't hide, just allow adding multiple users.
             return normalizeText(p.name).includes(norm) || normalizeText(p.tipo).includes(norm);
        }).slice(0, 10); // Limit results
    }, [marketProducts, search, selected]);

    const handleAddProduct = (p: MarketProduct) => {
        const key = `${p.id}-${p.usuario}`;
        setSelected((prev) => {
            const next = new Map(prev);
            if (next.has(key)) return prev; // Avoid duplicate adding of the exact same product-user pair
            next.set(key, {
                productId: p.id,
                nameSnapshot: p.name,
                tipoUsuario: p.usuario,
                tipo: p.tipo,
                qty: 1,
                priceCents: p.priceCents,
                unidad: p.unidad,
            });
            return next;
        });
        setSearch("");
        setIsSearchFocused(false);
    };

    // Calculate sum
    const summary = useMemo(() => {
        let pareja = 0, marcos = 0, camila = 0;
        selected.forEach(({ qty, priceCents, tipoUsuario }) => {
            const subtotal = Math.round(priceCents * qty);
            if (tipoUsuario === "pareja") pareja += subtotal;
            else if (tipoUsuario === "marcos") marcos += subtotal;
            else camila += subtotal;
        });
        const halfPareja = Math.round(pareja / 2);
        return { 
            pareja, 
            marcos, 
            camila, 
            total: pareja + marcos + camila,
            marcosFinal: marcos + halfPareja,
            camilaFinal: camila + halfPareja,
            parejaHalf: halfPareja
        };
    }, [selected]);

    const handleSave = async () => {
        if (!purchase) return;
        if (!paidBy || !establecimiento || selected.size === 0) {
            setError("Faltan campos obligatorios o la compra está vacía");
            return;
        }

        setSaving(true);
        setError("");

        const items = Array.from(selected.values()).map((sel) => ({
            productId: sel.productId,
            nameSnapshot: sel.nameSnapshot,
            priceCents: sel.priceCents,
            qty: sel.qty,
            tipoUsuario: sel.tipoUsuario,
            tipo: sel.tipo as any,
        }));

        try {
            await updateMarketPurchase(purchase.id, {
                date,
                paidBy,
                establecimiento,
                totalCents: summary.total,
                note: note.trim() || undefined,
            }, items);
            onClose();
        } catch {
            setError("Error al guardar la edición. Inténtalo de nuevo.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!purchase) return;
        if (confirm("¿Estás seguro de que quieres eliminar esta compra de mercado completa? Esto borrará el ticket, todos sus productos y los movimientos asociados de Marcos, Camila y Pareja.")) {
            setSaving(true);
            try {
                await deleteMarketPurchase(purchase.id);
                onClose();
            } catch {
                setError("Error al eliminar la compra");
            } finally {
                setSaving(false);
            }
        }
    };

    if (!purchase) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalle de Compra">
            {error && (
                <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-2xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            <div className="space-y-8 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar pb-6">
                
                <div className="space-y-6">
                    {/* Paid By - Modern segmented control */}
                    <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Pagado por</label>
                            <span className="text-[10px] font-medium text-blue-400/60 uppercase tracking-widest">Responsable del ticket</span>
                        </div>
                        <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                            {(["marcos", "camila"] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPaidBy(p)}
                                    className={`flex-1 py-2.5 rounded-xl transition-all duration-300 font-bold capitalize text-xs flex items-center justify-center gap-2 ${
                                        paidBy === p
                                            ? "bg-white text-slate-900 shadow-xl"
                                            : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                                    }`}
                                >
                                    {paidBy === p && (
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Comercio</label>
                            <div className="relative">
                                <select
                                    value={establecimiento}
                                    onChange={(e) => setEstablecimiento(e.target.value)}
                                    className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white/5 border border-white/5 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500/30 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Seleccionar...</option>
                                    {ESTABLECIMIENTOS.map(e => <option key={e} value={e}>{e}</option>)}
                                    {!ESTABLECIMIENTOS.includes(establecimiento) && establecimiento && (
                                        <option value={establecimiento}>{establecimiento}</option>
                                    )}
                                </select>
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Fecha</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500/30 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Nota adicional</label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ej: Compra mensual, snacks..."
                            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-xs font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30 transition-all"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Desglose de productos</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selected.size} items</span>
                        </div>
                    </div>
                    
                    <div className="relative z-20 mb-6 group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            placeholder="¿Qué quieres añadir?"
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/20 focus:bg-white/10 transition-all text-xs font-medium"
                        />
                        {isSearchFocused && search.trim() && filteredProductsToAdd.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1F2E] border border-white/5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                {filteredProductsToAdd.map(p => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => handleAddProduct(p)}
                                        className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center justify-between transition-colors"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-slate-200 font-medium text-sm">{p.name}</span>
                                            <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">{p.establecimiento}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${TIPO_USUARIO_COLORS[p.usuario]}`}>
                                                {TIPO_USUARIO_LABEL[p.usuario]}
                                            </span>
                                            <span className="text-slate-400 font-bold text-sm shrink-0">{(p.priceCents / 100).toFixed(2)}€</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        {(["pareja", "marcos", "camila"] as const).map((user) => {
                            const userItems = Array.from(selected.entries()).filter(([_, item]) => item.tipoUsuario === user);
                            if (userItems.length === 0) return null;
                            
                            const userTotal = user === "pareja" 
                                ? summary.pareja 
                                : user === "marcos" ? summary.marcosFinal : summary.camilaFinal;

                            const userColor = user === 'pareja' ? 'text-violet-400' : user === 'marcos' ? 'text-blue-400' : 'text-pink-400';
                            const userBg = user === 'pareja' ? 'bg-violet-400/10' : user === 'marcos' ? 'bg-blue-400/10' : 'bg-pink-400/10';

                            return (
                                <div key={user} className="animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-1 h-3 rounded-full ${user === 'pareja' ? 'bg-violet-500' : user === 'marcos' ? 'bg-blue-500' : 'bg-pink-500'}`}></div>
                                            <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${userColor}`}>
                                                {TIPO_USUARIO_LABEL[user]}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {user !== 'pareja' && summary.parejaHalf > 0 && (
                                                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">(+ {((summary.parejaHalf) / 100).toFixed(2)}€ par)</span>
                                            )}
                                            <span className={`text-sm font-black tracking-tight ${userColor}`}>
                                                {(userTotal / 100).toFixed(2)}€
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {userItems.map(([key, item]) => (
                                            <div key={key} className="group flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-[1.25rem] transition-all border border-white/5">
                                                
                                                {/* Icon/Emoji */}
                                                <div className={`w-10 h-10 rounded-xl ${userBg} flex items-center justify-center shrink-0 border border-white/5 text-lg shadow-inner`}>
                                                    {item.tipo === 'comida' ? '🍎' : item.tipo === 'personal' ? '🧼' : '🏠'}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-slate-200 text-[13px] truncate leading-tight mb-0.5">{item.nameSnapshot}</div>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                        <span>{formatEur(item.priceCents)} {item.unidad ? `/ ${item.unidad}` : ''}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                                                        <span className={userColor}>{formatEur(item.priceCents * item.qty)} total</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Controls */}
                                                <div className="flex items-center gap-3">
                                                    {/* Compact Stepper */}
                                                    <div className="flex items-center bg-black/20 rounded-xl border border-white/5 h-8 p-0.5">
                                                        <button onClick={() => handleQty(key, -1)} className="w-7 h-full flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4"/></svg>
                                                        </button>
                                                        <span className="w-5 text-center text-[11px] font-black text-slate-200">{item.qty}</span>
                                                        <button onClick={() => handleQty(key, 1)} className="w-7 h-full flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                                        </button>
                                                    </div>

                                                    <button 
                                                        onClick={() => handleRemove(key)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-500/5 text-rose-500/40 hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-white/5"
                                                        title="Eliminar item"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {selected.size === 0 && (
                            <div className="py-8 text-center text-sm text-slate-500 border border-dashed border-white/10 rounded-2xl italic">
                                No hay productos en esta compra.
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Summary ── */}
                <div className="mt-8 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Resumen de gastos</span>
                        <span className="text-2xl font-black text-white tracking-tighter">{formatEur(summary.total)}</span>
                    </div>

                    {/* Progress bar style breakdown */}
                    {summary.total > 0 && (
                        <div className="mb-6">
                            <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-white/5 shadow-inner">
                                {summary.pareja > 0 && <div style={{width: `${(summary.pareja / summary.total) * 100}%`}} className="bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all duration-700 ease-out" />}
                                {summary.marcos > 0 && <div style={{width: `${(summary.marcos / summary.total) * 100}%`}} className="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-700 ease-out" />}
                                {summary.camila > 0 && <div style={{width: `${(summary.camila / summary.total) * 100}%`}} className="bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.3)] transition-all duration-700 ease-out" />}
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                {summary.pareja > 0 && (
                                    <div className="flex flex-col">
                                        <span className="text-violet-500/50 text-[8px] font-black uppercase tracking-[0.2em] mb-0.5">Común</span>
                                        <span className="text-violet-200 text-xs font-black tracking-tight">{formatEur(summary.pareja)}</span>
                                    </div>
                                )}
                                {summary.marcosFinal > 0 && (
                                    <div className="flex flex-col items-center">
                                        <span className="text-blue-500/50 text-[8px] font-black uppercase tracking-[0.2em] mb-0.5">Marcos total</span>
                                        <span className="text-blue-200 text-xs font-black tracking-tight">{formatEur(summary.marcosFinal)}</span>
                                    </div>
                                )}
                                {summary.camilaFinal > 0 && (
                                    <div className="flex flex-col items-end">
                                        <span className="text-pink-500/50 text-[8px] font-black uppercase tracking-[0.2em] mb-0.5">Camila total</span>
                                        <span className="text-pink-200 text-xs font-black tracking-tight">{formatEur(summary.camilaFinal)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                <button 
                    onClick={() => void handleDelete()} 
                    disabled={saving} 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-500/5 text-rose-500/40 hover:bg-rose-500/20 hover:text-rose-500 transition-all border border-white/5 shrink-0"
                    title="Eliminar compra completa"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div className="flex-1 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-2xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 font-bold text-xs uppercase tracking-widest transition-all border border-white/5 active:scale-95"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => void handleSave()} 
                        disabled={saving} 
                        className="flex-[1.5] py-3.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-200 font-black text-xs uppercase tracking-widest shadow-xl shadow-white/5 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? "Guardando..." : "Sincronizar"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
