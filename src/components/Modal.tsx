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
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
            {/* Backdrop with strong blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full sm:max-w-md glass-panel rounded-t-3xl sm:rounded-b-3xl overflow-hidden shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-auto sm:zoom-in-95 duration-300 border border-white/10 flex flex-col max-h-[90dvh]">
                {/* Header */}
                <div className="bg-white/5 border-b border-white/5 px-6 py-5 flex items-center justify-between flex-shrink-0">
                    <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all focus:outline-none"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable area */}
                <div className="p-6 bg-gradient-to-b from-[#0f172a]/50 to-[#020617]/50 overflow-y-auto overflow-x-hidden overscroll-contain pb-safe shrink">
                    {children}
                </div>
            </div>
        </div>
    );
}
