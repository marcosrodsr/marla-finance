"use client";

import { useMemo } from "react";
import Card from "@/components/Card";
import SectionHeader from "@/components/SectionHeader";
import { formatEur } from "@/lib/finance";

type DataPoint = {
    label: string;
    value: number;
};

type Series = {
    name: string;
    data: DataPoint[];
    color: string;
};

type LineChartProps = {
    title: string;
    series: Series[];
    height?: number;
};

export default function LineChart({ title, series, height = 200 }: LineChartProps) {
    const { maxVal, points } = useMemo(() => {
        // Find absolute max value for scaling
        const allValues = series.flatMap(s => s.data.map(d => d.value));
        const max = Math.max(...allValues, 100); // Default min height

        // Assume all series have same labels/length
        const labels = series[0]?.data.map(d => d.label) || [];

        // Increase buffer to 1.5 to ensure peaks are well below top
        return { maxVal: max * 1.5, points: labels.length };
    }, [series]);

    if (series.length === 0 || series[0].data.length === 0) {
        return (
            <Card>
                <SectionHeader title={title} />
                <div className="h-40 flex items-center justify-center text-zinc-500 text-sm">
                    No hay datos suficientes
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <SectionHeader title={title} />

                {/* Legend */}
                <div className="flex gap-4">
                    {series.map((s) => (
                        <div key={s.name} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: s.color }}
                            />
                            <span className="text-xs text-zinc-400">{s.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative w-full" style={{ height }}>
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                        <div key={t} className="w-full border-t border-dashed border-zinc-800/30 h-0" />
                    ))}
                </div>

                {/* SVG Chart */}
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${points * 10} 100`}
                    preserveAspectRatio="none"
                    className="overflow-visible"
                >
                    <defs>
                        {series.map((s) => (
                            <linearGradient key={`grad-${s.name}`} id={`grad-${s.name}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={s.color} stopOpacity="0.4" />
                                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                            </linearGradient>
                        ))}
                    </defs>

                    {series.map((s) => {
                        // Calculate coordinates
                        // Use safe area: Top 10, Bottom 90 (Padding for stroke/shadow)
                        // Labels are now external, so we can use more vertical space
                        const CHART_TOP = 10;
                        const CHART_BOTTOM = 90;
                        const CHART_HEIGHT = CHART_BOTTOM - CHART_TOP;

                        const coords = s.data.map((d, i) => {
                            const x = i * 10 + 5; // Center in slot
                            const normalizedValue = d.value / maxVal;
                            const y = CHART_BOTTOM - (normalizedValue * CHART_HEIGHT);
                            return { x, y };
                        });

                        const pathD = coords.map((p, i) =>
                            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                        ).join(' ');

                        // Area path (closed loop at bottom axis)
                        const lastX = coords[coords.length - 1].x;
                        const firstX = coords[0].x;
                        const areaD = `${pathD} L ${lastX} ${CHART_BOTTOM} L ${firstX} ${CHART_BOTTOM} Z`;

                        return (
                            <g key={s.name}>
                                {/* Area Fill */}
                                <path
                                    d={areaD}
                                    fill={`url(#grad-${s.name})`}
                                    className="transition-all duration-300"
                                />

                                {/* Line */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke={s.color}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="drop-shadow-lg transition-all duration-300"
                                />

                                {/* Points */}
                                {coords.map((p, i) => (
                                    <circle
                                        key={i}
                                        cx={p.x}
                                        cy={p.y}
                                        r="2"
                                        fill="#020617"
                                        stroke={s.color}
                                        strokeWidth="2"
                                        className="transition-all duration-300"
                                    />
                                ))}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* X Axis Labels - In Flow */}
            <div className="flex justify-between px-2 mt-4">
                {series[0].data.map((d, i) => (
                    <div
                        key={i}
                        className="text-[10px] text-zinc-500 font-medium text-center truncate px-1"
                        style={{ width: `${100 / points}%` }}
                    >
                        {d.label}
                    </div>
                ))}
            </div>
        </Card>
    );
}
