import { Transaction, Category, CategoryKind, PeriodFilter } from "@/types";

// Format cents to EUR string
export function formatEur(cents: number): string {
    const euros = cents / 100;
    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(euros);
}

// Parse user input (accepts "12,34" or "12.34") to cents
export function parseToAmountCents(input: string): number | null {
    const cleaned = input.trim().replace(",", ".");
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed) || parsed < 0) return null;
    return Math.round(parsed * 100);
}

// Get date range for period filter (legacy support)
export function getPeriodRange(period: PeriodFilter): { start: string; end: string } {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (period === "current-month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === "previous-month") {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else {
        // current-year
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
    }

    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
    };
}

// Filter transactions by period (legacy support)
export function filterByPeriod(transactions: Transaction[], period: PeriodFilter): Transaction[] {
    const { start, end } = getPeriodRange(period);
    return transactions.filter((tx) => tx.date >= start && tx.date <= end);
}

// Filter by specific month and year
export function filterByMonthYear(transactions: Transaction[], month: number, year: number): Transaction[] {
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
    return transactions.filter((tx) => tx.date >= start && tx.date <= end);
}

// Filter by specific year
export function filterByYear(transactions: Transaction[], year: number): Transaction[] {
    const start = new Date(year, 0, 1).toISOString().split('T')[0];
    const end = new Date(year, 11, 31).toISOString().split('T')[0];
    return transactions.filter((tx) => tx.date >= start && tx.date <= end);
}

// Filter transactions by category kind
export function filterByKind(
    transactions: Transaction[],
    categories: Category[],
    kind: CategoryKind
): Transaction[] {
    return transactions.filter((tx) => {
        const cat = categories.find((c) => c.id === tx.categoryId);
        return cat?.kind === kind;
    });
}

// Filter transactions by user
export function filterByUser(transactions: Transaction[], userId: string | null): Transaction[] {
    if (!userId) return transactions;
    return transactions.filter((tx) => tx.userId === userId);
}

// Get transactions for personal view (User's own + shared paid by "pareja")
export function getPersonalViewTransactions(
    transactions: Transaction[],
    userId: string,
    _categories: Category[]  // kept for API compatibility
): Transaction[] {
    return transactions.filter(tx =>
        tx.userId === userId || tx.userId === "pareja"
    );
}

// --- NEW LOGIC HELPERS ---

/**
 * Calculates totals for a specific context (Personal or Couple).
 * 
 * Rules:
 * - Coupon View: Sum full amounts.
 * - Personal View: 
 *      - Scoped 'shared' -> 50%
 *      - Scoped 'individual' -> 100% (only own txs usually, but we filter by User before calling this for personal usually? 
 *        Wait, if I filter by user first, I miss the shared expenses paid by the other person that should count towards my 50% burden?
 *        Actually, for "Fixed Expenses", usually we just want to see "My Share".
 *        
 * Let's assume we pass ALL transactions to this function, and `currentUserId` context.
 * If `currentUserId` is provided (Personal view):
 *   - Shared Category TXs: Count 50% regardless of who paid (userId).
 *   - Individual Category TXs: Count 100% ONLY if userId matches.
 * 
 * If `currentUserId` is null (Couple view):
 *   - All TXs count 100%.
 */
export const FIXED_NAMES = [
    "Alquiler",
    "Luz/Agua",
    "Transporte",
    "Movil/internet",
    "Subs",
    "Mercado",
    "chatGPT"
];

export function calculateTotals(
    transactions: Transaction[],
    categories: Category[],
    currentUserId: string | null = null
) {
    let income = 0;
    let fixed = 0;
    let recurring = 0;
    let savings = 0;
    let investments = 0;

    transactions.forEach(tx => {
        const cat = categories.find(c => c.id === tx.categoryId);
        if (!cat) return;

        let amount = tx.amountCents;

        // === COUPLE VIEW (currentUserId = null) ===
        // Only include: all income + pareja-paid expenses/savings/investments
        // Individual expenses (paid by marcos/camila directly) are EXCLUDED from the couple dashboard.
        if (!currentUserId) {
            if (cat.kind !== 'income' && tx.userId !== 'pareja') return;
        }

        // === PERSONAL VIEW (currentUserId set) ===
        // The PAYER (userId) determines the split, NOT the category scope:
        //   userId = "pareja" → shared expense → split 50/50 for each person
        //   userId = "marcos" or "camila" → individual expense → 100% that person only
        if (currentUserId) {
            if (tx.userId === "pareja") {
                // Shared: each person bears 50%
                amount = Math.round(amount / 2);
            } else {
                // Individual: only count if this user paid it
                if (tx.userId !== currentUserId) {
                    return; // Skip transactions paid by the other person
                }
            }
        }

        // Add to buckets
        if (cat.kind === "income") {
            income += amount;
        } else if (cat.kind === "saving") {
            savings += amount;
        } else if (cat.kind === "investment") {
            investments += amount;
        } else {
            // Expenses (fixed or variable kind)
            if (FIXED_NAMES.includes(cat.label)) {
                fixed += amount;
            } else {
                recurring += amount;
            }
        }
    });

    const spent = fixed + recurring;
    const balance = income - spent - savings - investments;

    return {
        income,
        fixed,
        recurring,
        saved: savings,
        invested: investments,
        spent,
        balance
    };
}

/**
 * Groups transactions by category with total calculation respecting the view context.
 */
export function groupByCategory(
    transactions: Transaction[],
    categories: Category[],
    currentUserId: string | null = null
): Array<{ category: Category; total: number; limitStatus?: 'ok' | 'warning' | 'exceeded' }> {
    const map = new Map<string, number>();

    transactions.forEach((tx) => {
        const cat = categories.find(c => c.id === tx.categoryId);
        if (!cat) return;

        let amount = tx.amountCents;

        // Couple view: only income + pareja-paid entries
        if (!currentUserId) {
            if (cat.kind !== 'income' && tx.userId !== 'pareja') return;
        }

        if (currentUserId) {
            if (tx.userId === "pareja") {
                amount = Math.round(amount / 2);
            } else {
                if (tx.userId !== currentUserId) return;
            }
        }

        // Ensure we handle income/savings/investments correctly in breakdown if needed, 
        // usually this breakdown is for EXPENSES (fixed/variable).
        // If we want a generic breakdown, we just sum everything.
        // User asked specifically for "en qué se gasta más", so typically expenses.
        // But let's allow all for versatility.

        map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + amount);
    });

    const result = Array.from(map.entries())
        .map(([categoryId, total]) => {
            const category = categories.find((c) => c.id === categoryId);
            if (!category) return null;

            // Check limits
            let limitStatus: 'ok' | 'warning' | 'exceeded' | undefined;
            if (category.limitMonthly) {
                const effectiveLimit = currentUserId && category.scope === 'shared'
                    ? category.limitMonthly / 2
                    : category.limitMonthly;

                if (total > effectiveLimit) limitStatus = 'exceeded';
                else if (total > effectiveLimit * 0.8) limitStatus = 'warning';
                else limitStatus = 'ok';
            }

            return { category, total, limitStatus };
        })
        .filter((item): item is { category: Category; total: number; limitStatus: 'ok' | 'warning' | 'exceeded' | undefined } => item !== null)
        .sort((a, b) => b.total - a.total);

    return result;
}

/**
 * Obtenemos las semanas del mes según el calendario (Lunes a Domingo)
 */
export function getWeeksOfMonth(year: number, month: number) {
    const weeks: Array<{ idx: number; label: string; startDay: number; endDay: number }> = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let currentWeek = 1;
    let startDay = 1;

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        // Si es Domingo (0) o el último día del mes, cerramos la semana
        if (date.getDay() === 0 || day === daysInMonth) {
            weeks.push({
                idx: currentWeek - 1,
                label: `Semana ${currentWeek}`,
                startDay: startDay,
                endDay: day,
            });
            currentWeek++;
            startDay = day + 1;
        }
    }
    return weeks;
}

/**
 * Encuentra el índice de la semana actual
 */
export function getCurrentWeekIdx(weeks: Array<{ idx: number, startDay: number, endDay: number }>, month: number, year: number) {
    const today = new Date();
    if (today.getMonth() === month && today.getFullYear() === year) {
        const currentDay = today.getDate();
        const found = weeks.findIndex(w => currentDay >= w.startDay && currentDay <= w.endDay);
        return found !== -1 ? found : 0;
    }
    return 0;
}

/**
 * Calcula los ahorros acumulados dinámicamente desde el inicio del año hasta el mes indicado (inclusivo).
 * Esto asume que "Ahorro" = Ingresos - Gastos Fijos - Gastos Variables - Inversiones - Ahorros Conjuntos (si es personal).
 */
export function getAccumulatedSavings(
    transactions: Transaction[],
    categories: Category[],
    year: number,
    upToMonth: number,
    currentUserId: string | null = null,
    upToDay: number = 31 // Filtro opcional por día (acumulado semanal)
): number {
    const relevantTxs = transactions.filter(t => {
        if (!t.date) return false;
        const dateStr = t.date.split('T')[0];
        const [yStr, mStr, dStr] = dateStr.split('-');
        const tYear = parseInt(yStr, 10);
        const tMonth = parseInt(mStr, 10) - 1;
        const tDay = parseInt(dStr, 10);

        if (tYear !== year) return false;
        if (tMonth < upToMonth) return true;
        if (tMonth === upToMonth) {
            const cat = categories.find(c => c.id === t.categoryId);
            // Regla: Ingresos y gastos fijos siempre se cuentan desde el día 1 para el mes actual
            if (cat?.kind === 'income' || cat?.kind === 'fixed') return true;
            return tDay <= upToDay;
        }
        return false;
    });

    const totals = calculateTotals(relevantTxs, categories, currentUserId);

    let jointSavings = 0;
    relevantTxs.forEach(tx => {
        const cat = categories.find(c => c.id === tx.categoryId);
        if (cat?.kind === 'saving' && cat.scope === 'shared' && (!currentUserId || tx.userId === currentUserId)) {
            jointSavings += tx.amountCents;
        }
    });

    const leftover = totals.income - totals.fixed - totals.recurring - totals.invested - jointSavings;
    return Math.max(0, leftover);
}

// Get daily totals for charts (respecting split)
export function getDailyTotals(
    transactions: Transaction[],
    month: number, // 0-11
    year: number,
    categories: Category[],
    kind: CategoryKind,
    currentUserId: string | null = null
): Array<{ label: string; value: number }> {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: Array<{ label: string; value: number }> = [];
    const dailyMap = new Map<number, number>();

    transactions.forEach(tx => {
        const cat = categories.find(c => c.id === tx.categoryId);
        if (!cat || cat.kind !== kind) return;

        let amount = tx.amountCents;
        // Couple view: only income + pareja-paid entries
        if (!currentUserId) {
            if (cat.kind !== 'income' && tx.userId !== 'pareja') return;
        }
        if (currentUserId) {
            if (tx.userId === "pareja") {
                amount = Math.round(amount / 2);
            } else {
                if (tx.userId !== currentUserId) return;
            }
        }

        const day = new Date(tx.date).getDate();
        dailyMap.set(day, (dailyMap.get(day) || 0) + amount);
    });

    for (let d = 1; d <= daysInMonth; d++) {
        result.push({ label: d.toString(), value: dailyMap.get(d) || 0 });
    }
    return result;
}

// Get monthly totals for year (for annual charts)
export function getMonthlyTotalsForYear(
    transactions: Transaction[],
    year: number,
    categories: Category[],
    kind: CategoryKind,
    currentUserId: string | null = null
): Array<{ label: string; value: number }> {
    const result: Array<{ label: string; value: number }> = [];

    // Pre-filter/process for the whole year might be faster, but per-month loop is clearer
    for (let m = 0; m < 12; m++) {
        const start = new Date(year, m, 1).toISOString().split('T')[0];
        const end = new Date(year, m + 1, 0).toISOString().split('T')[0];

        // Filter for this month
        const monthTxs = transactions.filter(tx => tx.date >= start && tx.date <= end);

        // Calculate total using same logic
        let total = 0;
        monthTxs.forEach(tx => {
            const cat = categories.find(c => c.id === tx.categoryId);
            if (!cat || cat.kind !== kind) return;

            let amount = tx.amountCents;
            // Couple view: only income + pareja-paid entries
            if (!currentUserId) {
                if (cat.kind !== 'income' && tx.userId !== 'pareja') return;
            }
            if (currentUserId) {
                if (tx.userId === "pareja") {
                    amount = Math.round(amount / 2);
                } else {
                    if (tx.userId !== currentUserId) return;
                }
            }
            total += amount;
        });

        const label = new Date(year, m, 1).toLocaleDateString("es-ES", { month: "short" });
        result.push({ label, value: total });
    }

    return result;
}

// Format date for display
export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Returns the monthly joint savings (explicit saving txs with scope=shared) for a year.
 * Each entry is the raw total for that month (not cumulative).
 */
export function getMonthlyJointSavingsForYear(
    transactions: Transaction[],
    year: number,
    categories: Category[],
    currentUserId: string | null = null
): Array<{ label: string; value: number }> {
    const result: Array<{ label: string; value: number }> = [];
    for (let m = 0; m < 12; m++) {
        const start = new Date(year, m, 1).toISOString().split('T')[0];
        const end = new Date(year, m + 1, 0).toISOString().split('T')[0];
        const monthTxs = transactions.filter(tx => tx.date >= start && tx.date <= end);

        let total = 0;
        monthTxs.forEach(tx => {
            const cat = categories.find(c => c.id === tx.categoryId);
            if (!cat || cat.kind !== "saving" || cat.scope !== "shared") return;
            // In personal view only count contributions made by this user
            if (currentUserId && tx.userId !== currentUserId) return;
            total += tx.amountCents;
        });

        const label = new Date(year, m, 1).toLocaleDateString("es-ES", { month: "short" });
        result.push({ label, value: total });
    }
    return result;
}

/**
 * Returns the monthly personal surplus (income - fixed - recurring - investments - joint savings)
 * for a year. Each entry is the raw surplus for that month (not cumulative).
 */
export function getMonthlyPersonalSavingsForYear(
    transactions: Transaction[],
    year: number,
    categories: Category[],
    currentUserId: string | null = null
): Array<{ label: string; value: number }> {
    const result: Array<{ label: string; value: number }> = [];
    for (let m = 0; m < 12; m++) {
        const start = new Date(year, m, 1).toISOString().split('T')[0];
        const end = new Date(year, m + 1, 0).toISOString().split('T')[0];
        const monthTxs = transactions.filter(tx => tx.date >= start && tx.date <= end);

        const totals = calculateTotals(monthTxs, categories, currentUserId);

        // Joint savings for this month
        let js = 0;
        monthTxs.forEach(tx => {
            const cat = categories.find(c => c.id === tx.categoryId);
            if (!cat || cat.kind !== "saving" || cat.scope !== "shared") return;
            if (currentUserId && tx.userId !== currentUserId) return;
            js += tx.amountCents;
        });

        const surplus = totals.income - totals.fixed - totals.recurring - totals.invested - js;
        const label = new Date(year, m, 1).toLocaleDateString("es-ES", { month: "short" });
        result.push({ label, value: Math.max(0, surplus) });
    }
    return result;
}
