"use client";

import { useMemo } from "react";
import { Category } from "@/types";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SortableChipProps = {
    option: Category;
    selected: boolean;
    onSelect: (id: string) => void;
    isEditMode: boolean;
    onArchive?: (id: string) => void;
};

function SortableChip({ option, selected, onSelect, isEditMode, onArchive }: SortableChipProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: option.id, disabled: !isEditMode });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={`relative flex ${isEditMode ? 'touch-none' : ''}`}>
             <button
                type="button"
                onClick={() => {
                    if (!isEditMode) onSelect(option.id);
                }}
                {...(isEditMode ? { ...attributes, ...listeners } : {})}
                className={`
                    w-full px-3 py-2.5 rounded-xl border transition-all duration-200
                    flex items-center gap-2 justify-center text-xs font-medium relative overflow-hidden
                    ${selected && !isEditMode
                        ? "bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/30"
                        : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/10 hover:text-slate-200"
                    }
                    ${isEditMode ? "cursor-grab active:cursor-grabbing border-dashed border-zinc-500/50 bg-black/40 hover:bg-black/40" : ""}
                `}
            >
                <span className={`text-base ${isEditMode && isDragging ? 'animate-pulse' : ''}`}>{option.icon}</span>
                <span className="truncate">{option.label}</span>
                {selected && !isEditMode && (
                    <div className="absolute inset-0 border-2 border-white/20 rounded-xl pointer-events-none" />
                )}
            </button>

            {isEditMode && onArchive && (
                 <button
                 type="button"
                 onClick={(e) => {
                     e.stopPropagation();
                     onArchive(option.id);
                 }}
                 className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-black/50 hover:bg-rose-600 transition-colors z-20"
             >
                 ✕
             </button>
            )}
        </div>
    );
}


type ChipSelectProps = {
    options: Category[];
    selected: string | null;
    onSelect: (id: string) => void;
    isEditMode?: boolean;
    onReorder?: (reorderedCategories: Category[]) => void;
    onArchive?: (id: string) => void;
};

export default function ChipSelect({
    options,
    selected,
    onSelect,
    isEditMode = false,
    onReorder,
    onArchive
}: ChipSelectProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement before dragging starts, allows clicking inner elements
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const items = useMemo(() => options.map(o => o.id), [options]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id && onReorder) {
            const oldIndex = options.findIndex((opt) => opt.id === active.id);
            const newIndex = options.findIndex((opt) => opt.id === over.id);

            const newOptions = arrayMove(options, oldIndex, newIndex);
            onReorder(newOptions);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className={`
                grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-2xl border transition-colors
                max-h-[220px] overflow-y-auto overflow-x-hidden custom-scrollbar
                ${isEditMode ? 'bg-zinc-900/80 border-blue-500/30 ring-1 ring-blue-500/20' : 'bg-black/20 border-white/5'}
            `}>
                <SortableContext
                    items={items}
                    strategy={rectSortingStrategy}
                >
                    {options.map((option) => (
                        <SortableChip
                            key={option.id}
                            option={option}
                            selected={selected === option.id}
                            onSelect={onSelect}
                            isEditMode={isEditMode}
                            onArchive={onArchive}
                        />
                    ))}
                </SortableContext>
            </div>
        </DndContext>
    );
}
