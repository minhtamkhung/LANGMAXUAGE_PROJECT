import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const navItems = [
    { path: '/home',    icon: 'dashboard',   key: 'sidebar.home' },
    { path: '/topics',  icon: 'folder',      key: 'sidebar.topics' },
    { path: '/study',   icon: 'menu_book',   key: 'sidebar.study' },
    { path: '/quiz',    icon: 'quiz',        key: 'sidebar.quiz' },
    { path: '/profile', icon: 'person',      key: 'sidebar.profile' },
]

export default function Sidebar() {
    const { user, logout }            = useAuth()
    const { locale, setLocale, locales, t } = useLanguage()
    const location                    = useLocation()
    const navigate                    = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col py-6 gap-2 z-50">
            {/* Brand */}
            <div className="px-6 mb-4">
                <h1 className="text-xl font-bold text-primary font-headline tracking-tight">
                    TOEIC Sanctuary
                </h1>
                <p className="text-xs text-on-surface-variant font-medium tracking-widest uppercase mt-1">
                    Adaptive Scholar
                </p>
            </div>

            {/* Quick Search trigger */}
            <div className="px-4 mb-4">
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-container hover:bg-surface-container-high
                               text-on-surface-variant hover:text-primary border border-outline-variant/15
                               rounded-2xl text-xs font-semibold tracking-tight transition-all duration-200"
                >
                    <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">search</span>
                        {t('common.search') || 'Search...'}
                    </span>
                    <kbd className="bg-surface-container-highest px-1.5 py-0.5 rounded text-[10px] font-mono text-outline font-bold shadow-sm">
                        Ctrl K
                    </kbd>
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1 px-2">
                {navItems.map(({ path, icon, key }) => {
                    const active = location.pathname === path
                    return (
                        <Link
                            key={path}
                            to={path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold font-headline tracking-tight transition-all duration-200 ease-out-expo
                                ${active
                                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors'
                                }`}
                        >
                            <span className="material-symbols-outlined text-xl"
                                  style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                                {icon}
                            </span>
                            {t(key)}
                        </Link>
                    )
                })}
            </nav>

            {/* User footer */}
            <div className="px-4 pt-4 mt-auto border-t border-outline-variant/20">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container">
                    <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm font-headline flex-shrink-0">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-sm font-bold truncate font-headline">{user?.username}</p>
                        <p className="text-xs text-on-surface-variant truncate">{user?.role}</p>
                    </div>
                    <button onClick={handleLogout}
                            className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0">
                        <span className="material-symbols-outlined text-xl">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    )
}
