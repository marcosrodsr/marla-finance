import { ReactNode } from "react";

type ButtonProps = {
    children: ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "danger" | "ghost";
    className?: string;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    size?: "sm" | "md" | "lg";
};

export default function Button({
    children,
    onClick,
    variant = "primary",
    className = "",
    disabled = false,
    type = "button",
    size = "md",
}: ButtonProps) {

    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3.5 text-base",
    };

    const variants = {
        primary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 border border-transparent hover:shadow-blue-500/40 hover:from-blue-500 hover:to-indigo-500",
        secondary: "bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-800 hover:text-white hover:border-slate-500",
        danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300",
        ghost: "bg-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/30",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}
