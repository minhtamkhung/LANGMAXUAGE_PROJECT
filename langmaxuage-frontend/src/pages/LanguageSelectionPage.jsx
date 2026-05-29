import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

const FLAG_EMOJIS = {
    en: '🇺🇸', vi: '🇻🇳', ja: '🇯🇵', ko: '🇰🇷',
}
const LEVEL_MAP = {
    en: { label: 'Advanced',     w: 'w-4/5',  badge: 'Global Edition'   },
    vi: { label: 'Intermediate', w: 'w-3/5',  badge: 'Popular Choice'   },
    ja: { label: 'Beginner',     w: 'w-1/4',  badge: 'Regional'         },
    ko: { label: 'New',          w: 'w-1/12', badge: 'Regional'         },
}

export default function LanguageSelectionPage() {
    const { locale, setLocale, locales } = useLanguage()
    const [selected, setSelected]        = useState(locale)
    const navigate                       = useNavigate()

    const handleStart = () => {
        setLocale(selected)
        navigate('/home')
    }

    return (
        <div className="bg-surface font-body text-on-surface min-h-screen relative overflow-hidden">
            {/* Abstract Background */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-primary-fixed to-transparent blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-secondary-fixed to-transparent blur-3xl" />
            </div>

            {/* Top nav */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center px-6 h-16 shadow-[0_40px_40px_-5px_rgba(25,28,30,0.06)]">
                <span className="text-xl font-bold text-on-surface font-headline tracking-tight">
                    TOEIC Sanctuary
                </span>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high">
                    <span className="material-symbols-outlined text-lg">language</span>
                    <span className="text-sm font-bold font-label tracking-tight">
                        {selected.toUpperCase()}
                    </span>
                </div>
            </header>

            {/* Main content */}
            <main className="relative z-10 min-h-screen pt-28 pb-16 flex flex-col items-center justify-center px-6">
                <div className="w-full max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-14 space-y-4">
                        <h1 className="text-5xl font-extrabold font-headline tracking-tight text-on-surface">
                            Choose Your Language
                        </h1>
                        <p className="text-on-surface-variant text-lg max-w-md mx-auto">
                            Select the target language to customize your TOEIC learning experience.
                        </p>
                    </div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
                        {locales.map(lang => {
                            const isActive  = selected === lang.code
                            const meta      = LEVEL_MAP[lang.code] || { label: 'Available', w: 'w-1/2', badge: 'Global' }
                            const flag      = FLAG_EMOJIS[lang.code] || '🌐'
                            return (
                                <button
                                    key={lang.code}
                                    onClick={() => setSelected(lang.code)}
                                    className={`group relative bg-surface-container-lowest rounded-xl p-8 flex flex-col items-center justify-between transition-all duration-300 text-left
                                        ${isActive
                                            ? 'border-2 border-secondary shadow-[0_20px_40px_rgba(0,88,190,0.12)]'
                                            : 'border-2 border-transparent hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,88,190,0.1)] hover:border-secondary-fixed'
                                        }`}
                                >
                                    {/* Check badge */}
                                    {isActive && (
                                        <div className="absolute top-4 right-4">
                                            <span className="material-symbols-outlined text-secondary"
                                                  style={{ fontVariationSettings: "'FILL' 1" }}>
                                                check_circle
                                            </span>
                                        </div>
                                    )}

                                    {/* Flag */}
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl mb-6 shadow-md
                                        ${isActive ? 'outline outline-offset-4 outline-secondary/20' : 'outline outline-offset-4 outline-outline-variant/15'}`}>
                                        {flag}
                                    </div>

                                    {/* Name & badge */}
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold font-headline mb-2">{lang.name}</h3>
                                        <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase
                                            ${isActive
                                                ? 'bg-secondary-fixed text-on-secondary-fixed'
                                                : 'bg-surface-container text-on-surface-variant'
                                            }`}>
                                            {meta.badge}
                                        </div>
                                    </div>

                                    {/* Level bar */}
                                    <div className="w-full space-y-2">
                                        <div className="flex justify-between text-xs font-medium text-on-surface-variant px-1">
                                            <span>Level</span>
                                            <span className="text-secondary font-bold">{meta.label}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                                            <div className={`h-full bg-secondary rounded-full ${meta.w}`} />
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col items-center gap-6">
                        <button
                            onClick={handleStart}
                            className="group relative px-12 py-5 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-headline font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                Let's Start
                                <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform">
                                    arrow_forward
                                </span>
                            </span>
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>

                        <div className="flex items-center gap-3 px-5 py-3 bg-surface-container-low/60 backdrop-blur-md rounded-2xl border border-outline-variant/10">
                            <span className="material-symbols-outlined text-secondary text-lg">info</span>
                            <p className="text-sm font-medium text-on-surface-variant">
                                You can change your language anytime from the sidebar.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
