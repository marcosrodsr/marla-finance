"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useFinance } from "@/store/finance-store";
import {
    formatEur,
    normalizeText,
} from "@/lib/finance";
import {
    MarketProduct,
    MarketProductTipo,
    MarketProductUnidad,
    MarketProductUsuario,
    MarketPurchaseItem,
} from "@/types";
import PieChart from "@/components/charts/PieChart";
import StatCard from "@/components/StatCard";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers & constants
// ─────────────────────────────────────────────────────────────────────────────

const TIPOS: MarketProductTipo[] = ["comida", "personal", "casa"];
const UNIDADES: MarketProductUnidad[] = ["unidad", "kg", "g", "litro"];
const USUARIOS: MarketProductUsuario[] = ["pareja", "marcos", "camila"];
const ESTABLECIMIENTOS = ["Mercadona", "Lidl", "Carrefour", "Día", "Otro"];

const USUARIO_COLORS: Record<MarketProductUsuario, string> = {
    marcos: "bg-transparent text-blue-400 border-blue-400/30",
    camila: "bg-transparent text-pink-400 border-pink-400/30",
    pareja: "bg-transparent text-emerald-400 border-emerald-400/30",
};

const TIPO_COLORS: Record<MarketProductTipo, string> = {
    comida: "bg-transparent text-amber-500 border-amber-400/30",
    personal: "bg-transparent text-indigo-400 border-indigo-400/30",
    casa: "bg-transparent text-teal-400 border-teal-400/30",
};

const TIPO_LABEL: Record<MarketProductTipo, string> = {
    comida: "Comida",
    personal: "Personal",
    casa: "Casa",
};

const CATEGORY_PALETTE: Record<MarketProductTipo, string> = {
    comida: "#3b82f6", // Blue
    personal: "#ec4899", // Pink
    casa: "#10b981", // Emerald
};

const TIPO_ACCENT: Record<MarketProductTipo, { dot: string; bar: string; badge: string; border: string }> = {
    comida: {
        dot: "bg-blue-500",
        bar: "from-blue-600 to-blue-400",
        badge: "bg-blue-500/10 text-blue-400",
        border: "border-blue-500/10",
    },
    personal: {
        dot: "bg-pink-500",
        bar: "from-pink-600 to-pink-400",
        badge: "bg-pink-500/10 text-pink-400",
        border: "border-pink-500/10",
    },
    casa: {
        dot: "bg-emerald-500",
        bar: "from-emerald-600 to-emerald-400",
        badge: "bg-emerald-500/10 text-emerald-400",
        border: "border-emerald-500/10",
    },
};

const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function Badge({ text, color, icon }: { text: string; color: string; icon?: React.ReactNode }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] uppercase font-bold tracking-wider border transition-all select-none ${color}`}>
            {icon && <span className="opacity-70">{icon}</span>}
            {text}
        </span>
    );
}

function CustomSelect<T extends string>({
    value,
    onChange,
    options,
    placeholder,
    className = ""
}: {
    value: T | null;
    onChange: (val: T) => void;
    options: { value: T; label: string }[];
    placeholder: string;
    className?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div ref={containerRef} className={`relative min-w-[140px] ${className}`}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between cursor-pointer px-4 py-2 rounded-2xl bg-slate-900/40 border border-white/5 text-slate-200 text-xs backdrop-blur-xl hover:bg-slate-900/60 transition-all select-none shadow-lg group active:scale-95"
            >
                <span className={`truncate mr-2 ${!selectedOption ? "text-slate-500" : "font-bold"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <svg
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-slate-900 border border-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
                        {options.map((opt) => (
                            <div
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`px-4 py-2.5 text-[11px] font-medium cursor-pointer transition-all border-l-2 ${value === opt.value
                                        ? "bg-blue-600/10 text-blue-400 border-blue-500 font-bold"
                                        : "text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200"
                                    }`}
                            >
                                {opt.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function NumberInput({
    value,
    onChange,
    placeholder = "",
    className = "",
    step = 1,
    min,
    max
}: {
    value: number | string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    step?: number;
    min?: number;
    max?: number;
}) {
    const adjust = (delta: number) => {
        const current = typeof value === "string" ? parseFloat(value.replace(",", ".")) || 0 : value;
        let newVal = current + delta;
        if (min !== undefined) newVal = Math.max(min, newVal);
        if (max !== undefined) newVal = Math.min(max, newVal);
        onChange(newVal.toFixed(2));
    };

    return (
        <div className={`relative flex items-center group/num ${className}`}>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                step={step}
                placeholder={placeholder}
                className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-slate-900/40 border border-white/5 text-slate-200 text-xs focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 backdrop-blur-xl transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-xl"
            />
            <div className="absolute right-1.5 flex flex-col gap-0.5 opacity-0 group-hover/num:opacity-100 transition-opacity">
                <button
                    type="button"
                    onClick={() => adjust(step)}
                    className="p-0.5 rounded-md hover:bg-white/10 text-slate-500 hover:text-blue-400 transition-all active:scale-90"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                </button>
                <button
                    type="button"
                    onClick={() => adjust(-step)}
                    className="p-0.5 rounded-md hover:bg-white/10 text-slate-500 hover:text-blue-400 transition-all active:scale-90"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3: Products Database
// ─────────────────────────────────────────────────────────────────────────────

type EditingProduct = Partial<MarketProduct> & { _isNew?: boolean };

function ProductsDatabaseTab() {
    const { marketProducts, addMarketProduct, updateMarketProduct, deleteMarketProduct, marketLoading } = useFinance();

    const [search, setSearch] = useState("");
    const [filterEstablecimiento, setFilterEstablecimiento] = useState<string | null>(null);
    const [filterUsuario, setFilterUsuario] = useState<MarketProductUsuario | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<EditingProduct>({});
    const [mobileEditId, setMobileEditId] = useState<string | null>(null);
    const [showAddRow, setShowAddRow] = useState(false);
    const [newProduct, setNewProduct] = useState<Partial<MarketProduct>>({
        name: "", priceCents: 0, tipo: "comida", usuario: "pareja",
        establecimiento: "Mercadona", unidad: "unidad", isActive: true,
    });
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState("");

    const filtered = useMemo(() => {
        const norm = normalizeText(search);
        return marketProducts.filter((p) => {
            if (filterEstablecimiento && p.establecimiento !== filterEstablecimiento) return false;
            if (filterUsuario && p.usuario !== filterUsuario) return false;
            if (norm && !normalizeText(p.name).includes(norm) && !normalizeText(p.establecimiento).includes(norm)) return false;
            return true;
        });
    }, [marketProducts, search, filterEstablecimiento, filterUsuario]);

    const startEdit = (product: MarketProduct) => {
        setEditingId(product.id);
        setEditData({ ...product });
    };

    const cancelEdit = () => { setEditingId(null); setEditData({}); };

    const saveEdit = async () => {
        if (!editingId || !editData.name?.trim()) return;
        await updateMarketProduct(editingId, editData);
        cancelEdit();
    };

    const startMobileEdit = (product: MarketProduct) => {
        setMobileEditId(product.id);
        setEditData({ ...product });
    };

    const saveMobileEdit = async () => {
        if (!mobileEditId || !editData.name?.trim()) return;
        await updateMarketProduct(mobileEditId, editData);
        setMobileEditId(null);
        setEditData({});
    };

    const handleDelete = async (id: string) => {
        if (deleteConfirmId === id) {
            await deleteMarketProduct(id);
            setDeleteConfirmId(null);
        } else {
            setDeleteConfirmId(id);
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    const handleAddNew = async () => {
        if (!newProduct.name?.trim()) return;
        const { isActive, ...productToAdd } = newProduct;
        await addMarketProduct({
            ...productToAdd,
            name: newProduct.name!.trim(),
            priceCents: newProduct.priceCents ?? 0,
            tipo: newProduct.tipo ?? "comida",
            usuario: newProduct.usuario ?? "pareja",
            establecimiento: newProduct.establecimiento ?? "Mercadona",
            unidad: newProduct.unidad ?? "unidad",
        });
        setNewProduct({ name: "", priceCents: 0, tipo: "comida", usuario: "pareja", establecimiento: "Mercadona", unidad: "unidad", isActive: true });
        setShowAddRow(false);
    };

    // Excel import
    const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        setImportError("");
        try {
            const ExcelJS = (await import("exceljs")).default;
            const wb = new ExcelJS.Workbook();
            const buf = await file.arrayBuffer();
            await wb.xlsx.load(buf);

            const ws = wb.worksheets[0];
            const errors: string[] = [];
            for (let r = 2; r <= ws.rowCount; r++) {
                const row = ws.getRow(r);
                const name = row.getCell(1).text.trim();
                const priceRaw = String(row.getCell(2).text).replace(",", ".").replace("€", "").trim();
                const tipo = row.getCell(3).text.trim().toLowerCase() as MarketProductTipo;
                const usuario = row.getCell(4).text.trim().toLowerCase() as MarketProductUsuario;
                const est = row.getCell(5).text.trim();
                const unidad = (row.getCell(6).text.trim().toLowerCase() || "unidad") as MarketProductUnidad;

                if (!name) continue;
                if (!TIPOS.includes(tipo)) { errors.push(`Fila ${r}: tipo inválido (${tipo})`); continue; }
                if (!USUARIOS.includes(usuario)) { errors.push(`Fila ${r}: usuario inválido (${usuario})`); continue; }
                const priceCents = Math.round(parseFloat(priceRaw) * 100);
                if (isNaN(priceCents)) { errors.push(`Fila ${r}: precio inválido`); continue; }

                await addMarketProduct({ name, priceCents, tipo, usuario, establecimiento: est || "Mercadona", unidad });
            }
            if (errors.length > 0) setImportError(errors.slice(0, 3).join(" | "));
        } catch {
            setImportError("Error al leer el archivo Excel.");
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [addMarketProduct]);

    const inputCls = "w-full px-4 py-2.5 rounded-2xl bg-slate-900/40 border border-white/5 text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 backdrop-blur-xl transition-all duration-300 shadow-xl";

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-slate-900/40 backdrop-blur-xl p-4 rounded-3xl border border-white/5 shadow-2xl relative z-30">
                <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
                    {/* Search */}
                    <div className="relative group flex-1 sm:flex-none min-w-[200px]">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors group-focus-within:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar productos..."
                            className="pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 transition-all w-full"
                        />
                    </div>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto pb-1 sm:pb-0">
                        <CustomSelect
                            value={filterEstablecimiento}
                            onChange={setFilterEstablecimiento}
                            options={[{ value: "", label: "Todos los establecimientos" } as any, ...ESTABLECIMIENTOS.map(e => ({ value: e, label: e }))]}
                            placeholder="Establecimiento"
                            className="w-full sm:w-auto"
                        />
                        <CustomSelect
                            value={filterUsuario}
                            onChange={setFilterUsuario}
                            options={[{ value: "", label: "Todos los usuarios" } as any, ...USUARIOS.map(u => ({ value: u, label: u.charAt(0).toUpperCase() + u.slice(1) }))]}
                            placeholder="Usuario"
                            className="w-full sm:w-auto"
                        />
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-2 lg:mt-0">
                    <label className="flex-1 sm:flex-none cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        {importing ? "Importando..." : "Importar Excel"}
                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => void handleImport(e)} />
                    </label>
                    <button
                        onClick={() => setShowAddRow(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 text-white border border-blue-500/50 hover:bg-blue-500 hover:scale-[1.02] active:scale-95 transition-all text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        Añadir
                    </button>
                </div>
            </div>

            {importError && <p className="text-xs text-rose-400 bg-rose-400/10 px-3 py-2 rounded-xl">{importError}</p>}

            {/* Import format hint */}
            <p className="text-[10px] text-slate-600 italic">
                Formato Excel: Nombre | Precio (€) | Tipo (comida/personal/casa) | Usuario (pareja/marcos/camila) | Establecimiento | Unidad
            </p>

            {marketLoading && (
                <div className="text-slate-500 text-sm text-center py-8">Cargando productos...</div>
            )}

            {/* ── Desktop Table ─────────────────────────────────────────── */}
            {!marketLoading && (
                <div className="hidden sm:block rounded-[2.5rem] border border-white/5 bg-slate-900/20 shadow-2xl backdrop-blur-xl">
                    <table className="w-full text-xs">
                        <thead className="bg-slate-900/80 sticky top-0 z-10 border-b border-white/5">
                            <tr className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
                                <th className="text-left px-6 py-5">Nombre</th>
                                <th className="text-right px-6 py-5">Precio</th>
                                <th className="text-center px-6 py-5">Tipo</th>
                                <th className="text-center px-6 py-5">Usuario</th>
                                <th className="text-center px-6 py-5">Establecim.</th>
                                <th className="text-center px-6 py-5">Unidad</th>
                                <th className="px-6 py-5 w-10 sticky right-0 bg-slate-900/80" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filtered.map((product) => {
                                const isEditing = editingId === product.id;
                                const isDel = deleteConfirmId === product.id;
                                return (
                                    <tr
                                        key={product.id}
                                        className={`group transition-all duration-300 ${isDel ? "bg-red-500/10" : "hover:bg-white/[0.03]"} ${isEditing ? "bg-blue-500/5 ring-1 ring-inset ring-blue-500/20 relative z-20" : ""}`}
                                        onClick={() => !isEditing && startEdit(product)}
                                    >
                                        {isEditing ? (
                                            <>
                                                <td className="px-5 py-3 truncate min-w-[200px]"><input className={inputCls} value={editData.name ?? ""} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} autoFocus /></td>
                                                <td className="px-5 py-3 text-right">
                                                    <NumberInput
                                                        value={((editData.priceCents ?? 0) / 100).toFixed(2)}
                                                        onChange={(val: string) => setEditData((d) => ({ ...d, priceCents: Math.round(parseFloat(val.replace(",", ".")) * 100) || 0 }))}
                                                        step={0.01}
                                                        min={0}
                                                        className="w-24 ml-auto"
                                                    />
                                                </td>
                                                <td className="px-5 py-3">
                                                    <CustomSelect
                                                        value={editData.tipo ?? "comida"}
                                                        onChange={(val) => setEditData((d) => ({ ...d, tipo: val as MarketProductTipo }))}
                                                        options={TIPOS.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
                                                        placeholder="Tipo"
                                                        className="w-full"
                                                    />
                                                </td>
                                                <td className="px-5 py-3">
                                                    <CustomSelect
                                                        value={editData.usuario ?? "pareja"}
                                                        onChange={(val) => setEditData((d) => ({ ...d, usuario: val as MarketProductUsuario }))}
                                                        options={USUARIOS.map(u => ({ value: u, label: u.charAt(0).toUpperCase() + u.slice(1) }))}
                                                        placeholder="Usuario"
                                                        className="w-full"
                                                    />
                                                </td>
                                                <td className="px-5 py-3">
                                                    <CustomSelect
                                                        value={editData.establecimiento ?? "Mercadona"}
                                                        onChange={(val) => setEditData((d) => ({ ...d, establecimiento: val }))}
                                                        options={ESTABLECIMIENTOS.map(e => ({ value: e, label: e }))}
                                                        placeholder="Mercado"
                                                        className="w-full"
                                                    />
                                                </td>
                                                <td className="px-5 py-3">
                                                    <CustomSelect
                                                        value={editData.unidad ?? "unidad"}
                                                        onChange={(val) => setEditData((d) => ({ ...d, unidad: val as MarketProductUnidad }))}
                                                        options={UNIDADES.map(u => ({ value: u, label: u }))}
                                                        placeholder="Unidad"
                                                        className="w-full"
                                                    />
                                                </td>
                                                <td className="px-5 py-3 whitespace-nowrap sticky right-0 bg-slate-900/40 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => void saveEdit()} className="px-4 py-1.5 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">Guardar</button>
                                                        <button onClick={cancelEdit} className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-200 transition-all">✕</button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 font-bold text-slate-200 cursor-pointer group-hover:text-blue-400 transition-colors">{product.name}</td>
                                                <td className="px-6 py-4 text-right font-black text-slate-100 text-sm tracking-tight">{formatEur(product.priceCents)}</td>
                                                <td className="px-6 py-4 text-center"><Badge text={product.tipo} color={TIPO_COLORS[product.tipo]} icon={<span className="text-[10px] opacity-80">{product.tipo === 'comida' ? '🍎' : product.tipo === 'personal' ? '🧴' : '🏠'}</span>} /></td>
                                                <td className="px-6 py-4 text-center"><Badge text={product.usuario} color={USUARIO_COLORS[product.usuario]} /></td>
                                                <td className="px-6 py-4 text-center text-[11px] font-medium text-slate-400">{product.establecimiento}</td>
                                                <td className="px-6 py-4 text-center text-[10px] uppercase font-bold tracking-widest text-slate-600">{product.unidad}</td>
                                                <td className="px-6 py-4 text-right sticky right-0 group-hover:bg-slate-800/20 group-hover:backdrop-blur-md transition-all" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 justify-end">
                                                        <button onClick={() => startEdit(product)} className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center shadow-lg" title="Editar">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </button>
                                                        <button onClick={() => void handleDelete(product.id)} className={`w-8 h-8 rounded-xl transition-all flex items-center justify-center shadow-lg ${isDel ? "bg-red-500 text-white" : "bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"}`} title="Eliminar">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1: Market Debts
// ─────────────────────────────────────────────────────────────────────────────

function MarketDebtsTab() {
    const { marketPurchases, marketLoading, deleteMarketPurchaseItem, deleteMarketPurchase, selectedDate, setSelectedDate } = useFinance();
    const now = new Date();
    const { month, year } = selectedDate;

    const setMonth = (m: number | ((prev: number) => number)) => {
        if (typeof m === "function") {
            const nextMonth = m(selectedDate.month);
            setSelectedDate({ ...selectedDate, month: nextMonth });
        } else {
            setSelectedDate({ ...selectedDate, month: m });
        }
    };

    const setYear = (y: number | ((prev: number) => number)) => {
        if (typeof y === "function") {
            const nextYear = y(selectedDate.year);
            setSelectedDate({ ...selectedDate, year: nextYear });
        } else {
            setSelectedDate({ ...selectedDate, year: y });
        }
    };
    const [expandedUserId, setExpandedUserId] = useState<"marcos" | "camila" | null>(null);
    const [expandedUserPurchaseId, setExpandedUserPurchaseId] = useState<string | null>(null);
    const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
    const [deletingPurchaseId, setDeletingPurchaseId] = useState<string | null>(null);

    // Filter purchases by selected month
    const filteredPurchases = useMemo(() => {
        return marketPurchases.filter((p) => {
            const date = new Date(p.date);
            return date.getMonth() === month && date.getFullYear() === year;
        });
    }, [marketPurchases, month, year]);

    // Compute per-purchase debt owed by each person
    const purchaseDebt = useMemo(() => {
        return filteredPurchases.map((p) => {
            let parejaTotal = 0, marcosTotal = 0, camilaTotal = 0;
            p.items.forEach((item: MarketPurchaseItem) => {
                const sub = Math.round(item.priceCents * item.qty);
                if (item.tipoUsuario === "pareja") parejaTotal += sub;
                else if (item.tipoUsuario === "marcos") marcosTotal += sub;
                else camilaTotal += sub;
            });
            const parejaHalf = Math.round(parejaTotal / 2);
            // If Marcos paid: Camila owes her portion (her individual + half pareja)
            // If Camila paid: Marcos owes his portion (his individual + half pareja)
            const camilaOwes = p.paidBy === "marcos" ? camilaTotal + parejaHalf : 0;
            const marcosOwes = p.paidBy === "camila" ? marcosTotal + parejaHalf : 0;
            return { ...p, parejaTotal, marcosTotal, camilaTotal, parejaHalf, camilaOwes, marcosOwes };
        });
    }, [filteredPurchases]);


    // Aggregate totals
    const totals = useMemo(() => {
        let marcosIndividual = 0, camilaIndividual = 0, parejaTotal = 0;
        let marcosOwesTotal = 0, camilaOwesTotal = 0;
        purchaseDebt.forEach((p) => {
            marcosIndividual += p.marcosTotal;
            camilaIndividual += p.camilaTotal;
            parejaTotal += p.parejaTotal;
            marcosOwesTotal += p.marcosOwes;
            camilaOwesTotal += p.camilaOwes;
        });
        const parejaHalf = Math.round(parejaTotal / 2);
        // Net balance
        const net = marcosOwesTotal - camilaOwesTotal;
        const debtor = net > 0 ? "marcos" : net < 0 ? "camila" : null;
        const netAmount = Math.abs(net);
        const globalTotal = marcosIndividual + camilaIndividual + parejaTotal;
        return { marcosIndividual, camilaIndividual, parejaTotal, parejaHalf, marcosOwesTotal, camilaOwesTotal, net, debtor, netAmount, globalTotal };
    }, [purchaseDebt]);

    if (marketLoading) return <div className="text-slate-500 text-sm text-center py-12">Cargando...</div>;

    const renderMonthNavigator = () => (
        <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-white/5">
                <button
                    onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
                    className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all text-xs font-bold"
                >‹</button>
                <span className="px-4 text-xs font-black text-slate-200 min-w-[120px] text-center uppercase tracking-widest">
                    {MONTH_NAMES[month]} {year}
                </span>
                <button
                    onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
                    className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all text-xs font-bold"
                >›</button>
            </div>

            {(month !== now.getMonth() || year !== now.getFullYear()) && (
                <button
                    onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()); }}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20"
                >
                    Mes actual
                </button>
            )}
        </div>
    );

    if (filteredPurchases.length === 0) {
        return (
            <div className="space-y-6">
                {renderMonthNavigator()}
                <div className="text-center py-16">
                    <div className="text-4xl mb-3">🛒</div>
                    <p className="text-slate-400 font-medium">No hay compras de mercado en este mes</p>
                    <p className="text-xs text-slate-600 mt-1">Usa "Agregar Mercado" para añadir una compra o cambia de mes</p>
                </div>
            </div>
        );
    }

    const renderHistoryCard = (p: typeof purchaseDebt[0]) => {
        const isExpanded = expandedPurchaseId === p.id;
        return (
            <div key={p.id} className={`group/history relative border transition-all duration-500 overflow-hidden ${isExpanded ? "border-white/10 bg-slate-800/60 shadow-2xl rounded-[2rem]" : "border-white/5 bg-slate-900/40 hover:bg-slate-900/60 hover:border-white/10 shadow-lg rounded-[1.5rem]"}`}>
                <div
                    className="flex items-center gap-4 p-5 sm:p-6 cursor-pointer relative z-10"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpandedPurchaseId(isExpanded ? null : p.id);
                        setExpandedUserPurchaseId(null);
                        setExpandedUserId(null);
                    }}
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <span className="font-black text-slate-100 text-base tracking-tight">{p.establecimiento}</span>
                            <Badge text={`Pagó ${p.paidBy}`} color={USUARIO_COLORS[p.paidBy as MarketProductUsuario]} />
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest opacity-80">{p.date}</span>
                            {p.note && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                    <span className="text-[11px] text-slate-500 font-medium italic truncate max-w-[150px]">{p.note}</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                            {p.parejaTotal > 0 && <Badge text={`Pareja ${formatEur(p.parejaTotal)}`} color={USUARIO_COLORS.pareja} />}
                            {(p.marcosTotal > 0 || p.parejaTotal > 0) && <Badge text={`Marcos ${formatEur(p.marcosTotal + p.parejaHalf)}`} color={USUARIO_COLORS.marcos} />}
                            {(p.camilaTotal > 0 || p.parejaTotal > 0) && <Badge text={`Camila ${formatEur(p.camilaTotal + p.parejaHalf)}`} color={USUARIO_COLORS.camila} />}
                        </div>
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                        <div className="text-right">
                            <div className="font-black text-slate-100 text-xl tracking-tighter">{formatEur(p.totalCents)}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{p.items.length} productos</div>
                        </div>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 bg-white/5 group-hover/history:bg-white/10 ${isExpanded ? "rotate-180 shadow-inner bg-white/10" : ""}`}>
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500 border-t border-white/5 bg-black/20 p-5 sm:p-6 space-y-6">
                        {/* Summary cards with user style */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="group/aporte relative rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4 transition-all hover:bg-blue-500/10">
                                <div className="text-[10px] text-blue-400/60 font-black uppercase tracking-widest mb-2 flex items-center justify-between">
                                    <span>Aporte Marcos</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                </div>
                                <div className="font-black text-slate-100 text-2xl tracking-tight">{formatEur(p.marcosTotal + p.parejaHalf)}</div>
                                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                    <span>{formatEur(p.marcosTotal)} <span className="text-[8px] opacity-40">ind</span></span>
                                    <span className="opacity-20">+</span>
                                    <span>{formatEur(p.parejaHalf)} <span className="text-[8px] opacity-40">par</span></span>
                                </div>
                            </div>

                            <div className="group/aporte relative rounded-2xl border border-pink-500/10 bg-pink-500/5 p-4 transition-all hover:bg-pink-500/10">
                                <div className="text-[10px] text-pink-400/60 font-black uppercase tracking-widest mb-2 flex items-center justify-between">
                                    <span>Aporte Camila</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]"></div>
                                </div>
                                <div className="font-black text-slate-100 text-2xl tracking-tight">{formatEur(p.camilaTotal + p.parejaHalf)}</div>
                                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                    <span>{formatEur(p.camilaTotal)} <span className="text-[8px] opacity-40">ind</span></span>
                                    <span className="opacity-20">+</span>
                                    <span>{formatEur(p.parejaHalf)} <span className="text-[8px] opacity-40">par</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Minimalist product mapping */}
                        <div className="space-y-6">
                            {(["pareja", "marcos", "camila"] as const).map((user) => {
                                const userItems = p.items.filter((i: MarketPurchaseItem) => i.tipoUsuario === user);
                                if (userItems.length === 0) return null;
                                const tColor = user === "pareja" ? "text-violet-400" : user === "marcos" ? "text-blue-400" : "text-pink-400";
                                const uTotal = user === "pareja" ? p.parejaTotal : user === "marcos" ? p.marcosTotal : p.camilaTotal;
                                return (
                                    <div key={user} className="space-y-3">
                                        <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
                                            <Badge text={user} color={user === "pareja" ? USUARIO_COLORS.pareja : (user === "marcos" ? USUARIO_COLORS.marcos : USUARIO_COLORS.camila)} />
                                            <span className={`text-xs font-black ${tColor} flex items-center gap-1.5`}>
                                                {formatEur(uTotal + (user !== "pareja" ? p.parejaHalf : 0))}
                                                {user !== "pareja" && p.parejaHalf > 0 && <span className="text-[10px] opacity-50 font-bold uppercase tracking-widest">(inc. 50% par.)</span>}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {userItems.map((item: MarketPurchaseItem, i: number) => (
                                                <div key={i} className="flex justify-between items-center py-2.5 px-0 rounded-xl hover:bg-white/[0.03] transition-all group/item text-left">
                                                    <div className="flex items-center gap-3 overflow-hidden flex-1 justify-start">
                                                        <span className="text-[13px] font-medium text-slate-300 truncate text-left">
                                                            {item.nameSnapshot}
                                                            {item.qty > 1 && <span className="text-[9px] font-black text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded-md ml-2 inline-block -translate-y-[1px]">×{item.qty}</span>}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 shrink-0">
                                                        <span className="text-sm font-bold text-slate-100">{formatEur(Math.round(item.priceCents * item.qty))}</span>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (deletingItemId === item.id) return;
                                                                setDeletingItemId(item.id);
                                                                await deleteMarketPurchaseItem(p.id, item.id);
                                                                setDeletingItemId(null);
                                                            }}
                                                            className={`text-slate-600 hover:text-red-400 p-1.5 bg-white/5 hover:bg-red-500/10 rounded-lg opacity-0 group-hover/item:opacity-100 transition-all shrink-0 ${deletingItemId === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            title="Eliminar producto"
                                                            disabled={deletingItemId === item.id}
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Simple but bold delete button */}
                        <div className="pt-4 flex justify-center">
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (deletingPurchaseId === p.id) {
                                        await deleteMarketPurchase(p.id);
                                        setDeletingPurchaseId(null);
                                    } else {
                                        setDeletingPurchaseId(p.id);
                                        setTimeout(() => setDeletingPurchaseId(null), 3000);
                                    }
                                }}
                                className={`w-full py-3.5 rounded-2xl transition-all duration-300 text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 ${deletingPurchaseId === p.id
                                        ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] scale-[0.98]"
                                        : "bg-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-white/5"
                                    }`}
                            >
                                {deletingPurchaseId === p.id ? "⚠️ Confirmar eliminación total" : "🗑️ Eliminar Mercado"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderUserHistory = (targetUserId: MarketProductUsuario) => {
        return (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-3 pt-2">
                {purchaseDebt.map((p) => {
                    const userItems = p.items.filter((i: MarketPurchaseItem) => i.tipoUsuario === targetUserId);
                    const parejaItems = p.items.filter((i: MarketPurchaseItem) => i.tipoUsuario === "pareja");
                    if (userItems.length === 0 && parejaItems.length === 0) return null;
                    const isExpanded = expandedUserPurchaseId === p.id;
                const userTotalOnPurchase = p.items.reduce((acc: number, cur: MarketPurchaseItem) => {
                    if (cur.tipoUsuario === targetUserId) return acc + Math.round(cur.priceCents * cur.qty);
                    if (cur.tipoUsuario === "pareja") return acc + Math.round((cur.priceCents * cur.qty) / 2);
                    return acc;
                }, 0);

                return (
                    <div key={p.id} className={`rounded-2xl border transition-all duration-300 ${isExpanded ? 'bg-slate-800/60 border-white/10 shadow-xl' : 'bg-slate-900/40 border-white/5 hover:border-white/10'}`}>
                        <div
                            className="flex items-center justify-between p-5 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setExpandedUserPurchaseId(isExpanded ? null : p.id); }}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-1.5 h-10 rounded-full ${targetUserId === 'marcos' ? 'bg-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-pink-500/40 shadow-[0_0_10px_rgba(236,72,153,0.2)]'}`} />
                                <div>
                                    <div className="font-black text-slate-100 text-sm uppercase tracking-[0.1em]">{p.establecimiento || 'Mercado'}</div>
                                    <div className="text-[11px] text-slate-500 font-bold mt-0.5">{p.date}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-5">
                                <div className="text-right">
                                    <div className={`text-base font-black tracking-tighter ${targetUserId === 'marcos' ? 'text-blue-100' : 'text-pink-100'}`}>{formatEur(userTotalOnPurchase)}</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{userItems.length + parejaItems.length} productos</div>
                                </div>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-white/10 rotate-180 shadow-inner' : 'bg-white/5 hover:bg-white/10'}`}>
                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="bg-slate-950/40 rounded-2xl border border-white/[0.03] overflow-hidden p-4 space-y-6">
                                    {userItems.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                                                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-400/80">Individual</span>
                                                <span className="text-xs font-black text-blue-200">{formatEur(userItems.reduce((acc: number, cur: MarketPurchaseItem) => acc + Math.round(cur.priceCents * cur.qty), 0))}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {userItems.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center py-2.5 group/item border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] px-2 -mx-2 rounded-lg transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-slate-200">{item.nameSnapshot}</span>
                                                            {item.qty > 1 && <span className="text-[10px] font-bold text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded-md">×{item.qty}</span>}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-100">{formatEur(Math.round(item.priceCents * item.qty))}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {parejaItems.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center border-b border-violet-500/10 pb-2">
                                                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-violet-400/80">50% Aporte Pareja</span>
                                                <span className="text-xs font-black text-violet-200">{formatEur(parejaItems.reduce((acc: number, cur: MarketPurchaseItem) => acc + Math.round((cur.priceCents * cur.qty) / 2), 0))}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {parejaItems.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center py-2.5 group/item border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] px-2 -mx-2 rounded-lg transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-slate-200">{item.nameSnapshot}</span>
                                                            {item.qty > 1 && <span className="text-[10px] font-bold text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded-md">×{item.qty}</span>}
                                                        </div>
                                                        <span className="text-sm font-bold text-violet-100">{formatEur(Math.round((item.priceCents * item.qty) / 2))}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
        );
    };

    return (
        <div className="space-y-6">
            {renderMonthNavigator()}

            {/* Global Total Context */}
            <div className="text-center space-y-1">
                <p className="text-sm text-slate-400 font-medium">Total pagado en {MONTH_NAMES[month]}</p>
                <p className="text-3xl font-black text-slate-100 tracking-tight">{formatEur(totals.globalTotal)}</p>
            </div>

            {/* Net balance banner */}
            <div className={`rounded-xl border p-4 flex items-center justify-between shadow-lg ${totals.debtor === null
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-amber-500/10 border-amber-500/30"
                }`}>
                {totals.debtor === null ? (
                    <p className="text-emerald-400 font-semibold text-sm">✅ Sin deuda neta pendiente en compras de mercado</p>
                ) : (
                    <>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-amber-500/80">
                                {totals.debtor === "marcos" ? "Marcos debe pagar" : "Camila debe pagar"}
                            </p>
                            <p className="text-xs text-amber-200/60 mt-0.5">Balance neto compensado</p>
                        </div>
                        <p className="text-2xl font-black text-amber-400 tracking-tight">{formatEur(totals.netAmount)}</p>
                    </>
                )}
            </div>

            {/* Two-panel debt view */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                {/* Marcos Panel */}
                <div className="space-y-6">
                    <div
                        className={`group/usercard relative rounded-[2rem] border transition-all duration-500 cursor-pointer overflow-hidden backdrop-blur-xl ${expandedUserId === "marcos" ? "border-blue-500/40 bg-blue-950/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]" : "border-white/5 bg-slate-900/40 hover:bg-slate-900/60 hover:border-white/10 shadow-2xl"}`}
                        onClick={() => { 
                            setExpandedUserId(prev => prev === "marcos" ? null : "marcos"); 
                            setExpandedUserPurchaseId(null);
                            setExpandedPurchaseId(null);
                        }}
                    >
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500 rounded-full blur-[80px] opacity-10 pointer-events-none transition-opacity duration-500 group-hover/usercard:opacity-20" />
                        <div className="p-6 space-y-5 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm font-black text-blue-400 shadow-inner">M</div>
                                    <div>
                                        <div className="font-bold text-slate-100 text-base">Marcos</div>
                                        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Desglose de mercado</div>
                                    </div>
                                </div>
                                {expandedUserId === 'marcos' && <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/40">Cerrar ×</span>}
                            </div>
                            <div className="grid grid-cols-2 gap-3 pb-2">
                                <div className="bg-blue-500/5 rounded-2xl p-3 border border-blue-500/10">
                                    <div className="text-[10px] text-blue-400/60 font-black uppercase tracking-widest mb-1">Individual</div>
                                    <div className="text-lg font-black text-blue-100 tracking-tight">{formatEur(totals.marcosIndividual)}</div>
                                </div>
                                <div className="bg-violet-500/5 rounded-2xl p-3 border border-violet-500/10">
                                    <div className="text-[10px] text-violet-400/60 font-black uppercase tracking-widest mb-1">50% Pareja</div>
                                    <div className="text-lg font-black text-violet-100 tracking-tight">{formatEur(totals.parejaHalf)}</div>
                                </div>
                            </div>
                            <div className="bg-blue-600/20 rounded-2xl p-4 border border-blue-500/30">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Total Responsabilidad</span>
                                    <span className="text-xl font-black text-white tracking-tighter">{formatEur(totals.marcosIndividual + totals.parejaHalf)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {expandedUserId === 'marcos' && renderUserHistory('marcos')}
                </div>

                {/* Camila Panel */}
                <div className="space-y-6">
                    <div
                        className={`group/usercard relative rounded-[2rem] border transition-all duration-500 cursor-pointer overflow-hidden backdrop-blur-xl ${expandedUserId === "camila" ? "border-pink-500/40 bg-pink-950/20 shadow-[0_0_30px_rgba(236,72,153,0.15)]" : "border-white/5 bg-slate-900/40 hover:bg-slate-900/60 hover:border-white/10 shadow-2xl"}`}
                        onClick={() => { 
                            setExpandedUserId(prev => prev === "camila" ? null : "camila"); 
                            setExpandedUserPurchaseId(null);
                            setExpandedPurchaseId(null);
                        }}
                    >
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-500 rounded-full blur-[80px] opacity-10 pointer-events-none transition-opacity duration-500 group-hover/usercard:opacity-20" />
                        <div className="p-6 space-y-5 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-sm font-black text-pink-400 shadow-inner">C</div>
                                    <div>
                                        <div className="font-bold text-slate-100 text-base">Camila</div>
                                        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Desglose de mercado</div>
                                    </div>
                                </div>
                                {expandedUserId === 'camila' && <span className="text-[10px] font-black uppercase tracking-widest text-pink-500/40">Cerrar ×</span>}
                            </div>
                            <div className="grid grid-cols-2 gap-3 pb-2">
                                <div className="bg-pink-500/5 rounded-2xl p-3 border border-pink-500/10">
                                    <div className="text-[10px] text-pink-400/60 font-black uppercase tracking-widest mb-1">Individual</div>
                                    <div className="text-lg font-black text-pink-100 tracking-tight">{formatEur(totals.camilaIndividual)}</div>
                                </div>
                                <div className="bg-violet-500/5 rounded-2xl p-3 border border-violet-500/10">
                                    <div className="text-[10px] text-violet-400/60 font-black uppercase tracking-widest mb-1">50% Pareja</div>
                                    <div className="text-lg font-black text-violet-100 tracking-tight">{formatEur(totals.parejaHalf)}</div>
                                </div>
                            </div>
                            <div className="bg-pink-600/20 rounded-2xl p-4 border border-pink-500/30">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-pink-200 uppercase tracking-widest">Total Responsabilidad</span>
                                    <span className="text-xl font-black text-white tracking-tighter">{formatEur(totals.camilaIndividual + totals.parejaHalf)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {expandedUserId === 'camila' && renderUserHistory('camila')}
                </div>
            </div>

            {/* History Section */}
            <div className="space-y-4 pt-8 border-t border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 rounded-full bg-slate-700" />
                    <h3 className="text-sm font-black text-slate-500 tracking-[0.2em] uppercase">Historial de Compras</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {purchaseDebt.map(renderHistoryCard)}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2: Stats (with gasto cards)
// ─────────────────────────────────────────────────────────────────────────────

function MarketStatsTab() {
    const { marketPurchases, marketProducts, marketLoading } = useFinance();
    const now = new Date();
    const [periodMode, setPeriodMode] = useState<"monthly" | "annual">("monthly");
    const [month, setMonth] = useState(now.getMonth());
    const [year, setYear] = useState(now.getFullYear());
    const [userId, setUserId] = useState<MarketProductUsuario | "todos">("todos");
    const [activeTipo, setActiveTipo] = useState<MarketProductTipo | null>(null);

    // Filter purchases by period
    const filteredPurchases = useMemo(() => {
        return marketPurchases.filter(p => {
            const d = new Date(p.date);
            if (periodMode === "monthly") return d.getMonth() === month && d.getFullYear() === year;
            return d.getFullYear() === year;
        });
    }, [marketPurchases, periodMode, month, year]);

    // Compute item-level amount for the current user filter
    const getItemCents = (item: MarketPurchaseItem, user: MarketProductUsuario | "todos"): number | null => {
        const raw = Math.round(item.priceCents * item.qty);
        if (user === "todos") return raw; // pareja = full
        // personal filter: own items full + pareja items at 50%
        if (item.tipoUsuario === "pareja") return Math.round(raw / 2);
        if (item.tipoUsuario !== user) return null; // skip other user's items
        return raw;
    };

    // Build product lookup map for resolving tipo on legacy items
    const productMap = useMemo(() => {
        const map = new Map<string, MarketProductTipo>();
        marketProducts.forEach(p => map.set(p.id, p.tipo));
        return map;
    }, [marketProducts]);

    // Resolve tipo for an item (uses the saved field first, then fallback to product catalog)
    const getItemTipo = (item: MarketPurchaseItem): MarketProductTipo | undefined => {
        if (item.tipo && TIPOS.includes(item.tipo)) return item.tipo;
        if (item.productId) return productMap.get(item.productId);
        return undefined;
    };

    // Purchase items grouped by tipo, for drill-down panel
    const itemsByTipo = useMemo(() => {
        const map: Record<MarketProductTipo, { purchase: (typeof marketPurchases)[0]; item: MarketPurchaseItem; tipo: MarketProductTipo }[]> = { comida: [], personal: [], casa: [] };
        filteredPurchases.forEach(p => {
            p.items.forEach((item: MarketPurchaseItem) => {
                const tipo = getItemTipo(item);
                if (!tipo) return;
                const cents = getItemCents(item, userId);
                if (cents === null) return;
                map[tipo].push({ purchase: p, item, tipo });
            });
        });
        return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredPurchases, userId, productMap]);

    const stats = useMemo(() => {
        let totalCents = 0;
        const byType: Record<MarketProductTipo, number> = { comida: 0, personal: 0, casa: 0 };
        const byProduct: Record<string, { total: number; count: number; tipo: MarketProductTipo }> = {};

        // Per-user ticket medio tracking
        let marcosTotal = 0, camilaTotal = 0;
        let marcosPurchases = 0, camilaPurchases = 0;

        filteredPurchases.forEach(p => {
            let purchaseContribMarcos = 0;
            let purchaseContribCamila = 0;

            p.items.forEach((item: MarketPurchaseItem) => {
                const cents = getItemCents(item, userId);
                if (cents === null) return;

                const tipo = getItemTipo(item);
                if (!tipo) return; // skip items with no resolvable tipo

                totalCents += cents;
                byType[tipo] += cents;

                if (!byProduct[item.nameSnapshot]) {
                    byProduct[item.nameSnapshot] = { total: 0, count: 0, tipo };
                }
                byProduct[item.nameSnapshot].total += cents;
                byProduct[item.nameSnapshot].count += item.qty;

                // Track per-user contribution for avg ticket
                const rawCents = Math.round(item.priceCents * item.qty);
                if (item.tipoUsuario === "pareja") {
                    purchaseContribMarcos += Math.round(rawCents / 2);
                    purchaseContribCamila += Math.round(rawCents / 2);
                } else if (item.tipoUsuario === "marcos") {
                    purchaseContribMarcos += rawCents;
                } else if (item.tipoUsuario === "camila") {
                    purchaseContribCamila += rawCents;
                }
            });

            if (purchaseContribMarcos > 0) { marcosTotal += purchaseContribMarcos; marcosPurchases++; }
            if (purchaseContribCamila > 0) { camilaTotal += purchaseContribCamila; camilaPurchases++; }
        });

        const pieData = TIPOS.map(t => ({
            id: t,
            label: TIPO_LABEL[t],
            value: byType[t],
            color: CATEGORY_PALETTE[t]
        })).filter(d => d.value > 0);

        const topByTipo: Record<MarketProductTipo, { name: string; total: number; count: number; tipo: MarketProductTipo }[]> = {
            comida: [],
            personal: [],
            casa: [],
        };
        Object.entries(byProduct).forEach(([name, data]) => {
            if (data.tipo && topByTipo[data.tipo]) {
                topByTipo[data.tipo].push({ name, ...data });
            }
        });
        TIPOS.forEach(t => {
            topByTipo[t] = topByTipo[t].sort((a, b) => b.total - a.total).slice(0, 10);
        });

        const avgTicket = filteredPurchases.length > 0 ? Math.round(totalCents / filteredPurchases.length) : 0;
        const avgTicketMarcos = marcosPurchases > 0 ? Math.round(marcosTotal / marcosPurchases) : 0;
        const avgTicketCamila = camilaPurchases > 0 ? Math.round(camilaTotal / camilaPurchases) : 0;

        return { totalCents, byType, pieData, topByTipo, avgTicket, avgTicketMarcos, avgTicketCamila };
    }, [filteredPurchases, userId]);

    const periodLabel = periodMode === "monthly" ? `${MONTH_NAMES[month]} ${year}` : `Año ${year}`;
    const userLabel = userId === "todos" ? "Pareja" : userId === "marcos" ? "Marcos" : "Camila";

    const TIPO_ACCENT: Record<MarketProductTipo, { dot: string; bar: string; border: string; badge: string }> = {
        comida: { dot: "bg-amber-500", bar: "from-amber-500 to-amber-400", border: "border-amber-500/20", badge: "bg-amber-500/10 text-amber-400" },
        personal: { dot: "bg-indigo-400", bar: "from-indigo-500 to-indigo-400", border: "border-indigo-400/20", badge: "bg-indigo-500/10 text-indigo-400" },
        casa: { dot: "bg-teal-400", bar: "from-teal-500 to-teal-400", border: "border-teal-400/20", badge: "bg-teal-500/10 text-teal-400" },
    };

    if (marketLoading) return <div className="text-slate-500 text-sm text-center py-12">Cargando...</div>;

    return (
        <div className="space-y-8 pb-12">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-slate-900/40 backdrop-blur-xl p-4 rounded-3xl border border-white/5 shadow-2xl">
                {/* Period mode + navigator */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex gap-1 p-1 bg-slate-950/40 rounded-xl border border-white/5">
                        {(["monthly", "annual"] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setPeriodMode(m)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${periodMode === m ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"}`}
                            >
                                {m === "monthly" ? "Mensual" : "Anual"}
                            </button>
                        ))}
                    </div>

                    {periodMode === "monthly" ? (
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/40 border border-white/5">
                            <button
                                onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
                                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all text-xs font-bold"
                            >‹</button>
                            <span className="px-3 text-xs font-black text-slate-200 min-w-[110px] text-center uppercase tracking-widest">{MONTH_NAMES[month]} {year}</span>
                            <button
                                onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
                                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all text-xs font-bold"
                            >›</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/40 border border-white/5">
                            <button onClick={() => setYear(y => y - 1)} className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all text-xs font-bold">‹</button>
                            <span className="px-3 text-xs font-black text-slate-200 min-w-[60px] text-center tracking-widest">{year}</span>
                            <button onClick={() => setYear(y => y + 1)} className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all text-xs font-bold">›</button>
                        </div>
                    )}
                </div>

                {/* User filter */}
                <div className="flex gap-1 p-1 bg-slate-950/40 rounded-xl border border-white/5">
                    {(["todos", "marcos", "camila"] as const).map(u => (
                        <button
                            key={u}
                            onClick={() => setUserId(u)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${userId === u
                                ? u === "marcos" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                    : u === "camila" ? "bg-pink-600 text-white shadow-lg shadow-pink-600/20"
                                    : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                : "text-slate-500 hover:text-slate-300"}`}
                        >
                            {u === "todos" ? "Pareja" : u === "marcos" ? "Marcos" : "Camila"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Totalizador + Ticket Medio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2 lg:col-span-1 rounded-2xl bg-slate-900/40 border border-white/5 p-5 flex flex-col gap-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Total {periodLabel}
                    </div>
                    <div className="text-2xl font-black text-slate-100 tracking-tight">{formatEur(stats.totalCents)}</div>
                    <div className="text-[10px] text-slate-500">{filteredPurchases.length} compras · {userLabel}</div>
                </div>

                <div className="rounded-2xl bg-slate-900/40 border border-white/5 p-5 flex flex-col gap-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Ticket Medio
                    </div>
                    <div className="text-xl font-black text-slate-100 tracking-tight">{formatEur(stats.avgTicket)}</div>
                    <div className="text-[10px] text-slate-500">Por compra ({userLabel})</div>
                </div>

                <div className="rounded-2xl bg-blue-500/5 border border-blue-500/10 p-5 flex flex-col gap-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-blue-400/70 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Ticket Marcos
                    </div>
                    <div className="text-xl font-black text-blue-100 tracking-tight">{formatEur(stats.avgTicketMarcos)}</div>
                    <div className="text-[10px] text-slate-500">Por compra individual</div>
                </div>

                <div className="rounded-2xl bg-pink-500/5 border border-pink-500/10 p-5 flex flex-col gap-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-pink-400/70 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                        Ticket Camila
                    </div>
                    <div className="text-xl font-black text-pink-100 tracking-tight">{formatEur(stats.avgTicketCamila)}</div>
                    <div className="text-[10px] text-slate-500">Por compra individual</div>
                </div>
            </div>

            {/* Pie chart + Category breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Left: Donut */}
                <div className="rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-xl p-6 flex flex-col items-center justify-center gap-5 shadow-2xl min-h-[280px]">
                    <div className="text-xs font-black text-slate-500 flex items-center gap-2 self-start uppercase tracking-[0.2em]">
                        <div className="w-1 h-3 bg-blue-500 rounded-full" />
                        Gasto por Tipo
                    </div>

                    {stats.pieData.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-600 italic text-sm py-12">Sin datos para este periodo</div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
                            {/* SVG Donut */}
                            <div className="relative flex-shrink-0">
                                {(() => {
                                    const SIZE = 200;
                                    const cx = SIZE / 2, cy = SIZE / 2;
                                    const R = SIZE / 2 - 12;
                                    const IR = R * 0.55;
                                    const total = stats.totalCents || 1;
                                    let angle = -90;
                                    const svgSlices = stats.pieData.map(d => {
                                        const sweep = (d.value / total) * 360;
                                        const startA = angle;
                                        const endA = angle + sweep;
                                        angle = endA;
                                        const toRad = (a: number) => (a * Math.PI) / 180;
                                        const x1 = cx + R * Math.cos(toRad(startA)), y1 = cy + R * Math.sin(toRad(startA));
                                        const x2 = cx + R * Math.cos(toRad(endA)), y2 = cy + R * Math.sin(toRad(endA));
                                        const large = sweep > 180 ? 1 : 0;
                                        const path = `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
                                        return { ...d, path };
                                    });

                                    return (
                                        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="overflow-visible">
                                            {svgSlices.map(s => {
                                                const isActive = activeTipo === s.id;
                                                return (
                                                    <path
                                                        key={s.id}
                                                        d={s.path}
                                                        fill={s.color}
                                                        stroke="rgba(15,23,42,0.8)"
                                                        strokeWidth="2"
                                                        opacity={activeTipo && !isActive ? 0.3 : 1}
                                                        style={{ 
                                                            filter: isActive ? `drop-shadow(0 0 10px ${s.color}60)` : "none", 
                                                            transition: "opacity 0.3s, filter 0.3s",
                                                            transform: isActive ? 'scale(1.02)' : 'scale(1)',
                                                            transformOrigin: 'center'
                                                        }}
                                                        onClick={() => setActiveTipo(activeTipo === (s.id as MarketProductTipo) ? null : (s.id as MarketProductTipo))}
                                                        className="cursor-pointer"
                                                    />
                                                );
                                            })}
                                            {/* Donut hole */}
                                            <circle cx={cx} cy={cy} r={IR} fill="rgb(8,15,30)" />
                                            {/* Center label */}
                                            {activeTipo ? (
                                                <>
                                                    <text x={cx} y={cy - 8} textAnchor="middle" fill={CATEGORY_PALETTE[activeTipo]} fontSize="9" fontWeight="800" letterSpacing="1">{TIPO_LABEL[activeTipo].toUpperCase()}</text>
                                                    <text x={cx} y={cy + 8} textAnchor="middle" fill="white" fontSize="11" fontWeight="800">{formatEur(stats.byType[activeTipo])}</text>
                                                    <text x={cx} y={cy + 22} textAnchor="middle" fill="#64748b" fontSize="9">{Math.round((stats.byType[activeTipo] / total) * 100)}%</text>
                                                </>
                                            ) : (
                                                <>
                                                    <text x={cx} y={cy - 6} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">TOTAL</text>
                                                    <text x={cx} y={cy + 9} textAnchor="middle" fill="white" fontSize="11" fontWeight="800">{formatEur(stats.totalCents)}</text>
                                                </>
                                            )}
                                        </svg>
                                    );
                                })()}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-col gap-3 flex-1 min-w-0">
                                {stats.pieData.map(d => {
                                    const isActive = activeTipo === d.id;
                                    const pct = Math.round((d.value / (stats.totalCents || 1)) * 100);
                                    const tipoKey = d.id as MarketProductTipo;
                                    const icon = tipoKey === "comida" ? "🍎" : tipoKey === "personal" ? "🧴" : "🏠";
                                    return (
                                        <button
                                            key={d.id}
                                            onClick={() => setActiveTipo(isActive ? null : tipoKey)}
                                            className={`flex items-center gap-3 text-left rounded-xl px-2 py-1.5 transition-all ${isActive ? "bg-white/5" : "hover:bg-white/[0.03]"} ${activeTipo && !isActive ? "opacity-40" : ""}`}
                                        >
                                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color, boxShadow: isActive ? `0 0 8px ${d.color}` : "none" }} />
                                            <span className="text-xs font-medium text-slate-300 flex-1">{icon} {d.label}</span>
                                            <span className="text-xs font-black text-slate-200">{formatEur(d.value)}</span>
                                            <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{pct}%</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Category breakdown + drill-down */}
                <div className="rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-xl p-6 shadow-2xl flex flex-col">
                    <div className="text-xs font-black text-slate-500 flex items-center gap-2 mb-5 uppercase tracking-[0.2em]">
                        <div className="w-1 h-3 bg-amber-500 rounded-full" />
                        {activeTipo ? `Detalle · ${TIPO_LABEL[activeTipo]}` : "Distribución por Categoría"}
                        {activeTipo && (
                            <button onClick={() => setActiveTipo(null)} className="ml-auto text-slate-600 hover:text-slate-400 transition-colors text-xs font-normal normal-case tracking-normal">✕ cerrar</button>
                        )}
                    </div>

                    {activeTipo ? (
                        /* Drill-down: list of items for this tipo */
                        <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[300px] pr-1 custom-scrollbar">
                            {itemsByTipo[activeTipo].length === 0 ? (
                                <div className="text-center text-slate-600 italic text-sm py-8">Sin productos</div>
                            ) : (
                                itemsByTipo[activeTipo]
                                    .sort((a, b) => Math.round(b.item.priceCents * b.item.qty) - Math.round(a.item.priceCents * a.item.qty))
                                    .map(({ purchase, item }, i) => {
                                        const acc = TIPO_ACCENT[activeTipo];
                                        return (
                                            <div key={`${purchase.id}-${item.id}-${i}`} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                                                <span className={`text-[9px] font-black w-4 text-center ${acc.badge.split(" ")[1]} opacity-40`}>{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-semibold text-slate-200 truncate">{item.nameSnapshot}</div>
                                                    <div className="text-[10px] text-slate-600">{purchase.date} · {purchase.establecimiento} · {item.qty} uds.</div>
                                                </div>
                                                <div className="text-xs font-black text-slate-300 flex-shrink-0">{formatEur(Math.round(item.priceCents * item.qty))}</div>
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    ) : (
                        /* Default: progress bars per tipo */
                        <div className="space-y-5 flex-1">
                            {TIPOS.map(t => {
                                const typeTotalCents = stats.byType[t];
                                const pct = stats.totalCents > 0 ? Math.round((typeTotalCents / stats.totalCents) * 100) : 0;
                                const acc = TIPO_ACCENT[t];
                                const icon = t === "comida" ? "🍎" : t === "personal" ? "🧴" : "🏠";
                                return (
                                    <button key={t} onClick={() => setActiveTipo(t)} className="w-full text-left group">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-base group-hover:scale-110 transition-transform">{icon}</span>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{TIPO_LABEL[t]}</div>
                                                    <div className="text-[10px] text-slate-500">{pct}% · {itemsByTipo[t].length} items · click para ver</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-black text-slate-100 tracking-tight">{formatEur(typeTotalCents)}</div>
                                                <svg className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className={`h-full bg-gradient-to-r ${acc.bar} transition-all duration-700 ease-out rounded-full group-hover:brightness-110`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total periodo</span>
                        <span className="text-base font-black text-slate-100">{formatEur(stats.totalCents)}</span>
                    </div>
                </div>
            </div>

            {/* Top 10 — 3 columns, one per tipo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {TIPOS.map(t => {
                    const products = stats.topByTipo[t];
                    const acc = TIPO_ACCENT[t];
                    const icon = t === "comida" ? "🍎" : t === "personal" ? "🧴" : "🏠";
                    return (
                        <div key={t} className={`rounded-[2rem] border border-white/5 bg-slate-900/40 p-5 shadow-xl flex flex-col`}>
                            {/* Column header */}
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-lg">{icon}</span>
                                <div>
                                    <div className="text-xs font-black text-slate-200 uppercase tracking-widest">Top {TIPO_LABEL[t]}</div>
                                    <div className={`text-[9px] font-bold uppercase tracking-widest ${acc.badge.split(" ")[1]}`}>{periodLabel}</div>
                                </div>
                            </div>

                            {/* Product list */}
                            {products.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center py-8 text-slate-600 italic text-xs text-center">
                                    Sin datos en este periodo
                                </div>
                            ) : (
                                <div className="space-y-2 flex-1">
                                    {products.map((p, i) => (
                                        <div key={p.name} className="flex items-center gap-2.5 group">
                                            <span className={`text-[10px] font-black w-5 text-center ${acc.badge.split(" ")[1]} opacity-50 flex-shrink-0`}>
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">{p.name}</div>
                                                <div className="text-[10px] text-slate-600">{p.count} uds.</div>
                                            </div>
                                            <div className="text-xs font-black text-slate-300 flex-shrink-0">{formatEur(p.total)}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Column total */}
                            {products.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Total</span>
                                    <span className={`text-xs font-black ${acc.badge.split(" ")[1]}`}>{formatEur(stats.byType[t])}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function MercaDataPage() {
    const [activeTab, setActiveTab] = useState<"history" | "stats" | "products">("history");

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        MercaData
                    </h1>
                    <p className="mt-1 text-slate-400 font-medium">
                        Inteligencia de mercado y control de gastos compartidos
                    </p>
                </div>

                {/* Tab Navigation */}
                <nav className="flex items-center gap-2 p-1.5 bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] border border-white/5 shadow-2xl overflow-x-auto no-scrollbar">
                    {[
                        { id: "history", label: "Deudas", icon: "🤝" },
                        { id: "stats", label: "Estadísticas", icon: "📊" },
                        { id: "products", label: "Base Datos", icon: "🗄️" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as "history" | "stats" | "products")}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.1em] transition-all duration-500 whitespace-nowrap ${activeTab === tab.id
                                    ? "bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.4)] scale-[1.05] relative z-10"
                                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                                }`}
                        >
                            <span className={activeTab === tab.id ? "scale-125 transition-transform" : ""}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[600px]">
                {activeTab === "history" && <MarketDebtsTab />}
                {activeTab === "stats" && <MarketStatsTab />}
                {activeTab === "products" && <ProductsDatabaseTab />}
            </div>
        </div>
    );
}
