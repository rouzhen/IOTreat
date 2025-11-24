type StatCardProps = {
    title: string;
    icon: string;
    children: React.ReactNode;
};

export default function StatCard({ title, icon, children }: StatCardProps) {
    return (
        <div
            className="
        bg-white rounded-2xl shadow-card p-6 border border-latte/50
        transition transform hover:-translate-y-1 hover:shadow-lg
      "
        >
            <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{icon}</span>
                <h3 className="text-lg font-semibold text-choco">{title}</h3>
            </div>

            <div className="text-sm text-slate-600 leading-relaxed">
                {children}
            </div>
        </div>
    );
}
