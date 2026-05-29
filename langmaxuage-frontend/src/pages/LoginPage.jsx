import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
    const [tab, setTab]         = useState('login') // 'login' | 'register'
    const [form, setForm]       = useState({ username: '', email: '', password: '' })
    const [error, setError]     = useState('')
    const [loading, setLoading] = useState(false)
    const [showPw, setShowPw]   = useState(false)
    const { login, register }   = useAuth()
    const navigate              = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            if (tab === 'login') {
                await login(form.email, form.password)
            } else {
                await register(form.username, form.email, form.password)
            }
            navigate('/home')
        } catch (err) {
            setError(err.response?.data?.message || 'Đã có lỗi xảy ra')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-pattern font-body text-on-surface min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-lg">

                {/* Brand */}
                <div className="text-center mb-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-container rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center mb-6 -rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="material-symbols-outlined text-white text-5xl"
                  style={{ fontVariationSettings: "'FILL' 1", fontSize: '2.5rem' }}>
              auto_stories
            </span>
                    </div>
                    <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-2">
                        TOEIC Sanctuary
                    </h1>
                    <p className="text-on-surface-variant font-medium">
                        Your editorial path to English mastery.
                    </p>
                </div>

                {/* Card */}
                <div className="glass-effect rounded-xl shadow-2xl shadow-surface-tint/5 p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-tertiary-fixed rounded-full opacity-30 pointer-events-none" />

                    {/* Tab toggle */}
                    <div className="flex items-center justify-center mb-10 p-1 bg-surface-container-low rounded-full w-fit mx-auto">
                        {['login', 'register'].map(t => (
                            <button key={t} onClick={() => { setTab(t); setError('') }}
                                    className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
                  ${tab === t
                                        ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                                        : 'text-on-surface-variant hover:text-primary'
                                    }`}>
                                {t === 'login' ? 'Login' : 'Register'}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-error text-sm font-semibold mb-6 p-3 bg-error-container rounded-DEFAULT">
                            <span className="material-symbols-outlined text-base">error</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username — only on register */}
                        {tab === 'register' && (
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold font-label text-on-surface-variant ml-1">
                                    Username
                                </label>
                                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                    person
                  </span>
                                    <input
                                        type="text"
                                        value={form.username}
                                        onChange={e => setForm({ ...form, username: e.target.value })}
                                        placeholder="TheFluidScholar"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border border-outline-variant/20 rounded-DEFAULT focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold font-label text-on-surface-variant ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                  mail
                </span>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border border-outline-variant/20 rounded-DEFAULT focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold font-label text-on-surface-variant ml-1">
                                Password
                            </label>
                            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                  lock
                </span>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-12 pr-12 py-4 bg-surface-container-lowest border border-outline-variant/20 rounded-DEFAULT focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline"
                                />
                                <button type="button" onClick={() => setShowPw(v => !v)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-outline transition-colors">
                  <span className="material-symbols-outlined">
                    {showPw ? 'visibility_off' : 'visibility'}
                  </span>
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold py-4 rounded-DEFAULT shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-all duration-300 active:scale-[0.98] mt-4 disabled:opacity-60">
                            {loading ? 'Please wait...' : tab === 'login' ? 'Continue Journey' : 'Join the Sanctuary'}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-on-surface-variant text-xs font-medium px-4 leading-relaxed">
                    By continuing, you agree to our{' '}
                    <span className="text-primary font-bold">Terms of Sanctuary</span>
                </p>
            </div>
        </div>
    )
}