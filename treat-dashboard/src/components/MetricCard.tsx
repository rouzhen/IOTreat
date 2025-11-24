type MetricCardProps = {
    label: string;
    value: string;
    sublabel?: string;
    icon: string;
    tone?: "normal" | "alert" | "ok";
};

export default function MetricCard({
    label,
    value,
    sublabel,
    icon,
    tone = "normal",
}: MetricCardProps) {
    const toneClasses =
        tone === "alert"
            ? "bg-pawpink/20 border-pawpink/70"
            : tone === "ok"
                ? "bg-mint-100 border-mint-300"
                : "bg-white border-latte/60";

    return (
        <div
            className={`rounded-2xl px-5 py-4 shadow-card border ${toneClasses}
      flex items-center gap-4`}
        >
            <span className="text-2xl">{icon}</span>
            <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                    {label}
                </p>
                <p className="text-xl font-semibold text-choco leading-tight">
                    {value}
                </p>
                {sublabel && (
                    <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>
                )}
            </div>
        </div>
    );
}
