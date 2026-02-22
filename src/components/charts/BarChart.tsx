"use client";

import Card from "@/components/Card";
import SectionHeader from "@/components/SectionHeader";
import { formatEur } from "@/lib/finance";

type DataPoint = {
    label: string;
    value: number;
    color: string;
    icon?: string;
};

type BarChartProps = {
    title: string;
    data: DataPoint[];
};

export default function BarChart({ title, data }: BarChartProps) {
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
                        <div key={i} className="group">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    {d.icon && <span className="text-sm">{d.icon}</span>}
                                    <span className="text-xs font-medium text-zinc-300">{d.label}</span>
                                </div>
                                <span className="text-xs font-semibold text-zinc-100">{formatEur(d.value)}</span>
                            </div>

                            <div className="h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: d.color
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
