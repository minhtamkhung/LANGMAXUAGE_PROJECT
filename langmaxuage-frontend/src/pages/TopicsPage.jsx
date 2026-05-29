import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import topicApi from '../api/topicApi'
import { useLanguage } from '../context/LanguageContext'

const TOPIC_ICONS = {
    'Business':    'business_center',
    'Grammar':     'spellcheck',
    'Travel':      'flight_takeoff',
    'Technology':  'computer',
    'Phrasal':     'format_quote',
    'TOEIC':       'workspace_premium',
    'Daily':       'forum',
    'Academic':    'edit_note',
    'default':     'folder',
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
    const navigate                      = useNavigate()
    const { locale, currentLocaleInfo } = useLanguage()
    const [topics, setTopics]           = useState([])
    const [filter, setFilter]           = useState('all')
    const [loading, setLoading]         = useState(true)

    useEffect(() => {
        setLoading(true)
        topicApi.getAll(locale)
            .then(r => setTopics(r.data.data || []))
            .finally(() => setLoading(false))
    }, [locale])  // ← refetch whenever locale changes

    const systemTopics   = topics.filter(t => t.isSystem)
    const personalTopics = topics.filter(t => !t.isSystem)
    const displayed      = filter === 'system'   ? systemTopics
                         : filter === 'personal' ? personalTopics
                         : topics

    const localeName = LOCALE_LABEL[locale] || currentLocaleInfo?.name || locale.toUpperCase()

    // Split for bento: first is "featured" (large), rest are normal
    const featured  = displayed[0]
    const rest      = displayed.slice(1)

    return (
        <Layout>
            {/* Page Header */}
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-xs font-bold font-label tracking-widest uppercase">
                        {localeName.toUpperCase()} CONTEXT
                    </span>
                    {/* Filter pills */}
                    <div className="flex items-center gap-2 ml-auto">
                        {[
                            { key: 'all',      label: `All (${topics.length})` },
                            { key: 'system',   label: `System` },
                            { key: 'personal', label: `Mine` },
                        ].map(({ key, label }) => (
                            <button key={key} onClick={() => setFilter(key)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all
                                        ${filter === key
                                            ? 'bg-on-surface text-surface-container-lowest'
                                            : 'border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant'
                                        }`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface font-headline tracking-tight mb-4">
                    Trending Topics for{' '}
                    <span className="text-secondary">{localeName}</span>
                </h1>
                <p className="text-on-surface-variant max-w-2xl text-lg leading-relaxed">
                    Explore curated vocabulary modules adapted for TOEIC mastery.
                </p>
            </header>

            {loading ? (
                <div className="flex justify-center mt-20">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : displayed.length === 0 ? (
                <div className="text-center py-24 text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl mb-3 block opacity-30">folder_open</span>
                    <p>No topics found for this language.</p>
                </div>
            ) : (
                <>
                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Featured card (large, 8-col) */}
                        {featured && (
                            <FeatureCard
                                topic={featured}
                                onClick={() => navigate(`/flashcards/${featured.id}`)}
                            />
                        )}

                        {/* Fill remaining cols beside the feature card */}
                        {rest.slice(0, 1).map(topic => (
                            <SmallCard
                                key={topic.id}
                                topic={topic}
                                colSpan="md:col-span-4"
                                onClick={() => navigate(`/flashcards/${topic.id}`)}
                            />
                        ))}

                        {/* Full-width row for subsequent cards (4-col each) */}
                        {rest.slice(1).map(topic => (
                            <SmallCard
                                key={topic.id}
                                topic={topic}
                                colSpan="md:col-span-4"
                                onClick={() => navigate(`/flashcards/${topic.id}`)}
                            />
                        ))}
                    </div>

                    {/* Custom topic CTA */}
                    <section className="mt-12 bg-inverse-surface text-inverse-on-surface rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
                            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                <path d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.7,-31.3,87.1,-15.7,87.1,0C87.1,15.7,83.7,31.3,76.4,44.7C69.2,58.1,58.1,69.2,44.7,76.4C31.3,83.7,15.7,87.1,0,87.1C-15.7,87.1,-31.3,83.7,-44.7,76.4C-58.1,69.2,-69.2,58.1,-76.4,44.7C-83.7,31.3,-87.1,15.7,-87.1,0C-87.1,-15.7,-83.7,-31.3,-76.4,-44.7C-69.2,-58.1,-58.1,-69.2,-44.7,-76.4C-31.3,-83.7,-15.7,-87.1,0,-87.1C15.7,-87.1,31.3,-83.7,44.7,-76.4Z" fill="#ffffff" transform="translate(100 100)" />
                            </svg>
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                            <div>
                                <h2 className="text-3xl font-bold font-headline mb-3">Can't find what you need?</h2>
                                <p className="text-slate-300 max-w-md">Create a personal topic with your own vocabulary set.</p>
                            </div>
                            <button
                                onClick={() => navigate('/topics/new')}
                                className="md:ml-auto flex items-center gap-2 bg-secondary text-white px-8 py-4 rounded-xl font-bold font-label shadow-xl hover:bg-secondary-container transition-all active:scale-95 whitespace-nowrap"
                            >
                                <span className="material-symbols-outlined">add_circle</span>
                                Create Custom Topic
                            </button>
                        </div>
                    </section>
                </>
            )}
        </Layout>
    )
}

function FeatureCard({ topic, onClick }) {
    const icon = getIcon(topic.name)
    return (
        <div className="md:col-span-8 group relative overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-sm hover:shadow-xl transition-all duration-500 border border-outline-variant/15 cursor-pointer"
             onClick={onClick}>
            <div className="relative z-10 p-8 md:p-10 flex flex-col min-h-[280px]">
                <div className="flex justify-between items-start mb-10">
                    <div className={`p-4 rounded-2xl ${topic.isSystem ? 'bg-secondary-fixed text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
                        <span className="material-symbols-outlined text-3xl">{icon}</span>
                    </div>
                    <span className="text-xs font-bold font-label bg-surface-container-highest px-3 py-1.5 rounded-full uppercase tracking-tighter">
                        {topic.isSystem ? 'System' : 'Personal'}
                    </span>
                </div>
                <div className="mt-auto">
                    <h3 className="text-3xl font-bold font-headline mb-3 group-hover:text-secondary transition-colors">
                        {topic.name}
                    </h3>
                    {topic.description && (
                        <p className="text-on-surface-variant mb-8 max-w-md line-clamp-2">{topic.description}</p>
                    )}
                    <button className="bg-gradient-to-r from-primary to-primary-container text-white px-8 py-4 rounded-xl font-bold font-label flex items-center gap-2 hover:shadow-lg transition-all active:scale-95">
                        Start Study
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

function SmallCard({ topic, onClick, colSpan }) {
    const icon = getIcon(topic.name)
    return (
        <div className={`${colSpan} bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm flex flex-col border border-outline-variant/15 hover:bg-secondary-fixed/30 hover:shadow-md transition-all cursor-pointer group`}
             onClick={onClick}>
            <div className="mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6
                    ${topic.isSystem ? 'bg-primary-fixed text-primary' : 'bg-tertiary/10 text-tertiary'}`}>
                    <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
                <h3 className="text-2xl font-bold font-headline mb-3 group-hover:text-secondary transition-colors">
                    {topic.name}
                </h3>
                {topic.description && (
                    <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-3">{topic.description}</p>
                )}
            </div>
            <button className="mt-auto w-full border-2 border-secondary/20 text-secondary px-6 py-3 rounded-xl font-bold font-label hover:bg-secondary hover:text-white transition-all active:scale-95">
                Start Study
            </button>
        </div>
    )
}