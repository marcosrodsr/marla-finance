export type User = {
    id: string;
    name: string;
};

export type CategoryKind = "fixed" | "variable" | "saving" | "investment" | "income";

export type CategoryScope = "individual" | "shared";

export type TransactionOwner = "marcos" | "camila" | "pareja";

export type Category = {
    id: string;
    label: string;
    icon: string;
    kind: CategoryKind;
    scope: CategoryScope;
    limitMonthly?: number;
};

export type Transaction = {
    id: string;
    createdAt: string; // ISO
    date: string; // YYYY-MM-DD
    userId: string; // "marcos" | "camila" | "pareja"
    categoryId: string;
    amountCents: number;
    note?: string;
    isShared?: boolean;
    paidBy?: "marcos" | "camila"; // Who physically paid — only relevant for pareja transactions
    isSettled?: boolean; // If true, the debt portion of this transaction is resolved
};

export type PeriodFilter = "current-month" | "previous-month" | "current-year";

export type ViewMode = "monthly" | "annual";

export type MonthYear = {
    month: number; // 0-11
    year: number;
};

// --- Debt feature ---
export type DebtAdjustmentDirection = "marcos_to_camila" | "camila_to_marcos";

export type DebtAdjustment = {
    id: string;
    createdAt: string; // ISO
    date: string; // YYYY-MM-DD
    description: string;
    amountCents: number;
    direction: DebtAdjustmentDirection; // "marcos_to_camila" = Marcos pays Camila (reduces Camila's debt)
};
