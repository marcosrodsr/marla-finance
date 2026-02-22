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
            className="flex flex-col justify-between h-full group hover:border-blue-500/20 transition-colors bg-gradient-to-b from-white/[0.03] to-transparent"
        >
            <div className="flex justify-between items-start">
                <div className="text-sm text-slate-400 font-medium tracking-wide uppercase">{label}</div>
                {icon && <div className="text-slate-500 group-hover:text-blue-400 transition-colors">{icon}</div>}
            </div>

            <div className="mt-4">
                <div className="text-3xl lg:text-4xl font-bold text-white tracking-tight">{value}</div>

                {subtitle && (
                    <div className="mt-2 flex items-center gap-1.5">
                        {trend === "up" && (
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        )}
                        {trend === "down" && (
                            <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
                        )}
                        <div className={`text-xs font-medium ${trend === "up" ? "text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded" :
                            trend === "down" ? "text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded" :
                                "text-slate-500"
                            }`}>
                            {subtitle}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
