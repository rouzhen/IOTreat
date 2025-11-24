type PanelProps = {
    title: string;
    icon?: string;
    children: React.ReactNode;
    subtle?: boolean;
};

export default function Panel({ title, icon, children, subtle }: PanelProps) {
    return (
        <section
            className={`rounded-2xl px-6 py-5 border ${subtle ? "bg-cream/70 border-latte/40" : "bg-white border-latte/60"
                } shadow-card`}
        >
            <h3 className="text-lg font-semibold text-choco flex items-center gap-2 mb-3">
                {icon && <span className="text-xl">{icon}</span>}
                {title}
            </h3>
            <div className="text-sm text-slate-600">{children}</div>
        </section>
    );
}
