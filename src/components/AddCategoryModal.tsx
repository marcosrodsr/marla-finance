"use client";

import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { useFinance } from "@/store/finance-store";
import { CategoryKind } from "@/types";

type AddCategoryModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

const KINDS: { value: CategoryKind; label: string }[] = [
    { value: "fixed", label: "Gasto Fijo" },
    { value: "variable", label: "Gasto Variable" },
    { value: "saving", label: "Ahorro" },
    { value: "investment", label: "Inversión" },
    { value: "income", label: "Ingreso" },
];

const EMOJI_GROUPS = [
    {
        name: "Hogar",
        emojis: ["🏠", "🛋️", "🧹", "🧼", "🧺", "🚽", "🛏️", "🚪", "🚿", "🔑"]
    },
    {
        name: "Comida",
        emojis: ["🛒", "🍔", "🌮", "🍕", "🥗", "🍎", "🥦", "🥪", "🍷", "☕", "🍺", "🍽️"]
    },
    {
        name: "Transporte",
        emojis: ["🚗", "🚌", "🚆", "✈️", "⛽", "🛵", "🚲", "🚕", "🛥️", "🎟️", "🚄"]
    },
    {
        name: "Salud & Personal",
        emojis: ["🏥", "💊", "🩺", "🧴", "💄", "💇‍♀️", "🧘‍♀️", "🏋️‍♂️", "🏃‍♂️", "🦷", "👓", "👕", "👟"]
    },
    {
        name: "Ocio",
        emojis: ["🎉", "🎬", "🎮", "📚", "🎓", "🎸", "⛺", "🏖️", "🎫", "🧩", "🎨", "⚽"]
    },
    {
        name: "Finanzas y Servicios",
        emojis: ["💡", "💧", "🔌", "📱", "💻", "🏦", "💰", "📈", "📉", "💸", "💳", "🧾"]
    },
    {
        name: "Mascotas",
        emojis: ["🐶", "🐱", "🐰", "🐹", "🐾", "🦴", "🦜"]
    },
    {
        name: "Otros",
        emojis: ["🎁", "🛍️", "📦", "🔧", "🔨", "📎", "✂️", "🗑️", "✨", "🔥"]
    }
];

export default function AddCategoryModal({ isOpen, onClose }: AddCategoryModalProps) {
    const { addCategory } = useFinance();

    const [label, setLabel] = useState("");
    const [kind, setKind] = useState<CategoryKind>("variable");
    const [icon, setIcon] = useState("🛒");
    const [activeEmojiGroup, setActiveEmojiGroup] = useState(EMOJI_GROUPS[0].name);
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!label.trim()) {
            setError("El nombre es obligatorio");
            return;
        }

        addCategory({
            label: label.trim(),
            kind,
            icon,
            scope: "shared", // Defaulting new categories to shared
        });

        // Reset
        setLabel("");
        setKind("variable");
        setIcon("🛒");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nueva Categoría">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Nombre *
                    </label>
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Ej: Gimnasio"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Type */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Tipo *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {KINDS.map((k) => (
                            <button
                                key={k.value}
                                type="button"
                                onClick={() => setKind(k.value)}
                                className={`
                  px-3 py-2 rounded-xl text-sm font-medium border transition-all
                  ${kind === k.value
                                        ? "bg-blue-600/20 text-blue-400 border-blue-500/50"
                                        : "bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                                    }
                `}
                            >
                                {k.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Icon */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Icono
                    </label>
                    <div className="bg-zinc-800/30 rounded-xl overflow-hidden border border-zinc-700/50">
                        {/* Tabs */}
                        <div className="flex overflow-x-auto custom-scrollbar border-b border-zinc-700/50">
                            {EMOJI_GROUPS.map((group) => (
                                <button
                                    key={group.name}
                                    type="button"
                                    onClick={() => setActiveEmojiGroup(group.name)}
                                    className={`
                                        whitespace-nowrap px-4 py-2.5 text-xs font-medium transition-colors border-b-2
                                        ${activeEmojiGroup === group.name
                                            ? "text-blue-400 border-blue-500 bg-blue-500/5"
                                            : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/50"
                                        }
                                    `}
                                >
                                    {group.name}
                                </button>
                            ))}
                        </div>
                        {/* Grid */}
                        <div className="p-3">
                            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                {EMOJI_GROUPS.find(g => g.name === activeEmojiGroup)?.emojis.map((e) => (
                                    <button
                                        key={e}
                                        type="button"
                                        onClick={() => setIcon(e)}
                                        className={`
                                            h-10 w-full rounded-lg text-xl flex items-center justify-center transition-all
                                            ${icon === e
                                                ? "bg-blue-600/20 border border-blue-500/50 scale-110 shadow-sm"
                                                : "bg-zinc-800/50 hover:bg-zinc-700 hover:scale-105 border border-transparent"
                                            }
                                        `}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-rose-400 bg-rose-400/10 px-4 py-2 rounded-xl">
                        {error}
                    </div>
                )}

                <Button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white">
                    Crear Categoría
                </Button>
            </form>
        </Modal>
    );
}
