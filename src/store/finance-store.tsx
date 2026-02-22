"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Transaction, User, Category } from "@/types";
import { USERS } from "@/lib/mock";

type FinanceStore = {
    users: User[];
    categories: Category[];
    transactions: Transaction[];
    loading: boolean;
    error: string | null;
    addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
    updateTransaction: (id: string, tx: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    addCategory: (cat: Omit<Category, "id">) => Promise<void>;
    refresh: () => Promise<void>;
};

const FinanceContext = createContext<FinanceStore | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [txRes, catRes] = await Promise.all([
                fetch("/api/transactions"),
                fetch("/api/categories"),
            ]);

            if (!txRes.ok) throw new Error(`Transactions fetch failed: ${txRes.statusText}`);
            if (!catRes.ok) throw new Error(`Categories fetch failed: ${catRes.statusText}`);

            const [txData, catData] = await Promise.all([txRes.json(), catRes.json()]);
            setTransactions(txData as Transaction[]);
            setCategories(catData as Category[]);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            setError(msg);
            console.error("[FinanceStore] fetchAll error:", msg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load data on mount
    useEffect(() => {
        void fetchAll();
    }, [fetchAll]);

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
            setCategories((prev) => prev.map((c) => (c.id === newCat.id ? saved : c)));
        }
    };

    const value: FinanceStore = {
        users: USERS,
        categories,
        transactions,
        loading,
        error,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        refresh: fetchAll,
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
