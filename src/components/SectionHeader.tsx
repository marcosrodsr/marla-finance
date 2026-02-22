type SectionHeaderProps = {
    title: string;
    subtitle?: string;
};

export default function SectionHeader({ title, subtitle }: SectionHeaderProps) {
    return (
        <div className="mb-4">
            <h2 className="text-xl font-semibold text-zinc-50">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
        </div>
    );
}
