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
    limitMonthly?: number; // Limit in cents usually, but user specified amounts. Let's stick to cents for consistency or handle conversion. The user said "300 €", I'll store as number (cents) in logic but maybe simple number in types if clearer? No, let's use cents for all money.
};

export type Transaction = {
    id: string;
    createdAt: string; // ISO
    date: string; // YYYY-MM-DD
    userId: string; // "marcos" | "camila" | "pareja" - mapping to owner
    categoryId: string;
    amountCents: number;
    note?: string;
    isShared?: boolean; // Override category scope? Or just for UI?
};

export type PeriodFilter = "current-month" | "previous-month" | "current-year";

export type ViewMode = "monthly" | "annual";

export type MonthYear = {
    month: number; // 0-11
    year: number;
};
