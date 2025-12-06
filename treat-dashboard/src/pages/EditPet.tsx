import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getStatus, addPetProfile } from "../api/feeder";

export default function EditPet() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Get 'id' from URL (e.g. ?id=dog)
    const petId = searchParams.get("id") || "dog";

    const [name, setName] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [portion, setPortion] = useState(25);
    const [cooldown, setCooldown] = useState(30);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");

    // 1. Load existing data
    useEffect(() => {
        getStatus().then((data) => {
            const current = Array.isArray(data) ? data[0] : data;
            if (current.pets) {
                // Match by ID (species key)
                const pet = current.pets.find((p: any) => p.id === petId);
                if (pet) {
                    setName(pet.name);
                    setImage(pet.image); // This will be a URL
                    setPortion(pet.raw_portion || 25);
                    setCooldown(pet.raw_cooldown || 30);
                }
            }
            setLoading(false);
        });
    }, [petId]);

    const handleFileChange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setMsg("Updating...");
        try {
            // Send update (image will be null/URL or base64 if changed)
            await addPetProfile(name, petId, image, portion, cooldown);
            setMsg("✅ Updated Successfully!");
            setTimeout(() => navigate("/pets"), 1000); // Go back after 1s
        } catch (err) {
            setMsg("❌ Error updating.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Layout><p>Loading profile...</p></Layout>;

    return (
        <Layout>
            <button onClick={() => navigate("/pets")} className="text-xs text-slate-500 mb-4 hover:text-choco">← Back to Pets</button>
            <h1 className="text-3xl font-display text-choco mb-6">Edit Profile: {name}</h1>

            <div className="bg-white p-8 rounded-3xl shadow-card border border-latte/50 max-w-lg">
                <div className="mb-6">
                    <label className="block text-sm font-bold text-choco mb-2">Display Name</label>
                    <input className="w-full p-3 rounded-xl border border-latte/50" value={name} onChange={e => setName(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-choco mb-2">Portion (g)</label>
                        <input type="number" className="w-full p-3 rounded-xl border border-latte/50" value={portion} onChange={e => setPortion(Number(e.target.value))} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-choco mb-2">Cooldown (s)</label>
                        <input type="number" className="w-full p-3 rounded-xl border border-latte/50" value={cooldown} onChange={e => setCooldown(Number(e.target.value))} />
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-bold text-choco mb-2">Profile Picture</label>
                    <div className="border-2 border-dashed border-latte/40 rounded-xl p-6 text-center cursor-pointer hover:bg-cream/30 relative">
                        <input type="file" className="opacity-0 absolute inset-0 w-full h-full" onChange={handleFileChange} />
                        {image ? (
                            <img src={image} alt="Preview" className="h-32 w-32 object-cover rounded-full mx-auto shadow-md" />
                        ) : <p className="text-slate-400 text-xs">Click to change photo</p>}
                    </div>
                </div>

                <button onClick={handleSave} disabled={loading} className="w-full py-4 rounded-2xl bg-choco text-white font-bold hover:opacity-90 transition">
                    {loading ? "Saving..." : "Save Changes"}
                </button>
                <p className="text-center text-sm mt-4 text-green-600">{msg}</p>
            </div>
        </Layout>
    );
}