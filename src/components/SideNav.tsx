"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import HomeIcon from "./icons/HomeIcon";
import ListIcon from "./icons/ListIcon";
import SettingsIcon from "./icons/SettingsIcon";

// Custom icons
function MarcosIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    );
}

function CamilaIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14c-2 0-3.5-1-3.5-2.5S10 9 12 9s3.5 1 3.5 2.5S14 14 12 14z" />
        </svg>
    );
}

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
    { href: "/marcos", label: "Marcos", icon: MarcosIcon },
    { href: "/camila", label: "Camila", icon: CamilaIcon },
    { href: "/transactions", label: "Movimientos", icon: ListIcon },
    { href: "/settings", label: "Ajustes", icon: SettingsIcon },
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
                            <Icon className={`w-6 h-6 transition-colors ${isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`} />
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
