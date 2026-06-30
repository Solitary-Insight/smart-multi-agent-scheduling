"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Sparkles, Lock, AlertCircle, CheckCircle2, Calendar, Clock, MapPin, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MinimalistAgentShimmer } from "@/components/ui/loading-shimmers/minimal-agent-shimmer";
import RescheduleController from "@/lib/api-controllers/reschedule-controller";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const AGENT_STAGES = [
  "Initializing Smart Scheduler Agent...",
  "Fetching current faculty constraints...",
  "Analyzing room availability for preferred day...",
  "Checking for student group conflicts...",
  "Running optimization algorithm (Hill Climbing)...",
  "Verifying laboratory equipment requirements...",
  "Validating adjustment against department rules...",
  "Generating optimized slot allocation...",
];

export function RescheduleAgentDialog({ isOpen, onOpenChange, request, onApprovalComplete }) {
  const [status, setStatus] = useState<'idle' | 'running' | 'generated' | 'success' | 'failed'>('idle');
  const [currentStage, setCurrentStage] = useState(AGENT_STAGES[0]);
  const [errorData, setErrorData] = useState<{ message: string; code?: string; details?: any } | null>(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for final hit
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const isLocked = useMemo(() => status === 'running' || status === 'generated', [status]);

  const runSimulation = useCallback(async () => {
    if (!request) return;
    setStatus('running');
    setErrorData(null);

    for (let i = 0; i < AGENT_STAGES.length; i++) {
      if (!isMounted.current || !isOpen) return;
      setCurrentStage(AGENT_STAGES[i]);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      await new RescheduleController().arrangeRescheduleSlot({
        payload: {
          slot_id: request.slot_id,
          teacher_id: request.teacher_id,
          preferred_day_id: request.day_id,
          reason: request.reason || "No reason provided"
        },
        onSuccess: (data) => {
          if (!isMounted.current) return;
          setPreview(data.preview);
          setStatus('generated');
        },
        onFailed: (errorObj) => {
          if (!isMounted.current) return;
          setStatus('failed');
          // Map structured error from backend
          const err = errorObj?.response.data.error;
          setErrorData({
            message: err?.message || "Internal scheduling conflict.",
            code: err?.code || null,
            details: err?.details || null
          });
        }
      });
    } catch (e) {
      if (isMounted.current) setStatus('failed');
    }
  }, [request, isOpen]);

  useEffect(() => {
    if (isOpen) runSimulation();
    else {
      const timer = setTimeout(() => {
        setStatus('idle');
        setPreview(null);
        setErrorData(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, runSimulation]);

  const handleFinalApprove = async () => {
    if (!preview || isSubmitting) return;

    setIsSubmitting(true);
    setErrorData(null);
    try {
      await new RescheduleController().createRealocationSlot({
        payload: { ...preview,request_id:request?.id },
        onSuccess: (response) => {
          if (isMounted.current) {
            setIsSubmitting(false);
            setStatus('success');
            // Notify parent component to refresh lists
            onApprovalComplete?.(request?.id);
          }
        },
        onFailed: (errObj) => {
          if (isMounted.current) {
            setIsSubmitting(false);
            setStatus('failed');
            // Use the same error mapping as the simulation
            const err = errObj?.response?.data?.error || errObj;
            setErrorData({
              message: err?.message || "Failed to commit changes to the timetable.",
              code: err?.code
            });
          }
        }
      });
    } catch (e) {
      if (isMounted.current) {
        setIsSubmitting(false);
        setStatus('failed');
      }
    };

  }
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLocked && onOpenChange(open)}>
      <DialogContent
        className="sm:max-w-[420px] p-0 border-none shadow-2xl [&>button]:hidden transition-all duration-500 overflow-hidden bg-card"
        onEscapeKeyDown={(e) => isLocked && e.preventDefault()}
        onPointerDownOutside={(e) => isLocked && e.preventDefault()}
      >
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                status === 'running' ? "bg-amber-500 animate-pulse" :
                  status === 'failed' ? "bg-red-500" : "bg-emerald-500"
              )} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {status === 'running' ? "Neural Optimization" : "Agent Summary"}
              </span>
            </div>
            {isLocked && <Lock className="h-3 w-3 text-muted-foreground/20" />}
          </div>

          <AnimatePresence mode="wait">
            {/* 1. RUNNING */}
            {status === 'running' && (
              <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MinimalistAgentShimmer stage={currentStage} />
              </motion.div>
            )}

            {/* 2. GENERATED (PROPOSAL) */}
            {status === 'generated' && preview && (
              <motion.div key="gen" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold tracking-tight">Proposed Adjustment</h3>
                  <div className="flex items-center justify-center gap-0">
                    <Badge variant={preview.tier === 1 ? "default" : "secondary"} className="text-[9px] uppercase font-black px-2 py-1">
                      {preview.tier === 1 ? "Optimal" : "Alternative"} Solution
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 border rounded-xl p-4 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-lg border shadow-sm"><Calendar size={14} className="text-primary" /></div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Date & Day</p>
                      <p className="text-sm font-semibold">{preview.new_day_name}, {preview.reschedule_date}</p>
                    </div>
                  </div>
                  <Separator className="opacity-50" />
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-lg border shadow-sm"><Clock size={14} className="text-primary" /></div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Time Slot</p>
                      <p className="text-sm font-semibold">{preview.new_start_time} — {preview.new_end_time}</p>
                    </div>
                  </div>
                  <Separator className="opacity-50" />
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-lg border shadow-sm"><MapPin size={14} className="text-primary" /></div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Classroom</p>
                      <p className="text-sm font-semibold">{preview.new_classroom_name} <span className="text-[10px] text-muted-foreground">(Capacity: {preview.new_classroom_cap})</span></p>
                    </div>
                  </div>
                </div>

                {/* Conflict Warnings */}
                {(preview.teacher_availability_relaxed || preview.violations?.length > 0) && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 flex gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0" size={16} />
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-amber-700 uppercase tracking-tight">Optimization Notes</p>
                      {preview.teacher_availability_relaxed && (
                        <p className="text-[10px] text-amber-600/80 leading-tight">Relaxed teacher availability used to find this slot.</p>
                      )}
                      {preview.violations?.map((v, i) => (
                        <p key={i} className="text-[10px] text-amber-600/80 leading-tight">• {v.code}: {v.message}</p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={handleFinalApprove}
                    disabled={isSubmitting}
                    className="w-full font-black uppercase text-[11px] tracking-widest h-12 shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Timetable...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="mr-2" />
                        Commit Re-allocation
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    disabled={isSubmitting}
                    onClick={() => onOpenChange(false)}
                    className="w-full font-bold uppercase text-[10px] tracking-widest text-muted-foreground"
                  >
                    Discard Proposal
                  </Button>
                </div>
              </motion.div>
            )}

            {/* 3. SUCCESS */}
            {status === 'success' && (
              <motion.div key="succ" className="flex flex-col items-center text-center py-6 space-y-4">
                <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold tracking-tight">Adjustment Finalized</h3>
                  <p className="text-xs text-muted-foreground px-6">The timetable has been updated and notifications have been dispatched to all stakeholders.</p>
                </div>
                <Button onClick={() => onOpenChange(false)} className="w-full h-12" variant="outline">Dismiss</Button>
              </motion.div>
            )}
            {/* 4. FAILED - Redesigned for RescheduleError Structure */}
            {status === 'failed' && (
              <motion.div key="fail" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-red-600">Scheduling Failed</h3>
                  <p className="text-[11px] text-muted-foreground px-4 leading-relaxed">
                    {errorData?.message}
                  </p>
                </div>

                {/* Blocker Analysis Section */}
                {errorData?.details?.reasons?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">Core Blockers</p>
                    <div className="grid grid-cols-2 gap-2">
                      {errorData.details.reasons.slice(0, 4).map((r: any, i: number) => (
                        <div key={i} className="bg-muted/40 border border-border/50 rounded-lg p-2 flex justify-between items-center">
                          <span className="text-[10px] font-medium text-muted-foreground truncate mr-2">{r.key}</span>
                          <span className="text-[10px] font-bold bg-red-500/10 text-red-600 px-1.5 rounded">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Near Miss / Alternative Suggestion Section */}
                {errorData?.details?.bestNearMiss && (
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={12} className="text-primary" />
                      <p className="text-[10px] font-black uppercase tracking-tighter text-primary">Suggested Alternative</p>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-muted-foreground" />
                        <span className="font-semibold">Day {errorData.details.bestNearMiss.day_id}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-muted-foreground" />
                        <span className="font-semibold">{errorData.details.bestNearMiss.start_time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-muted-foreground" />
                        <span className="font-semibold">Room {errorData.details.bestNearMiss.room_id}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="w-full flex flex-col gap-2 pt-2">
                  <Button onClick={runSimulation} className="w-full font-bold uppercase text-[10px] tracking-widest h-11">
                    Attempt Auto-Relaxation
                  </Button>
                  <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[10px] font-bold uppercase text-muted-foreground">
                    Cancel Request
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}