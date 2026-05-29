import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import userApi from '../api/userApi'
import progressApi from '../api/progressApi'
import quizApi from '../api/quizApi'
import { useLanguage } from '../context/LanguageContext'

export default function ProfilePage() {
    const { user, logout }            = useAuth()
    const [stats, setStats]           = useState({ totalReviews: 0, dueCards: 0, quizCount: 0, avgScore: 0 })
    const [progress, setProgress]     = useState([])
    const [editMode, setEditMode]     = useState(false)
    const [form, setForm]             = useState({ username: '', avatarUrl: '' })
    const [pwForm, setPwForm]         = useState({ oldPassword: '', newPassword: '' })
    const [saving, setSaving]         = useState(false)
    const [msg, setMsg]               = useState('')

    // Lấy dữ liệu đa ngôn ngữ từ Context
    const { locale, setLocale, locales } = useLanguage()

    useEffect(() => {
        // Load progress stats
        progressApi.getMyProgress()
            .then(r => {
                const list = r.data.data || []
                setProgress(list)
                const totalReviews = list.reduce((s, p) => s + (p.reviewCount || 0), 0)
                setStats(prev => ({ ...prev, totalReviews }))
            }).catch(() => {})

        progressApi.getDueCards()
            .then(r => setStats(prev => ({ ...prev, dueCards: r.data.data?.length || 0 })))
            .catch(() => {})

        quizApi.history()
            .then(r => {
                const list = r.data.data || []
                const avg  = list.length ? Math.round(list.reduce((s, q) => s + q.score, 0) / list.length) : 0
                setStats(prev => ({ ...prev, quizCount: list.length, avgScore: avg }))
            }).catch(() => {})

        if (user) setForm({ username: user.username || '', avatarUrl: user.avatarUrl || '' })
    }, [user])

    const handleSaveProfile = async () => {
        setSaving(true); setMsg('')
        try {
            await userApi.updateMe({ username: form.username, avatarUrl: form.avatarUrl || null })
            setMsg('Profile updated!')
            setEditMode(false)
        } catch (err) {
            setMsg(err.response?.data?.message || 'Error updating profile')
        } finally { setSaving(false) }
    }

    const handleChangePassword = async () => {
        if (!pwForm.oldPassword || !pwForm.newPassword) return
        setSaving(true); setMsg('')
        try {
            await userApi.changePassword(pwForm.oldPassword, pwForm.newPassword)
            setMsg('Password changed! Please login again.')
            setPwForm({ oldPassword: '', newPassword: '' })
            setTimeout(() => logout(), 2000)
        } catch (err) {
            setMsg(err.response?.data?.message || 'Error changing password')
        } finally { setSaving(false) }
    }

    const mastered  = progress.filter(p => p.status === 'MASTERED').length
    const reviewing = progress.filter(p => p.status === 'REVIEWING').length
    const learning  = progress.filter(p => p.status === 'LEARNING').length
    const total     = progress.length || 1

    const initials = user?.username?.[0]?.toUpperCase() || 'U'

    return (
        <Layout>
            {/* Hero banner */}
            <section className="mb-12">
                <div className="relative w-full h-40 rounded-xl overflow-hidden mb-[-4rem] bg-gradient-to-r from-primary to-primary-container">
                    <div className="absolute inset-0 opacity-10"
                         style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                </div>

                <div className="relative px-8 flex flex-col md:flex-row items-end gap-6">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-xl border-4 border-surface bg-gradient-to-br from-primary to-primary-container shadow-xl flex items-center justify-center">
                            <span className="text-white text-5xl font-extrabold font-headline">{initials}</span>
                        </div>
                    </div>

                    <div className="flex-grow pb-2">
                        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface font-headline">
                            {user?.username}
                        </h1>
                        <p className="text-on-surface-variant font-medium mt-1">{user?.email} • {user?.role}</p>
                    </div>

                    <div className="pb-2">
                        <button onClick={() => { setEditMode(e => !e); setMsg('') }}
                                className="px-6 py-3 bg-primary text-on-primary rounded-full font-headline font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                            <span className="material-symbols-outlined text-sm">
                                {editMode ? 'close' : 'edit'}
                            </span>
                            {editMode ? 'Cancel' : 'Edit Profile'}
                        </button>
                    </div>
                </div>
            </section>

            {msg && (
                <div className={`mb-6 px-4 py-3 rounded-DEFAULT text-sm font-medium ${
                    msg.includes('Error') || msg.includes('error') ? 'bg-error-container text-error' : 'bg-primary-fixed text-primary'
                }`}>
                    {msg}
                </div>
            )}

            {/* Stats bento */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                {[
                    { icon: 'history_edu', iconBg: 'bg-primary-fixed text-primary', label: 'Total Reviews', value: stats.totalReviews, badge: 'All time' },
                    { icon: 'pending_actions', iconBg: 'bg-tertiary-fixed text-tertiary', iconFill: true, label: 'Due Today', value: stats.dueCards, badge: 'SM-2' },
                    { icon: 'quiz', iconBg: 'bg-secondary-container text-secondary', label: 'Quiz Attempts', value: stats.quizCount, badge: 'Total' },
                    { icon: 'analytics', iconBg: 'bg-surface-container-high text-on-surface-variant', label: 'Avg Quiz Score', value: `${stats.avgScore}/100`, badge: 'Average' },
                ].map(({ icon, iconBg, iconFill, label, value, badge }) => (
                    <div key={label} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 flex flex-col justify-between hover:-translate-y-1 transition-transform ease-out-expo duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${iconBg}`}>
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: iconFill ? "'FILL' 1" : "'FILL' 0" }}>
                                    {icon}
                                </span>
                            </div>
                            <span className="text-xs font-bold text-outline px-2 py-1 bg-surface-container rounded-full">{badge}</span>
                        </div>
                        <div>
                            <p className="text-outline text-sm font-medium">{label}</p>
                            <h3 className="text-3xl font-extrabold text-on-surface font-headline mt-1">{value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Flashcard Mastery */}
                <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold font-headline">Flashcard Mastery</h2>
                        <span className="text-sm font-bold text-primary">{progress.length} cards total</span>
                    </div>
                    <div className="space-y-6">
                        {[
                            { label: 'Mastered',  value: mastered,  color: 'from-primary to-primary-container', textColor: 'text-primary' },
                            { label: 'Reviewing', value: reviewing, color: 'from-secondary to-secondary-container', textColor: 'text-secondary' },
                            { label: 'Learning',  value: learning,  color: 'from-tertiary to-tertiary-container', textColor: 'text-tertiary' },
                        ].map(({ label, value, color, textColor }) => (
                            <div key={label}>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-bold text-on-surface">{label}</span>
                                    <span className={`text-sm font-bold ${textColor}`}>{value} cards</span>
                                </div>
                                <div className="w-full h-2.5 bg-surface-variant rounded-full overflow-hidden">
                                    <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`}
                                         style={{ width: `${Math.round((value / total) * 100)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Settings Column */}
                <div className="space-y-6">
                    {/* Edit profile */}
                    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
                        <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">manage_accounts</span>
                            Profile Settings
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-outline uppercase tracking-wider block mb-1">Username</label>
                                <input
                                    value={form.username}
                                    onChange={e => setForm({ ...form, username: e.target.value })}
                                    disabled={!editMode}
                                    className="w-full px-4 py-3 bg-surface-container-low rounded-DEFAULT text-sm border border-outline-variant/20 focus:ring-2 focus:ring-primary outline-none disabled:opacity-60"
                                />
                            </div>
                            {editMode && (
                                <button onClick={handleSaveProfile} disabled={saving}
                                        className="w-full py-3 bg-primary text-on-primary rounded-DEFAULT font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50">
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* NEW: App Language Switcher */}
                    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
                        <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">language</span>
                            App Language
                        </h3>
                        <p className="text-xs text-on-surface-variant mb-4 font-medium">
                            Chọn ngôn ngữ mẹ đẻ của bạn để tùy chỉnh nội dung học TOEIC.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {locales.map((l) => (
                                <button
                                    key={l.code}
                                    onClick={() => setLocale(l.code)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left
                                        ${locale === l.code
                                        ? 'border-secondary bg-secondary/5 text-secondary shadow-sm'
                                        : 'border-transparent bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                                    }`}
                                >
                                    <div className="flex flex-col items-start overflow-hidden">
                                        <span className="text-xs font-bold uppercase tracking-wider">{l.labelShort || l.code}</span>
                                        <span className="text-[10px] opacity-60 font-medium truncate w-full">{l.name}</span>
                                    </div>
                                    {locale === l.code && (
                                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                                            check_circle
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Change password */}
                    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
                        <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-tertiary">lock</span>
                            Change Password
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="password"
                                placeholder="Current password"
                                value={pwForm.oldPassword}
                                onChange={e => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-surface-container-low rounded-DEFAULT text-sm border border-outline-variant/20 focus:ring-2 focus:ring-primary outline-none"
                            />
                            <input
                                type="password"
                                placeholder="New password (min 6 chars)"
                                value={pwForm.newPassword}
                                onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-surface-container-low rounded-DEFAULT text-sm border border-outline-variant/20 focus:ring-2 focus:ring-primary outline-none"
                            />
                            <button onClick={handleChangePassword} disabled={saving}
                                    className="w-full py-3 border-2 border-tertiary text-tertiary rounded-DEFAULT font-bold text-sm hover:bg-tertiary-fixed transition-all disabled:opacity-50">
                                {saving ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}