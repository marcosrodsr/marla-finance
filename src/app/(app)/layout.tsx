import { FinanceProvider } from "@/store/finance-store";
import AppShell from "@/components/AppShell";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <FinanceProvider>
            <AppShell>{children}</AppShell>
        </FinanceProvider>
    );
}
