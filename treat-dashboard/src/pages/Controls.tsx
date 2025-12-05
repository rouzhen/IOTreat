import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { apiPost, apiGet } from "../api/client";

export default function Controls() {
    // --- SETTINGS STATE ---
    const [portion, setPortion] = useState<number>(25);
    const [cooldown, setCooldown] = useState<number>(30);
    const [morningTime, setMorningTime] = useState<string>("08:00");
    const [eveningTime, setEveningTime] = useState<string>("18:00");
    
    // --- MANUAL FEED STATE ---
    const [selectedPet, setSelectedPet] = useState<string>("dog"); // Default Mocha
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>("");

    // Load Settings from Cloud
    useEffect(() => {
        apiGet("/status").then((data) => {
            const current = Array.isArray(data) ? data[0] : data;
            if (current.settings) {
                setPortion(current.settings.portion || 25);
                setCooldown(current.settings.cooldown || 30);
                setMorningTime(current.settings.morning || "08:00");
                setEveningTime(current.settings.evening || "18:00");
            }
        }).catch(err => console.error("Error fetching settings", err));
    }, []);

    // --- TRIGGER LOGIC (Single Event) ---
    const sendSimulationEvent = async (forcedPet: string) => {
        // Use the portion from the slider
        const amountToSend = Number(portion); 
        setMessage(`Sending ${amountToSend}g command...`);

        try {
            await apiPost("/command", {
                action: "SIMULATE_RPI",
                data: {
                    species: forcedPet,
                    stage: "finished",
                    grams: amountToSend,
                    status: "fed",
                    ts: "simulated"
                }
            });
            const name = forcedPet === "dog" ? "Mocha" : "Luna";
            setMessage(`✅ Fed ${amountToSend}g to ${name}!`);
        } catch (err) {
            console.error("Feed error", err);
            setMessage("❌ Connection Error");
        }
    };

    // --- SAVE SETTINGS LOGIC ---
    async function handleSave() {
        setLoading(true);
        setMessage("Syncing...");
        try {
            await apiPost("/command", {
                action: "UPDATE_ALL_SETTINGS",
                portion: Number(portion),
                cooldown: Number(cooldown),
                morning: morningTime,
                evening: eveningTime
            });
            setMessage("✅ Settings Saved!");
        } catch (err) {
            console.error(err);
            setMessage("❌ Error saving.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout>
            <h1 className="text-3xl font-display text-choco mb-2">Device Controls</h1>
            <p className="text-choco/70 mb-8">Manage manual feeding and real device configurations.</p>

            <div className="grid grid-cols-1 gap-6 mb-8">
                {/* --- CARD 1: INSTANT TRIGGER --- */}
                <div className="bg-white p-6 rounded-3xl border border-latte/40 shadow-sm">
                    <h2 className="text-xl text-choco mb-4 flex items-center gap-2">
                        <span>⚡</span> Manual Feed
                    </h2>
                    <p className="text-sm text-slate-500 mb-4">
                        Select a pet to trigger an immediate feeding event.
                    </p>
                    
                    <div className="flex gap-2 mb-6">
                        <button 
                            onClick={() => setSelectedPet("dog")}
                            className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition flex items-center justify-center gap-2
                                ${selectedPet === "dog" ? "border-amber-400 bg-amber-50 text-amber-800" : "border-slate-100 text-slate-400 hover:border-latte/30"}`}
                        >
                            🐶 Mocha
                        </button>
                        <button 
                            onClick={() => setSelectedPet("cat")}
                            className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition flex items-center justify-center gap-2
                                ${selectedPet === "cat" ? "border-amber-400 bg-amber-50 text-amber-800" : "border-slate-100 text-slate-400 hover:border-latte/30"}`}
                        >
                            🐱 Luna
                        </button>
                    </div>

                    <button
                        onClick={() => sendSimulationEvent(selectedPet)}
                        className="w-full py-3 rounded-2xl bg-choco text-white font-bold hover:opacity-90 transition shadow-md active:scale-95"
                    >
                        Feed {selectedPet === "dog"} Now ({portion}g)
                    </button>
                </div>
            </div>

            {/* --- CARD 2: REAL SETTINGS --- */}
            <div className="bg-white rounded-3xl shadow-card border border-latte/60 p-8 max-w-2xl opacity-95">
                <h2 className="text-xl text-choco mb-6">⚙️ Hardware Settings</h2>
                
                {/* Portion */}
                <div className="mb-8">
                    <label className="block text-sm text-choco mb-2">Default Portion</label>
                    <div className="flex items-center gap-4">
                        <input type="range" min="5" max="100" step="5" value={portion} onChange={(e) => setPortion(Number(e.target.value))} className="w-full h-2 bg-cream rounded-lg accent-amber-500" />
                        <span className="font-bold text-choco w-12">{portion}g</span>
                    </div>
                </div>

                {/* Cooldown */}
                <div className="mb-8">
                    <label className="block text-sm text-choco mb-2">Cooldown</label>
                    <div className="flex items-center gap-4">
                        <input type="range" min="10" max="300" step="10" value={cooldown} onChange={(e) => setCooldown(Number(e.target.value))} className="w-full h-2 bg-cream rounded-lg accent-amber-500" />
                        <span className="font-bold text-choco w-12">{cooldown}s</span>
                    </div>
                </div>

                <hr className="border-latte/30 mb-8" />

                {/* Schedule */}
                <div className="mb-8">
                    <h3 className="text-md text-choco mb-4 flex items-center gap-2"><span>🕒</span> Schedule</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Morning Reset</label>
                            <input type="time" value={morningTime} onChange={(e) => setMorningTime(e.target.value)} className="w-full p-2 rounded-lg border border-latte/50 text-choco" />
                        </div>
                        <div>
                            <label className="block text-xs  text-slate-500 mb-1">Evening Reset</label>
                            <input type="time" value={eveningTime} onChange={(e) => setEveningTime(e.target.value)} className="w-full p-2 rounded-lg border border-latte/50  text-choco" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end border-t border-latte/10 pt-6">
                    <button onClick={handleSave} disabled={loading} className="rounded-2xl px-8 py-3 bg-choco text-white font-bold hover:opacity-90 transition">
                        {loading ? "Saving..." : "Save All Changes"}
                    </button>
                </div>
                <p className="text-center text-xs text-green-600 mt-2 h-4">{message}</p>
            </div>
        </Layout>
    );
}