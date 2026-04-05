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
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3 5 6l4 3M15 3l4 3-4 3" />
        </svg>
    );
}

function MarketIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
    );
}

function StatsIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
        </svg>
    );
}

// Redefining simpler versions for mobile - Letter Badges
function MobileMarcosBadge() {
    return (
        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <span className="text-xs font-bold leading-none">M</span>
        </div>
    );
}

function MobileCamilaBadge() {
    return (
        <div className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
            <span className="text-xs font-bold leading-none">C</span>
        </div>
    );
}

const navItems = [
    { href: "/dashboard", icon: HomeIcon, label: "Home", isBadge: false },
    { href: "/marcos", icon: MobileMarcosBadge, label: "Marcos", isBadge: true },
    { href: "/camila", icon: MobileCamilaBadge, label: "Camila", isBadge: true },
    { href: "/deudas", icon: DebtIcon, label: "Deudas", isBadge: false },
    { href: "/mercadata", icon: MarketIcon, label: "Mercado", isBadge: false },
    { href: "/estadisticas", icon: StatsIcon, label: "Stats", isBadge: false },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t border-slate-800/50 pb-safe"
            style={{
                backgroundColor: 'rgba(2, 6, 23, 0.85)',
            }}
        >
            <div className="flex items-center justify-around h-[70px] px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center flex-1 h-full group active:scale-95 transition-transform duration-200"
                        >
                            <div
                                className={`p-1 rounded-xl transition-all duration-300 ${isActive ? '-translate-y-0.5' : ''}`}
                                style={isActive && !item.isBadge ? { color: '#60a5fa' } : !item.isBadge ? { color: '#64748b' } : {}}
                            >
                                <Icon />
                            </div>

                            {/* Label */}
                            <span className={`text-[10px] sm:text-xs font-medium transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                                {item.label}
                            </span>

                            {isActive && (
                                <div
                                    className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
