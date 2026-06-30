"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect, useMemo } from "react"
import { io, Socket } from "socket.io-client"
import { NOTIFICATION_SOCKET_ENDPOINT } from "@/lib/constants/backend-constants"
import { toast } from "sonner"
import { UserController } from "./api-controllers/user.controller"

interface Message {
  id: number
  title: string
  body: string
  is_read: number // Aligned with your backend 0/1
  created_at: string
}

interface AuthContextType {
  user: any
  login: (userData: any) => void
  logout: () => void
  isAuthenticated: boolean
  messages: Message[]
  unreadCount: number
  markNotificationsAsRead: () => void
  markSingleAsRead: (id: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  const unreadCount = useMemo(() => {
    return messages.filter(m => !m.is_read).length
  },[messages])

  useEffect(() => {

    async function validateAccess(user_) {
      toast.dismiss()
      toast.loading("Validating user session. Please wait...")
      await new UserController().checkAuth({
        session_token: user_?.session_token,
        onSuccess: ({ user }) => {
          toast.dismiss()
          setUser(user)
        }, onFailed: (err) => {
          toast.dismiss()
          toast.error(err)
        }
      })
    }
    const _user = localStorage.getItem("USER")
    if (_user) {
      validateAccess(JSON.parse(_user))
    }

  }, [])


  
  const msgs = useMemo(
    () => messages.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    ),
    [messages]
  );

  useEffect(() => {
    if (!user) {
      if (socket) { socket.disconnect(); setSocket(null); }
      setMessages([]);
      return
    }

    const newSocket = io(NOTIFICATION_SOCKET_ENDPOINT, { transports: ["websocket"] })

    newSocket.on("connect", () => {
      newSocket.emit("join", { id: user.id, role: user.role, name: user.name })
    })

    newSocket.on("new_message", (msg: Message) => {
      console.log('msg', msg)
      setMessages((prev) => {
        // Prevent duplicates if the backend re-emits on join
        if (prev.find(m => m.id === msg.id)) return prev;
        return [msg, ...prev];
      });
    })

    newSocket.on("message_read", ({ id }: { id: number }) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: 1 } : m)))
    })

    newSocket.on("all_messages_read", () => {
      setMessages((prev) => prev.map((m) => ({ ...m, is_read: 1 })))
    })

    setSocket(newSocket)
    return () => { newSocket.disconnect() }
  }, [user])

  const markNotificationsAsRead = useCallback(() => {
    if (socket && user) {
      socket.emit("mark_all_read", { userId: user.id })
      setMessages(prev => prev.map(m => ({ ...m, is_read: 1 })))
    }
  }, [socket, user])

  const markSingleAsRead = useCallback((id: number) => {
    if (socket && user) {
      socket.emit("mark_read", { messageId: id, userId: user.id })
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: 1 } : m))
    }
  }, [socket, user])

  const login = (userData: any) => {
    // setUser({...JSON.parse(_user),validated:true})
    setUser(userData)
    localStorage.setItem("USER", JSON.stringify(userData))
  }

  const logout = async () => {

    toast.dismiss()
    toast.loading("Signing out. Please wait...")
    await new UserController().logout({
      session_token: user?.session_token,
      onSuccess: () => {
        toast.dismiss()
        setUser(null)
        localStorage.removeItem("USER")
      },
      onFailed: (err) => {
        toast.dismiss()
        toast.error(err)
      }
    })



  }

  return (
    <AuthContext.Provider value={{
      user, login, logout, isAuthenticated: !!user,
      messages: msgs, unreadCount, markNotificationsAsRead, markSingleAsRead
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}