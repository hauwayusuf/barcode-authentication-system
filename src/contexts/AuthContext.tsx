import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  role: 'admin' | 'lecturer' | 'student'
  first_name?: string
  last_name?: string
  username?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('auth_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        localStorage.removeItem('auth_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string, role: string) => {
    setLoading(true)
    try {
      // Try API authentication first
      const apiUrl = import.meta.env.VITE_API_URL
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, role }),
        })

        const data = await response.json()

        if (data.success) {
          const userData = {
            id: data.user.id,
            email: data.user.email,
            role: role as 'admin' | 'lecturer' | 'student',
            first_name: data.user.first_name,
            last_name: data.user.last_name,
            username: data.user.username,
          }
          setUser(userData)
          localStorage.setItem('auth_user', JSON.stringify(userData))
          localStorage.setItem('auth_token', data.token)
          return { success: true }
        } else {
          return { success: false, error: data.message }
        }
      }

      // Fallback to demo authentication if API not available
      const demoUsers = {
        admin: { email: 'admin', password: 'admin', name: 'Administrator', id: '1' },
        lecturer: { email: 'lecturer@bazeuniversity.edu.ng', password: 'password', name: 'Dr. Smith', id: '2' },
        student: { email: 'student@bazeuniversity.edu.ng', password: 'password', name: 'John Doe', id: '3' }
      }

      const demoUser = demoUsers[role as keyof typeof demoUsers]
      
      if (demoUser && (email === demoUser.email) && (password === demoUser.password)) {
        const userData = {
          id: demoUser.id,
          email: demoUser.email,
          role: role as 'admin' | 'lecturer' | 'student',
          first_name: demoUser.name.split(' ')[0],
          last_name: demoUser.name.split(' ')[1] || '',
          username: demoUser.name,
        }
        setUser(userData)
        localStorage.setItem('auth_user', JSON.stringify(userData))
        localStorage.setItem('auth_token', 'demo-token')
        return { success: true }
      }
      
      return { success: false, error: 'Invalid credentials' }
    } catch (error) {
      return { success: false, error: 'Invalid credentials' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setUser(null)
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}