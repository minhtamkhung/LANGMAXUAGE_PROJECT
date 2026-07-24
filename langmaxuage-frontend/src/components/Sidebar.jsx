import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const navItems = [
    { path: '/home',     icon: 'dashboard',   key: 'sidebar.home' },
    { path: '/topics',   icon: 'folder',      key: 'sidebar.topics' },
    { path: '/study',    icon: 'menu_book',   key: 'sidebar.study' },
    { path: '/quiz',     icon: 'quiz',        key: 'sidebar.quiz' },
    { path: '/typing',   icon: 'keyboard',    key: 'sidebar.typing' },
    { path: '/matching', icon: 'shuffle',     key: 'sidebar.matching' },
]

export default function Sidebar({ collapsed, onToggle }) {
    const { user, logout }            = useAuth()
    const { t }                       = useLanguage()
    const location                    = useLocation()
    const navigate                    = useNavigate()
    
    const [userMenuOpen, setUserMenuOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <aside className={`h-screen fixed left-0 top-0 bg-surface-container-low flex flex-col py-6 gap-2 z-50 border-r border-outline-variant/10 transition-all duration-300
            ${collapsed ? 'w-20' : 'w-64'}`}
        >
            {/* Header & Toggle */}
            <div className={`px-6 mb-4 flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between'}`}>
                {!collapsed && (
                    <div>
                        <h1 className="text-lg font-bold text-primary font-headline tracking-tight leading-tight">
                            LangMaxuage
                        </h1>
                        <p className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase mt-0.5">
                            Adaptive Scholar
                        </p>
                    </div>
                )}
                <button onClick={onToggle}
                        className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-90 flex-shrink-0"
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
                    <span className="material-symbols-outlined text-xl">
                        {collapsed ? 'menu' : 'menu_open'}
                    </span>
                </button>
            </div>

            {/* Quick Search */}
            <div className={`px-4 mb-4 ${collapsed ? 'flex justify-center px-0' : ''}`}>
                {collapsed ? (
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                        className="w-10 h-10 flex items-center justify-center bg-surface-container hover:bg-surface-container-high
                                   text-on-surface-variant hover:text-primary border border-outline-variant/15
                                   rounded-full transition-all duration-200 active:scale-90"
                        title={t('common.search') || 'Search...'}
                    >
                        <span className="material-symbols-outlined text-xl">search</span>
                    </button>
                ) : (
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
                )}
            </div>

            {/* Navigation links */}
            <nav className="flex-1 space-y-1 px-2">
                {navItems.map(({ path, icon, key }) => {
                    const active = location.pathname === path
                    return (
                        <Link
                            key={path}
                            to={path}
                            className={`flex items-center gap-3 rounded-full text-sm font-semibold font-headline tracking-tight transition-all duration-200 ease-out-expo
                                ${collapsed ? 'justify-center w-12 h-12 p-0 mx-auto' : 'px-4 py-3'}
                                ${active
                                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors'
                                }`}
                            title={collapsed ? t(key) : ''}
                        >
                            <span className="material-symbols-outlined text-xl"
                                  style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                                {icon}
                            </span>
                            {!collapsed && <span>{t(key)}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* User footer with Dropdown */}
            <div className="px-4 pt-4 mt-auto border-t border-outline-variant/20 relative">
                {/* Backdrop to close menu */}
                {userMenuOpen && (
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                )}

                {/* Dropdown Menu */}
                {userMenuOpen && (
                    <div className={`absolute z-50 bg-surface-container-high border border-outline-variant/30 rounded-2xl p-1.5 shadow-xl animate-[fadeInUp_0.15s_ease-out] w-48
                        ${collapsed ? 'bottom-16 left-4' : 'bottom-16 left-4 right-4'}`}
                    >
                        {/* Header Info */}
                        <div className="px-3 py-2 border-b border-outline-variant/10 mb-1 select-none">
                            <p className="text-xs font-bold text-on-surface truncate font-headline">{user?.username}</p>
                            <p className="text-[10px] text-on-surface-variant truncate uppercase tracking-wider mt-0.5">{user?.role}</p>
                        </div>

                        {/* Profile Item */}
                        <button
                            onClick={() => {
                                setUserMenuOpen(false)
                                navigate('/profile')
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all active:scale-[0.98] text-left"
                        >
                            <span className="material-symbols-outlined text-lg">person</span>
                            {t('sidebar.profile')}
                        </button>

                        {/* Language Item */}
                        <button
                            onClick={() => {
                                setUserMenuOpen(false)
                                navigate('/language')
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all active:scale-[0.98] text-left"
                        >
                            <span className="material-symbols-outlined text-lg">language</span>
                            {t('sidebar.language')}
                        </button>

                        {/* Divider */}
                        <div className="h-[1px] bg-outline-variant/10 my-1" />

                        {/* Logout Item */}
                        <button
                            onClick={() => {
                                setUserMenuOpen(false)
                                handleLogout()
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-error hover:bg-error/10 transition-all active:scale-[0.98] text-left"
                        >
                            <span className="material-symbols-outlined text-lg">logout</span>
                            {t('sidebar.logout')}
                        </button>
                    </div>
                )}

                {/* Avatar trigger button */}
                {collapsed ? (
                    <div className="flex flex-col items-center">
                        <button 
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className={`w-10 h-10 rounded-full bg-primary-fixed hover:bg-primary-fixed-dim text-primary font-bold text-sm font-headline flex items-center justify-center transition-all active:scale-[0.97] z-50
                                ${userMenuOpen ? 'ring-2 ring-primary' : ''}`}
                            title={user?.username}
                        >
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </button>
                    </div>
                ) : (
                    <div 
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className={`flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-all active:scale-[0.98] cursor-pointer select-none z-50 relative
                            ${userMenuOpen ? 'bg-surface-container' : 'bg-transparent'}`}
                    >
                        <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm font-headline flex-shrink-0">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-bold truncate font-headline">{user?.username}</p>
                            <p className="text-xs text-on-surface-variant truncate">{user?.role}</p>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant text-base">
                            {userMenuOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
                        </span>
                    </div>
                )}
            </div>
        </aside>
    )
}
