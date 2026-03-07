"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import HomeIcon from "./icons/HomeIcon";
import ListIcon from "./icons/ListIcon";
import SettingsIcon from "./icons/SettingsIcon";

// Debt/balance icon
function DebtIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M5.636 5.636l12.728 12.728M18.364 5.636 5.636 18.364" />
        </svg>
    );
}

// Custom icons - Letter Badges
function MarcosBadge() {
    return (
        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <span className="text-xs font-bold leading-none">M</span>
        </div>
    );
}

function CamilaBadge() {
    return (
        <div className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
            <span className="text-xs font-bold leading-none">C</span>
        </div>
    );
}

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: HomeIcon, isBadge: false },
    { href: "/marcos", label: "Marcos", icon: MarcosBadge, isBadge: true },
    { href: "/camila", label: "Camila", icon: CamilaBadge, isBadge: true },
    { href: "/transactions", label: "Movimientos", icon: ListIcon, isBadge: false },
    { href: "/deudas", label: "Deudas", icon: DebtIcon, isBadge: false },
    { href: "/settings", label: "Ajustes", icon: SettingsIcon, isBadge: false },
];

export default function SideNav() {
    const pathname = usePathname();

    return (
        <aside className="hidden lg:flex lg:flex-col lg:w-[280px] lg:fixed lg:inset-y-0 lg:left-0 lg:border-r border-slate-800/50 bg-[#020617]/80 backdrop-blur-xl z-50">
            <div className="flex items-center h-20 px-8 border-b border-slate-800/50">
                <Link href="/dashboard" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                    Marla Finance
                </Link>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group
                ${isActive
                                    ? "bg-blue-500/10 text-blue-400"
                                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                                }
              `}
                        >
                            <div className={`transition-colors flex-shrink-0 ${isActive && !item.isBadge ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                                <Icon />
                            </div>
                            <span className={`font-medium ${isActive ? "translate-x-1" : ""} transition-transform duration-300`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                        MF
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-200">Marla Finance</div>
                        <div className="text-xs text-slate-500">Premium Plan</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
