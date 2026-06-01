import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) return <LoadingSpinner />
    if (!user)   return <Navigate to="/login" replace />

    // Bắt buộc thực hiện onboarding nếu chưa làm
    if (!user.onboarded && window.location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />
    }

    // Tránh quay lại trang onboarding khi đã làm rồi
    if (user.onboarded && window.location.pathname === '/onboarding') {
        return <Navigate to="/home" replace />
    }

    return children
}