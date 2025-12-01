import Layout from "../components/Layout";
import { getFeedingHistory } from "../api/feeder";
import { useEffect, useState } from "react";

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
    const [history, setHistory] = useState<any[] | null>(null);
    useEffect(() => {
        getFeedingHistory()
            .then(setHistory)
            .catch(err => console.error("History error", err));
    }, []);

    
    return (
        <Layout>
            <h1 className="text-3xl font-display text-choco mb-2">
                Feeding history
            </h1>
            <p className="text-choco/70 mb-6">
                Complete log of feeding events, snacks, and auto-scheduled meals. In production, this will come from
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
                        {!history ? (
                            <tr>
                                <td colSpan={5} className="py-4 text-center text-slate-500">
                                    Loading feeding history...
                                </td>
                            </tr>
                        ) : (
                            history.map((h, idx) => (
                                <tr
                                    key={idx}
                                    className="border-t border-latte/30 even:bg-cream/40"
                                >
                                    <td className="py-2 px-3">{h.time}</td>
                                    <td className="py-2 px-3">{h.pet}</td>
                                    <td className="py-2 px-3">{h.amount} g</td>
                                    <td className="py-2 px-3">{h.method}</td>
                                    <td className="py-2 px-3">
                                        {h.status === "Success" ? "🟢 Success" : "🟠 Warning"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
}