import Panel from "../components/Panel";
import Layout from "../components/Layout";
import BowlWeightChart from "../components/BowlWeightChart";

const demoProfile = {
    name: "Mocha",
    type: "Shiba Inu",
    status: "Needs attention",
    lastReading: "18 minutes ago",
    diseaseRisk: "Snack risk", // fun
    moisture: "N/A",
    portionIdeal: "22–26 g / meal",
    mealsPerDay: 2,
    notes:
        "Mocha tends to rush food and steal Luna's leftovers. Recommended to keep portions controlled and monitor snack frequency.",
};

const demoFeedings = [
    { time: "Nov 24, 7:45 PM", portion: "25 g", mode: "Auto Dinner", ok: true },
    { time: "Nov 24, 1:15 PM", portion: "10 g", mode: "Manual Snack", ok: true },
    { time: "Nov 24, 8:00 AM", portion: "24 g", mode: "Auto Breakfast", ok: true },
    { time: "Nov 23, 8:05 PM", portion: "28 g", mode: "Auto Dinner", ok: false },
];

const demoDetections = [
    { time: "Today, 7:44 PM", action: "Eating", note: "Dinner schedule" },
    { time: "Today, 5:02 PM", action: "Sniffing", note: "No food dispensed" },
    { time: "Today, 1:14 PM", action: "Eating", note: "Manual snack" },
    { time: "Yesterday, 9:01 PM", action: "Checking bowl", note: "Bowl empty" },
];

export default function MochaDetail() {
    return (
        <Layout>
            {/* Back link */}
            <button
                onClick={() => history.back()}
                className="text-xs text-slate-500 mb-4 hover:text-choco flex items-center gap-1"
            >
                ← Back to pets
            </button>

            {/* Header */}
            <section className="rounded-3xl bg-gradient-to-br from-cream via-white to-cream shadow-card border border-latte/60 px-6 py-6 mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-full bg-latte/40 flex items-center justify-center text-4xl shadow-inner">
                            🐶
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-choco/60 mb-1">
                                pet profile
                            </p>
                            <h1 className="text-3xl sm:text-4xl font-display text-choco tracking-tight mb-1">
                                {demoProfile.name}
                            </h1>
                            <p className="text-sm text-choco/80">{demoProfile.type}</p>
                            <p className="text-xs text-slate-500 mt-1">
                                Latest detection: <span className="font-medium">{demoProfile.lastReading}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-pawpink/20 text-pawpink-900 px-3 py-1 text-xs border border-pawpink/60">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Needs attention • loves snacks
                        </span>
                        <div className="flex gap-3 text-xs">
                            <div className="px-3 py-2 rounded-2xl bg-white/70 border border-latte/60 text-center">
                                <p className="text-[10px] uppercase text-slate-500">Portion</p>
                                <p className="text-sm font-semibold text-choco">
                                    {demoProfile.portionIdeal}
                                </p>
                            </div>
                            <div className="px-3 py-2 rounded-2xl bg-white/70 border border-latte/60 text-center">
                                <p className="text-[10px] uppercase text-slate-500">Meals / day</p>
                                <p className="text-sm font-semibold text-choco">
                                    {demoProfile.mealsPerDay}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recommended profile + current readings */}
            <section className="grid grid-cols-1 lg:grid-cols-[2fr,1.3fr] gap-6 mb-8">
                <Panel title="Recommended feeding profile" icon="📋">
                    <p className="mb-3">
                        Compare Mocha&apos;s recent feedings against your recommended feeding
                        guidelines.
                    </p>
                    <ul className="text-sm space-y-1.5">
                        <li>
                            • Portion per meal:{" "}
                            <span className="font-medium">{demoProfile.portionIdeal}</span>
                        </li>
                        <li>
                            • Number of meals per day:{" "}
                            <span className="font-medium">{demoProfile.mealsPerDay}</span>
                        </li>
                        <li>
                            • Suggested snack policy:{" "}
                            <span className="font-medium">Max 1 small snack per day</span>
                        </li>
                        <li>
                            • Notes: <span className="font-medium">{demoProfile.notes}</span>
                        </li>
                    </ul>
                </Panel>

                <Panel title="Recent portion summary" icon="🍖" subtle>
                    <ul className="text-sm space-y-1.5">
                        <li>
                            • Average portion (last 7 feedings):{" "}
                            <span className="font-medium">24 g</span>
                        </li>
                        <li>
                            • Largest portion: <span className="font-medium">28 g</span> (yesterday dinner)
                        </li>
                        <li>
                            • Snack frequency:{" "}
                            <span className="font-medium text-amber-700">2 snacks / day (demo)</span>
                        </li>
                        <li>
                            • Recommendation: reduce snack size if weight gain observed.
                        </li>
                    </ul>
                </Panel>
            </section>

            {/* Chart + actuator controls */}
            <section className="grid grid-cols-1 xl:grid-cols-[2.2fr,1.5fr] gap-6 mb-8">
                <Panel title="Dispensed food over time" icon="📈">
                    <BowlWeightChart />
                </Panel>

                <Panel title="Remote feeder control (demo only)" icon="🎛️">
                    <p className="text-xs text-slate-500 mb-3">
                        These buttons are simulated. Once hardware is ready, they will send commands to
                        the real feeder for Mocha only.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button className="rounded-2xl bg-white border border-latte/70 px-3 py-2 text-xs hover:bg-cream transition">
                            🍖 Snack 5 g
                        </button>
                        <button className="rounded-2xl bg-white border border-latte/70 px-3 py-2 text-xs hover:bg-cream transition">
                            🍽 Dinner 25 g
                        </button>
                        <button className="rounded-2xl bg-white border border-latte/70 px-3 py-2 text-xs hover:bg-cream transition">
                            🧪 Test camera
                        </button>
                    </div>
                </Panel>
            </section>

            {/* Recent readings + detections */}
            <section className="grid grid-cols-1 xl:grid-cols-[2fr,1.4fr] gap-6 mb-8">
                <Panel title="Recent feedings" icon="📜">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                            <thead className="bg-cream/80 text-slate-500 uppercase">
                                <tr>
                                    <th className="px-3 py-2 text-left">Time</th>
                                    <th className="px-3 py-2 text-left">Portion</th>
                                    <th className="px-3 py-2 text-left">Mode</th>
                                    <th className="px-3 py-2 text-left">OK?</th>
                                </tr>
                            </thead>
                            <tbody>
                                {demoFeedings.map((f, idx) => (
                                    <tr
                                        key={idx}
                                        className="border-t border-latte/40 even:bg-cream/40"
                                    >
                                        <td className="px-3 py-2">{f.time}</td>
                                        <td className="px-3 py-2">{f.portion}</td>
                                        <td className="px-3 py-2">{f.mode}</td>
                                        <td className="px-3 py-2">
                                            {f.ok ? "✅" : "⚠️"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel>

                <Panel title="Recent detections near bowl" icon="🎥" subtle>
                    <ul className="text-xs space-y-1.5">
                        {demoDetections.map((d, idx) => (
                            <li key={idx}>
                                <span className="font-medium text-choco">{d.time}</span> —{" "}
                                <span className="font-medium">{d.action}</span>{" "}
                                <span className="text-slate-500">({d.note})</span>
                            </li>
                        ))}
                    </ul>
                </Panel>
            </section>
        </Layout>
    );
}
