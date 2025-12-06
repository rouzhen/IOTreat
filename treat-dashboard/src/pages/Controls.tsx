import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { apiPost, apiGet } from "../api/client";

export default function Controls() {
    // --- STATE ---
    const [pets, setPets] = useState<any[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<string>("dog"); // Unified ID

    // Sliders (Linked to the currently selected pet)
    const [sliderPortion, setSliderPortion] = useState<number>(25);
    const [sliderCooldown, setSliderCooldown] = useState<number>(30);

    // Global Schedule
    const [morningTime, setMorningTime] = useState<string>("08:00");
    const [eveningTime, setEveningTime] = useState<string>("18:00");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>("");

    // Helper to normalize pet types to IDs
    const getPetKey = (petType: string) => {
        const t = petType.toLowerCase();
        if (t.includes("dog") || t.includes("shiba")) return "dog";
        if (t.includes("cat") || t.includes("british")) return "cat";
        return "dog";
    };

    // 1. Fetch Data on Load
    useEffect(() => {
        apiGet("/status").then((data) => {
            const current = Array.isArray(data) ? data[0] : data;

            // Load Schedule
            if (current.settings) {
                setMorningTime(current.settings.morning || "08:00");
                setEveningTime(current.settings.evening || "18:00");
            }

            // Load Pets & Initialize Sliders
            if (current.pets && Array.isArray(current.pets)) {
                setPets(current.pets);

                // Initialize with the default pet (usually Dog)
                const firstPetKey = getPetKey(current.pets[0]?.type || "dog");
                setSelectedPetId(firstPetKey);

                // Find the pet data to set initial sliders
                const petData = current.pets.find((p: any) => getPetKey(p.type) === firstPetKey);
                if (petData) {
                    setSliderPortion(petData.raw_portion || 25);
                    setSliderCooldown(petData.raw_cooldown || 30);
                }
            }
        }).catch(err => console.error("Error fetching data", err));
    }, []);

    // 2. SMART PET SWITCHING (The Logic Missing Before)
    const handlePetSwitch = (newPetKey: string) => {
        if (newPetKey === selectedPetId) return;

        // A. Save current sliders to the OLD pet in memory (so we don't lose changes)
        const updatedPets = pets.map(p =>
            getPetKey(p.type) === selectedPetId
                ? { ...p, raw_portion: sliderPortion, raw_cooldown: sliderCooldown }
                : p
        );
        setPets(updatedPets);

        // B. Switch ID
        setSelectedPetId(newPetKey);

        // C. Load settings for the NEW pet into sliders
        const nextPet = updatedPets.find(p => getPetKey(p.type) === newPetKey);
        if (nextPet) {
            setSliderPortion(nextPet.raw_portion || 25);
            setSliderCooldown(nextPet.raw_cooldown || 30);
        }
    };

    // 3. Save Logic
    const handleSave = async () => {
        setLoading(true);
        setMessage("Syncing...");

        try {
            // A. Update the currently selected pet
            await apiPost("/command", {
                action: "UPDATE_PET_CONFIG",
                species: selectedPetId,
                portion: sliderPortion,
                cooldown: sliderCooldown
            });

            // B. Update Global Schedule (Schedule is shared)
            await apiPost("/command", {
                action: "UPDATE_ALL_SETTINGS",
                morning: morningTime,
                evening: eveningTime,
                portion: 0, cooldown: 0 // Dummy values for global
            });

            // Update local state array to confirm save
            const updatedPets = pets.map(p =>
                getPetKey(p.type) === selectedPetId
                    ? { ...p, raw_portion: sliderPortion, raw_cooldown: sliderCooldown }
                    : p
            );
            setPets(updatedPets);

            const petName = pets.find(p => getPetKey(p.type) === selectedPetId)?.name || "Pet";
            setMessage(`✅ Saved settings for ${petName}!`);

        } catch (err) {
            console.error(err);
            setMessage("❌ Error saving.");
        } finally {
            setLoading(false);
        }
    };

    // 4. Manual Feed Trigger
    const triggerFeed = async () => {
        const petName = pets.find(p => getPetKey(p.type) === selectedPetId)?.name || "Pet";
        setMessage(`Feeding ${petName}...`);
        try {
            await apiPost("/command", {
                action: "SIMULATE_RPI",
                data: {
                    species: selectedPetId,
                    stage: "finished",
                    grams: sliderPortion,
                    status: "fed",
                    ts: "simulated"
                }
            });
            setMessage(`✅ Fed ${sliderPortion}g to ${petName}!`);
        } catch (err) { console.error(err); }
    };

    return (
        <Layout>
            <h1 className="text-3xl font-display text-choco mb-2">Device Controls</h1>
            <p className="text-choco/70 mb-8">Customize feeding preferences for each pet.</p>

            <div className="flex flex-col gap-8 max-w-3xl">

                {/* --- CONTROL CARD --- */}
                <div className="bg-white p-8 rounded-3xl border border-latte/40 shadow-sm w-full">

                    {/* PET SELECTOR TABS */}
                    <div className="flex gap-4 mb-8 border-b border-latte/20 pb-8 overflow-x-auto">
                        {pets.length > 0 ? pets.map((pet) => {
                            const key = getPetKey(pet.type);
                            const isSelected = selectedPetId === key;
                            return (
                                <button
                                    key={pet.name}
                                    onClick={() => handlePetSwitch(key)}
                                    className={`flex-1 min-w-[120px] py-4 rounded-xl border-2 font-bold text-lg transition flex items-center justify-center gap-2 relative
                                        ${isSelected
                                            ? "border-amber-400 bg-amber-50 text-amber-800 shadow-sm"
                                            : "border-slate-100 text-slate-400 hover:border-latte/30 bg-slate-50"}`}
                                >
                                    <span>{key === "cat" ? "🐱" : "🐶"}</span>
                                    {pet.name}
                                    {isSelected && (
                                        <span className="absolute -top-2 -right-2 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                        </span>
                                    )}
                                </button>
                            );
                        }) : <p className="text-slate-400 text-sm">Loading profiles...</p>}
                    </div>

                    <h2 className="text-xl font-bold text-choco mb-6 flex items-center gap-2">
                        <span>⚙️</span> Settings for {pets.find(p => getPetKey(p.type) === selectedPetId)?.name || selectedPetId}
                    </h2>

                    {/* SLIDERS */}
                    <div className="space-y-10 mb-10">
                        {/* Portion */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label htmlFor="portion-slider" className="text-lg font-bold text-choco">
                                    Portion Size
                                </label>
                                <span className="text-xl font-bold text-choco bg-cream/50 px-3 py-1 rounded-lg border border-latte/20">
                                    {sliderPortion} g
                                </span>
                            </div>
                            <input
                                id="portion-slider"
                                aria-label="Portion slider"
                                type="range" min="5" max="200" step="5"
                                value={sliderPortion} onChange={(e) => setSliderPortion(Number(e.target.value))}
                                className="w-full h-4 bg-cream rounded-lg cursor-pointer accent-amber-500"
                            />
                        </div>

                        {/* Cooldown */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label htmlFor="cooldown-slider" className="text-lg font-bold text-choco">Cooldown Timer</label>
                                <span className="text-xl font-bold text-choco bg-cream/50 px-3 py-1 rounded-lg border border-latte/20">
                                    {sliderCooldown} s
                                </span>
                            </div>
                            <input
                                id="cooldown-slider"
                                aria-label="Cooldown slider"
                                type="range" min="10" max="300" step="10"
                                value={sliderCooldown} onChange={(e) => setSliderCooldown(Number(e.target.value))}
                                className="w-full h-4 bg-cream rounded-lg cursor-pointer accent-amber-500"
                            />
                        </div>
                    </div>

                    {/* MANUAL FEED BUTTON */}
                    <button
                        onClick={triggerFeed}
                        className="w-full py-4 mb-10 rounded-2xl border-2 border-dashed border-choco/30 text-choco font-bold hover:bg-cream hover:border-choco transition flex items-center justify-center gap-2"
                    >
                        <span>⚡</span>
                        Test Feed {pets.find(p => getPetKey(p.type) === selectedPetId)?.name} Now
                    </button>

                    <hr className="border-latte/30 mb-8" />

                    {/* SCHEDULE */}
                    <h3 className="text-lg font-bold text-choco mb-6 flex items-center gap-2"><span>🕒</span> Global Schedule</h3>
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-2">Morning Reset</label>
                            <input aria-label="Morning Time" type="time" value={morningTime} onChange={(e) => setMorningTime(e.target.value)} className="w-full p-4 rounded-xl border border-latte/50 text-lg font-bold text-choco focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-2">Evening Reset</label>
                            <input aria-label="Evening Time" type="time" value={eveningTime} onChange={(e) => setEveningTime(e.target.value)} className="w-full p-4 rounded-xl border border-latte/50 text-lg font-bold text-choco focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                        </div>
                    </div>

                    {/* SAVE BUTTON */}
                    <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-latte/10 gap-4">
                        <span className="text-sm font-medium text-green-600 animate-pulse h-6">{message}</span>
                        <button onClick={handleSave} disabled={loading} className="w-full sm:w-auto rounded-2xl px-12 py-4 text-lg font-bold bg-choco text-white hover:opacity-90 transition shadow-lg">
                            {loading ? "Saving..." : "Save Settings"}
                        </button>
                    </div>

                </div>
            </div>
        </Layout>
    );
}