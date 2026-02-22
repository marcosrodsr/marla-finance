"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import TopBar from "./TopBar";
import SideNav from "./SideNav";
import BottomNav from "./BottomNav";
import AddPaymentModal from "./AddPaymentModal";
import AddCategoryModal from "./AddCategoryModal";
import PlusIcon from "./icons/PlusIcon";
import Button from "./Button";

type AppShellProps = {
    children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    const pathname = usePathname();
    const showFAB = pathname === "/dashboard" || pathname === "/marcos" || pathname === "/camila" || pathname === "/transactions";

    return (
        <>
            <div className="min-h-screen pb-24 lg:pb-0 lg:pl-[280px]">
                {/* Desktop Header Actions (Injected via Portal? No, just keep layout clean) */}
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
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="gap-2"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Campo</span>
                        </Button>

                        <Button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="shadow-lg shadow-blue-500/20"
                        >
                            Agregar pago
                        </Button>
                    </div>
                </header>

                <TopBar /> {/* Mobile only */}

                <SideNav />

                <main className="flex-1 lg:p-8 animate-in fade-in duration-500">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>

                <BottomNav />
            </div>

            {/* FAB for mobile */}
            {showFAB && (
                <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="lg:hidden fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full shadow-[0_8px_20px_-4px_rgba(59,130,246,0.6)] flex items-center justify-center active:scale-90 transition-transform bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                    aria-label="Agregar pago"
                >
                    <PlusIcon className="w-6 h-6" />
                </button>
            )}

            <AddPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} />
            <AddCategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} />
        </>
    );
}
