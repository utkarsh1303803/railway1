import Link from "next/link";
import {
    LayoutDashboard,
    Map,
    History,
    Settings,
    Shield,
    Bell,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    { icon: LayoutDashboard, label: "Live Alerts", href: "/", active: true },
    { icon: Map, label: "Train Tracking", href: "/tracking" },
    { icon: Users, label: "Staff Management", href: "/staff" },
    { icon: History, label: "Archive", href: "/history" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
    return (
        <div className="w-64 h-screen bg-secondary border-r border-border flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight">RailRakshak</h1>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Command Center</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
                {menuItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group",
                            item.active
                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                : "text-muted-foreground hover:bg-muted hover:text-white"
                        )}
                    >
                        <item.icon className={cn("w-5 h-5", item.active ? "text-white" : "text-muted-foreground group-hover:text-white")} />
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-500">System Live</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Connected to NR-01 Hub. All units operational.
                    </p>
                </div>
            </div>
        </div>
    );
}
