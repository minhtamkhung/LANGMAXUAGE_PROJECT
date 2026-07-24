import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import topicApi from '../api/topicApi'
import { useLanguage } from '../context/LanguageContext'

const TOPIC_ICONS = {
    'Business': 'business_center',
    'Grammar': 'spellcheck',
    'Travel': 'flight_takeoff',
    'Technology': 'computer',
    'Phrasal': 'format_quote',
    'Certificate': 'workspace_premium',
    'Daily': 'forum',
    'Academic': 'edit_note',
    'default': 'folder',
}

function getIcon(name = '') {
    const key = Object.keys(TOPIC_ICONS).find(k =>
        name.toLowerCase().includes(k.toLowerCase()))
    return TOPIC_ICONS[key] || TOPIC_ICONS.default
}

const LOCALE_LABEL = {
    en: 'English',
    vi: 'Vietnamese',
    ja: 'Japanese',
    ko: 'Korean',
}

export default function TopicsPage() {
    const navigate = useNavigate()
    const { locale, currentLocaleInfo, t } = useLanguage()

    const [topics, setTopics] = useState([])
    const [filter, setFilter] = useState('all')
    const [searchInput, setSearchInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(true)

    // Debounce tìm kiếm từ khóa phía Client sang Backend (350ms)
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchQuery(searchInput)
            setPage(0) // Reset về trang đầu khi đổi từ khóa
        }, 350)
        return () => clearTimeout(handler)
    }, [searchInput])

    // Gọi API tìm kiếm có phân trang và lọc từ Backend
    useEffect(() => {
        setLoading(true)
        topicApi.search({
            query: searchQuery,
            filter,
            locale,
            page,
            size: 10 // Đổi số lượng phần tử trên trang
        })
            .then(res => {
                const data = res.data.data || {}
                setTopics(data.content || [])
                setTotalPages(data.totalPages || 0)
                setTotalElements(data.totalElements || 0)
            })
            .catch(() => {
                setTopics([])
                setTotalPages(0)
                setTotalElements(0)
            })
            .finally(() => setLoading(false))
    }, [searchQuery, filter, page, locale])

    const handleFilterChange = (key) => {
        setFilter(key)
        setPage(0) // Reset về trang đầu khi chọn danh mục khác
    }

    const localeName = LOCALE_LABEL[locale] || currentLocaleInfo?.name || locale.toUpperCase()

    // Căn chỉnh bento card ở trang đầu tiên
    const featured = topics[0]
    const rest = topics.slice(1)

    const getFilterLabel = (key) => {
        if (key === 'all') {
            return t('topics.all_filter') || 'All'
        }
        if (key === 'system') {
            return t('topics.system')
        }
        if (key === 'personal') {
            return t('topics.mine_filter')
        }
        return ''
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 py-6">

                {/* Page Header */}
                <header className="mb-12 space-y-8">
                    {/* Top Row: Title & Create Button */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-primary font-mono text-[10px] font-bold uppercase tracking-wider mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                {localeName.toUpperCase()} {t('topics.context')}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-on-surface font-headline tracking-tighter leading-none">
                                {t('topics.title')} <span className="text-primary">{localeName}</span>
                            </h1>
                            <p className="text-on-surface-variant text-sm mt-3 max-w-[60ch] leading-relaxed font-medium">
                                {t('topics.subtitle')}
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/topics/new')}
                            className="flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3.5 rounded-2xl font-bold font-label hover:shadow-lg hover:shadow-primary/10 active:scale-[0.97] transition-all self-start md:self-auto flex-shrink-0"
                        >
                            <span className="material-symbols-outlined text-xl">add_circle</span>
                            {t('topics.create_custom')}
                        </button>
                    </div>

                    {/* Bottom Row: Search Bar & Tab Filters */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-outline-variant/10">
                        {/* Search Input Bar */}
                        <div className="relative flex-1 max-w-md w-full">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
                            <input
                                type="text"
                                placeholder={t('common.search') || 'Search topics...'}
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                className="w-full border border-outline-variant/30 rounded-2xl pl-12 pr-10 py-3 bg-surface-container-lowest text-on-surface placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-semibold text-sm transition-all shadow-sm"
                            />
                            {searchInput && (
                                <button
                                    onClick={() => setSearchInput('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface flex items-center"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            )}
                        </div>

                        {/* Filter Segmented Control (Pills capsule design) */}
                        <div className="flex bg-surface-container p-1 rounded-2xl self-start md:self-auto shadow-sm">
                            {[
                                { key: 'all' },
                                { key: 'system' },
                                { key: 'personal' },
                            ].map(({ key }) => (
                                <button
                                    key={key}
                                    onClick={() => handleFilterChange(key)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap
                                        ${filter === key
                                            ? 'bg-surface-container-lowest text-primary shadow-sm'
                                            : 'text-on-surface-variant hover:text-on-surface'
                                        }`}
                                >
                                    {getFilterLabel(key)}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="py-24 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : topics.length === 0 ? (
                    <div className="text-center py-24 bg-surface-container-lowest border border-outline-variant/30 rounded-[2.5rem] p-8 shadow-sm animate-[fadeInUp_0.3s_ease-out]">
                        <span className="material-symbols-outlined text-6xl text-outline mb-4 block opacity-40">folder_open</span>
                        <p className="text-on-surface-variant font-bold">{t('topics.no_topics_found')}</p>
                    </div>
                ) : (
                    <>
                        {/* Bento Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-[fadeInUp_0.3s_ease-out]">
                            {/* Ở trang 0: Featured card đầu tiên, các card sau xếp kề bên */}
                            {page === 0 && featured ? (
                                <>
                                    <FeatureCard
                                        topic={featured}
                                        t={t}
                                        onClick={() => navigate(`/flashcards/${featured.id}`)}
                                        onManage={() => navigate(`/topics/${featured.id}/manage`)}
                                    />
                                    {rest.map(topic => (
                                        <SmallCard
                                            key={topic.id}
                                            topic={topic}
                                            t={t}
                                            colSpan="md:col-span-4"
                                            onClick={() => navigate(`/flashcards/${topic.id}`)}
                                            onManage={() => navigate(`/topics/${topic.id}/manage`)}
                                        />
                                    ))}
                                </>
                            ) : (
                                // Ở các trang tiếp theo: Hiển thị đều đặn 3 cột
                                topics.map(topic => (
                                    <SmallCard
                                        key={topic.id}
                                        topic={topic}
                                        t={t}
                                        colSpan="md:col-span-4"
                                        onClick={() => navigate(`/flashcards/${topic.id}`)}
                                        onManage={() => navigate(`/topics/${topic.id}/manage`)}
                                    />
                                ))
                            )}
                        </div>

                        {/* Pagination UI Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-outline-variant/10">
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    className="w-10 h-10 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:bg-surface-container flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                                </button>

                                {Array.from({ length: totalPages }).map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setPage(idx)}
                                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-all active:scale-95
                                            ${page === idx
                                                ? 'bg-primary text-on-primary shadow-md shadow-primary/10'
                                                : 'text-on-surface-variant hover:bg-surface-container'
                                            }`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}

                                <button
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(p => p + 1)}
                                    className="w-10 h-10 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:bg-surface-container flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                                </button>
                            </div>
                        )}

                        {/* Custom Topic CTA Banner with abstract grid mesh */}
                        <section className="mt-12 bg-gradient-to-r from-primary to-primary-container text-white rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-lg shadow-primary/10">
                            {/* Abstract SVG grid background overlay */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1.5" />
                                        </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#grid)" />
                                </svg>
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-3xl font-black font-headline tracking-tight leading-none mb-3">
                                        {t('topics.cant_find_what_you_need')}
                                    </h2>
                                    <p className="text-white/80 text-sm max-w-md font-medium leading-relaxed">
                                        {t('topics.create_personal_topic')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/topics/new')}
                                    className="flex items-center justify-center gap-2 bg-white text-primary px-8 py-4 rounded-2xl font-bold font-label hover:bg-surface active:scale-[0.97] transition-all shadow-md shadow-primary/10"
                                >
                                    <span className="material-symbols-outlined text-xl">add_circle</span>
                                    {t('topics.create_custom')}
                                </button>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </Layout>
    )
}

function FeatureCard({ topic, t, onClick, onManage }) {
    const icon = getIcon(topic.name)
    return (
        <div
            className="md:col-span-8 group relative overflow-hidden rounded-[2.5rem] bg-surface-container-lowest border border-outline-variant/30 shadow-sm hover:shadow-xl hover:scale-[1.005] hover:-translate-y-0.5 transition-all duration-500 cursor-pointer flex flex-col"
            onClick={onClick}
        >
            {/* Soft decorative visual overlay */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors" />

            <div className="p-8 md:p-10 flex flex-col justify-between flex-1 min-h-[300px]">
                <div className="flex justify-between items-start mb-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${topic.isSystem ? 'bg-primary-fixed text-primary' : 'bg-tertiary/10 text-tertiary'}`}>
                        <span className="material-symbols-outlined text-3xl">{icon}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {onManage && (
                            <button
                                onClick={e => { e.stopPropagation(); onManage() }}
                                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full
                                           bg-tertiary/10 text-tertiary hover:bg-tertiary-fixed-dim transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined text-sm">settings</span>
                                {t('topics.manage')}
                            </button>
                        )}
                        <span className="text-xs font-bold font-label bg-surface-container text-on-surface-variant px-3 py-1.5 rounded-full uppercase tracking-wider">
                            {topic.isSystem ? t('topics.system') : t('topics.personal')}
                        </span>
                    </div>
                </div>

                <div className="mt-auto">
                    <h3 className="text-3xl font-black font-headline tracking-tight text-on-surface mb-2 group-hover:text-primary transition-colors leading-tight">
                        {topic.name}
                    </h3>
                    {topic.description && (
                        <p className="text-on-surface-variant text-sm mb-6 max-w-lg leading-relaxed line-clamp-2 font-medium">{topic.description}</p>
                    )}
                    <button className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold font-label flex items-center gap-2 hover:bg-primary-container active:scale-[0.98] transition-all shadow-md shadow-primary/10">
                        {t('topics.start_study')}
                        <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

function SmallCard({ topic, t, onClick, onManage, colSpan }) {
    const icon = getIcon(topic.name)
    return (
        <div
            className={`${colSpan} bg-surface-container-lowest border border-outline-variant/30 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between hover:shadow-xl hover:scale-[1.005] hover:-translate-y-0.5 transition-all duration-500 cursor-pointer group`}
            onClick={onClick}
        >
            <div className="mb-6">
                <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm
                        ${topic.isSystem ? 'bg-primary-fixed text-primary' : 'bg-tertiary/10 text-tertiary'}`}>
                        <span className="material-symbols-outlined text-2xl">{icon}</span>
                    </div>
                    {onManage && (
                        <button
                            onClick={e => { e.stopPropagation(); onManage() }}
                            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full
                                       bg-tertiary/10 text-tertiary hover:bg-tertiary-fixed-dim transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-sm">settings</span>
                            {t('topics.manage')}
                        </button>
                    )}
                </div>
                <h3 className="text-2xl font-black font-headline tracking-tight text-on-surface mb-2 group-hover:text-primary transition-colors leading-tight">
                    {topic.name}
                </h3>
                {topic.description && (
                    <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-3 font-medium">{topic.description}</p>
                )}
            </div>
            <button className="mt-auto w-full border border-primary/20 hover:border-primary text-primary px-6 py-3 rounded-2xl font-bold font-label hover:bg-primary hover:text-white transition-all active:scale-[0.98]">
                {t('topics.start_study')}
            </button>
        </div>
    )
}