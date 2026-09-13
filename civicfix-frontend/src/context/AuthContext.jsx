import { useState, useCallback } from 'react'
import { authService } from '../services/authService.js'
import { AuthContext } from './auth-context-def.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser())
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    try {
      const loggedInUser = await authService.login(email, password)
      setUser(loggedInUser)
      return loggedInUser
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (userData) => {
    setIsLoading(true)
    try {
      const newUser = await authService.register(userData)
      setUser(newUser)
      return newUser
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (updates) => {
    if (!user) return
    setIsLoading(true)
    try {
      const updated = await authService.updateProfile(user.id, updates)
      setUser((prev) => ({ ...prev, ...updates }))
      return updated
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

