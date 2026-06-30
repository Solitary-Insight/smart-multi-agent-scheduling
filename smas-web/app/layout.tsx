import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "sonner"

import "./globals.css"
import { Loader } from "lucide-react"

const _inter = Inter({ subsets: ["latin"] })
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SMAS - Smart Multi-Agent Scheduler",
  description: "Smart Scheduling system for students, teachers, and administrators.",
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster icons={{
            loading: <Loader className=" animate-spin mr-2 h-4 w-4" /> // your own React icon
          }} position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  )
}
