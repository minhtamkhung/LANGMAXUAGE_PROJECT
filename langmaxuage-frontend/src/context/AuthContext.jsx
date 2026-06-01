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

    const loginWithGoogle = async (idToken) => {
        const res = await authApi.googleLogin(idToken)
        const { accessToken, refreshToken, user: userData } = res.data.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        setUser(userData)
        return userData
    }

    // Bước 1: gửi OTP về email (không lưu state — chỉ gọi API)
    const sendOtp = async (username, email, password) => {
        await authApi.sendOtp({ username, email, password })
    }

    // Bước 2: xác nhận OTP → tạo user → đăng nhập
    const verifyAndRegister = async (email, otp) => {
        const res = await authApi.verifyOtp({ email, otp })
        const { accessToken, refreshToken, user: userData } = res.data.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        setUser(userData)
        return userData
    }

    // ── Quên mật khẩu ────────────────────────────────────────────
    // Bước 1: gửi email → nhận OTP reset password
    const forgotPassword = async (email) => {
        await authApi.forgotPassword(email)
    }

    // Bước 2: xác nhận OTP + đặt mật khẩu mới
    const resetPassword = async (email, otp, newPassword) => {
        await authApi.resetPassword({ email, otp, newPassword })
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

    const updateUser = (userData) => {
        setUser(userData)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, sendOtp, verifyAndRegister, forgotPassword, resetPassword, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth phải dùng trong AuthProvider')
    return ctx
}