import { ReactNode } from "react";

type CardProps = {
    children: ReactNode;
    className?: string;
    noPadding?: boolean;
    onClick?: () => void;
};

export default function Card({ children, className = "", noPadding = false, onClick }: CardProps) {
    return (
        <div
            onClick={onClick}
            className={`
        glass-panel rounded-3xl overflow-hidden active:scale-[0.99] transition-transform duration-200 ease-out
        ${onClick ? "cursor-pointer hover:bg-white/[0.05]" : ""}
        ${noPadding ? "" : "p-6 sm:p-8"} 
        ${className}
      `}
        >
            {children}
        </div>
    );
}
