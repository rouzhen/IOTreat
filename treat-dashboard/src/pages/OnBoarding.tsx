import { useState } from "react";
import Layout from "../components/Layout";
import { addPetProfile } from "../api/feeder";

export default function Onboarding() {
    const [name, setName] = useState("");
    const [species, setSpecies] = useState("dog"); // 'dog' or 'cat'
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    // Convert file to Base64
    const handleFileChange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
            setLoading(true);
            setMsg("Uploading to Cloud...");
            
            try {
                // 2. Use the new function here
                await addPetProfile(name, species, image);
                
                setMsg("✅ Profile Created! Dashboard updated.");
                // Optional: Clear form
                setName("");
                setImage(null);
            } catch (err) {
                console.error(err);
                setMsg("❌ Error uploading.");
            } finally {
                setLoading(false);
            }
        };

    return (
        <Layout>
            <h1 className="text-3xl font-display text-choco mb-2">New Pet Profile</h1>
            <p className="text-choco/70 mb-8">Register a pet so the pet feeder knows who they are.</p>

            <div className="bg-white p-8 rounded-3xl shadow-card border border-latte/50 max-w-lg">
                
                {/* 1. Name Input */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-choco mb-2">Pet Name</label>
                    <input 
                        className="w-full p-3 rounded-xl border border-latte/50 focus:ring-2 focus:ring-amber-400 outline-none"
                        placeholder="e.g. Mocha"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>

                {/* 2. Species Selector (Links to YOLO class) */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-choco mb-2">Detection Type</label>
                    <p className="text-xs text-slate-500 mb-2">Which AI model detects this pet?</p>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setSpecies("dog")}
                            className={`flex-1 py-3 rounded-xl border-2 font-bold ${species === "dog" ? "border-amber-400 bg-amber-50" : "border-slate-100"}`}
                        >
                            🐶 Dog
                        </button>
                        <button 
                            onClick={() => setSpecies("cat")}
                            className={`flex-1 py-3 rounded-xl border-2 font-bold ${species === "cat" ? "border-amber-400 bg-amber-50" : "border-slate-100"}`}
                        >
                            🐱 Cat
                        </button>
                    </div>
                </div>

                {/* 3. Image Upload */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-choco mb-2">Profile Picture</label>
                    <div className="border-2 border-dashed border-latte/40 rounded-xl p-6 text-center cursor-pointer hover:bg-cream/30 relative">
                        <input type="file" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" onChange={handleFileChange} />
                        {image ? (
                            <img src={image} alt="Preview" className="h-32 w-32 object-cover rounded-full mx-auto shadow-md" />
                        ) : (
                            <div className="text-slate-400">
                                <span className="text-2xl">📷</span>
                                <p className="text-xs mt-2">Click to upload photo</p>
                            </div>
                        )}
                    </div>
                </div>

                <button 
                    onClick={handleSubmit} 
                    disabled={loading || !name}
                    className="w-full py-4 rounded-2xl bg-choco text-white font-bold hover:opacity-90 disabled:opacity-50 transition"
                >
                    {loading ? "Saving..." : "Create Profile"}
                </button>
                
                <p className="text-center text-sm mt-4 text-green-600 font-medium">{msg}</p>
            </div>
        </Layout>
    );
}