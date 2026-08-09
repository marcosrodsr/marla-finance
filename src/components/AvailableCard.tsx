type AvailableCardProps = {
    available: number;
    income: number;
    fixed: number;
    recurring: number;
    invested: number;
    className?: string;
};

export default function AvailableCard({
    available,
    income,
    fixed,
    recurring,
    invested,
    className = "",
}: AvailableCardProps) {
    const totalAllocated = fixed + recurring + invested;
    const allocationBase = Math.max(income, totalAllocated, 1);
    const percentageOfIncome = (amount: number) => income > 0
        ? Math.round((amount / income) * 100)
        : 0;
    const absoluteValue = Math.abs(available);
    const wholeValue = Math.floor(absoluteValue / 100)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const decimalValue = (absoluteValue % 100).toString().padStart(2, "0");

    return (
        <section
            className={`min-h-[190px] overflow-hidden rounded-2xl border border-blue-400/25 bg-[#111f38] p-5 shadow-[0_18px_45px_rgba(2,6,23,0.24)] sm:p-6 ${className}`}
            aria-label={`Disponible: ${available / 100} euros`}
        >
            <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300">
                    Disponible
                </p>
                <span
                    className={`h-2 w-2 shrink-0 rounded-full ${available >= 0
                        ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                        : "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.8)]"
                        }`}
                    aria-hidden="true"
                />
            </div>

            <div className={`mt-3 flex items-end whitespace-nowrap font-mono ${available >= 0 ? "text-white" : "text-rose-300"}`}>
                <span className="text-4xl font-black leading-none sm:text-[42px]">
                    {available < 0 ? "-" : ""}{wholeValue}
                </span>
                <span className="mb-0.5 text-xl font-extrabold text-slate-300">
                    ,{decimalValue} €
                </span>
            </div>

            <div
                className="mt-6 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-600/45"
                role="img"
                aria-label={`Distribución: gastos fijos ${percentageOfIncome(fixed)}%, gastos recurrentes ${percentageOfIncome(recurring)}%, inversión ${percentageOfIncome(invested)}%`}
            >
                <span className="h-full bg-amber-400" style={{ width: `${(fixed / allocationBase) * 100}%` }} />
                <span className="h-full bg-cyan-400" style={{ width: `${(recurring / allocationBase) * 100}%` }} />
                <span className="h-full bg-violet-400" style={{ width: `${(invested / allocationBase) * 100}%` }} />
                <span className="h-full bg-slate-600/45" style={{ width: `${(Math.max(available, 0) / allocationBase) * 100}%` }} />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-medium text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-sm bg-amber-400" />
                    Fijos {percentageOfIncome(fixed)}%
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-sm bg-cyan-400" />
                    Recurrentes {percentageOfIncome(recurring)}%
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-sm bg-violet-400" />
                    Inversión {percentageOfIncome(invested)}%
                </span>
            </div>
        </section>
    );
}
