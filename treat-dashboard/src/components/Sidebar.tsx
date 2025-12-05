import { Link, useLocation } from "react-router-dom";

const routes = [
    { name: "Dashboard", path: "/", icon: "📊" },
    { name: "History", path: "/history", icon: "📜" },
    { name: "Pets", path: "/pets", icon: "🐾" },
    { name: "Controls", path: "/controls", icon: "⚙️" },
    { name: "Onboarding", path: "/onboarding", icon: "🚀" },
];

export default function Sidebar() {
    const location = useLocation();

    return (
        <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r shadow-md flex flex-col p-6">
            <div className="text-2xl font-display text-choco mb-10 flex items-center gap-2">
                🐾 <span>IOTreat</span>
            </div>

            <nav className="flex flex-col gap-2">
                {routes.map((route) => {
                    const active = location.pathname === route.path;

                    return (
                        <Link
                            key={route.path}
                            to={route.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition 
                ${active
                                    ? "bg-pawpink/30 text-choco shadow-sm"
                                    : "text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            <span>{route.icon}</span>
                            {route.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
