import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

const demoData = [
    { time: "8:00", weight: 80 },
    { time: "9:00", weight: 60 },
    { time: "10:00", weight: 40 },
    { time: "11:00", weight: 35 },
    { time: "12:00", weight: 20 },
    { time: "13:00", weight: 10 },
    { time: "14:00", weight: 5 },
];

export default function BowlWeightChart() {
    return (
        <div className="h-64 py-6">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={demoData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3e5d5" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                    <YAxis
                        tick={{ fontSize: 11 }}
                        label={{
                            value: "Weight (g)",
                            angle: -90,
                            position: "insideLeft",
                            offset: -5,
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: 12,
                            borderColor: "#f3d6b8",
                            fontSize: 12,
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#f4a7b9"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-slate-500">
                Demo data: simulated bowl weight trend across the afternoon.
            </p>
        </div>
    );
}
