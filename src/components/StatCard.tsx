import Card from "./Card";

type StatCardProps = {
    label: string;
    value: string;
    subtitle?: string;
    trend?: "up" | "down" | "neutral";
    icon?: React.ReactNode;
    onClick?: () => void;
};

export default function StatCard({ label, value, subtitle, trend, icon, onClick }: StatCardProps) {
    return (
        <Card
            onClick={onClick}
            className="flex flex-col items-center justify-center text-center h-full group hover:border-blue-500/20 transition-colors bg-gradient-to-b from-white/[0.03] to-transparent"
        >
            <div className="flex flex-col items-center gap-2 mb-4 w-full">
                <div className="flex items-center justify-center gap-2 w-full">
                    <span className="text-[10px] sm:text-xs text-slate-400 font-bold tracking-[0.15em] uppercase">{label}</span>
                    {icon && <div className="text-slate-500 group-hover:text-blue-400 transition-colors">{icon}</div>}
                </div>
            </div>

            <div className="flex flex-col items-center w-full overflow-hidden">
                <div className="text-lg sm:text-xl lg:text-2xl font-black text-white tracking-tight whitespace-nowrap">
                    {value}
                </div>

                {subtitle && (
                    <div className="mt-3 flex items-center justify-center gap-1.5 w-full">
                        {trend === "up" && (
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        )}
                        {trend === "down" && (
                            <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
                        )}
                        <div className={`text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded-lg ${trend === "up" ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" :
                            trend === "down" ? "text-rose-400 bg-rose-500/10 border border-rose-500/20" :
                                "text-slate-400 bg-slate-800/80 border border-white/5"
                            }`}>
                            {subtitle}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
