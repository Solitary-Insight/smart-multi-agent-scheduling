import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import Shimmer from "@/components/ui/loading-shimmers/shimmer";
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatTimeAgo } from "@/lib/utils";
import { Activity, ChevronLeft, ChevronRight, Globe, Monitor, Terminal } from "lucide-react"
import { useMemo, useState } from "react";

export default function TrafficLogTimeline({ logs, isBusy }) {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 4;

    const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
    const paginatedLogs = useMemo(() => {
        // Sort by latest first
        const sorted = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return sorted.slice(start, start + ITEMS_PER_PAGE);
    }, [logs, currentPage]);

    const getStatusColor = (code) => {
        if (code >= 500) return "text-destructive bg-destructive/10 border-destructive/20";
        if (code >= 400) return "text-warning bg-warning/10 border-warning/20";
        return "text-success bg-success/10 border-success/20";
    };

    return (
        <div className="flex flex-col h-full">
            <div className="space-y-3 flex-1">
                {isBusy ? (
                    // 1. Shimmer State
                    Array(ITEMS_PER_PAGE).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-2 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Shimmer className="h-8 w-12 rounded-md" />
                                <div className="space-y-1">
                                    <Shimmer className="h-3 w-24" />
                                    <Shimmer className="h-2 w-16" />
                                </div>
                            </div>
                            <Shimmer className="h-6 w-10 rounded-full" />
                        </div>
                    ))
                ) : logs.length === 0 ? (
                    // 2. No Log UI
                    <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed rounded-xl">
                        <Activity className="h-8 w-8 text-muted-foreground/20 mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">No traffic detected</p>
                    </div>
                ) : (
                    // 3. Traffic Log List
                    paginatedLogs.map((log, i) => (
                        <Dialog key={i}>
                            <DialogTrigger asChild>
                                <div className="group flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-card/50 hover:bg-accent hover:border-primary/20 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`text-[10px] font-black px-2 py-1 rounded border uppercase ${getStatusColor(log.statusCode)}`}>
                                            {log.method}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate max-w-[150px] font-mono">
                                                {log.path}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Globe className="w-2.5 h-2.5" /> {log.ip.replace('::ffff:', '')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <Badge variant="outline" className="text-[9px] font-mono opacity-70">
                                            {log.duration}
                                        </Badge>
                                        <span className="text-[9px] text-muted-foreground font-medium uppercase">
                                            {formatTimeAgo(log.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            </DialogTrigger>

                            <DialogContent className="max-w-2xl bg-card border-border/50">
                                <DialogHeader className="border-b pb-4">
                                    <DialogTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-tight">
                                        <Terminal className="w-4 h-4 text-primary" />
                                        Request Analysis
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="flex  gap-2 items-center py-4">
                                    <div className=" flex-1 space-y-3">
                                        <DetailItem label="Endpoint" value={`${log.method} ${log.path}`} icon={Activity} />
                                        <DetailItem label="Client IP" value={log.ip} icon={Globe} />
                                        <DetailItem label="User Agent" value={log.device} icon={Monitor} isSmall />
                                    </div>
                                    <div className=" flex-1 bg-slate-950 rounded-xl border border-border/50 p-4 shadow-inner">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                                                <Terminal className="w-3 h-3 text-primary" />
                                                Response Body
                                            </p>
                                            <Badge variant="outline" className="text-[9px] font-mono border-slate-700 text-slate-500 bg-transparent">
                                                JSON
                                            </Badge>
                                        </div>

                                        <ScrollArea className="h-[200px] w-full rounded-md border border-slate-800 bg-slate-900/50">
                                            <div className="p-3">
                                                <pre className="text-[11px] font-mono text-emerald-400/90 leading-relaxed whitespace-pre-wrap break-all">
                                                    {log.responseData}
                                                </pre>
                                            </div>
                                            {/* ScrollArea includes vertical scrollbar by default */}
                                        </ScrollArea>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ))
                )}
            </div>

            {/* Pagination (Reusing your logic) */}
            {!isBusy && totalPages > 1 && (
                <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Logs {currentPage}/{totalPages}</p>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                            <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                            <ChevronRight className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailItem({ label, value, icon: Icon, isSmall = false }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                <Icon className="w-3 h-3" /> {label}
            </p>
            <p className={`${isSmall ? 'text-[10px]' : 'text-xs'} font-bold text-foreground break-all bg-muted/50 p-2 rounded-md border border-border/50`}>
                {value}
            </p>
        </div>
    );
}