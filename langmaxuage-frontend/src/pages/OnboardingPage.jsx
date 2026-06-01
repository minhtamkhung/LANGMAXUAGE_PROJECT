import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import userApi from '../api/userApi'
import topicApi from '../api/topicApi'

const SCORES = (t) => [
    { value: 600, label: t('onboarding.score_600_label'), desc: t('onboarding.score_600_desc'), color: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/10 text-emerald-800' },
    { value: 750, label: t('onboarding.score_750_label'), desc: t('onboarding.score_750_desc'), color: 'border-amber-200 hover:border-amber-400 bg-amber-50/10 text-amber-800' },
    { value: 900, label: t('onboarding.score_900_label'), desc: t('onboarding.score_900_desc'), color: 'border-primary-container hover:border-primary bg-primary/5 text-primary' },
]

const GOALS = (t) => [
    { value: 5, label: t('onboarding.goal_5_label'), desc: t('onboarding.goal_5_desc') },
    { value: 10, label: t('onboarding.goal_10_label'), desc: t('onboarding.goal_10_desc') },
    { value: 20, label: t('onboarding.goal_20_label'), desc: t('onboarding.goal_20_desc') },
]

const WELCOME_SLIDES = (t) => [
    {
        title: t('onboarding.slide_1_title'),
        subtitle: t('onboarding.slide_1_subtitle'),
        icon: 'explore',
        color: 'text-primary bg-primary/10',
    },
    {
        title: t('onboarding.slide_2_title'),
        subtitle: t('onboarding.slide_2_subtitle'),
        icon: 'update',
        color: 'text-amber-500 bg-amber-500/10',
    },
    {
        title: t('onboarding.slide_3_title'),
        subtitle: t('onboarding.slide_3_subtitle'),
        icon: 'analytics',
        color: 'text-emerald-500 bg-emerald-500/10',
    },
]

export default function OnboardingPage() {
    const navigate = useNavigate()
    const { user, updateUser } = useAuth()
    const { locale, t } = useLanguage()

    const welcomeSlides = WELCOME_SLIDES(t)
    const scores = SCORES(t)
    const goals = GOALS(t)

    const [step, setStep] = useState(1)
    const [welcomeIndex, setWelcomeIndex] = useState(0)

    const [targetScore, setTargetScore] = useState(750)
    const [dailyGoal, setDailyGoal] = useState(10)
    const [selectedTopic, setSelectedTopic] = useState(null)

    const [topics, setTopics] = useState([])
    const [loadingTopics, setLoadingTopics] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    // Tải các topic để người dùng chọn làm topic đầu tiên
    useEffect(() => {
        if (step === 4) {
            setLoadingTopics(true)
            topicApi.getAll(locale)
                .then(res => {
                    const content = res.data.data || []
                    setTopics(content)
                    if (content.length > 0) {
                        setSelectedTopic(content[0].id)
                    }
                })
                .catch(() => setError(t('onboarding.no_topics')))
                .finally(() => setLoadingTopics(false))
        }
    }, [step, locale, t])

    const handleNextStep = () => {
        if (step === 1) {
            if (welcomeIndex < welcomeSlides.length - 1) {
                setWelcomeIndex(v => v + 1)
            } else {
                setStep(2)
            }
        } else {
            setStep(v => v + 1)
        }
    }

    const handleBackStep = () => {
        if (step === 1) {
            if (welcomeIndex > 0) {
                setWelcomeIndex(v => v - 1)
            }
        } else {
            setStep(v => v - 1)
        }
    }

    const handleSubmit = async () => {
        setSubmitting(true)
        setError('')
        try {
            const payload = {
                onboarded: true,
                targetScore,
                dailyGoalMinutes: dailyGoal,
            }
            const res = await userApi.updateMe(payload)
            updateUser(res.data.data) // Cập nhật Auth Context ngay lập tức

            // Chuyển hướng người học vào thẳng Topic đầu tiên đã chọn
            if (selectedTopic) {
                navigate(`/flashcards/${selectedTopic}`)
            } else {
                navigate('/home')
            }
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'))
        } finally {
            setSubmitting(false)
        }
    }

    const activeSlide = welcomeSlides[welcomeIndex]

    return (
        <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-6 select-none relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] aspect-square rounded-full bg-primary/5 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] aspect-square rounded-full bg-secondary/5 blur-[120px]" />

            <div className="relative z-10 w-full max-w-2xl bg-surface-container-low border border-outline-variant/15
                            rounded-[2.5rem] shadow-2xl p-8 md:p-12 transition-all duration-300">
                
                {/* Progress bar */}
                <div className="flex items-center gap-1.5 mb-12">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className="flex-1 h-2.5 rounded-full overflow-hidden bg-surface-container-high">
                            <div className={`h-full transition-all duration-500
                                ${step > s ? 'bg-primary' : step === s ? 'bg-gradient-to-r from-primary to-primary-container w-[100%]' : 'w-0'}`}
                            />
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-error text-sm font-semibold mb-6 p-4 bg-error-container rounded-2xl">
                        <span className="material-symbols-outlined text-base">error</span>
                        {error}
                    </div>
                )}

                {/* ── STEP 1: WELCOME SLIDER ── */}
                {step === 1 && (
                    <div className="space-y-8 animate-[fadeInUp_0.35s_ease-out]">
                        <div className="text-center space-y-6">
                            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto transition-all duration-300 ${activeSlide.color}`}>
                                <span className="material-symbols-outlined text-5xl animate-[pulse_2s_infinite]">
                                    {activeSlide.icon}
                                </span>
                            </div>
                            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight leading-snug">
                                {activeSlide.title}
                            </h1>
                            <p className="text-on-surface-variant text-base leading-relaxed max-w-lg mx-auto">
                                {activeSlide.subtitle}
                            </p>
                        </div>

                        {/* Slider dots */}
                        <div className="flex justify-center gap-2 pt-2">
                            {welcomeSlides.map((_, idx) => (
                                <button key={idx} onClick={() => setWelcomeIndex(idx)}
                                        className={`h-2 rounded-full transition-all duration-300
                                            ${welcomeIndex === idx ? 'w-6 bg-primary' : 'w-2 bg-outline-variant/35'}`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── STEP 2: TARGET SCORE ── */}
                {step === 2 && (
                    <div className="space-y-8 animate-[fadeInUp_0.35s_ease-out]">
                        <div className="text-center">
                            <span className="text-xs font-bold text-secondary uppercase tracking-widest">{t('onboarding.step_2_of_4')}</span>
                            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight mt-1.5">
                                {t('onboarding.title_2')}
                            </h1>
                            <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
                                {t('onboarding.desc_2')}
                            </p>
                        </div>

                        <div className="space-y-3 pt-2">
                            {scores.map(sc => (
                                <div key={sc.value} onClick={() => setTargetScore(sc.value)}
                                     className={`flex items-start gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.01]
                                         ${targetScore === sc.value
                                             ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                                             : 'border-outline-variant/15 hover:border-outline-variant/40 bg-surface-container-low'
                                         }`}
                                >
                                    <div className="flex items-center justify-center mt-1">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                            ${targetScore === sc.value ? 'border-primary' : 'border-outline'}`}>
                                            {targetScore === sc.value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-headline font-bold text-on-surface text-base">{sc.label}</h3>
                                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{sc.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── STEP 3: DAILY STUDY GOAL ── */}
                {step === 3 && (
                    <div className="space-y-8 animate-[fadeInUp_0.35s_ease-out]">
                        <div className="text-center">
                            <span className="text-xs font-bold text-secondary uppercase tracking-widest">{t('onboarding.step_3_of_4')}</span>
                            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight mt-1.5">
                                {t('onboarding.title_3')}
                            </h1>
                            <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
                                {t('onboarding.desc_3')}
                            </p>
                        </div>

                        <div className="space-y-3 pt-2">
                            {goals.map(gl => (
                                <div key={gl.value} onClick={() => setDailyGoal(gl.value)}
                                     className={`flex items-start gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.01]
                                         ${dailyGoal === gl.value
                                             ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                                             : 'border-outline-variant/15 hover:border-outline-variant/40 bg-surface-container-low'
                                         }`}
                                >
                                    <div className="flex items-center justify-center mt-1">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                            ${dailyGoal === gl.value ? 'border-primary' : 'border-outline'}`}>
                                            {dailyGoal === gl.value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-headline font-bold text-on-surface text-base">{gl.label}</h3>
                                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{gl.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── STEP 4: FIRST TOPIC ── */}
                {step === 4 && (
                    <div className="space-y-8 animate-[fadeInUp_0.35s_ease-out]">
                        <div className="text-center">
                            <span className="text-xs font-bold text-secondary uppercase tracking-widest">{t('onboarding.step_4_of_4')}</span>
                            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight mt-1.5">
                                {t('onboarding.title_4')}
                            </h1>
                            <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
                                {t('onboarding.desc_4')}
                            </p>
                        </div>

                        {loadingTopics ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : topics.length === 0 ? (
                            <div className="text-center py-12 text-on-surface-variant text-sm">
                                {t('onboarding.no_topics')}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                                {topics.map(tp => (
                                    <div key={tp.id} onClick={() => setSelectedTopic(tp.id)}
                                         className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.01] flex flex-col justify-between
                                             ${selectedTopic === tp.id
                                                 ? 'border-primary bg-primary/5'
                                                 : 'border-outline-variant/15 hover:border-outline-variant/30 bg-surface-container-low'
                                             }`}
                                    >
                                        <div>
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                                                <span className="material-symbols-outlined text-sm">auto_stories</span>
                                            </div>
                                            <h3 className="font-headline font-bold text-on-surface text-sm line-clamp-1">{tp.name}</h3>
                                            <p className="text-[10px] text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
                                                {tp.description || 'TOEIC vocabulary topic.'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Navigation Buttons */}
                <div className="flex items-center justify-between mt-12 pt-6 border-t border-outline-variant/10">
                    {/* Back Button */}
                    {(step > 1 || welcomeIndex > 0) ? (
                        <button onClick={handleBackStep} disabled={submitting}
                                className="flex items-center gap-2 px-5 py-3 border-2 border-outline-variant/30 text-on-surface-variant
                                           font-semibold rounded-2xl hover:bg-surface-container transition-all text-sm active:scale-95 disabled:opacity-50">
                            <span className="material-symbols-outlined text-base">arrow_back</span>
                            {t('common.back')}
                        </button>
                    ) : (
                        <div />
                    )}

                    {/* Forward / Finish Button */}
                    {step < 4 ? (
                        <button onClick={handleNextStep}
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary
                                           font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/35
                                           transition-all active:scale-95 text-sm ml-auto">
                            {t('common.continue')}
                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={submitting || topics.length === 0}
                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-primary-container
                                           text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/35
                                           transition-all active:scale-95 text-sm ml-auto disabled:opacity-50">
                            {submitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                    </svg>
                                    {t('onboarding.setting_up')}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    {t('onboarding.start_now')}
                                </span>
                            )}
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}

