import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

const OTP_TTL_SECONDS = 5 * 60

export default function RegisterPage() {
    const { t }                 = useLanguage()
    const [step, setStep]       = useState(1)  // 1 = form info, 2 = OTP input
    const [form, setForm]       = useState({ username: '', email: '', password: '' })
    const [otp,  setOtp]        = useState(['', '', '', '', '', ''])
    const [error, setError]     = useState('')
    const [loading, setLoading] = useState(false)
    const [showPw, setShowPw]   = useState(false)
    const [countdown, setCountdown] = useState(0)

    const { sendOtp, verifyAndRegister } = useAuth()
    const navigate = useNavigate()
    const otpRefs  = useRef([])

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) return
        const t = setInterval(() => setCountdown(c => c - 1), 1000)
        return () => clearInterval(t)
    }, [countdown])

    const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

    // Bước 1: Gửi OTP
    const handleSendOtp = async (e) => {
        e.preventDefault(); setError(''); setLoading(true)
        try {
            await sendOtp(form.username, form.email, form.password)
            setStep(2)
            setCountdown(OTP_TTL_SECONDS)
            setTimeout(() => otpRefs.current[0]?.focus(), 100)
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'))
        } finally {
            setLoading(false)
        }
    }

    // Bước 2: Xác nhận OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault(); setError(''); setLoading(true)
        try {
            await verifyAndRegister(form.email, otp.join(''))
            navigate('/home')
        } catch (err) {
            setError(err.response?.data?.message || t('register.otp_invalid'))
        } finally {
            setLoading(false)
        }
    }

    // OTP input handling
    const handleOtpChange = (index, value) => {
        if (!/^\d?$/.test(value)) return
        const next = [...otp]; next[index] = value; setOtp(next)
        if (value && index < 5) otpRefs.current[index + 1]?.focus()
    }
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus()
    }
    const handleOtpPaste = (e) => {
        e.preventDefault()
        const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        const next = [...otp]
        digits.split('').forEach((d, i) => { next[i] = d }); setOtp(next)
        otpRefs.current[Math.min(digits.length, 5)]?.focus()
    }

    const handleResend = async () => {
        if (countdown > 0) return
        setError(''); setLoading(true)
        try {
            await sendOtp(form.username, form.email, form.password)
            setCountdown(OTP_TTL_SECONDS)
            setOtp(['', '', '', '', '', ''])
            otpRefs.current[0]?.focus()
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md">

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden">
                    {/* Decorative blob */}
                    <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-100 rounded-full opacity-50" />

                    {/* Header */}
                    <div className="text-center mb-8 relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mx-auto mb-4
                                        flex items-center justify-center shadow-lg shadow-blue-200">
                            {step === 1
                                ? <span className="text-white text-2xl">📚</span>
                                : <span className="text-white text-2xl">📧</span>
                            }
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {step === 1 ? t('register.title') : t('register.verify_email')}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {step === 1
                                ? t('register.step_1')
                                : `${t('register.step_2')} ${form.email}`
                            }
                        </p>

                        {/* Step indicator */}
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <div className="w-8 h-1.5 rounded-full bg-blue-500" />
                            <div className={`w-8 h-1.5 rounded-full transition-colors ${step === 2 ? 'bg-blue-500' : 'bg-gray-200'}`} />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-5 border border-red-100">
                            <span className="text-red-500 mt-0.5">⚠️</span>
                            {error}
                        </div>
                    )}

                    {/* ── STEP 1 ── */}
                    {step === 1 && (
                        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('common.username')}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
                                    <input type="text" placeholder="TheFluidScholar"
                                           value={form.username}
                                           onChange={e => setForm({ ...form, username: e.target.value })}
                                           required minLength={3}
                                           className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl
                                                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                                      transition text-sm bg-gray-50" />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('common.email')}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                                    <input type="email" placeholder="you@example.com"
                                           value={form.email}
                                           onChange={e => setForm({ ...form, email: e.target.value })}
                                           required
                                           className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl
                                                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                                      transition text-sm bg-gray-50" />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('common.password')}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                                    <input type={showPw ? 'text' : 'password'}
                                           placeholder={t('register.password_label')}
                                           value={form.password}
                                           onChange={e => setForm({ ...form, password: e.target.value })}
                                           required minLength={6}
                                           className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl
                                                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                                      transition text-sm bg-gray-50" />
                                    <button type="button" onClick={() => setShowPw(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                                        {showPw ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold
                                               py-3.5 rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300
                                               transition-all active:scale-[0.98] disabled:opacity-60 mt-1
                                               flex items-center justify-center gap-2">
                                {loading
                                    ? <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> {t('register.sending_otp')}</>
                                    : <><span>📨</span> {t('register.send_otp')}</>
                                }
                            </button>
                        </form>
                    )}

                    {/* ── STEP 2 ── */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOtp}>
                            {/* OTP boxes */}
                            <div className="flex justify-center gap-3 mb-5" onPaste={handleOtpPaste}>
                                {otp.map((digit, i) => (
                                    <input key={i}
                                           ref={el => otpRefs.current[i] = el}
                                           id={`otp-${i}`}
                                           type="text" inputMode="numeric" maxLength={1}
                                           value={digit}
                                           onChange={e => handleOtpChange(i, e.target.value)}
                                           onKeyDown={e => handleOtpKeyDown(i, e)}
                                           className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2
                                                       outline-none transition-all duration-200
                                                       ${digit
                                                           ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                                           : 'border-gray-200 bg-gray-50 text-gray-800'
                                                       }
                                                       focus:border-blue-500 focus:bg-blue-50`} />
                                ))}
                            </div>

                            {/* Countdown */}
                            <div className="text-center mb-5">
                                {countdown > 0 ? (
                                    <p className="text-sm text-gray-500">
                                        {t('register.otp_expired_after')}{' '}
                                        <span className="font-bold text-blue-600 tabular-nums">{fmtTime(countdown)}</span>
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        {t('register.no_otp_received')}{' '}
                                        <button type="button" onClick={handleResend} disabled={loading}
                                                className="text-blue-600 font-bold hover:underline disabled:opacity-50">
                                            {t('register.resend')}
                                        </button>
                                    </p>
                                )}
                            </div>

                            <button type="submit" disabled={loading || otp.join('').length < 6}
                                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold
                                               py-3.5 rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300
                                               transition-all active:scale-[0.98] disabled:opacity-60
                                               flex items-center justify-center gap-2">
                                {loading
                                    ? <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> {t('register.verifying')}</>
                                    : <><span>✅</span> {t('register.confirm_and_create')}</>
                                }
                            </button>

                            <button type="button" onClick={() => { setStep(1); setError('') }}
                                    className="w-full mt-3 text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium">
                                {t('register.back_to_edit')}
                            </button>
                        </form>
                    )}

                    {/* Footer link */}
                    <p className="text-center text-sm text-gray-400 mt-6">
                        {t('register.has_account')}{' '}
                        <Link to="/login" className="text-blue-600 font-bold hover:underline">{t('register.login_now')}</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}