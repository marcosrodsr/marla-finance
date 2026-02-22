"use client";

import { Category } from "@/types";

type ChipSelectProps = {
    options: Category[];
    selected: string | null;
    onSelect: (id: string) => void;
};

export default function ChipSelect({ options, selected, onSelect }: ChipSelectProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-black/20 p-2 rounded-2xl border border-white/5 max-h-[160px] overflow-y-auto custom-scrollbar">
            {options.map((option) => (
                <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelect(option.id)}
                    className={`
                        px-3 py-2.5 rounded-xl border transition-all duration-200
                        flex items-center gap-2 justify-center text-xs font-medium
                        ${selected === option.id
                            ? "bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/30"
                            : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/10 hover:text-slate-200"
                        }
                    `}
                >
                    <span className="text-base">{option.icon}</span>
                    <span className="truncate">{option.label}</span>
                </button>
            ))}
        </div>
    );
}
