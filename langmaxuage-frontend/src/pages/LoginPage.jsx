import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const GOOGLE_CLIENT_ID = '639866900116-i9tqjkufihom92vkqbhifvi9vj0lgsri.apps.googleusercontent.com'
const OTP_TTL_SECONDS = 5 * 60  // 5 phút

export default function LoginPage() {
    const { t } = useLanguage()
    const [tab, setTab] = useState('login')    // 'login' | 'register'
    const [regStep, setRegStep] = useState(1)          // 1 = form info, 2 = OTP
    const [screen, setScreen] = useState('main')     // 'main' | 'forgot-email' | 'forgot-otp' | 'forgot-newpw' | 'forgot-done'

    // Form fields chung
    const [form, setForm] = useState({ username: '', email: '', password: '' })

    // Quên mật khẩu
    const [forgotEmail, setForgotEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [showNewPw, setShowNewPw] = useState(false)

    // OTP
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

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) return
        const t = setInterval(() => setCountdown(c => c - 1), 1000)
        return () => clearInterval(t)
    }, [countdown])

    const fmtCountdown = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

    // Google OAuth
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
            const userData = await loginWithGoogle(response.credential)
            if (userData?.onboarded) {
                navigate('/home')
            } else {
                navigate('/onboarding')
            }
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
            
            const btnEl = document.getElementById('google-signin-btn')
            if (btnEl) {
                btnEl.innerHTML = ''
                window.google.accounts.id.renderButton(btnEl, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    text: 'signin_with',
                    shape: 'pill',
                    width: btnEl.clientWidth || 360,
                })
            }
        }
        init(); const t = setTimeout(init, 1000); return () => clearTimeout(t)
    }, [handleGoogleCallback, tab, screen])

    // Login submit
    const handleLogin = async (e) => {
        e.preventDefault(); setError(''); setLoading(true)
        try {
            const userData = await login(form.email, form.password)
            if (userData?.onboarded) {
                navigate('/home')
            } else {
                navigate('/onboarding')
            }
        } catch (err) {
            setError(err.response?.data?.message || t('login.wrong_credentials'))
        } finally {
            setLoading(false)
        }
    }

    // Register step 1: Gửi OTP
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

    // Register step 2: Xác nhận OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault(); setError(''); setLoading(true)
        try {
            const userData = await verifyAndRegister(form.email, otp.join(''))
            if (userData?.onboarded) {
                navigate('/home')
            } else {
                navigate('/onboarding')
            }
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

    // Forgot password: bước 1 — gửi OTP
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

    // Forgot password: bước 2 — xác nhận OTP
    const handleForgotVerifyOtp = (e) => {
        e.preventDefault(); setError('')
        if (otp.join('').length < 6) { setError('OTP must be 6 digits.'); return }
        setScreen('forgot-newpw')
    }

    // Forgot password: bước 3 — đặt mật khẩu mới
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

    // OTP input handlers
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

    const switchTab = (t) => {
        setTab(t); setError(''); setRegStep(1)
        setForm({ username: '', email: '', password: '' })
        setOtp(['', '', '', '', '', ''])
        setScreen('main')
    }

    const goToForgot = () => {
        setScreen('forgot-email'); setError('')
        setForgotEmail('')
    }

    const goToMain = () => {
        setScreen('main'); setTab('login'); setError('')
        setForm({ username: '', email: '', password: '' })
        setForgotEmail(''); setNewPassword('')
        setOtp(['', '', '', '', '', ''])
        setRegStep(1)
    }

    return (
        <div className="bg-pattern font-body text-on-surface min-h-[100dvh] flex items-center justify-center p-6">
            <div className="w-full max-w-lg">

                {/* Brand Logo */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary rounded-2xl shadow-md shadow-primary/20 flex items-center justify-center mb-4 transition-transform duration-300 hover:rotate-3">
                        <span className="material-symbols-outlined text-white text-3xl">
                            auto_stories
                        </span>
                    </div>
                    <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-1">
                        LangMaxuage
                    </h1>
                    <p className="text-on-surface-variant text-sm font-semibold">
                        Your adaptive path to multilingual mastery.
                    </p>
                </div>

                {/* Glassmorphic Card Container */}
                <div className="glass-effect rounded-[2.5rem] shadow-xl p-8 md:p-10 border border-outline-variant/30 relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

                    {/* Capsule Segmented Tab selection */}
                    {screen === 'main' && (
                        <div className="flex bg-surface-container p-1 rounded-2xl mb-8 w-fit mx-auto shadow-sm">
                            {['login', 'register'].map(tCode => (
                                <button key={tCode} onClick={() => switchTab(tCode)}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap active:scale-95
                                            ${tab === tCode
                                            ? 'bg-surface-container-lowest text-primary shadow-sm'
                                            : 'text-on-surface-variant hover:text-on-surface'
                                        }`}>
                                    {tCode === 'login' ? t('login.login_btn') : t('register.register_btn')}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Error Banner */}
                    {error && (
                        <div className="flex items-center gap-2 text-error text-xs font-bold mb-6 p-3 bg-error-container/20 border border-error/10 rounded-xl">
                            <span className="material-symbols-outlined text-base">error</span>
                            {error}
                        </div>
                    )}

                    {/* ── Login Section ── */}
                    {screen === 'main' && tab === 'login' && (
                        <>
                            <form onSubmit={handleLogin} className="space-y-6">
                                <InputField id="login-email" icon="mail" label={t('common.email')} type="email" placeholder="you@example.com"
                                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                <PasswordField id="login-password" label={t('common.password')} value={form.password} showPw={showPw}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    onToggle={() => setShowPw(v => !v)} />

                                <div className="text-right -mt-2">
                                    <button type="button" onClick={goToForgot}
                                        className="text-xs text-primary font-bold hover:underline transition-colors active:scale-95">
                                        {t('login.forgot_pwd')}
                                    </button>
                                </div>
                                <SubmitButton loading={loading} label={t('login.login_btn')} loadingLabel={t('login.logging_in')} />
                            </form>

                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px bg-outline-variant/30" />
                                <span className="text-[10px] text-outline font-bold uppercase tracking-wider">{t('common.or')}</span>
                                <div className="flex-1 h-px bg-outline-variant/30" />
                            </div>

                            <div className="w-full flex justify-center">
                                <div id="google-signin-btn" className="w-full min-h-[44px]"></div>
                            </div>
                        </>
                    )}

                    {/* ── Register Step 1: Info input ── */}
                    {screen === 'main' && tab === 'register' && regStep === 1 && (
                        <form onSubmit={handleSendOtp} className="space-y-6">
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

                    {/* ── Register Step 2: OTP Verification ── */}
                    {screen === 'main' && tab === 'register' && regStep === 2 && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="font-headline text-lg font-bold text-on-surface mb-2">{t('register.verify_email')}</h2>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    {t('register.step_2')} <strong className="text-primary">{form.email}</strong>
                                </p>
                            </div>

                            <OtpBoxes otp={otp} otpRefs={otpRefs} prefix="reg" onChange={handleOtpChange} onKeyDown={handleOtpKeyDown} onPaste={handleOtpPaste} />
                            <ResendCountdown countdown={countdown} loading={loading} fmtCountdown={fmtCountdown} onResend={handleResendRegOtp} />

                            <div className="flex gap-4">
                                <button type="button" onClick={() => setRegStep(1)}
                                    className="flex-1 py-4 border border-outline-variant/40 rounded-2xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors active:scale-95">
                                    {t('common.back')}
                                </button>
                                <button type="submit" disabled={loading || otp.join('').length < 6}
                                    className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-container shadow-md shadow-primary/10 transition-all active:scale-95 disabled:opacity-50">
                                    {t('login.confirm_otp')}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Forgot Password Step 1: Input Email ── */}
                    {screen === 'forgot-email' && (
                        <form onSubmit={handleForgotSendOtp} className="space-y-6">
                            <div className="mb-4">
                                <h2 className="font-headline text-lg font-bold text-on-surface mb-2">{t('login.forgot_email_title')}</h2>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    {t('login.forgot_email_desc')}
                                </p>
                            </div>

                            <InputField id="forgot-email" icon="mail" label={t('common.email')} type="email" placeholder="you@example.com"
                                value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />

                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={goToMain}
                                    className="flex-1 py-4 border border-outline-variant/40 rounded-2xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors active:scale-95">
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" disabled={loading || !forgotEmail.trim()}
                                    className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-container shadow-md shadow-primary/10 transition-all active:scale-95 disabled:opacity-50">
                                    {t('register.send_otp')}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Forgot Password Step 2: Verification OTP ── */}
                    {screen === 'forgot-otp' && (
                        <form onSubmit={handleForgotVerifyOtp} className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="font-headline text-lg font-bold text-on-surface mb-2">{t('login.forgot_otp_title')}</h2>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    {t('login.forgot_otp_desc')} <strong className="text-primary">{forgotEmail}</strong>
                                </p>
                            </div>

                            <OtpBoxes otp={otp} otpRefs={otpRefs} prefix="forgot" onChange={handleOtpChange} onKeyDown={handleOtpKeyDown} onPaste={handleOtpPaste} />
                            <ResendCountdown countdown={countdown} loading={loading} fmtCountdown={fmtCountdown} onResend={handleResendForgotOtp} />

                            <div className="flex gap-4">
                                <button type="button" onClick={() => setScreen('forgot-email')}
                                    className="flex-1 py-4 border border-outline-variant/40 rounded-2xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors active:scale-95">
                                    {t('common.back')}
                                </button>
                                <button type="submit" disabled={otp.join('').length < 6}
                                    className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-container shadow-md shadow-primary/10 transition-all active:scale-95 disabled:opacity-50">
                                    {t('login.confirm_otp')}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Forgot Password Step 3: Enter New Password ── */}
                    {screen === 'forgot-newpw' && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="mb-4">
                                <h2 className="font-headline text-lg font-bold text-on-surface mb-2">{t('login.forgot_newpw_title')}</h2>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    {t('login.forgot_newpw_desc')} <strong className="text-primary">{forgotEmail}</strong>
                                </p>
                            </div>

                            <PasswordField id="new-password" label={t('login.new_password_label')} value={newPassword} showPw={showNewPw}
                                onChange={e => setNewPassword(e.target.value)}
                                onToggle={() => setShowNewPw(v => !v)} />

                            <SubmitButton loading={loading} label={t('login.reset_password_btn')} loadingLabel={t('login.processing')} />
                        </form>
                    )}

                    {/* ── Forgot Password Step 4: Done Success ── */}
                    {screen === 'forgot-done' && (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-sm">
                                <span className="material-symbols-outlined text-4xl">check_circle</span>
                            </div>
                            <h2 className="font-headline text-xl font-bold text-on-surface mb-2">{t('login.forgot_done_title')}</h2>
                            <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
                                {t('login.forgot_done_desc')}
                            </p>
                            <button type="button" onClick={goToMain}
                                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/10 hover:bg-primary-container transition-all active:scale-[0.98]">
                                <span className="material-symbols-outlined text-xl">login</span>
                                {t('login.back_to_login_btn')}
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center mt-8 text-on-surface-variant text-xs font-semibold px-4 leading-relaxed">
                    By continuing, you agree to our{' '}
                    <span className="text-primary font-bold">Terms of Service</span>
                </p>
            </div>
        </div>
    )
}

// ── Reusable sub-components ──

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
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-2xl border-2 outline-none
                               transition-all duration-200 bg-surface-container-lowest
                               ${digit
                            ? 'border-primary text-primary shadow-sm shadow-primary/5'
                            : 'border-outline-variant/30 text-on-surface'
                        }
                               focus:border-primary focus:ring-2 focus:ring-primary/10`}
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
                <p className="text-sm text-on-surface-variant font-medium">
                    {t('register.otp_expired_after')}{' '}
                    <span className="font-bold text-primary tabular-nums">{fmtCountdown(countdown)}</span>
                </p>
            ) : (
                <p className="text-sm text-on-surface-variant font-medium">
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
            <label className="block text-xs font-bold text-on-surface ml-1">{label}</label>
            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">{icon}</span>
                <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant/30
                                  rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary
                                  outline-none transition-all placeholder:text-outline font-semibold" />
            </div>
        </div>
    )
}

function PasswordField({ id, label = 'Mật khẩu', value, showPw, onChange, onToggle }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-bold text-on-surface ml-1">{label}</label>
            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input id={id} type={showPw ? 'text' : 'password'} value={value} onChange={onChange}
                    placeholder="••••••••" required minLength={6}
                    className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low border border-outline-variant/30
                                  rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary
                                  outline-none transition-all placeholder:text-outline font-semibold" />
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
            className="w-full flex items-center justify-center gap-2 bg-primary
                           text-white font-bold py-4 rounded-2xl shadow-md shadow-primary/10
                           hover:bg-primary-container transition-all active:scale-[0.98]
                           mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading
                ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                : icon && <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            }
            {loading ? loadingLabel : label}
        </button>
    )
}