import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import progressApi from '../api/progressApi'
import quizApi from '../api/quizApi'

export default function HomePage() {
    const { user }                = useAuth()
    const navigate                = useNavigate()
    const [dueCount, setDueCount] = useState(0)
    const [history, setHistory]   = useState([])

    useEffect(() => {
        progressApi.getDueCards()
            .then(r => setDueCount(r.data.data?.length || 0))
            .catch(() => {})
        quizApi.history()
            .then(r => setHistory(r.data.data?.slice(0, 3) || []))
            .catch(() => {})
    }, [])

    return (
        <Layout>
            {/* Greeting */}
            <section className="mb-10">
                <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">
                    Hello, {user?.username}!
                </h2>
                <p className="text-on-surface-variant mt-2 text-lg">
                    Your cognitive sanctuary is ready. Continue your TOEIC mastery.
                </p>
            </section>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <StatCard
                    icon="style" iconFill
                    badge="MASTERED" badgeColor="text-primary bg-primary-fixed"
                    label="Total flashcards"
                    value="–"
                    footer={<div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden mt-6">
                        <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full w-3/4" />
                    </div>}
                />
                <StatCard
                    icon="pending_actions" iconFill iconColor="text-tertiary" iconBg="bg-tertiary/10"
                    badge="DUE TODAY" badgeColor="text-tertiary bg-tertiary-fixed"
                    label="Cards to review"
                    value={dueCount}
                    footer={
                        <button onClick={() => navigate('/study')}
                                className="mt-6 w-full py-3 bg-tertiary text-white rounded-DEFAULT font-bold text-sm hover:bg-tertiary-container hover:scale-[1.02] active:scale-95 shadow-lg shadow-tertiary/20 transition-all">
                            START REVIEW
                        </button>
                    }
                />
                <StatCard
                    icon="history_edu" iconFill iconColor="text-secondary" iconBg="bg-secondary/10"
                    badge="TOTAL" badgeColor="text-secondary bg-secondary-fixed"
                    label="Quiz attempts"
                    value={history.length}
                    footer={
                        <div className="mt-6 flex items-center gap-2">
              <span className="text-emerald-600 font-bold flex items-center gap-1 text-sm">
                <span className="material-symbols-outlined text-sm">trending_up</span> Active
              </span>
                            <span className="text-outline text-xs font-medium">learning streak</span>
                        </div>
                    }
                />
            </div>

            {/* Bottom grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent activity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold font-headline">Recent Quiz History</h3>
                        <button onClick={() => navigate('/quiz')}
                                className="text-primary font-bold text-sm hover:underline">
                            View All
                        </button>
                    </div>
                    <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
                        {history.length === 0 ? (
                            <div className="p-8 text-center text-on-surface-variant">
                                <span className="material-symbols-outlined text-4xl mb-2 block">quiz</span>
                                <p className="text-sm">No quiz attempts yet. Start your first quiz!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-surface-container">
                                {history.map(attempt => (
                                    <div key={attempt.attemptId}
                                         className="p-5 flex items-center justify-between hover:bg-surface-container transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary-fixed transition-colors">
                                                <span className="material-symbols-outlined">quiz</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-on-surface">{attempt.topicName}</p>
                                                <p className="text-xs text-outline font-medium">
                                                    {attempt.correctAnswers}/{attempt.totalQuestions} correct
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border
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

                {/* Quick actions */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold font-headline">Quick Start</h3>
                    <QuickAction
                        icon="style" label="Browse Flashcards"
                        sub="Explore all your cards"
                        onClick={() => navigate('/topics')}
                        gradient
                    />
                    <QuickAction
                        icon="menu_book" label="Study Due Cards"
                        sub={`${dueCount} cards waiting`}
                        onClick={() => navigate('/study')}
                    />
                    <QuickAction
                        icon="quiz" label="Take a Quiz"
                        sub="Test your knowledge"
                        onClick={() => navigate('/quiz')}
                    />
                </div>
            </div>
        </Layout>
    )
}

function StatCard({ icon, iconFill, iconColor = 'text-primary', iconBg = 'bg-primary/10',
                      badge, badgeColor, label, value, footer }) {
    return (
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 ${iconBg} rounded-2xl ${iconColor}`}>
          <span className="material-symbols-outlined"
                style={{ fontVariationSettings: iconFill ? "'FILL' 1" : "'FILL' 0" }}>
            {icon}
          </span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${badgeColor}`}>
          {badge}
        </span>
            </div>
            <h3 className="text-outline font-label text-sm font-semibold uppercase tracking-wider">
                {label}
            </h3>
            <p className="text-5xl font-extrabold font-headline mt-2 text-on-surface">{value}</p>
            {footer}
        </div>
    )
}

function QuickAction({ icon, label, sub, onClick, gradient }) {
    return (
        <button onClick={onClick}
                className={`w-full p-5 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-95
        ${gradient
                    ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20'
                    : 'bg-surface-container-lowest hover:shadow-md border border-outline-variant/10'
                }`}>
            <div className="flex items-center gap-3">
        <span className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
                <div>
                    <p className={`font-bold font-headline text-sm ${gradient ? '' : 'text-on-surface'}`}>
                        {label}
                    </p>
                    <p className={`text-xs mt-0.5 ${gradient ? 'text-on-primary/70' : 'text-outline'}`}>
                        {sub}
                    </p>
                </div>
            </div>
        </button>
    )
}