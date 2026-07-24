import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

const FLAG_EMOJIS = {
    en: '🇺🇸', vi: '🇻🇳', ja: '🇯🇵', ko: '🇰🇷',
}

const LEVEL_MAP = {
    en: { label: 'Advanced',     w: 'w-4/5',  badge: 'Global Edition', color: 'text-primary bg-primary/10' },
    vi: { label: 'Intermediate', w: 'w-3/5',  badge: 'Popular Choice', color: 'text-emerald-500 bg-emerald-500/10' },
    ja: { label: 'Beginner',     w: 'w-1/4',  badge: 'Regional Edition', color: 'text-amber-500 bg-amber-500/10' },
    ko: { label: 'New',          w: 'w-1/12', badge: 'Regional Edition', color: 'text-rose-500 bg-rose-500/10' },
}

export default function LanguageSelectionPage() {
    const { locale, setLocale, locales } = useLanguage()
    const { user }                       = useAuth()
    const [selected, setSelected]        = useState(locale)
    const navigate                       = useNavigate()

    const handleStart = () => {
        setLocale(selected)
        if (user) {
            navigate('/home')
        } else {
            navigate('/')
        }
    }

    return (
        <div className="bg-surface font-body text-on-surface min-h-screen relative overflow-hidden flex items-center justify-center p-6 selection:bg-primary/20">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-5xl bg-surface-container-low border border-outline-variant/15
                            rounded-[2.5rem] shadow-2xl p-8 md:p-12 transition-all duration-300">
                
                {/* Header Section */}
                <div className="text-center mb-12 space-y-3">
                    <span className="text-[10px] font-black text-secondary uppercase tracking-[0.25em]">LangMaxuage Preferences</span>
                    <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-on-surface leading-none">
                        Choose Your Language
                    </h1>
                    <p className="text-on-surface-variant text-sm font-semibold max-w-md mx-auto leading-relaxed">
                        Select the target language to customize your learning and interface experience.
                    </p>
                </div>

                {/* Grid of Languages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {locales.map(lang => {
                        const isActive = selected === lang.code
                        const meta = LEVEL_MAP[lang.code] || { label: 'Available', w: 'w-1/2', badge: 'Global', color: 'text-primary bg-primary/10' }
                        const flag = FLAG_EMOJIS[lang.code] || '🌐'
                        return (
                            <button
                                key={lang.code}
                                onClick={() => setSelected(lang.code)}
                                className={`group flex flex-col p-6 bg-surface-container-lowest rounded-3xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] relative overflow-hidden text-left
                                    ${isActive
                                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                                        : 'border-outline-variant/15 hover:border-outline-variant/40 bg-surface-container-low'
                                    }`}
                            >
                                {/* Checkmark Indicator */}
                                {isActive && (
                                    <div className="absolute top-4 right-4 text-primary">
                                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                            check_circle
                                        </span>
                                    </div>
                                )}

                                {/* Flag Emoji Container */}
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm transition-all duration-300
                                    ${isActive ? 'bg-primary-container/20 scale-105' : 'bg-surface-container'}`}>
                                    {flag}
                                </div>

                                {/* Language metadata */}
                                <div className="mb-6 flex-1 flex flex-col justify-end">
                                    <h3 className="text-xl font-bold font-headline text-on-surface mb-1.5 leading-tight">{lang.name}</h3>
                                    <div className={`inline-block self-start px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase ${meta.color}`}>
                                        {meta.badge}
                                    </div>
                                </div>

                                {/* Progress bar popularity indicator */}
                                <div className="w-full space-y-2 mt-auto">
                                    <div className="flex justify-between text-[11px] font-bold text-on-surface-variant">
                                        <span className="opacity-80">Interface</span>
                                        <span className="text-primary">{meta.label}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden shadow-inner">
                                        <div className={`h-full bg-primary rounded-full transition-all duration-500 ${meta.w}`} />
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Footer / CTA Actions */}
                <div className="flex flex-col items-center gap-6 pt-6 border-t border-outline-variant/10">
                    <button
                        onClick={handleStart}
                        className="group flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-primary to-primary-container
                                   text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/35
                                   transition-all hover:scale-[1.01] active:scale-95 text-base"
                    >
                        <span>Let's Start</span>
                        <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                            arrow_forward
                        </span>
                    </button>

                    <div className="flex items-center gap-2.5 px-5 py-3 bg-surface-container rounded-2xl border border-outline-variant/10">
                        <span className="material-symbols-outlined text-primary text-base">info</span>
                        <p className="text-xs font-bold text-on-surface-variant">
                            You can change your language anytime from the sidebar or profile settings.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}
