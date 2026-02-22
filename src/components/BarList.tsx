import { Category } from "@/types";
import { formatEur } from "@/lib/finance";
import Card from "./Card";
import SectionHeader from "./SectionHeader";

type BarListProps = {
    title: string;
    data: Array<{ category: Category; total: number }>;
    maxTotal?: number;
};

export default function BarList({ title, data, maxTotal }: BarListProps) {
    const max = maxTotal || Math.max(...data.map((d) => d.total));

    if (data.length === 0) {
        return (
            <Card>
                <SectionHeader title={title} />
                <p className="text-sm text-zinc-500">No hay datos</p>
            </Card>
        );
    }

    return (
        <Card>
            <SectionHeader title={title} />
            <div className="space-y-3">
                {data.map(({ category, total }) => {
                    const percentage = max > 0 ? (total / max) * 100 : 0;

                    return (
                        <div key={category.id}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 text-sm">
                                    <span>{category.icon}</span>
                                    <span className="text-zinc-300">{category.label}</span>
                                </div>
                                <span className="text-sm font-medium text-zinc-50">
                                    {formatEur(total)}
                                </span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-zinc-400 to-zinc-200 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
