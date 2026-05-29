import { createContext, useContext, useEffect, useState } from 'react'
import authApi from '../api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser]       = useState(null)
    const [loading, setLoading] = useState(true)  // true khi đang check token lúc load app

    // Khi app khởi động — check xem có token cũ không
    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            authApi.getMe()
                .then(res => setUser(res.data.data))
                .catch(() => {
                    localStorage.removeItem('accessToken')
                    localStorage.removeItem('refreshToken')
                })
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [])

    const login = async (email, password) => {
        const res = await authApi.login({ email, password })
        const { accessToken, refreshToken, user: userData } = res.data.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        setUser(userData)
        return userData
    }

    const register = async (username, email, password) => {
        const res = await authApi.register({ username, email, password })
        const { accessToken, refreshToken, user: userData } = res.data.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        setUser(userData)
        return userData
    }

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) await authApi.logout(refreshToken)
        } finally {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth phải dùng trong AuthProvider')
    return ctx
}