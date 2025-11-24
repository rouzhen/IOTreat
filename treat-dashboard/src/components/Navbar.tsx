import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <nav className="w-full py-4 px-6 bg-white shadow flex justify-between items-center fixed top-0 left-0 z-50">
            <div className="text-xl font-display text-choco flex items-center gap-2">
                🐾 <span>IOTreat</span>
            </div>

            <div className="flex gap-6 text-choco/80 font-medium">
                <Link to="/" className="hover:text-pawpink transition">Dashboard</Link>
                <Link to="/history" className="hover:text-pawpink transition">History</Link>
                <Link to="/pets" className="hover:text-pawpink transition">Pets</Link>
                <Link to="/controls" className="hover:text-pawpink transition">Controls</Link>
            </div>
        </nav>
    );
}
