import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import topicApi from '../api/topicApi'
import flashcardApi from '../api/flashcardApi'

const NAV_SHORTCUTS = [
    { key: 'sidebar.home', path: '/home', icon: '🏠' },
    { key: 'sidebar.topics', path: '/topics', icon: '📂' },
    { key: 'sidebar.study', path: '/study', icon: '📖' },
    { key: 'sidebar.quiz', path: '/quiz', icon: '📝' },
    { key: 'sidebar.profile', path: '/profile', icon: '👤' },
]

export default function CommandPalette() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const { locale, t } = useLanguage()
    const navigate = useNavigate()

    const [allTopics, setAllTopics] = useState([])
    const [allCards, setAllCards] = useState([])
    const [loading, setLoading] = useState(false)

    const [selectedIndex, setSelectedIndex] = useState(0)
    const containerRef = useRef(null)
    const inputRef = useRef(null)

    // Listen to open events (Ctrl + K or custom event)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 'k') {
                e.preventDefault()
                setOpen(prev => !prev)
            }
            if (e.key === 'Escape') {
                setOpen(false)
            }
        };

        const handleCustomOpen = () => setOpen(true)

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('open-command-palette', handleCustomOpen)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('open-command-palette', handleCustomOpen)
        }
    }, [])

    // Load fresh topics and flashcards when opened
    useEffect(() => {
        if (open) {
            setQuery('')
            setSelectedIndex(0)
            setLoading(true)
            setTimeout(() => {
                inputRef.current?.focus()
            }, 100)

            Promise.all([
                topicApi.getAll(locale).catch(() => ({ data: { data: [] } })),
                flashcardApi.getAll(locale, false, { page: 0, size: 200 }).catch(() => ({ data: { data: { content: [] } } }))
            ]).then(([topicRes, fcRes]) => {
                setAllTopics(topicRes.data.data || [])
                setAllCards(fcRes.data.data?.content || [])
            }).finally(() => setLoading(false))
        }
    }, [open, locale])

    // Client-side filtering logic
    const getFilteredResults = () => {
        const q = query.trim().toLowerCase()
        
        // Navigation shortcuts matches
        const shortcuts = NAV_SHORTCUTS
            .map(s => ({
                label: `${s.icon} ${t(s.key)}`,
                path: s.path,
                category: t('common.navigation') || 'Navigation'
            }))
            .filter(s => s.label.toLowerCase().includes(q))
        
        // Topic matches
        const topics = allTopics
            .filter(t => t.name.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)))
            .map(tp => ({
                label: `📂 ${tp.name}`,
                sub: tp.description || t('topics.subtitle'),
                action: () => navigate(`/topics/${tp.id}/manage`),
                category: t('sidebar.topics') || 'Topics'
            }))

        // Flashcard matches
        const cards = allCards
            .filter(c => c.word.toLowerCase().includes(c.word.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q)))
            .map(c => ({
                label: `🃏 ${c.word}`,
                sub: `${c.pronunciation || ''} • ${c.definition}`,
                action: () => navigate(`/topics/${c.topicId}/manage`),
                category: t('sidebar.study') || 'Study'
            }))

        return [
            ...shortcuts.map(s => ({
                label: s.label,
                sub: `${t('common.navigate_to') || 'Go to'} ${s.label.split(' ')[1]}`,
                action: () => navigate(s.path),
                category: s.category
            })),
            ...topics,
            ...cards
        ]
    }

    const filtered = getFilteredResults()

    // Keydown controls (Up, Down, Enter)
    const handleListKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (filtered[selectedIndex]) {
                filtered[selectedIndex].action()
                setOpen(false)
            }
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[10vh]">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

            {/* Panel */}
            <div ref={containerRef}
                 className="relative z-10 w-full max-w-xl bg-surface-container-lowest border border-outline-variant/15
                            rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-[fadeInUp_0.2s_ease-out]">
                
                {/* Search Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant/10">
                    <span className="material-symbols-outlined text-outline">search</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setSelectedIndex(0)
                        }}
                        onKeyDown={handleListKeyDown}
                        placeholder={t('common.search_placeholder') || 'Search everything...'}
                        className="flex-1 bg-transparent border-none outline-none text-on-surface text-sm placeholder:text-outline"
                    />
                    <button onClick={() => setOpen(false)}
                            className="p-1 rounded-lg text-outline hover:text-on-surface-variant hover:bg-surface-container transition-all">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Body Results */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs text-on-surface-variant">{t('common.loading_search') || 'Loading search data...'}</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-on-surface-variant">
                            <span className="material-symbols-outlined text-4xl block mb-2 opacity-35">search_off</span>
                            <p className="text-sm">{t('common.no_results') || 'No results found for'} "<strong>{query}</strong>"</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filtered.map((item, idx) => {
                                const isSelected = idx === selectedIndex
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            item.action()
                                            setOpen(false)
                                        }}
                                        className={`px-4 py-3 rounded-2xl cursor-pointer transition-all duration-150 flex items-center justify-between
                                            ${isSelected 
                                                ? 'bg-primary text-on-primary shadow-lg shadow-primary/15 scale-[1.01]' 
                                                : 'hover:bg-surface-container text-on-surface'
                                            }`}
                                    >
                                        <div className="min-w-0 pr-4">
                                            <p className={`font-bold text-sm truncate ${isSelected ? 'text-on-primary' : 'text-on-surface'}`}>
                                                {item.label}
                                            </p>
                                            {item.sub && (
                                                <p className={`text-xs mt-0.5 truncate ${isSelected ? 'text-on-primary-container/85' : 'text-on-surface-variant'}`}>
                                                    {item.sub}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase flex-shrink-0 tracking-wider
                                            ${isSelected ? 'bg-on-primary/15 text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                            {item.category}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Guide info */}
                <div className="px-6 py-3.5 bg-surface-container border-t border-outline-variant/10 text-[10px] text-on-surface-variant flex gap-4 select-none">
                    <span className="flex items-center gap-1">
                        <kbd className="bg-surface-container-highest px-1 rounded shadow-sm border border-outline-variant/10">↑↓</kbd> {t('common.move') || 'Move'}
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="bg-surface-container-highest px-1 rounded shadow-sm border border-outline-variant/10">Enter</kbd> {t('common.select') || 'Select'}
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="bg-surface-container-highest px-1 rounded shadow-sm border border-outline-variant/10">Esc</kbd> {t('common.close') || 'Close'}
                    </span>
                </div>
            </div>
        </div>
    )
}
