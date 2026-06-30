"use client"

import { useEffect, useMemo, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Bell, CheckCheck, Inbox,
  Calendar, AlertCircle, MessageSquare, Clock
} from "lucide-react"
import { cn, formatDateTime, formatTimeAgo } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export function Notifications() {
  const { messages, unreadCount, markNotificationsAsRead, markSingleAsRead } = useAuth()
  const readQueue = useRef(new Set())

  useEffect(() => {
    return () => {
      markNotificationsAsRead()
    }
  }, [markNotificationsAsRead])

  useEffect(() => {
    if (messages.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = Number(entry.target.getAttribute("data-id"))
            const isRead = entry.target.getAttribute("data-read") === "true"
            if (!isRead && !readQueue.current.has(id)) {
              readQueue.current.add(id)
              markSingleAsRead(id)
            }
          }
        })
      },
      { threshold: 0.9 }
    )
    document.querySelectorAll(".notif-card").forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [messages, markSingleAsRead])

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="text-primary w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Updates & Alerts</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            {unreadCount > 0 ? `You have ${unreadCount} unread updates` : "Your inbox is clear"}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markNotificationsAsRead}
            className="h-8 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
          >
            <CheckCheck className="mr-2 h-3.5 w-3.5" /> Mark all as read
          </Button>
        )}
      </div>

      {/* Main Container with Scroll Logic */}
      <Card className="overflow-hidden border-none shadow-xl bg-background/50 backdrop-blur-sm ring-1 ring-border/50 rounded-2xl">
        <CardContent className="p-0">
          <div className="relative">
            {/* Scrollable Area - Fixed Height to prevent infinite listing */}
            <div className="max-h-[600px] overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/5 rounded-xl border border-dashed">
                  <div className="p-4 bg-muted/10 rounded-full mb-4">
                    <Inbox size={32} className="text-muted-foreground/40" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">No new notifications</h3>
                </div>
              ) : (
                <div className="grid gap-2">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        data-id={msg.id}
                        data-read={!!msg.is_read}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn(
                          "notif-card group relative overflow-hidden rounded-xl border p-4 transition-all duration-200",
                          msg.is_read
                            ? "bg-muted/20 border-transparent opacity-80"
                            : "bg-card border-primary/10 shadow-sm hover:border-primary/30"
                        )}
                      >
                        {/* Indicative Unread Bar */}
                        {!msg.is_read && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        )}

                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
                            msg.is_read
                              ? "bg-muted/50 border-border text-muted-foreground/50"
                              : "bg-primary/5 border-primary/20 text-primary"
                          )}>
                            {msg.is_read ? <MessageSquare size={16} /> : <AlertCircle size={16} />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className={cn(
                                "text-sm font-semibold truncate",
                                msg.is_read ? "text-muted-foreground/80" : "text-foreground"
                              )}>
                                {msg.title}
                              </h4>
                              <span className="shrink-0 text-[10px] font-medium text-muted-foreground/60">
                                {formatDateTime(msg.created_at)}
                              </span>
                            </div>

                            <p className={cn(
                              "text-[13px] leading-relaxed line-clamp-2",
                              msg.is_read ? "text-muted-foreground/70" : "text-muted-foreground"
                            )}>
                              {msg.body}
                            </p>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium">
                                <Calendar size={12} className="opacity-70" />
                                {msg.timesAgo}
                              </div>
                              {!msg.is_read && (
                                <Badge className="h-5 px-2 text-[9px] font-bold bg-primary text-primary-foreground border-none">
                                  NEW
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Subtle Gradient Overlay for scroll hint */}
            <div className="pointer-events-none absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-background/50 to-transparent" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}