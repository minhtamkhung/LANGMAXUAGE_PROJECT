import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RegisterPage() {
    const [form, setForm]       = useState({ username: '', email: '', password: '' })
    const [error, setError]     = useState('')
    const [loading, setLoading] = useState(false)
    const { register }          = useAuth()
    const navigate              = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await register(form.username, form.email, form.password)
            navigate('/home')
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng ký thất bại')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
                <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
                    TOEIC Flashcard
                </h1>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Đăng ký</h2>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={form.username}
                        onChange={e => setForm({ ...form, username: e.target.value })}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Mật khẩu (ít nhất 6 ký tự)"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required minLength={6}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Đã có tài khoản?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    )
}