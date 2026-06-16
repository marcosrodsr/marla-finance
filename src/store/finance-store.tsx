"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Category,
    Transaction,
    User,
    DebtAdjustment,
    MarketProduct,
    MarketPurchase,
    MarketPurchaseItem,
    MonthYear,
} from "@/types";
import { USERS } from "@/lib/mock";
import { createClient } from "@/lib/supabase/client";

type CurrentUser = {
    id: string;
    email: string;
    appUserId: "marcos" | "camila" | null;
};

type FinanceStore = {
    users: User[];
    categories: Category[];
    transactions: Transaction[];
    debtAdjustments: DebtAdjustment[];
    loading: boolean;
    error: string | null;
    budgetedAmount: number;
    isCategoryModalOpen: boolean;
    setCategoryModalOpen: (open: boolean) => void;
    
    // MercaData state
    marketProducts: MarketProduct[];
    marketPurchases: MarketPurchase[];
    marketLoading: boolean;

    addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
    updateTransaction: (id: string, tx: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    addCategory: (cat: Omit<Category, "id">) => Promise<void>;
    updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    addDebtAdjustment: (adj: Omit<DebtAdjustment, "id" | "createdAt">) => Promise<void>;
    updateDebtAdjustment: (id: string, adj: Omit<DebtAdjustment, "id" | "createdAt">) => Promise<void>;
    deleteDebtAdjustment: (id: string) => Promise<void>;
    
    // MercaData actions
    addMarketProduct: (product: Omit<MarketProduct, "id" | "createdAt" | "isActive">) => Promise<void>;
    updateMarketProduct: (id: string, product: Partial<MarketProduct>) => Promise<void>;
    deleteMarketProduct: (id: string) => Promise<void>;
    addMarketPurchase: (purchase: Omit<MarketPurchase, 'id' | 'createdAt' | 'items'>, items: Omit<MarketPurchaseItem, 'id' | 'purchaseId'>[]) => Promise<void>;
    updateMarketPurchase: (id: string, purchase: Omit<MarketPurchase, 'id' | 'createdAt' | 'items'>, items: Omit<MarketPurchaseItem, 'id' | 'purchaseId'>[]) => Promise<void>;
    deleteMarketPurchase: (id: string) => Promise<void>;
    deleteMarketPurchaseItem: (purchaseId: string, itemId: string) => Promise<void>;

    selectedDate: MonthYear;
    setSelectedDate: (date: MonthYear) => void;

    currentUser: CurrentUser | null;
    signOut: () => Promise<void>;

    refresh: () => Promise<void>;
};

const FinanceContext = createContext<FinanceStore | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
    const router = useRouter();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [debtAdjustments, setDebtAdjustments] = useState<DebtAdjustment[]>([]);
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);

    // MercaData state
    const [marketProducts, setMarketProducts] = useState<MarketProduct[]>([]);
    const [marketPurchases, setMarketPurchases] = useState<MarketPurchase[]>([]);
    const [marketLoading, setMarketLoading] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    // Persisted selected date
    const [selectedDate, setSelectedDateState] = useState<MonthYear>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("marla-finance-selected-date");
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error("Error parsing saved date", e);
                }
            }
        }
        const now = new Date();
        return { month: now.getMonth(), year: now.getFullYear() };
    });

    const setSelectedDate = useCallback((date: MonthYear) => {
        setSelectedDateState(date);
        localStorage.setItem("marla-finance-selected-date", JSON.stringify(date));
    }, []);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setMarketLoading(true);
        setError(null);
        try {
            const [txRes, catRes, adjRes, mpRes, mkRes] = await Promise.all([
                fetch("/api/transactions"),
                fetch("/api/categories"),
                fetch("/api/debt-adjustments"),
                fetch("/api/market-products"),
                fetch("/api/market-purchases"),
            ]);

            if (!txRes.ok) throw new Error(`Transactions fetch failed: ${txRes.statusText}`);
            if (!catRes.ok) throw new Error(`Categories fetch failed: ${catRes.statusText}`);
            if (!adjRes.ok) throw new Error(`Debt adjustments fetch failed: ${adjRes.statusText}`);
            if (!mpRes.ok) throw new Error(`Market products fetch failed: ${mpRes.statusText}`);
            if (!mkRes.ok) throw new Error(`Market purchases fetch failed: ${mkRes.statusText}`);

            const [txData, catData, adjData, mpData, mkData] = await Promise.all([
                txRes.json(),
                catRes.json(),
                adjRes.json(),
                mpRes.json(),
                mkRes.json()
            ]);
            
            setTransactions(txData as Transaction[]);
            setCategories(catData as Category[]);
            setDebtAdjustments(adjData as DebtAdjustment[]);
            setMarketProducts(mpData as MarketProduct[]);
            setMarketPurchases(mkData as MarketPurchase[]);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            setError(msg);
            console.error("[FinanceStore] fetchAll error:", msg);
        } finally {
            setLoading(false);
            setMarketLoading(false);
        }
    }, []);

    // Load data on mount
    useEffect(() => {
        void fetchAll();
    }, [fetchAll]);

    // Resolve the logged-in Supabase user once on mount.
    // getUser() validates against the server — safer than getSession() which only reads the cookie.
    useEffect(() => {
        const supabase = createClient();
        void supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            setCurrentUser({
                id: user.id,
                email: user.email ?? "",
                appUserId: (user.user_metadata?.app_user_id as "marcos" | "camila") ?? null,
            });
        });
    }, []);

    const signOut = useCallback(async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }, [router]);

    const addTransaction = async (tx: Omit<Transaction, "id" | "createdAt">) => {
        const newTx: Transaction = {
            ...tx,
            id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            createdAt: new Date().toISOString(),
        };

        // Optimistic update
        setTransactions((prev) => [newTx, ...prev]);

        const res = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTx),
        });

        if (!res.ok) {
            // Rollback on failure
            setTransactions((prev) => prev.filter((t) => t.id !== newTx.id));
            const data = await res.json() as { error?: string };
            console.error("[addTransaction] error:", data.error);
            setError(`Error al guardar transacción: ${data.error ?? res.statusText}`);
        } else {
            const saved = await res.json() as Transaction;
            // Replace optimistic entry with server response
            setTransactions((prev) => prev.map((t) => (t.id === newTx.id ? saved : t)));
        }
    };

    const updateTransaction = async (id: string, tx: Omit<Transaction, "id" | "createdAt">) => {
        // Optimistic update
        setTransactions((prev) =>
            prev.map((t) => (t.id === id ? { ...t, ...tx } : t))
        );

        const res = await fetch(`/api/transactions/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tx),
        });

        if (!res.ok) {
            const data = await res.json() as { error?: string };
            console.error("[updateTransaction] error:", data.error);
            setError(`Error al actualizar transacción: ${data.error ?? res.statusText}`);
            await fetchAll(); // Re-sync on failure
        } else {
            const updated = await res.json() as Transaction;
            setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
        }
    };

    const deleteTransaction = async (id: string) => {
        const tx = transactions.find((t) => t.id === id);
        // If it's a market transaction, delete the entire purchase instead
        if (tx?.marketPurchaseId) {
            if (confirm("Este movimiento pertenece a una compra de mercado. ¿Quieres eliminar la compra completa y todos sus movimientos asociados?")) {
                const pId = tx.marketPurchaseId;
                // Optimistic: remove all transactions of this purchase
                setTransactions(prev => prev.filter(t => t.marketPurchaseId !== pId));
                setMarketPurchases(prev => prev.filter(p => p.id !== pId));
                
                await deleteMarketPurchase(pId);
            }
            // Note: If they cancel, we do nothing. 
            // We don't allow deleting just one user's share *from the dashboard* yet 
            // because it's safer to use the Market Details modal for that.
            return;
        }

        // Optimistic update
        const prev = transactions;
        setTransactions((p) => p.filter((t) => t.id !== id));

        const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });

        if (!res.ok) {
            setTransactions(prev); // Rollback
            const data = await res.json() as { error?: string };
            console.error("[deleteTransaction] error:", data.error);
            setError(`Error al eliminar transacción: ${data.error ?? res.statusText}`);
        }
    };

    const addCategory = async (cat: Omit<Category, "id">) => {
        const newCat: Category = {
            ...cat,
            id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };

        // Optimistic update
        setCategories((prev) => [...prev, newCat]);

        const res = await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newCat),
        });

        if (!res.ok) {
            setCategories((prev) => prev.filter((c) => c.id !== newCat.id)); // Rollback
            const data = await res.json() as { error?: string };
            console.error("[addCategory] error:", data.error);
            setError(`Error al guardar categoría: ${data.error ?? res.statusText}`);
        } else {
            const saved = await res.json() as Category;
            setCategories((prev) => {
                const updated = prev.map((c) => (c.id === newCat.id ? saved : c));
                return updated.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            });
        }
    };

    const updateCategory = async (id: string, cat: Partial<Category>) => {
        setCategories((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...cat } : c)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        );

        const res = await fetch(`/api/categories/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cat),
        });

        if (!res.ok) {
            const data = await res.json() as { error?: string };
            setError(`Error al actualizar categoría: ${data.error ?? res.statusText}`);
            await fetchAll();
        } else {
            const updated = await res.json() as Category;
            setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        }
    };

    const deleteCategory = async (id: string) => {
        const prev = categories;
        // Soft delete locally (just mark it so it can be filtered in UI, or actually remove if we want,
        // but since we need historical data, we'll mark isActive = false)
        setCategories((p) => p.map(c => c.id === id ? { ...c, isActive: false } : c));

        const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });

        if (!res.ok) {
            setCategories(prev);
            const data = await res.json() as { error?: string };
            setError(`Error al archivar categoría: ${data.error ?? res.statusText}`);
        }
    };

    const addDebtAdjustment = async (adj: Omit<DebtAdjustment, "id" | "createdAt">) => {
        const newAdj: DebtAdjustment = {
            ...adj,
            id: `adj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            createdAt: new Date().toISOString(),
        };

        setDebtAdjustments((prev) => [newAdj, ...prev]);

        const res = await fetch("/api/debt-adjustments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newAdj),
        });

        if (!res.ok) {
            setDebtAdjustments((prev) => prev.filter((a) => a.id !== newAdj.id));
            const data = await res.json() as { error?: string };
            setError(`Error al guardar ajuste: ${data.error ?? res.statusText}`);
        } else {
            const saved = await res.json() as DebtAdjustment;
            setDebtAdjustments((prev) => prev.map((a) => (a.id === newAdj.id ? saved : a)));
        }
    };

    const updateDebtAdjustment = async (id: string, adj: Omit<DebtAdjustment, "id" | "createdAt">) => {
        setDebtAdjustments((prev) =>
            prev.map((a) => (a.id === id ? { ...a, ...adj } : a))
        );

        const res = await fetch(`/api/debt-adjustments/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(adj),
        });

        if (!res.ok) {
            const data = await res.json() as { error?: string };
            setError(`Error al actualizar ajuste: ${data.error ?? res.statusText}`);
            await fetchAll();
        } else {
            const updated = await res.json() as DebtAdjustment;
            setDebtAdjustments((prev) => prev.map((a) => (a.id === id ? updated : a)));
        }
    };

    const deleteDebtAdjustment = async (id: string) => {
        const prev = debtAdjustments;
        setDebtAdjustments((p) => p.filter((a) => a.id !== id));

        const res = await fetch(`/api/debt-adjustments/${id}`, { method: "DELETE" });

        if (!res.ok) {
            setDebtAdjustments(prev);
            const data = await res.json() as { error?: string };
            setError(`Error al eliminar ajuste: ${data.error ?? res.statusText}`);
        }
    };

    // --- MercaData actions ---

    const addMarketProduct = async (product: Omit<MarketProduct, "id" | "createdAt" | "isActive">) => {
        const res = await fetch("/api/market-products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product),
        });
        if (res.ok) {
            const saved = await res.json() as MarketProduct;
            setMarketProducts((prev) => [...prev, saved]);
        }
    };

    const updateMarketProduct = async (id: string, product: Partial<MarketProduct>) => {
        const res = await fetch(`/api/market-products/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product),
        });
        if (res.ok) {
            const updated = await res.json() as MarketProduct;
            setMarketProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
        }
    };

    const deleteMarketProduct = async (id: string) => {
        const res = await fetch(`/api/market-products/${id}`, { method: "DELETE" });
        if (res.ok) {
            setMarketProducts((prev) => prev.filter((p) => p.id !== id));
        }
    };

    const addMarketPurchase = async (
        purchase: Omit<MarketPurchase, 'id' | 'createdAt' | 'items'>,
        items: Omit<MarketPurchaseItem, 'id' | 'purchaseId'>[]
    ) => {
        setMarketLoading(true);
        try {
            // Recalculate per-block totals for transactions
            const totals = { pareja: 0, marcos: 0, camila: 0 };
            items.forEach(it => {
                totals[it.tipoUsuario] += Math.round(it.priceCents * it.qty);
            });

            // "Mercado" category ID
            const marketCat = categories.find(c => c.label.toLowerCase() === "mercado")?.id;

            const txs = (['pareja', 'marcos', 'camila'] as const)
                .filter(u => totals[u] > 0)
                .map(u => ({
                    id: `tx-market-${Date.now()}-${u}-${Math.random().toString(36).substring(2, 5)}`,
                    date: purchase.date,
                    userId: u,
                    categoryId: marketCat ?? "uncategorized",
                    amountCents: totals[u],
                    paidBy: purchase.paidBy,
                    note: `Compra en ${purchase.establecimiento}${purchase.note ? ': ' + purchase.note : ''}`
                }));

            const res = await fetch("/api/market-purchases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ purchase, items, transactions: txs }),
            });

            if (res.ok) {
                await fetchAll(); // Re-fetch everything to ensure consistent totals and transactions
            } else {
                const data = await res.json() as { error?: string };
                setError(`Error al guardar compra: ${data.error ?? res.statusText}`);
            }
        } finally {
            setMarketLoading(false);
        }
    };

    const updateMarketPurchase = async (
        id: string,
        purchase: Omit<MarketPurchase, 'id' | 'createdAt' | 'items'>,
        items: Omit<MarketPurchaseItem, 'id' | 'purchaseId'>[]
    ) => {
        setMarketLoading(true);
        try {
            // Recalculate per-block totals for transactions
            const totals = { pareja: 0, marcos: 0, camila: 0 };
            items.forEach(it => {
                totals[it.tipoUsuario] += Math.round(it.priceCents * it.qty);
            });

            // "Mercado" category ID
            const marketCat = categories.find(c => c.label.toLowerCase() === "mercado")?.id;

            const txs = (['pareja', 'marcos', 'camila'] as const)
                .filter(u => totals[u] > 0)
                .map(u => ({
                    id: `tx-market-${Date.now()}-${u}-${Math.random().toString(36).substring(2, 5)}`,
                    date: purchase.date,
                    userId: u,
                    categoryId: marketCat ?? "uncategorized",
                    amountCents: totals[u],
                    paidBy: purchase.paidBy,
                    note: `Compra en ${purchase.establecimiento}${purchase.note ? ': ' + purchase.note : ''}`
                }));

            const res = await fetch(`/api/market-purchases/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ purchase, items, transactions: txs }),
            });

            if (res.ok) {
                await fetchAll(); // Re-fetch everything to ensure consistent totals and transactions
            } else {
                const data = await res.json() as { error?: string };
                setError(`Error al actualizar compra: ${data.error ?? res.statusText}`);
            }
        } finally {
            setMarketLoading(false);
        }
    };

    const deleteMarketPurchase = async (id: string) => {
        setMarketLoading(true);
        // Optimistic update
        setMarketPurchases(prev => prev.filter(p => p.id !== id));
        setTransactions(prev => prev.filter(t => t.marketPurchaseId !== id));

        try {
            const res = await fetch(`/api/market-purchases/${id}`, { method: "DELETE" });
            if (res.ok) {
                await fetchAll();
            } else {
                await fetchAll(); // Re-sync on error
            }
        } finally {
            setMarketLoading(false);
        }
    };

    const deleteMarketPurchaseItem = async (purchaseId: string, itemId: string) => {
        setMarketLoading(true);
        
        // Optimistic update
        setMarketPurchases(prev => prev.map(p => {
            if (p.id !== purchaseId) return p;
            const newItems = p.items.filter(it => it.id !== itemId);
            const newTotal = newItems.reduce((acc, it) => acc + Math.round(it.priceCents * it.qty), 0);
            return { ...p, items: newItems, totalCents: newTotal };
        }));

        try {
            const res = await fetch(`/api/market-purchases/${purchaseId}/items/${itemId}`, { method: "DELETE" });
            if (res.ok) {
                await fetchAll();
            } else {
                await fetchAll();
            }
        } finally {
            setMarketLoading(false);
        }
    };

    const value: FinanceStore = {
        users: USERS,
        categories,
        transactions,
        debtAdjustments,
        loading,
        error,
        marketProducts,
        marketPurchases,
        marketLoading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addDebtAdjustment,
        updateDebtAdjustment,
        deleteDebtAdjustment,
        addMarketProduct,
        updateMarketProduct,
        deleteMarketProduct,
        addMarketPurchase,
        updateMarketPurchase,
        deleteMarketPurchase,
        deleteMarketPurchaseItem,
        refresh: fetchAll,
        isCategoryModalOpen,
        setCategoryModalOpen,
        selectedDate,
        setSelectedDate,
        currentUser,
        signOut,
        budgetedAmount: 1800 // Hardcoded for now
    };

    return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceStore {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error("useFinance must be used within FinanceProvider");
    }
    return context;
}
