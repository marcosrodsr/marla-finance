"use client";

import { useState } from "react";
import Card from "@/components/Card";
import { formatEur } from "@/lib/finance";

type PieSlice = {
    id: string;
    label: string;
    value: number;
    color: string;
    icon?: string;
};

type PieChartProps = {
    title: string;
    data: PieSlice[];
    selectedId?: string | null;
    onSelect?: (id: string | null) => void;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export default function PieChart({ title, data, selectedId, onSelect }: PieChartProps) {
    const totalValue = data.reduce((sum, d) => sum + d.value, 0);

    if (data.length === 0 || totalValue === 0) {
        return (
            <Card>
                <h3 className="text-base font-bold text-slate-200 mb-4">{title}</h3>
                <div className="text-sm text-zinc-500 py-8 text-center">No hay datos</div>
            </Card>
        );
    }

    const SIZE = 220;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const R = SIZE / 2 - 10;
    const INNER_R = R * 0.52;
    const SELECTED_OFFSET = 8; // how far a selected slice pops out

    // Sort by value descending for visual clarity
    const sorted = [...data].sort((a, b) => b.value - a.value);

    // Build slices with angle info we need for highlight offset
    const slices: {
        id: string;
        path: string;
        pathSelected: string;
        color: string;
        pct: number;
        label: string;
        value: number;
        icon?: string;
        midAngle: number;
    }[] = [];

    let currentAngle = 0;

    sorted.forEach((d) => {
        const pct = (d.value / totalValue) * 100;
        const angle = (d.value / totalValue) * 360;
        const endAngle = currentAngle + angle;
        const midAngle = currentAngle + angle / 2;

        // Offset path for selected state (pop-out effect)
        const rad = ((midAngle - 90) * Math.PI) / 180;
        const dx = SELECTED_OFFSET * Math.cos(rad);
        const dy = SELECTED_OFFSET * Math.sin(rad);

        // Normal arc (centered at cx, cy)
        const normalPath = describeArc(cx, cy, R, currentAngle, endAngle);

        // Selected arc (shifted toward midpoint direction)
        const selectedPath = `M ${cx + dx} ${cy + dy} L ${polarToCartesian(cx, cy, R, endAngle).x + dx} ${polarToCartesian(cx, cy, R, endAngle).y + dy} A ${R} ${R} 0 ${angle > 180 ? 1 : 0} 0 ${polarToCartesian(cx, cy, R, currentAngle).x + dx} ${polarToCartesian(cx, cy, R, currentAngle).y + dy} Z`;

        slices.push({
            id: d.id,
            path: normalPath,
            pathSelected: selectedPath,
            color: d.color,
            pct,
            label: d.label,
            value: d.value,
            icon: d.icon,
            midAngle,
        });

        currentAngle = endAngle;
    });

    // What to show in the center
    const selectedSlice = selectedId ? slices.find(s => s.id === selectedId) : null;

    const handleSliceClick = (id: string) => {
        if (onSelect) {
            onSelect(selectedId === id ? null : id);
        }
    };

    return (
        <Card>
            <h3 className="text-base font-bold text-slate-200 mb-5">{title}</h3>
            <div className="flex flex-col items-center gap-4">
                {/* SVG Donut */}
                <div className="relative">
                    <svg width={SIZE} height={SIZE} className="drop-shadow-sm overflow-visible">
                        {slices.map((s) => {
                            const isSelected = selectedId === s.id;
                            const isDimmed = selectedId && !isSelected;
                            return (
                                <path
                                    key={s.id}
                                    d={isSelected ? s.pathSelected : s.path}
                                    fill={s.color}
                                    opacity={isDimmed ? 0.25 : isSelected ? 1 : 0.85}
                                    stroke={isSelected ? "rgba(255,255,255,0.3)" : "transparent"}
                                    strokeWidth={isSelected ? 2 : 0}
                                    onClick={() => handleSliceClick(s.id)}
                                    className="cursor-pointer transition-all duration-300"
                                    style={{
                                        filter: isSelected ? `drop-shadow(0 0 8px ${s.color}80)` : "none",
                                    }}
                                />
                            );
                        })}
                        {/* Inner circle for donut hole */}
                        <circle cx={cx} cy={cy} r={INNER_R} fill="rgb(15,23,42)" />
                        {/* Center text */}
                        {selectedSlice ? (
                            <>
                                <text
                                    x={cx}
                                    y={cy - 14}
                                    textAnchor="middle"
                                    fill={selectedSlice.color}
                                    fontSize="10"
                                    fontWeight="700"
                                >
                                    {selectedSlice.icon} {selectedSlice.label.length > 12 ? selectedSlice.label.slice(0, 12) + "…" : selectedSlice.label}
                                </text>
                                <text
                                    x={cx}
                                    y={cy + 4}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize="12"
                                    fontWeight="700"
                                >
                                    {selectedSlice.pct.toFixed(1)}%
                                </text>
                                <text
                                    x={cx}
                                    y={cy + 18}
                                    textAnchor="middle"
                                    fill="#94a3b8"
                                    fontSize="9"
                                >
                                    {formatEur(selectedSlice.value)}
                                </text>
                            </>
                        ) : (
                            <>
                                <text x={cx} y={cy - 6} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="500">
                                    Total
                                </text>
                                <text x={cx} y={cy + 10} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">
                                    {formatEur(totalValue)}
                                </text>
                            </>
                        )}
                    </svg>
                </div>

                {/* Legend */}
                <div className="w-full space-y-1.5">
                    {slices.map((s) => {
                        const isSelected = selectedId === s.id;
                        const isDimmed = selectedId && !isSelected;
                        return (
                            <div
                                key={s.id}
                                onClick={() => handleSliceClick(s.id)}
                                className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg cursor-pointer transition-all duration-200 ${
                                    isSelected ? "bg-white/5 ring-1 ring-white/10" : "hover:bg-white/5"
                                } ${isDimmed ? "opacity-40" : ""}`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-200"
                                        style={{
                                            backgroundColor: s.color,
                                            transform: isSelected ? "scale(1.4)" : "scale(1)",
                                        }}
                                    />
                                    <span className={`text-xs truncate transition-colors ${isSelected ? "text-white font-semibold" : "text-slate-300"}`}>
                                        {s.icon && <span className="mr-1">{s.icon}</span>}
                                        {s.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs text-slate-400">{formatEur(s.value)}</span>
                                    <span
                                        className="text-xs font-bold tabular-nums w-10 text-right"
                                        style={{ color: s.color }}
                                    >
                                        {s.pct.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {selectedId && (
                    <button
                        onClick={() => onSelect?.(null)}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors mt-1"
                    >
                        ✕ Quitar selección
                    </button>
                )}
            </div>
        </Card>
    );
}
