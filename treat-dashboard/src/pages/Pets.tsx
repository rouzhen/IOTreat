import Layout from "../components/Layout";
import { Link } from "react-router-dom";

const DEMO_PETS = [
    {
        name: "Mocha",
        type: "Shiba Inu",
        portion: "25 g / meal",
        mealsPerDay: 2,
        notes: "Prone to stealing Luna's food. Watch closely.",
    },
    {
        name: "Luna",
        type: "British Shorthair",
        portion: "18 g / meal",
        mealsPerDay: 3,
        notes: "Eats slowly, prefers smaller frequent meals.",
    },
];

export default function Pets() {
    return (
        <Layout>
            <h1 className="text-3xl font-display text-choco mb-2">Pets</h1>
            <p className="text-choco/70 mb-6">
                Profiles for each pet using the feeder. These are demo profiles only.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {DEMO_PETS.map((pet) => (
                    <div
                        key={pet.name}
                        className="bg-white rounded-2xl shadow-card p-5 border border-latte/50"
                    >
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 rounded-full bg-latte/40 flex items-center justify-center text-2xl">
                                {pet.name === "Mocha" ? "🐶" : "🐱"}
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-choco">
                                    {pet.name}
                                </h2>
                                <p className="text-xs text-slate-500">{pet.type}</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600">
                            Portion: <span className="font-semibold">{pet.portion}</span>
                        </p>
                        <p className="text-sm text-slate-600">
                            Meals / day:{" "}
                            <span className="font-semibold">{pet.mealsPerDay}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-3">{pet.notes}</p>
                        
                        {pet.name === "Mocha" ? (
                            <Link
                                to="/pets/mocha"
                                className="mt-4 inline-block text-xs rounded-full px-3 py-1 bg-cream border border-latte/70 hover:bg-latte/30 transition"
                            >
                                View Mocha detail
                            </Link>
                        ) : (
                            <button className="mt-4 text-xs rounded-full px-3 py-1 bg-cream border border-latte/70 hover:bg-latte/30 transition">
                                View detection history (demo)
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </Layout>
    );
}
