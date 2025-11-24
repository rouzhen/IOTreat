import Layout from "../components/Layout";

const DEMO_HISTORY = [
    {
        time: "Today, 7:45 PM",
        pet: "Mocha",
        portion: "25 g",
        mode: "Auto – Dinner",
        status: "Success",
    },
    {
        time: "Today, 1:15 PM",
        pet: "Mocha",
        portion: "10 g",
        mode: "Manual snack",
        status: "Success",
    },
    {
        time: "Today, 8:00 AM",
        pet: "Mocha & Luna",
        portion: "20 g + 18 g",
        mode: "Auto – Breakfast",
        status: "Success",
    },
];

export default function History() {
    return (
        <Layout>
            <h1 className="text-3xl font-display text-choco mb-2">
                Feeding history
            </h1>
            <p className="text-choco/70 mb-6">
                Demo log of recent feedings. In production, this will come from
                DynamoDB.
            </p>

            <div className="bg-white rounded-2xl shadow-card border border-latte/50 overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-cream/80">
                        <tr className="text-left text-xs uppercase text-slate-500">
                            <th className="px-5 py-3">Time</th>
                            <th className="px-5 py-3">Pet</th>
                            <th className="px-5 py-3">Portion</th>
                            <th className="px-5 py-3">Mode</th>
                            <th className="px-5 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DEMO_HISTORY.map((row, idx) => (
                            <tr
                                key={idx}
                                className="border-t border-latte/30 even:bg-cream/40"
                            >
                                <td className="px-5 py-3">{row.time}</td>
                                <td className="px-5 py-3">{row.pet}</td>
                                <td className="px-5 py-3">{row.portion}</td>
                                <td className="px-5 py-3">{row.mode}</td>
                                <td className="px-5 py-3">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs">
                                        ✅ {row.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
}
