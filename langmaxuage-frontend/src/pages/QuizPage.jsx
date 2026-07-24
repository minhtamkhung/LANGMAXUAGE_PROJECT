import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import quizApi from '../api/quizApi'
import topicApi from '../api/topicApi'
import { useLanguage } from '../context/LanguageContext'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

export default function QuizPage() {
    const navigate                  = useNavigate()
    const { locale, t }             = useLanguage()
    const [step, setStep]           = useState('setup')   // setup | playing | result
    const [topics, setTopics]       = useState([])
    const [config, setConfig]       = useState({ topicId: '', questionCount: 10 })
    const [attempt, setAttempt]     = useState(null)
    const [qIndex, setQIndex]       = useState(0)
    const [selected, setSelected]   = useState(null)
    const [answerRes, setAnswerRes] = useState(null)
    const [result, setResult]       = useState(null)
    const [loading, setLoading]     = useState(false)

    // Tải lại danh sách topic khi locale thay đổi
    useEffect(() => {
        topicApi.getAll(locale).then(r => setTopics(r.data.data || []))
    }, [locale])

    const handleStart = async () => {
        if (!config.topicId) return
        setLoading(true)
        try {
            const res = await quizApi.start({
                topicId: Number(config.topicId),
                questionCount: config.questionCount
            }, locale)
            setAttempt(res.data.data)
            setStep('playing')
            setQIndex(0)
        } catch (err) {
            alert(err.response?.data?.message || 'Cannot start quiz')
        } finally {
            setLoading(false)
        }
    }

    const handleAnswer = async (option) => {
        if (answerRes) return
        setSelected(option)
        const q = attempt.questions[qIndex]

        const res = await quizApi.answer(attempt.attemptId, {
            flashcardId: q.flashcardId,
            selectedAnswer: option,
            timeSpentSeconds: 0
        }, locale)

        setAnswerRes(res.data.data)
    }

    const handleNext = () => {
        setSelected(null)
        setAnswerRes(null)
        if (qIndex + 1 >= attempt.questions.length) {
            handleFinish()
        } else {
            setQIndex(i => i + 1)
        }
    }

    const handleFinish = async () => {
        const res = await quizApi.finish(attempt.attemptId)
        setResult(res.data.data)
        setStep('result')
    }

    const currentQ    = attempt?.questions?.[qIndex]
    const progressPct = attempt ? Math.round((qIndex / attempt.questions.length) * 100) : 0

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-8">
                
                {/* SETUP STEP */}
                {step === 'setup' && (
                    <div className="max-w-xl mx-auto animate-[fadeInUp_0.35s_ease-out]">
                        <div className="text-center mb-10">
                            <h2 className="font-headline text-4xl md:text-5xl font-black tracking-tighter text-on-surface leading-none mb-3">
                                {t('quiz.start_quiz_title')}
                            </h2>
                            <p className="text-on-surface-variant text-base font-medium">
                                {t('quiz.test_knowledge_with_lang').replace('{lang}', locale.toUpperCase())}
                            </p>
                        </div>

                        <div className="bg-surface-container-lowest rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-outline-variant/30 space-y-8">
                            {/* Topic selector */}
                            <div>
                                <label className="block text-[10px] font-bold font-label text-outline mb-3 uppercase tracking-[0.2em]">
                                    {t('quiz.select_topic')}
                                </label>
                                <div className="relative">
                                    <select 
                                        value={config.topicId}
                                        onChange={e => setConfig({ ...config, topicId: e.target.value })}
                                        className="w-full border border-outline-variant/30 rounded-2xl pl-5 pr-12 py-4 bg-surface-container-low text-on-surface font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-body transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">{t('quiz.choose_topic')}</option>
                                        {topics.map(t => (
                                            <option key={t.id} value={t.id}>{t.translatedName || t.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none flex items-center">
                                        <span className="material-symbols-outlined text-2xl">keyboard_arrow_down</span>
                                    </div>
                                </div>
                            </div>

                            {/* Question Count Selector */}
                            <div>
                                <label className="block text-[10px] font-bold font-label text-outline mb-3 uppercase tracking-[0.2em]">
                                    {t('quiz.num_questions')}
                                </label>
                                <div className="grid grid-cols-4 gap-3">
                                    {[5, 10, 20, 30].map(n => (
                                        <button 
                                            key={n} 
                                            onClick={() => setConfig({ ...config, questionCount: n })}
                                            className={`py-3.5 rounded-2xl font-black text-sm transition-all active:scale-[0.97] border-2
                                                ${config.questionCount === n
                                                    ? 'bg-primary border-primary text-on-primary shadow-md shadow-primary/15'
                                                    : 'bg-surface-container-low border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Start Button */}
                            <div className="flex justify-center pt-4">
                                <button 
                                    onClick={handleStart} 
                                    disabled={loading || !config.topicId}
                                    className="group flex items-center justify-center gap-2.5 px-12 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none text-base"
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin rounded-full h-5 w-5 border-2 border-on-primary border-t-transparent" />
                                            <span>{t('common.loading')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform duration-300">sports_esports</span>
                                            <span>{t('quiz.begin_quiz_btn')}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PLAYING STEP */}
                {step === 'playing' && currentQ && (
                    <div className="space-y-8 animate-[fadeInUp_0.35s_ease-out]">
                        {/* Progress Indicator */}
                        <div className="max-w-3xl mx-auto">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-xs font-bold text-primary font-headline tracking-widest uppercase">
                                  {t('quiz.question_indicator')
                                      .replace('{current}', qIndex + 1)
                                      .replace('{total}', attempt.questions.length)
                                  }
                                </span>
                                <span className="text-xs font-bold text-outline">
                                  {t('quiz.pct_completed').replace('{pct}', progressPct)}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-500"
                                     style={{ width: `${progressPct}%` }} />
                            </div>
                        </div>

                        {/* Question Card */}
                        <div className="max-w-3xl mx-auto bg-surface-container rounded-[2.5rem] p-10 md:p-16 shadow-sm relative overflow-hidden border border-outline-variant/20">
                            {/* Graphic elements */}
                            <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
                            
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <span className="px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase tracking-widest mb-6">
                                    {t('quiz.vocabulary_focus')}
                                </span>
                                <h1 className="text-4xl md:text-6xl font-black text-on-surface font-headline leading-none tracking-tight mb-4">
                                    {currentQ.word}
                                </h1>
                                {currentQ.pronunciation && (
                                    <p className="text-on-surface-variant italic font-mono font-medium text-lg md:text-xl">{currentQ.pronunciation}</p>
                                )}
                                <div className="w-16 h-1 bg-outline-variant/30 rounded-full my-6" />
                                <p className="text-outline text-base font-semibold italic">
                                    {t('quiz.choose_correct_def').replace('{lang}', locale.toUpperCase())}
                                </p>
                            </div>
                        </div>

                        {/* Options Grid */}
                        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentQ.options.map((option, i) => {
                                let borderClass = 'border-outline-variant/30 hover:border-primary/25 hover:bg-surface-container-low/40'
                                if (answerRes) {
                                    if (option === answerRes.correctAnswer) {
                                        borderClass = 'border-emerald-500 bg-emerald-50/50 text-emerald-800'
                                    } else if (option === selected && !answerRes.isCorrect) {
                                        borderClass = 'border-error bg-error-container/40 text-error'
                                    } else {
                                        borderClass = 'border-outline-variant/10 opacity-40'
                                    }
                                }
                                return (
                                    <button 
                                        key={i} 
                                        onClick={() => handleAnswer(option)} 
                                        disabled={!!answerRes}
                                        className={`group flex items-center justify-between p-5 md:p-6 bg-surface-container-lowest rounded-2xl border-2 ${borderClass} transition-all duration-300 text-left active:scale-[0.99] disabled:cursor-default shadow-sm`}
                                    >
                                        <div className="flex items-center gap-5 pr-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all flex-shrink-0
                                                ${answerRes && option === answerRes.correctAnswer
                                                    ? 'bg-emerald-500 text-white shadow-sm'
                                                    : answerRes && option === selected && !answerRes.isCorrect
                                                        ? 'bg-error text-white shadow-sm'
                                                        : 'bg-surface-container-high group-hover:bg-primary-fixed text-on-surface-variant group-hover:text-primary'
                                                }`}
                                            >
                                                {OPTION_LABELS[i]}
                                            </div>
                                            <span className="text-base font-semibold leading-snug">{option}</span>
                                        </div>
                                        
                                        {/* Result Icons */}
                                        {answerRes && option === answerRes.correctAnswer && (
                                            <span className="material-symbols-outlined text-emerald-500 flex-shrink-0 text-2xl">check_circle</span>
                                        )}
                                        {answerRes && option === selected && !answerRes.isCorrect && (
                                            <span className="material-symbols-outlined text-error flex-shrink-0 text-2xl">cancel</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Submit & Next actions */}
                        {answerRes && (
                            <div className="max-w-3xl mx-auto flex items-center justify-between pt-8 border-t border-outline-variant/20 mt-8">
                                <div className={`flex items-center gap-2.5 font-black text-sm md:text-base uppercase tracking-wider ${answerRes.isCorrect ? 'text-emerald-600' : 'text-error'}`}>
                                    <span className="material-symbols-outlined text-2xl">
                                      {answerRes.isCorrect ? 'task_alt' : 'error'}
                                    </span>
                                    {answerRes.isCorrect ? t('quiz.correct_feedback') : t('quiz.wrong_feedback')}
                                </div>
                                <button 
                                    onClick={handleNext}
                                    className="group flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-bold shadow-lg shadow-primary/15 hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] hover:-translate-y-0.5 transition-all active:scale-[0.98] active:translate-y-0 text-sm md:text-base"
                                >
                                    <span>{qIndex + 1 >= attempt.questions.length ? t('quiz.view_results_btn') : t('quiz.next_question_btn')}</span>
                                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* RESULT STEP */}
                {step === 'result' && result && (
                    <div className="max-w-xl mx-auto text-center animate-[fadeInUp_0.35s_ease-out]">
                        <div className="bg-surface-container-lowest rounded-[2.5rem] p-10 md:p-12 shadow-sm border border-outline-variant/30">
                            {/* Score circle */}
                            <div className="relative w-36 h-36 mx-auto mb-8 flex items-center justify-center">
                                {/* SVG background circle */}
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle 
                                        cx="50" cy="50" r="44" 
                                        className="stroke-surface-container-high fill-none" 
                                        strokeWidth="8" 
                                    />
                                    <circle 
                                        cx="50" cy="50" r="44" 
                                        className={`${result.score >= 70 ? 'stroke-primary' : 'stroke-tertiary'} fill-none transition-all duration-1000 ease-out`} 
                                        strokeWidth="8"
                                        strokeDasharray="276"
                                        strokeDashoffset={276 - (276 * result.score) / 100}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                
                                <div className="absolute flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-on-surface font-headline leading-none">
                                        {result.score}
                                    </span>
                                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider mt-1">Score</span>
                                </div>
                            </div>

                            <h2 className="font-headline text-3xl font-black text-on-surface mb-2">
                                {result.score >= 70 ? '🎉 Outstanding!' : '📚 Good Effort!'}
                            </h2>
                            
                            <p className="text-on-surface-variant font-semibold text-sm mb-10">
                                {t('quiz.correct_answers_count')
                                    .replace('{correct}', result.correctAnswers)
                                    .replace('{total}', result.totalQuestions)
                                }
                            </p>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => {
                                        setStep('setup'); setAttempt(null); setResult(null);
                                        setQIndex(0); setSelected(null); setAnswerRes(null);
                                    }}
                                    className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold shadow-lg shadow-primary/15 hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.005] active:scale-[0.98] transition-all text-sm"
                                >
                                    {t('quiz.try_another_topic')}
                                </button>
                                <button 
                                    onClick={() => navigate('/home')}
                                    className="w-full border-2 border-outline-variant/30 text-on-surface-variant py-3.5 rounded-2xl font-bold hover:bg-surface-container/30 transition-all active:scale-[0.98] text-sm"
                                >
                                    {t('quiz.back_to_homepage')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
            </div>
        </Layout>
    )
}