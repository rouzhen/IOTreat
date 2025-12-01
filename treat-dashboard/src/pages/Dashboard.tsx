import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import MetricCard from "../components/MetricCard";
import Panel from "../components/Panel";
import BowlWeightChart from "../components/BowlWeightChart";
import { useEffect, useState } from "react";
import { getStatus } from "../api/feeder";

const DEMO_STATUS = {
    lastFeedingTime: "Today, 7:45 PM",
    lastFeedingPortion: "25 g",
    lastFeedingPet: "Mocha",
    bowlStatus: "Almost empty",
    bowlWeight: "12 g remaining",
    recentPet: "Mocha (shiba inu)",
    recentPetTime: "2 minutes ago",
};

export default function Dashboard() {
    const [status, setStatus] = useState<any | null>(null);

    useEffect(() => {
        getStatus()
            .then(setStatus)
            .catch((err) => console.error("Status error", err));
    }, []);

    if (!status) {
        return (
            <Layout>
                <p className="text-slate-500">Loading dashboard...</p>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Hero section */}
            <section className="mb-8">
                <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                        <p className="text-xs tracking-[0.2em] uppercase text-choco/60 mb-1">
                            feeder overview
                        </p>
                        <h1 className="text-4xl font-display text-choco tracking-tight mb-2">
                            TREAT feeder dashboard
                        </h1>
                        <p className="text-choco/80 text-sm sm:text-base">
                            Monitor bowl weight, feeding events, and which pet is sneaking
                            snacks — all in one place. 🐶🐱
                        </p>
                    </div>

                    <div className="hidden sm:flex flex-col items-end gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs shadow-sm border border-latte/60">
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            Feeder online
                        </span>
                        <button className="text-xs rounded-full border border-latte/80 bg-white/70 px-3 py-1 shadow-sm hover:bg-latte/40 transition">
                            Refresh demo data
                        </button>
                    </div>
                </div>
            </section>

            {/* Metrics row */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                <MetricCard
                    label="Feedings today"
                    value={status?.feedingsToday ?? "—"}
                    sublabel="Mocha • Luna • Mocha"
                    icon="🍖"
                />
                <MetricCard
                    label="Food level"
                    value={`${status?.foodLevel ?? "—"}%`}
                    sublabel="Top up recommended soon"
                    icon="📦"
                    tone="alert"
                />
                <MetricCard
                    label="Last motion near bowl"
                    value={status?.lastMotionTime ?? "—"}
                    sublabel="Mocha sniffing around 👀"
                    icon="🎥"
                />
            </section>

            {/* Main cards row */}
            <section className="grid grid-cols-1 xl:grid-cols-[2fr,1.4fr] gap-6 mb-6">
                <StatCard title="Last Feeding" icon="🍖">
                    {status ? (
                        <>
                            <p className="text-sm text-slate-600">
                                <span className="font-semibold text-choco">
                                    {status.lastFeeding.pet}
                                </span>{" "}
                                ate{" "}
                                <span className="font-semibold">
                                    {status.lastFeeding.portion} g
                                </span>{" "}
                                at{" "}
                                <span className="font-medium">
                                    {status.lastFeeding.time}
                                </span>
                                .
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                                Mode: Auto breakfast schedule (demo). Source: Load cell confirmed.
                            </p>
                        </>
                    ) : (
                        <p>Loading demo status...</p>
                    )}
                </StatCard>


                <StatCard title="Bowl Status" icon="⚖️">
                    <p className="text-sm text-slate-600">
                        <span className="font-semibold text-choco">
                            {status.bowlStatus}
                        </span>
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                        Estimated remaining food:{" "}
                        <span className="font-semibold">
                            {status.bowlWeight}
                        </span>
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Last weight reading: {status.lastMotionTime} • Load cell stable.
                    </p>
                </StatCard>
            </section>

            {/* Recent pet + mini “timeline” */}
            <section className="grid grid-cols-1 lg:grid-cols-[2fr,1.4fr] gap-6">
                <StatCard title="Recent Pet Detected" icon="🐶">
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                        <div className="w-14 h-14 rounded-full bg-[url('https://images.dog.ceo/breeds/terrier-welsh/lucy.jpg')] bg-cover bg-center shadow-md border border-latte/70" />
                        <div>
                            <p className="text-sm text-slate-600">
                                <span className="font-semibold text-choco">
                                    {status.recentPet.name}
                                </span>{" "}
                                ({status.recentPet.breed})
                            </p>
                            <p className="text-xs text-slate-500">
                                Last seen {status.recentPet.time} • Looked at bowl, no
                                feeding triggered.
                            </p>
                        </div>
                    </div>
                </StatCard>

                <StatCard title="Today’s Timeline" icon="🕒">
                    <ul className="text-xs text-slate-600 space-y-1.5">
                        <li>7:45 PM – Auto dinner dispensed 25 g for Mocha ✅</li>
                        <li>5:02 PM – Motion detected, no scheduled feeding 👀</li>
                        <li>1:15 PM – Manual snack: 10 g, triggered from dashboard 🍖</li>
                        <li>8:00 AM – Breakfast: 20 g each for Mocha & Luna ✅</li>
                    </ul>
                </StatCard>
            </section>

            {/* Bowl weight chart + system health row */}
            <section className="grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-6 mt-8">
                <Panel title="Bowl weight over today" icon="📈">
                    <BowlWeightChart />
                </Panel>

                <Panel title="System health" icon="💡" subtle>
                    <ul className="text-sm space-y-1.5">
                        <li>• Load cell: <span className="font-medium text-green-600">Stable</span></li>
                        <li>• Motor: <span className="font-medium text-green-600">Ready</span></li>
                        <li>• Camera: <span className="font-medium text-green-600">Online (demo)</span></li>
                        <li>• Last heartbeat: 2 minutes ago (simulated)</li>
                    </ul>
                </Panel>
            </section>


        </Layout>
    );
}
