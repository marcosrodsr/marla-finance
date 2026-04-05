"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import TopBar from "./TopBar";
import SideNav from "./SideNav";
import BottomNav from "./BottomNav";
import AddPaymentModal from "./AddPaymentModal";
import AddCategoryModal from "./AddCategoryModal";
import AddMarketModal from "./AddMarketModal";
import { useFinance } from "@/store/finance-store";
import PlusIcon from "./icons/PlusIcon";
import Button from "./Button";
import UpdateBanner from "./UpdateBanner";

type AppShellProps = {
    children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
    const { isCategoryModalOpen, setCategoryModalOpen } = useFinance();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);

    const pathname = usePathname();
    const showFAB = pathname === "/dashboard" || pathname === "/marcos" || pathname === "/camila" || pathname === "/transactions" || pathname === "/estadisticas";


    return (
        <>
            <UpdateBanner />
            <div className="min-h-[100dvh] pb-[calc(80px+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-[280px]">
                {/* Desktop Header Actions */}
                {/* Actually, user requested "Header superior" on desktop with title left and buttons right. 
            Since pages handle their own title/layout, I will render a global desktop header here or let pages do it?
            Request says: "Header superior: título izquierda, botones derecha".
            It's better if the Page handles the title, but the global "Add" buttons should be always accessible?
            Let's put a Desktop Header in the AppShell.
        */}

                <header className="hidden lg:flex items-center justify-between h-20 px-8 sticky top-0 z-30 backdrop-blur-md bg-[#020617]/80 border-b border-slate-800/50">
                    {/* Breadcrumb / Title placeholder - Pages will likely render their own big H1, 
               so maybe this header works as a global toolbar? 
               Actually, the user wants "Header superior" with title and buttons.
               Let's make this header contain the Buttons. 
               The Title is usually page specific. 
               However, to follow the request exactly, I will put the global actions here.
           */}
                    <div className="flex-1">
                        {/* Spacer or Breadcrumbs */}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setCategoryModalOpen(true)}
                            className="gap-2"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Campo</span>
                        </Button>

                        <Button
                            onClick={() => setIsMarketModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        >
                            Agregar Mercado
                        </Button>

                        <Button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="shadow-lg shadow-blue-500/20"
                        >
                            Agregar pago
                        </Button>
                    </div>
                </header>

                <TopBar onAddCategory={() => setCategoryModalOpen(true)} /> {/* Mobile only */}

                <SideNav />

                <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 animate-in fade-in duration-500">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>

                <BottomNav />
            </div>

            {/* FABs for mobile */}
            {showFAB && (
                <>
                    {/* Agregar Mercado FAB (Stacked above) */}
                    <button
                        onClick={() => setIsMarketModalOpen(true)}
                        className="lg:hidden fixed bottom-[calc(155px+env(safe-area-inset-bottom))] right-6 z-40 w-14 h-14 rounded-full shadow-[0_8px_20px_-4px_rgba(16,185,129,0.6)] flex items-center justify-center active:scale-90 transition-transform bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                        aria-label="Agregar Mercado"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </button>

                    {/* Agregar Pago FAB */}
                    <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="lg:hidden fixed bottom-[calc(85px+env(safe-area-inset-bottom))] right-6 z-40 w-14 h-14 rounded-full shadow-[0_8px_20px_-4px_rgba(59,130,246,0.6)] flex items-center justify-center active:scale-90 transition-transform bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                        aria-label="Agregar pago"
                    >
                        <PlusIcon className="w-6 h-6" />
                    </button>
                </>
            )}

            <AddPaymentModal 
                isOpen={isPaymentModalOpen} 
                onClose={() => setIsPaymentModalOpen(false)} 
            />

            <AddMarketModal
                isOpen={isMarketModalOpen}
                onClose={() => setIsMarketModalOpen(false)}
            />

            <AddCategoryModal isOpen={isCategoryModalOpen} onClose={() => setCategoryModalOpen(false)} />
        </>
    );
}
