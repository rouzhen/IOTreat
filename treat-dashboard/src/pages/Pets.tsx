import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { getStatus } from "../api/feeder"; 

export default function Pets() {
    const [pets, setPets] = useState<any[] | null>(null);

    useEffect(() => {
        getStatus()
            .then((data) => {
                const current = Array.isArray(data) ? data[0] : data;
                if (current && current.pets) {
                    setPets(current.pets);
                }
            })
            .catch((err) => console.error("Error loading pets", err));
    }, []);

    return (
        <Layout>
            <h1 className="text-3xl font-display text-choco mb-2">Pets</h1>
            <p className="text-choco/70 mb-6">
                Profiles for each pet detected by the system. Settings are synced globally.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!pets ? (
                    <p className="text-slate-500">Loading pet profiles...</p>
                ) : (
                    pets.map((pet) => (
                        <div
                            key={pet.name}
                            className="bg-white rounded-2xl shadow-card p-5 border border-latte/50 transition hover:-translate-y-1"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                {/* IMAGE LOGIC: Show Photo if available, else Emoji */}
                                <div className="w-16 h-16 rounded-full bg-latte/40 flex items-center justify-center text-3xl border border-latte/60 overflow-hidden shadow-inner relative">
                                    {pet.image ? (
                                        <img 
                                            src={pet.image} 
                                            alt={pet.name} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // If image fails (403/404), hide it so emoji shows
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement!.classList.remove('bg-white');
                                            }}
                                        />
                                    ) : (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            {pet.type.includes("Cat") ? "🐱" : "🐶"}
                                        </span>
                                    )}
                                </div>
                                
                                <div>
                                    <h2 className="text-xl font-bold text-choco">
                                        {pet.name}
                                    </h2>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">{pet.type}</p>
                                </div>
                            </div>

                            <div className="space-y-2 bg-cream/30 p-4 rounded-xl border border-latte/20">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Portion Size:</span>
                                    <span className="font-bold text-choco bg-white px-2 py-0.5 rounded shadow-sm border border-latte/30">
                                        {pet.portion}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Cooldown:</span>
                                    <span className="font-bold text-choco bg-white px-2 py-0.5 rounded shadow-sm border border-latte/30">
                                        {pet.cooldown}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Meals / day:</span>
                                    <span className="font-medium text-slate-700">{pet.mealsPerDay}</span>
                                </div>
                            </div>
                            
                            <div className="mt-4 flex gap-2">
                                <button className="flex-1 text-xs rounded-xl px-3 py-2 bg-choco text-white font-semibold hover:bg-opacity-90 transition">
                                    View History
                                </button>
                                <button className="flex-1 text-xs rounded-xl px-3 py-2 bg-white border border-latte/70 hover:bg-cream transition text-slate-600">
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Layout>
    );
}