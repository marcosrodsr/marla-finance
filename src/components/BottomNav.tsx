"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import HomeIcon from "./icons/HomeIcon";
import ListIcon from "./icons/ListIcon";
import SettingsIcon from "./icons/SettingsIcon";

// Redefining simpler versions for mobile
function MobileMarcosIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7v10M12 12h5" />
        </svg>
    );
}

function MobileCamilaIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7v10M8 12h8" />
        </svg>
    );
}

const navItems = [
    { href: "/dashboard", icon: HomeIcon, label: "Home" },
    { href: "/marcos", icon: MobileMarcosIcon, label: "Marcos" },
    { href: "/camila", icon: MobileCamilaIcon, label: "Camila" },
    { href: "/transactions", icon: ListIcon, label: "Lista" },
    { href: "/settings", icon: SettingsIcon, label: "Ajustes" },
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
                                className={`p-1 rounded-xl transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}
                                style={isActive ? { color: '#60a5fa' } : { color: '#64748b' }}
                            >
                                <Icon className="w-6 h-6" />
                            </div>

                            {isActive && (
                                <div
                                    className="absolute bottom-2 w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
