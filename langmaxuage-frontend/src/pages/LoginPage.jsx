import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const GOOGLE_CLIENT_ID = '639866900116-i9tqjkufihom92vkqbhifvi9vj0lgsri.apps.googleusercontent.com'
const OTP_TTL_SECONDS = 5 * 60  // 5 phút

// Các màn hình:
//   tab chính : 'login' | 'register'
//   register  : regStep 1 (form) → regStep 2 (OTP)
//   quên mk   : 'forgot-email' → 'forgot-otp' → 'forgot-newpw' → 'forgot-done'
export default function LoginPage() {
    const { t } = useLanguage()
    const [tab, setTab] = useState('login')    // 'login' | 'register'
    const [regStep, setRegStep] = useState(1)          // 1 = form info, 2 = OTP
    const [screen, setScreen] = useState('main')     // 'main' | 'forgot-email' | 'forgot-otp' | 'forgot-newpw' | 'forgot-done'

    // ── Form fields chung ─────────────────────────────────────────────────────
    const [form, setForm] = useState({ username: '', email: '', password: '' })

    // Quên mật khẩu
    const [forgotEmail, setForgotEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [showNewPw, setShowNewPw] = useState(false)

    // OTP (dùng chung cho cả đăng ký và quên MK)
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [showPw, setShowPw] = useState(false)
    const [otpMode, setOtpMode] = useState('register') // 'register' | 'forgot'

    // UI state
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [gLoading, setGLoading] = useState(false)
    const [countdown, setCountdown] = useState(0)

    const { login, loginWithGoogle, sendOtp, verifyAndRegister, forgotPassword, resetPassword } = useAuth()
    const navigate = useNavigate()
    const otpRefs = useRef([])

    // ── Countdown timer ───────────────────────────────────────────────────────
    useEffect(() => {
        if (countdown <= 0) return
        const t = setInterval(() => setCountdown(c => c - 1), 1000)
        return () => clearInterval(t)
    }, [countdown])

    const fmtCountdown = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

    // ── Google OAuth ──────────────────────────────────────────────────────────
    useEffect(() => {
        const id = 'google-gsi-script'
        if (!document.getElementById(id)) {
            const s = document.createElement('script')
            s.id = id; s.src = 'https://accounts.google.com/gsi/client'
            s.async = true; s.defer = true
            document.body.appendChild(s)
        }
    }, [])

    const handleGoogleCallback = useCallback(async (response) => {
        setGLoading(true); setError('')
        try {
            await loginWithGoogle(response.credential)
            navigate('/home')
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'))
        } finally {
            setGLoading(false)
        }
    }, [loginWithGoogle, navigate, t])

    useEffect(() => {
        const init = () => {
            if (!window.google) return
            window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCallback })
        }
        init(); const t = setTimeout(init, 1000); return () => clearTimeout(t)
    }, [handleGoogleCallback])

    const handleGoogleClick = () => {
        if (!window.google) { setError('Google SDK client not loaded yet.'); return }
        window.google.accounts.id.prompt()
    }

    // ── Login submit ──────────────────────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault(); setError(''); setLoading(true)
        try {
            await login(form.email, form.password)
            navigate('/home')
        } catch (err) {
            setError(err.response?.data?.message || t('login.wrong_credentials'))
        } finally {
            setLoading(false)
        }
    }

    // ── Register step 1: Gửi OTP ─────────────────────────────────────────────
    const handleSendOtp = async (e) => {
        e.preventDefault(); setError(''); setLoading(true)
        try {
            await sendOtp(form.username, form.email, form.password)
            setOtpMode('register')
            setRegStep(2)
            setCountdown(OTP_TTL_SECONDS)
            setOtp(['', '', '', '', '', ''])
            setTimeout(() => otpRefs.current[0]?.focus(), 100)
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'))
        } finally {
            setLoading(false)
        }
    }

    // ── Register step 2: Xác nhận OTP ────────────────────────────────────────
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

    const handleResendRegOtp = async () => {
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

    // ── Forgot password: bước 1 — gửi OTP ───────────────────────────────────
    const handleForgotSendOtp = async (e) => {
        e.preventDefault(); setError(''); setLoading(true)
        try {
            await forgotPassword(forgotEmail)
            setOtpMode('forgot')
            setOtp(['', '', '', '', '', ''])
            setCountdown(OTP_TTL_SECONDS)
            setScreen('forgot-otp')
            setTimeout(() => otpRefs.current[0]?.focus(), 100)
        } catch (err) {
            setError(err.response?.data?.message || t('login.email_not_found'))
        } finally {
            setLoading(false)
        }
    }

    const handleResendForgotOtp = async () => {
        if (countdown > 0) return
        setError(''); setLoading(true)
        try {
            await forgotPassword(forgotEmail)
            setCountdown(OTP_TTL_SECONDS)
            setOtp(['', '', '', '', '', ''])
            otpRefs.current[0]?.focus()
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'))
        } finally {
            setLoading(false)
        }
    }

    // ── Forgot password: bước 2 — xác nhận OTP → chuyển sang nhập mật khẩu ──
    const handleForgotVerifyOtp = (e) => {
        e.preventDefault(); setError('')
        if (otp.join('').length < 6) { setError('OTP must be 6 digits.'); return }
        setScreen('forgot-newpw')
    }

    // ── Forgot password: bước 3 — đặt mật khẩu mới ───────────────────────────
    const handleResetPassword = async (e) => {
        e.preventDefault(); setError(''); setLoading(true)
        try {
            await resetPassword(forgotEmail, otp.join(''), newPassword)
            setScreen('forgot-done')
        } catch (err) {
            setError(err.response?.data?.message || t('register.otp_invalid'))
        } finally {
            setLoading(false)
        }
    }

    // ── OTP input handlers ────────────────────────────────────────────────────
    const handleOtpChange = (index, value) => {
        if (!/^\d?$/.test(value)) return
        const next = [...otp]
        next[index] = value
        setOtp(next)
        if (value && index < 5) otpRefs.current[index + 1]?.focus()
    }

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }
    }

    const handleOtpPaste = (e) => {
        e.preventDefault()
        const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        const next = [...otp]
        digits.split('').forEach((d, i) => { next[i] = d })
        setOtp(next)
        otpRefs.current[Math.min(digits.length, 5)]?.focus()
    }

    // ── Tab switch ────────────────────────────────────────────────────────────
    const switchTab = (t) => {
        setTab(t); setError(''); setRegStep(1)
        setForm({ username: '', email: '', password: '' })
        setOtp(['', '', '', '', '', ''])
        setScreen('main')
    }

    // ── Đi đến màn quên mật khẩu ─────────────────────────────────────────────
    const goToForgot = () => {
        setScreen('forgot-email'); setError('')
        setForgotEmail('')
    }

    // ── Quay về login chính ───────────────────────────────────────────────────
    const goToMain = () => {
        setScreen('main'); setTab('login'); setError('')
        setForm({ username: '', email: '', password: '' })
        setForgotEmail(''); setNewPassword('')
        setOtp(['', '', '', '', '', ''])
        setRegStep(1)
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="bg-pattern font-body text-on-surface min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-lg">

                {/* Brand */}
                <div className="text-center mb-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-container rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center mb-6 -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <span className="material-symbols-outlined text-white"
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

                    {/* Tab toggle — chỉ hiện khi đang ở màn 'main' */}
                    {screen === 'main' && (
                        <div className="flex items-center justify-center mb-8 p-1 bg-surface-container-low rounded-full w-fit mx-auto">
                            {['login', 'register'].map(tCode => (
                                <button key={tCode} onClick={() => switchTab(tCode)}
                                    className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
                                            ${tab === tCode
                                            ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                                            : 'text-on-surface-variant hover:text-primary'
                                        }`}>
                                    {tCode === 'login' ? t('login.login_btn') : t('register.register_btn')}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-error text-sm font-semibold mb-5 p-3 bg-error-container rounded-DEFAULT">
                            <span className="material-symbols-outlined text-base">error</span>
                            {error}
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        TAB ĐĂNG NHẬP
                    ══════════════════════════════════════════════════════ */}
                    {screen === 'main' && tab === 'login' && (
                        <>
                            <form onSubmit={handleLogin} className="space-y-5">
                                <InputField id="login-email" icon="mail" label={t('common.email')} type="email" placeholder="you@example.com"
                                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                <PasswordField id="login-password" label={t('common.password')} value={form.password} showPw={showPw}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    onToggle={() => setShowPw(v => !v)} />

                                {/* Quên mật khẩu link */}
                                <div className="text-right -mt-2">
                                    <button type="button" onClick={goToForgot}
                                        className="text-sm text-primary font-semibold hover:underline transition-colors">
                                        {t('login.forgot_pwd')}
                                    </button>
                                </div>
                                <SubmitButton loading={loading} label={t('login.login_btn')} loadingLabel={t('login.logging_in')} />
                            </form>
                            <div className="flex items-center gap-10 mb-5 mt-5">
                                <div className="flex-1 h-px bg-outline-variant/30" />
                                <span className="text-xs text-on-surface-variant font-medium">{t('common.or')}</span>
                                <div className="flex-1 h-px bg-outline-variant/30" />
                            </div>
                            <button id="btn-google-login" type="button" onClick={handleGoogleClick}
                                disabled={gLoading}
                                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 mb-5
                                               bg-white border border-outline-variant/30 rounded-DEFAULT
                                               text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md
                                               hover:border-outline-variant/60 transition-all duration-200
                                               active:scale-[0.98] disabled:opacity-60">
                                {gLoading
                                    ? <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                    : <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                }
                                {gLoading ? t('login.authenticating') : t('login.google_btn')}
                            </button>
                        </>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        TAB ĐĂNG KÝ — Bước 1: Điền thông tin
                    ══════════════════════════════════════════════════════ */}
                    {screen === 'main' && tab === 'register' && regStep === 1 && (
                        <form onSubmit={handleSendOtp} className="space-y-5">
                            <InputField id="reg-username" icon="person" label={t('common.username')} type="text"
                                placeholder="TheFluidScholar"
                                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                            <InputField id="reg-email" icon="mail" label={t('common.email')} type="email"
                                placeholder="you@example.com"
                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            <PasswordField id="reg-password" label={t('register.password_label')}
                                value={form.password} showPw={showPw}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                onToggle={() => setShowPw(v => !v)} />
                            <SubmitButton loading={loading} label={t('register.send_otp')} loadingLabel={t('register.sending_otp')} icon="send" />
                        </form>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        TAB ĐĂNG KÝ — Bước 2: Nhập OTP
                    ══════════════════════════════════════════════════════ */}
                    {screen === 'main' && tab === 'register' && regStep === 2 && (
                        <form onSubmit={handleVerifyOtp}>
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-primary text-3xl"
                                        style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
                                </div>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    {t('register.step_2')}<br />
                                    <strong className="text-on-surface">{form.email}</strong>
                                </p>
                            </div>

                            <OtpBoxes otp={otp} otpRefs={otpRefs}
                                prefix="reg"
                                onChange={handleOtpChange}
                                onKeyDown={handleOtpKeyDown}
                                onPaste={handleOtpPaste} />

                            <ResendCountdown countdown={countdown} loading={loading}
                                fmtCountdown={fmtCountdown} onResend={handleResendRegOtp} />

                            <SubmitButton
                                loading={loading}
                                disabled={otp.join('').length < 6}
                                label={t('register.confirm_and_create')}
                                loadingLabel={t('register.verifying')}
                                icon="verified_user"
                            />

                            <button type="button" onClick={() => { setRegStep(1); setError('') }}
                                className="w-full mt-3 text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
                                {t('register.back_to_edit')}
                            </button>
                        </form>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        QUÊN MẬT KHẨU — Bước 1: Nhập email
                    ══════════════════════════════════════════════════════ */}
                    {screen === 'forgot-email' && (
                        <div>
                            <button type="button" onClick={goToMain}
                                className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary mb-6 transition-colors font-medium">
                                <span className="material-symbols-outlined text-base">arrow_back</span>
                                {t('login.back_to_login')}
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-primary text-3xl"
                                        style={{ fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
                                </div>
                                <h2 className="font-headline text-xl font-bold text-on-surface mb-1">{t('login.forgot_email_title')}</h2>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    {t('login.forgot_email_desc')}
                                </p>
                            </div>

                            <form onSubmit={handleForgotSendOtp} className="space-y-5">
                                <InputField id="forgot-email" icon="mail" label={t('common.email')} type="email"
                                    placeholder="you@example.com"
                                    value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                                <SubmitButton loading={loading} label={t('register.send_otp')} loadingLabel={t('register.sending_otp')} icon="send" />
                            </form>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        QUÊN MẬT KHẨU — Bước 2: Nhập OTP
                    ══════════════════════════════════════════════════════ */}
                    {screen === 'forgot-otp' && (
                        <form onSubmit={handleForgotVerifyOtp}>
                            <button type="button" onClick={() => { setScreen('forgot-email'); setError('') }}
                                className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary mb-6 transition-colors font-medium">
                                <span className="material-symbols-outlined text-base">arrow_back</span>
                                {t('login.change_email')}
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-primary text-3xl"
                                        style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
                                </div>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    {t('login.forgot_otp_desc')}<br />
                                    <strong className="text-on-surface">{forgotEmail}</strong>
                                </p>
                            </div>

                            <OtpBoxes otp={otp} otpRefs={otpRefs}
                                prefix="forgot"
                                onChange={handleOtpChange}
                                onKeyDown={handleOtpKeyDown}
                                onPaste={handleOtpPaste} />

                            <ResendCountdown countdown={countdown} loading={loading}
                                fmtCountdown={fmtCountdown} onResend={handleResendForgotOtp} />

                            <SubmitButton
                                loading={loading}
                                disabled={otp.join('').length < 6}
                                label={t('login.confirm_otp')}
                                loadingLabel={t('register.verifying')}
                                icon="verified_user"
                            />
                        </form>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        QUÊN MẬT KHẨU — Bước 3: Mật khẩu mới
                    ══════════════════════════════════════════════════════ */}
                    {screen === 'forgot-newpw' && (
                        <form onSubmit={handleResetPassword}>
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-primary text-3xl"
                                        style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
                                </div>
                                <h2 className="font-headline text-xl font-bold text-on-surface mb-1">{t('login.forgot_newpw_title')}</h2>
                                <p className="text-sm text-on-surface-variant">
                                    {t('login.forgot_newpw_desc')} <strong className="text-on-surface">{forgotEmail}</strong>
                                </p>
                            </div>

                            <div className="space-y-5">
                                <PasswordField
                                    id="reset-newpw"
                                    label={t('login.new_password_label')}
                                    value={newPassword}
                                    showPw={showNewPw}
                                    onChange={e => setNewPassword(e.target.value)}
                                    onToggle={() => setShowNewPw(v => !v)}
                                />
                                <SubmitButton loading={loading} label={t('login.reset_password_btn')} loadingLabel={t('login.processing')} icon="lock_reset" />
                            </div>
                        </form>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        QUÊN MẬT KHẨU — Thành công
                    ══════════════════════════════════════════════════════ */}
                    {screen === 'forgot-done' && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                <span className="material-symbols-outlined text-green-600 text-4xl"
                                    style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            </div>
                            <h2 className="font-headline text-xl font-bold text-on-surface mb-2">{t('login.forgot_done_title')}</h2>
                            <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
                                {t('login.forgot_done_desc')}
                            </p>
                            <button type="button" onClick={goToMain}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-container
                                               text-on-primary font-bold py-4 rounded-DEFAULT shadow-xl shadow-primary/30
                                               hover:shadow-primary/40 transition-all duration-300 active:scale-[0.98]">
                                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
                                {t('login.back_to_login_btn')}
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center mt-8 text-on-surface-variant text-xs font-medium px-4 leading-relaxed">
                    By continuing, you agree to our{' '}
                    <span className="text-primary font-bold">Terms of Sanctuary</span>
                </p>
            </div>
        </div>
    )
}

// ── Reusable sub-components ───────────────────────────────────────────────────

function OtpBoxes({ otp, otpRefs, prefix, onChange, onKeyDown, onPaste }) {
    return (
        <div className="flex justify-center gap-3 mb-6" onPaste={onPaste}>
            {otp.map((digit, i) => (
                <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    id={`${prefix}-otp-digit-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => onChange(i, e.target.value)}
                    onKeyDown={e => onKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 outline-none
                               transition-all duration-200 bg-surface-container-lowest
                               ${digit
                            ? 'border-primary text-primary shadow-sm shadow-primary/20'
                            : 'border-outline-variant/30 text-on-surface'
                        }
                               focus:border-primary focus:shadow-sm focus:shadow-primary/20`}
                />
            ))}
        </div>
    )
}

function ResendCountdown({ countdown, loading, fmtCountdown, onResend }) {
    const { t } = useLanguage()
    return (
        <div className="text-center mb-6">
            {countdown > 0 ? (
                <p className="text-sm text-on-surface-variant">
                    {t('register.otp_expired_after')}{' '}
                    <span className="font-bold text-primary tabular-nums">{fmtCountdown(countdown)}</span>
                </p>
            ) : (
                <p className="text-sm text-on-surface-variant">
                    {t('register.no_otp_received')}{' '}
                    <button type="button" onClick={onResend}
                        disabled={loading}
                        className="text-primary font-bold hover:underline disabled:opacity-50">
                        {t('register.resend')}
                    </button>
                </p>
            )}
        </div>
    )
}

function InputField({ id, icon, label, type, placeholder, value, onChange }) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant ml-1">{label}</label>
            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">{icon}</span>
                <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border border-outline-variant/20
                                  rounded-DEFAULT focus:ring-2 focus:ring-primary focus:border-transparent
                                  outline-none transition-all placeholder:text-outline" />
            </div>
        </div>
    )
}

function PasswordField({ id, label = 'Mật khẩu', value, showPw, onChange, onToggle }) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant ml-1">{label}</label>
            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input id={id} type={showPw ? 'text' : 'password'} value={value} onChange={onChange}
                    placeholder="••••••••" required minLength={6}
                    className="w-full pl-12 pr-12 py-4 bg-surface-container-lowest border border-outline-variant/20
                                  rounded-DEFAULT focus:ring-2 focus:ring-primary focus:border-transparent
                                  outline-none transition-all placeholder:text-outline" />
                <button type="button" onClick={onToggle}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-outline transition-colors">
                    <span className="material-symbols-outlined">{showPw ? 'visibility_off' : 'visibility'}</span>
                </button>
            </div>
        </div>
    )
}

function SubmitButton({ loading, disabled, label, loadingLabel, icon }) {
    return (
        <button type="submit" disabled={loading || disabled}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-container
                           text-on-primary font-bold py-4 rounded-DEFAULT shadow-xl shadow-primary/30
                           hover:shadow-primary/40 transition-all duration-300 active:scale-[0.98]
                           mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading
                ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                : icon && <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            }
            {loading ? loadingLabel : label}
        </button>
    )
}