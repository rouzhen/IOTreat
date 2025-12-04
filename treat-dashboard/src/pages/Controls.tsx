import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { apiPost, apiGet } from "../api/client";

export default function Controls() {
    // Hardware Settings
    const [portion, setPortion] = useState<number>(25);
    const [cooldown, setCooldown] = useState<number>(30);
    
    // Schedule Settings
    const [morningTime, setMorningTime] = useState<string>("08:00");
    const [eveningTime, setEveningTime] = useState<string>("18:00");
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>("");

    // Fetch settings on load
    useEffect(() => {
        apiGet("/status").then((data) => {
            const current = Array.isArray(data) ? data[0] : data;
            if (current.settings) {
                setPortion(current.settings.portion || 25);
                setCooldown(current.settings.cooldown || 30);
                // If you save schedule to DB, load it here too. 
                // For now, we default to 08:00 / 18:00
            }
        }).catch(err => console.log("Error fetching settings", err));
    }, []);

    async function handleSave() {
        setLoading(true);
        setMessage("Syncing to Device & Cloud...");

        try {
            await apiPost("/command", {
                action: "UPDATE_ALL_SETTINGS",
                portion: Number(portion),
                cooldown: Number(cooldown),
                morning: morningTime,
                evening: eveningTime
            });
            setMessage("✅ All settings updated successfully!");
        } catch (err) {
            console.error(err);
            setMessage("❌ Error saving settings.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout>
            <h1 className="text-3xl font-display text-choco mb-2">Device & Schedule</h1>
            <p className="text-choco/70 mb-8">Configure portion sizes and automated feeding times.</p>

            <div className="bg-white rounded-3xl shadow-card border border-latte/60 p-8 max-w-2xl space-y-10">
                
                {/* --- HARDWARE SECTION --- */}
                <div>
                    <h2 className="text-xl font-bold text-choco mb-6 flex items-center gap-2">
                        <span>⚙️</span> Hardware Settings
                    </h2>
                    
                    <div className="mb-8">
                        <label htmlFor="portion-slider" className="block text-sm font-bold text-choco mb-2">
                            Default Portion (grams)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                id="portion-slider"
                                type="range"
                                min="5" max="100" step="5"
                                value={portion}
                                onChange={(e) => setPortion(Number(e.target.value))}
                                className="w-full h-2 bg-cream rounded-lg cursor-pointer accent-amber-500"
                            />
                            <div className="w-16 text-center font-bold text-xl text-choco border border-latte/40 rounded-lg py-1">
                                {portion}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="cooldown-slider" className="block text-sm font-bold text-choco mb-2">
                            Detection Cooldown (seconds)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                id="cooldown-slider"
                                type="range"
                                min="10" max="300" step="10"
                                value={cooldown}
                                onChange={(e) => setCooldown(Number(e.target.value))}
                                className="w-full h-2 bg-cream rounded-lg cursor-pointer accent-amber-500"
                            />
                            <div className="w-16 text-center font-bold text-xl text-choco border border-latte/40 rounded-lg py-1">
                                {cooldown}
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-latte/30" />

                {/* --- SCHEDULE SECTION --- */}
                <div>
                    <h2 className="text-xl font-bold text-choco mb-6 flex items-center gap-2">
                        <span>🕒</span> Feeding Schedule
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">
                        The cloud will reset the "Hungry" flag at these times daily.
                    </p>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-choco mb-2">Morning Reset</label>
                            <input
                                type="time"
                                value={morningTime}
                                onChange={(e) => setMorningTime(e.target.value)}
                                className="w-full p-3 rounded-xl border border-latte/50 text-choco font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-choco mb-2">Evening Reset</label>
                            <input
                                type="time"
                                value={eveningTime}
                                onChange={(e) => setEveningTime(e.target.value)}
                                className="w-full p-3 rounded-xl border border-latte/50 text-choco font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>
                    </div>
                </div>

                {/* --- SAVE BUTTON --- */}
                <div className="flex items-center justify-between pt-4">
                    <span className="text-sm font-medium text-green-600 animate-pulse">{message}</span>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`rounded-2xl px-8 py-4 text-base font-bold transition shadow-lg hover:-translate-y-0.5 ${loading ? "bg-slate-100 text-slate-400" : "bg-gradient-to-r from-amber-400 to-orange-400 text-white"}`}
                    >
                        {loading ? "Saving..." : "Save All Changes"}
                    </button>
                </div>

            </div>
        </Layout>
    );
}