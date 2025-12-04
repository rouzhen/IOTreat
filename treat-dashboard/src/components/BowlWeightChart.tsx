import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Cell
} from "recharts";

const demoData = [
    { time: "Start", weight: 0 },
    { time: "Now", weight: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        // Don't show tooltip for empty placeholders
        if (data.weight === 0) return null;
        
        return (
            <div className="bg-white p-3 border border-latte/50 rounded-xl shadow-lg text-xs">
                <p className="font-bold text-choco mb-1">{label}</p>
                <p className="text-slate-600">Dispensed: <span className="font-semibold">{data.weight} g</span></p>
                {data.note && (
                    <p className="text-amber-600 font-medium mt-1">
                        {data.note}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

export default function BowlWeightChart({ data }: { data?: any[] }) {
    const chartData = (data && data.length > 0) ? data : demoData;

    return (
        <div className="h-64 py-6">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3e5d5" vertical={false} />
                    <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 10, fill: '#888' }} 
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: '#888' }}
                        label={{ value: "Grams", angle: -90, position: "insideLeft", offset: 10, fontSize: 10 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#fffbf7'}} />
                    <Bar 
                        dataKey="weight" 
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.weight > 0 ? "#f4a7b9" : "transparent"} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-center text-slate-400">
                Amount Dispensed per Feeding (Today)
            </p>
        </div>
    );
}