"use client";

import Card from "@/components/Card";
import SectionHeader from "@/components/SectionHeader";
import { formatEur } from "@/lib/finance";

type DataPoint = {
    id: string; // Added id for click identification
    label: string;
    value: number;
    color: string;
    icon?: string;
};

type BarChartProps = {
    title: string;
    data: DataPoint[];
    onRowClick?: (point: DataPoint) => void;
};

export default function BarChart({ title, data, onRowClick }: BarChartProps) {
    const maxVal = Math.max(...data.map(d => d.value), 100);

    if (data.length === 0) {
        return (
            <Card>
                <SectionHeader title={title} />
                <div className="text-sm text-zinc-500 py-8 text-center">No hay datos</div>
            </Card>
        );
    }

    return (
        <Card>
            <SectionHeader title={title} />
            <div className="space-y-4">
                {data.map((d, i) => {
                    const percentage = (d.value / maxVal) * 100;

                    return (
                        <div
                            key={i}
                            onClick={() => onRowClick && onRowClick(d)}
                            className={`group ${onRowClick ? 'cursor-pointer' : ''}`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1.5 transition-transform duration-200 group-hover:translate-x-1 gap-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded-lg bg-zinc-800/50 flex items-center justify-center group-hover:bg-zinc-700/50 transition-colors shrink-0">
                                        {d.icon && <span className="text-xs sm:text-sm">{d.icon}</span>}
                                    </div>
                                    <span className="text-[11px] sm:text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors truncate">
                                        {d.label}
                                    </span>
                                </div>
                                <span className="text-[11px] sm:text-xs font-bold text-zinc-100 group-hover:text-blue-400 transition-colors sm:text-right">
                                    {formatEur(d.value)}
                                </span>
                            </div>

                            <div className="h-2 w-full bg-zinc-800/30 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: d.color,
                                        boxShadow: `0 0 10px ${d.color}40`
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
