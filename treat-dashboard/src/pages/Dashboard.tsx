import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import MetricCard from "../components/MetricCard";
import Panel from "../components/Panel";
import BowlWeightChart from "../components/BowlWeightChart";
import { useEffect, useState } from "react";
import { getStatus } from "../api/feeder";

export default function Dashboard() {
    const [status, setStatus] = useState<any | null>(null);

    useEffect(() => {
        getStatus()
            .then((data) => {
                // If API returns an array (from Lambda), grab the first item
                const validData = Array.isArray(data) ? data[0] : data;
                setStatus(validData);
            })
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
                        <button 
                            onClick={() => window.location.reload()}
                            className="text-xs rounded-full border border-latte/80 bg-white/70 px-3 py-1 shadow-sm hover:bg-latte/40 transition"
                        >
                            Refresh data
                        </button>
                    </div>
                </div>
            </section>

            {/* Metrics row */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                <MetricCard
                    label="Feedings today"
                    value={status?.feedingsToday ?? 0}
                    sublabel="Mocha • Luna"
                    icon="🍖"
                />
                <MetricCard
                    label="Food level"
                    value={`${status?.foodLevel ?? 0}%`}
                    sublabel={status?.foodLevel < 20 ? "Low - Refill soon" : "Healthy level"}
                    icon="📦"
                    tone={status?.foodLevel < 20 ? "alert" : "normal"}
                />
                <MetricCard
                    label="Last motion near bowl"
                    value={status?.lastMotionTime ?? "—"}
                    sublabel="Sensor active"
                    icon="🎥"
                />
            </section>

            {/* Main cards row */}
            <section className="grid grid-cols-1 xl:grid-cols-[2fr,1.4fr] gap-6 mb-6">
                <StatCard title="Last Feeding" icon="🍖">
                    {status?.lastFeeding?.pet !== "None" ? (
                        <>
                            <p className="text-sm text-slate-600">
                                Dispensed{" "}
                                <span className="font-semibold">
                                    {status.lastFeeding.portion} g
                                </span>{" "}
                                for{" "}
                                <span className="font-semibold text-choco">
                                    {status.lastFeeding.pet}
                                </span>{" "}
                                at{" "}
                                <span className="font-medium">
                                    {status.lastFeeding.time}
                                </span>
                                .
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                                Mode: Auto schedule. Source: Cloud logs.
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-slate-500">No feedings recorded yet today.</p>
                    )}
                </StatCard>

                <StatCard title="Bowl Status" icon="⚖️">
                    <p className="text-sm text-slate-600">
                        <span className="font-semibold text-choco">
                            {status?.bowlStatus ?? "Unknown"}
                        </span>
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                        Estimated remaining food:{" "}
                        <span className="font-semibold">
                            {status?.bowlWeight ?? 0} g
                        </span>
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Live reading from Load Cell.
                    </p>
                </StatCard>
            </section>

            {/* Recent pet + Dynamic Timeline */}
            <section className="grid grid-cols-1 lg:grid-cols-[2fr,1.4fr] gap-6">
                <StatCard title="Recent Pet Detected" icon="🐶">
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                        <div className="w-14 h-14 rounded-full bg-latte/20 flex items-center justify-center text-2xl shadow-inner border border-latte/70">
                            {status?.recentPet?.name === "Cat" ? "🐱" : "🐶"}
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">
                                <span className="font-semibold text-choco">
                                    {status?.recentPet?.name ?? "Unknown"}
                                </span>{" "}
                                ({status?.recentPet?.breed ?? "Pet"})
                            </p>
                            <p className="text-xs text-slate-500">
                                Last seen: {status?.recentPet?.time}
                            </p>
                        </div>
                    </div>
                </StatCard>

                <StatCard title="Today’s Timeline" icon="🕒">
                    <ul className="text-xs text-slate-600 space-y-1.5">
                        {status?.timeline && status.timeline.length > 0 ? (
                            status.timeline.map((event: string, idx: number) => (
                                <li key={idx}>{event}</li>
                            ))
                        ) : (
                            <li>No events recorded yet today.</li>
                        )}
                    </ul>
                </StatCard>
            </section>

            {/* Bowl weight chart + system health row */}
            <section className="grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-6 mt-8">
                <Panel title="Bowl weight over today" icon="📈">
                    <BowlWeightChart data={status?.chartData} />
                </Panel>

                <Panel title="System health" icon="💡" subtle>
                    <ul className="text-sm space-y-1.5">
                        <li>• Load cell: <span className="font-medium text-green-600">Online</span></li>
                        <li>• Motor: <span className="font-medium text-green-600">Ready</span></li>
                        <li>• Camera: <span className="font-medium text-green-600">Active</span></li>
                        <li>• Cloud Sync: <span className="font-medium text-green-600">Connected</span></li>
                    </ul>
                </Panel>
            </section>
        </Layout>
    );
}