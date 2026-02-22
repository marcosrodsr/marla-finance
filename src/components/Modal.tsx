"use client";

import { ReactNode, useEffect } from "react";
import XIcon from "./icons/XIcon";

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
};

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop with strong blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md glass-panel rounded-3xl overflow-hidden shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200 border border-white/10">
                {/* Header */}
                <div className="bg-white/5 border-b border-white/5 px-6 py-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 bg-gradient-to-b from-[#0f172a]/50 to-[#020617]/50">
                    {children}
                </div>
            </div>
        </div>
    );
}
