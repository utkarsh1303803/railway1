"use client";

import { useState, useEffect } from "react";
import {
    AlertTriangle,
    Camera,
    Clock,
    UserCircle2,
    CheckCircle2,
    MoreVertical,
    ExternalLink,
    ShieldAlert
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    Timestamp
} from "firebase/firestore";

type Alert = {
    id: string;
    coach: string;
    seat: string;
    type: "SOS" | "Evidence";
    category: string;
    timestamp: Timestamp | null;
    priority: "high" | "medium" | "low";
    status: "pending" | "assigned" | "investigating" | "resolved" | "escalated";
};

export default function DashboardPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    // Real-time listener
    useEffect(() => {
        const q = query(collection(db, "sos_alerts"), orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const alertData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Alert[];
            setAlerts(alertData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Escalation logic: Check every 5 seconds for pending alerts > 2 mins
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            alerts.forEach(async (alert) => {
                if (alert.status === "pending" && alert.timestamp) {
                    const alertTime = alert.timestamp.toMillis();
                    const diffInMins = (now - alertTime) / (1000 * 60);

                    if (diffInMins > 2) {
                        const alertRef = doc(db, "sos_alerts", alert.id);
                        try {
                            await updateDoc(alertRef, { status: "escalated" });
                        } catch (err) {
                            console.error("Escalation update failed:", err);
                        }
                    }
                }
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [alerts]);

    const handleAssign = async (id: string) => {
        const alertRef = doc(db, "sos_alerts", id);
        try {
            await updateDoc(alertRef, { status: "assigned" });
        } catch (err) {
            console.error("Assignment failed:", err);
        }
    };

    const getTimeAgo = (timestamp: Timestamp | null) => {
        if (!timestamp) return "Just now";
        const now = Date.now();
        const diff = now - timestamp.toMillis();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        return `${mins}m ago`;
    };

    const getRemainingSeconds = (timestamp: Timestamp | null) => {
        if (!timestamp) return 120;
        const now = Date.now();
        const diff = now - timestamp.toMillis();
        const remaining = Math.max(0, 120 - Math.floor(diff / 1000));
        return remaining;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    {
                        label: "Active Alerts",
                        value: alerts.filter(a => a.status === "pending" || a.status === "escalated").length.toString().padStart(2, "0"),
                        color: "text-accent",
                        icon: AlertTriangle
                    },
                    {
                        label: "Escalated",
                        value: alerts.filter(a => a.status === "escalated").length.toString().padStart(2, "0"),
                        color: "text-red-500",
                        icon: ShieldAlert
                    },
                    {
                        label: "Assigned Units",
                        value: alerts.filter(a => a.status === "assigned").length.toString().padStart(2, "0"),
                        color: "text-green-400",
                        icon: UserCircle2
                    },
                    {
                        label: "Total Today",
                        value: alerts.length.toString().padStart(2, "0"),
                        color: "text-purple-400",
                        icon: Clock
                    },
                ].map((stat) => (
                    <Card key={stat.label} className="bg-card/50 border-border/50">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{stat.label}</p>
                                <p className={cn("text-3xl font-bold tracking-tight", stat.color)}>{stat.value}</p>
                            </div>
                            <div className={cn("p-2 rounded-lg bg-opacity-10", stat.color.replace('text-', 'bg-'))}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Alerts Table */}
            <Card className="bg-card border-border shadow-2xl">
                <CardHeader className="border-b border-border/50 pb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                Live Alert Feed
                                <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">Real-time Firestore stream. Alerts escalate after 2 minutes of inaction.</CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="text-xs h-8 border-border hover:bg-muted/50">Export Logs</Button>
                            <Button variant="default" size="sm" className="text-xs h-8">Refresh Feed</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="w-[120px] pl-8">Coach/Seat</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Incident</TableHead>
                                <TableHead>Received</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right pr-8">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                        Establishing real-time link to NR-01 Hub...
                                    </TableCell>
                                </TableRow>
                            ) : alerts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                        No active alerts in current sector.
                                    </TableCell>
                                </TableRow>
                            ) : alerts.map((alert) => {
                                const isEscalated = alert.status === "escalated";
                                const isPending = alert.status === "pending";
                                const remainingSecs = getRemainingSeconds(alert.timestamp);

                                return (
                                    <TableRow
                                        key={alert.id}
                                        className={cn(
                                            "border-border/40 transition-colors group",
                                            isEscalated ? "bg-red-500/10 hover:bg-red-500/20" : "hover:bg-muted/20"
                                        )}
                                    >
                                        <TableCell className="font-bold pl-8">
                                            <span className={cn(isEscalated ? "text-red-400" : "text-primary", "mr-1")}>{alert.coach}</span>
                                            <span className="text-muted-foreground mr-1">/</span>
                                            {alert.seat}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {alert.type === "SOS" ? (
                                                    <AlertTriangle className={cn("w-4 h-4", isEscalated ? "text-red-500" : "text-accent")} />
                                                ) : (
                                                    <Camera className={cn("w-4 h-4", isEscalated ? "text-red-500" : "text-primary")} />
                                                )}
                                                <span className="font-medium">{alert.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs capitalize">
                                            {alert.category.replace('_', ' ')}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {getTimeAgo(alert.timestamp)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={alert.priority === "high" || isEscalated ? "destructive" : alert.priority === "medium" ? "secondary" : "outline"}
                                                className="text-[10px] font-bold uppercase tracking-tighter h-5"
                                            >
                                                {alert.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={isEscalated ? "destructive" : isPending ? "accent" : alert.status === "resolved" ? "success" : "secondary"}
                                                className={cn(
                                                    "text-[10px] font-bold uppercase tracking-tighter h-5",
                                                    isEscalated && "animate-bounce mt-1"
                                                )}
                                            >
                                                {alert.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex items-center justify-end gap-2">
                                                {(isPending || isEscalated) && (
                                                    <Button
                                                        onClick={() => handleAssign(alert.id)}
                                                        className={cn(
                                                            "h-7 px-3 text-[10px] font-bold uppercase transition-all shadow-lg",
                                                            isEscalated ? "bg-red-600 hover:bg-red-700 shadow-red-900/40 px-5" : "bg-primary hover:bg-primary/90 shadow-primary/20"
                                                        )}
                                                    >
                                                        {isEscalated ? "URGENT ASSIGN" : "Assign Unit"}
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Footer Info */}
            <div className={cn(
                "border rounded-xl p-6 flex items-center justify-between transition-colors",
                alerts.some(a => a.status === "escalated")
                    ? "bg-red-500/5 border-red-500/20"
                    : "bg-primary/5 border-primary/20"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        alerts.some(a => a.status === "escalated") ? "bg-red-500/20" : "bg-primary/20"
                    )}>
                        {alerts.some(a => a.status === "escalated") ? (
                            <ShieldAlert className="w-6 h-6 text-red-500" />
                        ) : (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-bold tracking-tight">
                            {alerts.some(a => a.status === "escalated")
                                ? "Emergency Protocol Active"
                                : "System Integrity: 100%"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {alerts.some(a => a.status === "escalated")
                                ? "Multiple high-priority breaches detected. Escalation chain notified."
                                : "Real-time sync active with IRCTC and RPF backend services."}
                        </p>
                    </div>
                </div>
                <Button variant="link" className={cn(
                    "flex items-center gap-1 text-xs",
                    alerts.some(a => a.status === "escalated") ? "text-red-400" : "text-primary"
                )}>
                    Sector Logs
                    <ExternalLink className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );
}
