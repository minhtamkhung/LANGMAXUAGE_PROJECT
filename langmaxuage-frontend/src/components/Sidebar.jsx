import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const navItems = [
    { path: '/home',    icon: 'dashboard',   label: 'Dashboard' },
    { path: '/topics',  icon: 'folder',      label: 'Topics'    },
    { path: '/study',   icon: 'menu_book',   label: 'Study'     },
    { path: '/quiz',    icon: 'quiz',        label: 'Quiz'      },
    { path: '/profile', icon: 'person',      label: 'Profile'   },
]

export default function Sidebar() {
    const { user, logout }            = useAuth()
    const { locale, setLocale, locales } = useLanguage()
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

            {/* Nav */}
            <nav className="flex-1 space-y-1 px-2">
                {navItems.map(({ path, icon, label }) => {
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
                            {label}
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
