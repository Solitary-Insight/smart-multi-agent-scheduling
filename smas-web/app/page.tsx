"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import type { Role } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, BookOpen, Shield, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { toast } from "sonner"
import { UserController } from '@/lib/api-controllers/user.controller'

const ROLE_CONFIG: {
  role: Role
  label: string
  description: string
  icon: typeof GraduationCap
  color: string
}[] = [
  { role: "student", label: "Student", description: "Courses & Timetable", icon: GraduationCap, color: "from-blue-500 to-indigo-600" },
  { role: "teacher", label: "Teacher", description: "Schedule Management", icon: BookOpen, color: "from-purple-500 to-fuchsia-600" },
  { role: "admin", label: "Admin", description: "Full System Control", icon: Shield, color: "from-orange-500 to-red-600" },
]

export default function Page() {
  const { user, isAuthenticated } = useAuth()
  if (isAuthenticated && user) return <DashboardShell />
  return <LoginPage />
}

function LoginPage() {
  const { login } = useAuth()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)

  // Helper: Capitalize first character only
  const formatRole = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const handleLogin = async () => {
    if (!selectedRole) return toast.error("Please select a role first!")
    
    setLoggingIn(true)
    toast.loading("Authenticating credentials...")

    const payload = { email, password, role: selectedRole }

    await new UserController().loginUser({
      payload,
      onSuccess: ({ user }) => {
        toast.dismiss()
        toast.success(`Welcome back, ${user.name} to your ${formatRole(user.role)} account.`)
        login(user)
      },
      onFailed: (error) => {
        toast.dismiss()
        toast.error(error || "Authentication failed")
        setLoggingIn(false)
      }
    })
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#020617] selection:bg-blue-500/30">
      {/* Permanent Artistic Background */}
      <div className="fixed inset-0 z-0">
        {/* Subtle Grid with Fade Mask */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
        
        {/* Ambient Glows */}
        <div className="absolute -top-[10%] -left-[10%] h-[50%] w-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <main className="relative z-10 flex h-full items-center justify-center p-4">
        <div className="w-full max-w-[460px] space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-[0_0_40px_-10px_rgba(37,99,235,0.6)] mb-2">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white sm:text-5xl">SMAS</h1>
            <p className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">Smart Multi-Agent Scheduler</p>
          </div>

          {/* Glass Card */}
          <Card className="border-white/10 bg-slate-950/40 backdrop-blur-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-bold text-white/90">Authentication</CardTitle>
              <CardDescription className="text-slate-500 text-[11px] uppercase tracking-widest">Select Access Profile</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              {/* Role Selection Grid */}
              <div className="grid grid-cols-3 gap-3">
                {ROLE_CONFIG.map(({ role, label, icon: Icon, color }) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`group relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-500 ${
                      selectedRole === role
                        ? "border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/40"
                        : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${color} transition-all duration-500 group-hover:scale-110 shadow-lg ${selectedRole === role ? "scale-110 opacity-100" : "opacity-70"}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    
                    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${selectedRole === role ? "text-blue-400" : "text-slate-500"}`}>
                      {label}
                    </span>

                    {selectedRole === role && (
                      <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Collapsible Form Section */}
              <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${selectedRole ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden px-1">
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">University Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@stmu.edu.pk"
                        className="h-12 border-white/5 bg-black/40 text-white transition-all focus:border-blue-500/40 focus:ring-blue-500/5 placeholder:text-slate-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="h-12 border-white/5 bg-black/40 text-white pr-12 transition-all focus:border-blue-500/40 focus:ring-blue-500/5 placeholder:text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-blue-400 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      onClick={handleLogin}
                      disabled={loggingIn}
                      className="w-full h-12 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                    >
                      {loggingIn ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-2">
                          Enter {selectedRole ? formatRole(selectedRole) : ""} Dashboard
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {!selectedRole && (
                <div className="text-center py-2 animate-pulse">
                  <p className="text-[9px] text-slate-700 uppercase tracking-[0.4em]">Ready for Secure Handshake</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <footer className="text-center animate-in fade-in duration-1000 delay-500">
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium opacity-60">
              Shifa Tameer-E-Millat University • 2026
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}