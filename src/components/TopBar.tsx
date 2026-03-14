"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "./Button";
import PlusIcon from "./icons/PlusIcon";

type TopBarProps = {
    onAddPayment?: () => void;
    onAddCategory?: () => void;
};

export default function TopBar({ onAddPayment, onAddCategory }: TopBarProps) {
    const pathname = usePathname();
    const showActions = pathname === "/dashboard" || pathname === "/marcos" || pathname === "/camila" || pathname === "/transactions" || pathname === "/movimientos";

    // Title map
    const getTitle = () => {
        if (pathname === "/dashboard") return "General";
        if (pathname === "/marcos") return "Marcos";
        if (pathname === "/camila") return "Camila";
        if (pathname === "/transactions") return "Movimientos";
        if (pathname === "/settings") return "Ajustes";
        return "";
    }

    return (
        <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-slate-800/50 lg:hidden"
            style={{ backgroundColor: 'rgba(2, 6, 23, 0.8)' }}>
            <div className="mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-medium tracking-wider">MARLA FINANCE</span>
                    <span className="text-lg font-bold text-slate-100">{getTitle()}</span>
                </div>

                {showActions && (
                    <div className="flex items-center gap-2">
                        {onAddCategory && (
                            <button
                                onClick={onAddCategory}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 font-medium text-xs hover:bg-blue-500/20 active:scale-95 transition-all"
                            >
                                <PlusIcon className="w-3.5 h-3.5" />
                                <span>Campo</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
