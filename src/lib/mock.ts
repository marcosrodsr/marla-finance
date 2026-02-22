import { User, Category, Transaction } from "@/types";

export const USERS: User[] = [
    { id: "marcos", name: "Marcos" },
    { id: "camila", name: "Camila" },
    { id: "pareja", name: "Pareja" },
];

export const CATEGORIES: Category[] = [
    // --- GASTOS FIJOS COMPARTIDOS ---
    { id: "rent", label: "Alquiler", icon: "🏠", kind: "fixed", scope: "shared" },
    { id: "electricity", label: "Luz/Agua", icon: "💡", kind: "fixed", scope: "shared" },
    { id: "internet", label: "Móvil/Internet", icon: "📶", kind: "fixed", scope: "shared" },
    { id: "subscriptions", label: "Subscripciones", icon: "📺", kind: "fixed", scope: "shared" },
    { id: "market", label: "Mercado", icon: "🛒", kind: "fixed", scope: "shared" }, // Requested as Fixed
    { id: "outing", label: "Salidas", icon: "🍻", kind: "variable", scope: "shared", limitMonthly: 30000 },

    // --- GASTOS FIJOS INDIVIDUALES ---
    { id: "transport", label: "Transporte", icon: "🚇", kind: "fixed", scope: "individual" },
    { id: "chatgpt", label: "ChatGPT", icon: "🤖", kind: "fixed", scope: "individual" },

    // --- INGRESOS ---
    { id: "salary", label: "Sueldo", icon: "💵", kind: "income", scope: "individual" },
    { id: "income-joint", label: "Ingreso Conjunto", icon: "💰", kind: "income", scope: "shared" },

    // --- AHORROS ---
    { id: "savings-personal", label: "Ahorro Personal", icon: "🐖", kind: "saving", scope: "individual" },
    { id: "savings-joint", label: "Ahorro Pareja", icon: "🏦", kind: "saving", scope: "shared" },

    // --- INVERSIONES ---
    { id: "investments", label: "Inversiones", icon: "📈", kind: "investment", scope: "individual" },
    { id: "investments-joint", label: "Inversiones Pareja", icon: "🚀", kind: "investment", scope: "shared" },
];

const generateMockTransactions = () => {
    const transactions: Transaction[] = [];
    const now = new Date();
    const nowISO = now.toISOString();
    const currentYear = now.getFullYear();

    // Generate for all 12 months of current year
    for (let month = 0; month < 12; month++) {
        const dateStr = new Date(currentYear, month, 1).toISOString().split('T')[0];

        // --- INGRESOS ---
        transactions.push({
            id: `seed-income-marcos-${month}`,
            createdAt: nowISO,
            date: dateStr,
            userId: "marcos",
            categoryId: "salary",
            amountCents: 149400,
            note: "Ingreso Fijo Marcos",
            isShared: false
        });
        transactions.push({
            id: `seed-income-camila-${month}`,
            createdAt: nowISO,
            date: dateStr,
            userId: "camila",
            categoryId: "salary",
            amountCents: 250000,
            note: "Ingreso Fijo Camila",
            isShared: false
        });

        // --- GASTOS FIJOS COMPARTIDOS ---
        transactions.push({
            id: `seed-rent-${month}`,
            createdAt: nowISO,
            date: dateStr,
            userId: "pareja",
            categoryId: "rent",
            amountCents: 115000,
            note: "Alquiler Fijo"
        });
        transactions.push({
            id: `seed-light-${month}`,
            createdAt: nowISO,
            date: dateStr,
            userId: "pareja",
            categoryId: "electricity",
            amountCents: 10000,
            note: "Luz/Agua Estimado"
        });
        transactions.push({
            id: `seed-internet-${month}`,
            createdAt: nowISO,
            date: dateStr,
            userId: "pareja",
            categoryId: "internet",
            amountCents: 3600,
            note: "Internet Fijo"
        });
        transactions.push({
            id: `seed-subs-${month}`,
            createdAt: nowISO,
            date: dateStr,
            userId: "pareja",
            categoryId: "subscriptions",
            amountCents: 1800,
            note: "Subs Fijo"
        });
        transactions.push({
            id: `seed-market-${month}`,
            createdAt: nowISO,
            date: dateStr,
            userId: "pareja",
            categoryId: "market",
            amountCents: 40000,
            note: "Mercado Estimado"
        });
        // (Salidas removed as per user request to not auto-populate it)

        // --- GASTOS FIJOS INDIVIDUALES (Marcos) ---
        transactions.push({
            id: `seed-transport-marcos-${month}`,
            createdAt: nowISO,
            date: dateStr,
            userId: "marcos",
            categoryId: "transport",
            amountCents: 3270,
            note: "Transporte Marcos"
        });
        transactions.push({
            id: `seed-gpt-marcos-${month}`,
            createdAt: nowISO,
            date: dateStr,
            userId: "marcos",
            categoryId: "chatgpt",
            amountCents: 2120,
            note: "ChatGPT Marcos"
        });

        // --- GASTOS FIJOS INDIVIDUALES (Camila) ---
        transactions.push({
            id: `seed-transport-camila-${month}`,
            createdAt: nowISO,
            date: dateStr,
            userId: "camila",
            categoryId: "transport",
            amountCents: 3270,
            note: "Transporte Camila"
        });
        transactions.push({
            id: `seed-gpt-camila-${month}`,
            createdAt: nowISO,
            date: dateStr,
            userId: "camila",
            categoryId: "chatgpt",
            amountCents: 2120,
            note: "ChatGPT Camila"
        });
    }

    return transactions;
};

export const MOCK_TRANSACTIONS: Transaction[] = generateMockTransactions();
