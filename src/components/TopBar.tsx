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
    const showActions = [
        "/dashboard",
        "/marcos",
        "/camila",
        "/transactions",
        "/movimientos",
        "/deudas",
        "/estadisticas"
    ].includes(pathname);

    // Title map
    const getTitle = () => {
        if (pathname === "/dashboard") return "General";
        if (pathname === "/marcos") return "Marcos";
        if (pathname === "/camila") return "Camila";
        if (pathname === "/transactions" || pathname === "/movimientos") return "Movimientos";
        if (pathname === "/deudas") return "Deudas";
        if (pathname === "/estadisticas") return "Estadísticas";
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
                        {/* Global actions moved to local selectors for better contextual accessibility */}
                    </div>
                )}
            </div>
        </div>
    );
}
