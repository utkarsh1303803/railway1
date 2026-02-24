import { Bell, Search, User, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";

export function Header() {
    return (
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between ml-64">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <span>RPF Command Center</span>
                </div>
                <div className="h-4 w-[1px] bg-border mx-2" />
                <span className="text-xs text-muted-foreground">Officer ID: #RPF-7742</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative group">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-white transition-colors" />
                    <input
                        type="text"
                        placeholder="Search alerts, coach, pnr..."
                        className="bg-muted/30 border border-border rounded-lg pl-10 pr-4 py-1.5 text-xs w-64 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                </div>

                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-background" />
                </Button>

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right">
                        <p className="text-xs font-bold">Insp. Vikram Singh</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Shift Lead</p>
                    </div>
                    <div className="w-9 h-9 bg-primary/20 rounded-full border border-primary/50 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                    </div>
                </div>
            </div>
        </header>
    );
}
