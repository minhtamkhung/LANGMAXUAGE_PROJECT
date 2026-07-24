import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import progressApi from '../api/progressApi'
import quizApi from '../api/quizApi'
import { useLanguage } from '../context/LanguageContext'

const calculateStreak = (progressList, quizHistory) => {
    const dates = new Set()
    
    progressList.forEach(p => {
        if (p.lastReviewedAt) {
            dates.add(new Date(p.lastReviewedAt).toDateString())
        }
    })
    
    quizHistory.forEach(q => {
        if (q.startedAt) {
            dates.add(new Date(q.startedAt).toDateString())
        }
    })
    
    let streak = 0
    let checkDate = new Date()
    
    if (!dates.has(checkDate.toDateString())) {
        checkDate.setDate(checkDate.getDate() - 1)
    }
    
    while (dates.has(checkDate.toDateString())) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
    }
    
    return streak
}

const getReviewedTodayCount = (progressList) => {
    const todayStr = new Date().toDateString()
    return progressList.filter(p => p.lastReviewedAt && new Date(p.lastReviewedAt).toDateString() === todayStr).length
}

export default function HomePage() {
    const { user }                = useAuth()
    const navigate                = useNavigate()
    const { t }                   = useLanguage()
    const [dueCount, setDueCount] = useState(0)
    const [progressList, setProgressList] = useState([])
    const [history, setHistory]   = useState([])

    useEffect(() => {
        progressApi.getDueCards()
            .then(r => setDueCount(r.data.data?.length || 0))
            .catch(() => {})
        progressApi.getMyProgress()
            .then(r => {
                const data = r.data.data
                const list = Array.isArray(data) ? data : (data?.content || [])
                setProgressList(list)
            })
            .catch(() => {})
        quizApi.history()
            .then(r => setHistory(r.data.data || []))
            .catch(() => {})
    }, [])

    const totalCards = progressList.length
    const masteredCount = progressList.filter(p => p.status === 'MASTERED').length
    const streak = calculateStreak(progressList, history)
    const reviewedToday = getReviewedTodayCount(progressList)

    const nextReviewCard = progressList
        .filter(p => p.nextReviewAt && new Date(p.nextReviewAt) > new Date())
        .sort((a, b) => new Date(a.nextReviewAt) - new Date(b.nextReviewAt))[0]

    // Heatmap days for last 4 weeks (28 days)
    const heatmapDays = []
    const today = new Date()
    for (let i = 27; i >= 0; i--) {
        const d = new Date()
        d.setDate(today.getDate() - i)
        const dayStr = d.toDateString()
        const reviewsCount = progressList.filter(p => p.lastReviewedAt && new Date(p.lastReviewedAt).toDateString() === dayStr).length
        const quizCount = history.filter(q => q.startedAt && new Date(q.startedAt).toDateString() === dayStr).length
        heatmapDays.push({
            date: d,
            count: reviewsCount + quizCount
        })
    }

    return (
        <Layout>
            {/* Greeting */}
            <section className="mb-10">
                <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">
                    {t('home.greeting')}, {user?.username}!
                </h2>
                <p className="text-on-surface-variant mt-2 text-lg">
                    {t('home.subtitle')}
                </p>
            </section>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <StatCard
                    icon="style" iconFill
                    badge={`${masteredCount} ${t('home.mastered').toUpperCase()}`} badgeColor="text-primary bg-primary-fixed"
                    label={t('home.total_words_learned')}
                    value={totalCards}
                    footer={
                        <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden mt-6">
                            <div 
                                className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-500" 
                                style={{ width: `${totalCards > 0 ? (masteredCount / totalCards) * 100 : 0}%` }}
                            />
                        </div>
                    }
                />
                <StatCard
                    icon="pending_actions" iconFill iconColor="text-tertiary" iconBg="bg-tertiary/10"
                    badge={t('home.due_today')} badgeColor="text-tertiary bg-tertiary-fixed"
                    label={t('home.due_today_desc')}
                    value={dueCount}
                    footer={
                        <button onClick={() => navigate('/study')}
                                className="mt-6 w-full py-3.5 bg-tertiary text-white rounded-2xl font-bold text-sm hover:bg-tertiary-container active:scale-[0.98] shadow-md shadow-tertiary/15 transition-all">
                            {t('home.review_now')}
                        </button>
                    }
                />
                <StatCard
                    icon="local_fire_department" iconFill iconColor="text-orange-500" iconBg="bg-orange-500/10"
                    badge={`${t('home.streak').toUpperCase()}: ${streak}`} badgeColor="text-orange-600 bg-orange-100"
                    label={t('home.streak_label')}
                    value={`${streak} 🔥`}
                    footer={
                        <div className="mt-6 text-xs text-on-surface-variant flex flex-col gap-1.5">
                            <p className="font-semibold text-emerald-600 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">trending_up</span> {t('home.hard_work')}
                            </p>
                            <p className="text-outline">
                                {t('home.goal_label')
                                    .replace('{score}', user?.targetScore || 600)
                                    .replace('{mins}', user?.dailyGoalMinutes || 5)
                                }
                            </p>
                        </div>
                    }
                />
            </div>

            {/* Bottom grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent activity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold font-headline text-on-surface">{t('home.recent_quiz_history')}</h3>
                        <button onClick={() => navigate('/profile')}
                                className="text-primary font-bold text-sm hover:underline">
                            {t('home.view_all')}
                        </button>
                    </div>
                    <div className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/30 shadow-sm overflow-hidden">
                        {history.length === 0 ? (
                            <div className="p-10 text-center text-on-surface-variant">
                                <span className="material-symbols-outlined text-4xl mb-3 block text-outline">quiz</span>
                                <p className="text-sm font-medium">{t('home.no_quizzes')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-outline-variant/20">
                                {history.slice(0, 3).map(attempt => (
                                    <div key={attempt.attemptId}
                                         className="p-6 flex items-center justify-between hover:bg-surface-container/30 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-primary transition-colors duration-300">
                                                <span className="material-symbols-outlined">quiz</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-on-surface text-base">{attempt.topicName}</p>
                                                <p className="text-xs text-outline font-semibold mt-0.5">
                                                    {attempt.correctAnswers}/{attempt.totalQuestions} {t('home.correct')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border
                                                ${attempt.score >= 70
                                                  ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                                                  : 'text-tertiary bg-tertiary-fixed border-tertiary-fixed-dim'
                                                }`}>
                                                {attempt.score}/100
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Heatmap & Quick actions side column */}
                <div className="space-y-6">
                    {/* Heatmap Widget */}
                    <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/30 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-headline font-bold text-sm flex items-center gap-1.5 text-on-surface">
                                <span className="material-symbols-outlined text-primary text-lg">calendar_month</span>
                                {t('home.study_frequency')}
                            </h4>
                            <span className="text-[9px] text-outline font-bold uppercase tracking-wider">{t('home.last_4_weeks')}</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1.5 justify-center py-2 max-w-[210px] mx-auto">
                            {heatmapDays.map((day, idx) => {
                                const count = day.count
                                let color = 'bg-surface-container-high' // default empty
                                if (count > 0 && count <= 2)   color = 'bg-emerald-100/70 border border-emerald-200/50'
                                else if (count > 2 && count <= 5) color = 'bg-emerald-300/80 border border-emerald-400/50'
                                else if (count > 5)               color = 'bg-emerald-500 border border-emerald-600'
                                
                                return (
                                    <div
                                        key={idx}
                                        title={`${day.date.toLocaleDateString()}: ${count} ${t('home.activities')}`}
                                        className={`w-6 h-6 rounded-[6px] transition-all duration-300 hover:scale-115 cursor-help ${color}`}
                                    />
                                )
                            })}
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-outline px-1">
                            <span>{t('home.less_study')}</span>
                            <div className="flex gap-1">
                                <div className="w-2.5 h-2.5 bg-surface-container-high rounded-[3px]" />
                                <div className="w-2.5 h-2.5 bg-emerald-100 rounded-[3px]" />
                                <div className="w-2.5 h-2.5 bg-emerald-300 rounded-[3px]" />
                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-[3px]" />
                            </div>
                            <span>{t('home.more_study')}</span>
                        </div>
                    </div>

                    {/* Next Review Indicator */}
                    <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/30 shadow-sm space-y-3">
                        <h4 className="font-headline font-bold text-sm flex items-center gap-1.5 text-on-surface">
                            <span className="material-symbols-outlined text-tertiary text-lg">alarm</span>
                            {t('home.next_review_schedule')}
                        </h4>
                        {dueCount > 0 ? (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                                <p className="text-xs font-bold text-rose-700">{t('home.words_due_warning')}</p>
                                <p className="text-[10px] text-rose-600 mt-1 font-medium">
                                    {t('home.words_due_count').replace('{count}', dueCount)}
                                </p>
                            </div>
                        ) : nextReviewCard ? (
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <p className="text-xs font-bold text-emerald-800">{t('home.all_caught_up')}</p>
                                <p className="text-[10px] text-emerald-600 mt-1 leading-relaxed font-medium">
                                    {t('home.next_word_due')
                                        .replace('{word}', nextReviewCard.flashcard?.word)
                                        .replace('{time}', new Date(nextReviewCard.nextReviewAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
                                        .replace('{date}', new Date(nextReviewCard.nextReviewAt).toLocaleDateString())
                                    }
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-on-surface-variant leading-relaxed">{t('home.no_next_review')}</p>
                        )}
                    </div>

                    <div className="space-y-3.5">
                        <h3 className="text-lg font-bold font-headline text-on-surface">{t('home.quick_start')}</h3>
                        <QuickAction
                            icon="style" label={t('home.browse_flashcards')}
                            sub={t('home.explore_all_cards')}
                            onClick={() => navigate('/topics')}
                            gradient
                        />
                        <QuickAction
                            icon="menu_book" label={t('home.study_due_cards')}
                            sub={t('home.cards_waiting').replace('{count}', dueCount)}
                            onClick={() => navigate('/study')}
                        />
                        <QuickAction
                            icon="quiz" label={t('home.take_quiz')}
                            sub={t('home.test_your_knowledge')}
                            onClick={() => navigate('/quiz')}
                        />
                        <QuickAction
                            icon="keyboard" label={t('home.typing_practice')}
                            sub={t('home.improve_spelling')}
                            onClick={() => navigate('/typing')}
                        />
                        <QuickAction
                            icon="shuffle" label={t('home.matching_game')}
                            sub={t('home.connect_words_defs')}
                            onClick={() => navigate('/matching')}
                        />
                    </div>
                </div>
            </div>
        </Layout>
    )
}

function StatCard({ icon, iconFill, iconColor = 'text-primary', iconBg = 'bg-primary/10',
                      badge, badgeColor, label, value, footer }) {
    return (
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/30 hover:border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[220px]">
            <div>
                <div className="flex justify-between items-start mb-5">
                    <div className={`p-3 ${iconBg} rounded-2xl ${iconColor}`}>
                        <span className="material-symbols-outlined text-2xl"
                              style={{ fontVariationSettings: iconFill ? "'FILL' 1" : "'FILL' 0" }}>
                            {icon}
                        </span>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full ${badgeColor}`}>
                        {badge}
                    </span>
                </div>
                <h3 className="text-outline font-label text-xs font-bold uppercase tracking-wider">
                    {label}
                </h3>
                <p className="text-5xl font-extrabold font-headline mt-2 text-on-surface leading-none">{value}</p>
            </div>
            {footer}
        </div>
    )
}

function QuickAction({ icon, label, sub, onClick, gradient }) {
    return (
        <button onClick={onClick}
                className={`w-full p-5 rounded-2xl text-left border transition-all hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0
        ${gradient
                    ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary border-transparent shadow-lg shadow-primary/15'
                    : 'bg-surface-container-lowest hover:shadow-md border-outline-variant/30 hover:border-primary/20'
                }`}>
            <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-2xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                </span>
                <div>
                    <p className={`font-bold font-headline text-sm ${gradient ? 'text-white' : 'text-on-surface'}`}>
                        {label}
                    </p>
                    <p className={`text-xs mt-0.5 ${gradient ? 'text-white/70' : 'text-outline'}`}>
                        {sub}
                    </p>
                </div>
            </div>
        </button>
    )
}