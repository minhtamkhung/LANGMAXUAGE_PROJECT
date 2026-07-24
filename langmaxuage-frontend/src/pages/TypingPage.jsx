import { useEffect, useRef, useState } from 'react'
import { useNavigate }                 from 'react-router-dom'
import Layout                          from '../components/Layout'
import typingApi                       from '../api/typingApi'
import topicApi                        from '../api/topicApi'
import { useLanguage }                 from '../context/LanguageContext'

/* ─────────────────────────────────────────────────────────────────────────── *
 * TypingPage — Chế độ luyện gõ chính tả (Typing Practice)
 * Bước 1 (setup)   → Chọn topic + số lượng thẻ
 * Bước 2 (playing) → Xem nghĩa / ví dụ, gõ từ đúng, Enter để tiếp
 * Bước 3 (result)  → Hiển thị accuracy, bảng chi tiết, nút chơi lại
 * ─────────────────────────────────────────────────────────────────────────── */
export default function TypingPage() {
    const navigate          = useNavigate()
    const { locale, t }     = useLanguage()

    // ── Step machine ─────────────────────────────────────────────────────────
    const [step, setStep]   = useState('setup') // setup | playing | result

    // ── Setup ────────────────────────────────────────────────────────────────
    const [topics, setTopics]           = useState([])
    const [config, setConfig]           = useState({ topicId: '', cardCount: 10 })
    const [loadingStart, setLoadingStart] = useState(false)

    // ── Playing ──────────────────────────────────────────────────────────────
    const [session, setSession]         = useState(null)   // TypingStartResponse
    const [cardIndex, setCardIndex]     = useState(0)
    const [typed, setTyped]             = useState('')
    const [submitState, setSubmitState] = useState(null)   // null | 'correct' | 'wrong'
    const [answers, setAnswers]         = useState([])     // [{flashcardId, typedAnswer}]
    const [startTime, setStartTime]     = useState(null)
    const inputRef                      = useRef(null)

    // ── Result ───────────────────────────────────────────────────────────────
    const [result, setResult]           = useState(null)   // TypingSubmitResponse
    const [submitting, setSubmitting]   = useState(false)

    // ── Tải topics khi locale thay đổi ───────────────────────────────────────
    useEffect(() => {
        topicApi.getAll(locale).then(r => setTopics(r.data.data || []))
    }, [locale])

    // ── Focus input khi đổi card ─────────────────────────────────────────────
    useEffect(() => {
        if (step === 'playing') {
            inputRef.current?.focus()
        }
    }, [step, cardIndex])

    // ── Lắng nghe phím mũi tên phải (->) để qua câu tiếp theo khi đã check ─────
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (step === 'playing' && submitState) {
                if (e.key === 'ArrowRight') {
                    e.preventDefault()
                    handleNext()
                }
            }
        }
        window.addEventListener('keydown', handleGlobalKeyDown)
        return () => window.removeEventListener('keydown', handleGlobalKeyDown)
    }, [step, submitState])

    // ── Helpers ──────────────────────────────────────────────────────────────
    const currentCard    = session?.cards?.[cardIndex]
    const totalCards     = session?.cards?.length ?? 0
    const progressPct    = totalCards > 0 ? Math.round((cardIndex / totalCards) * 100) : 0
    const displayDef     = currentCard?.primaryDefinition ?? currentCard?.definition ?? ''
    const displayExample = currentCard?.exampleSentence  ?? ''

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleStart = async () => {
        if (!config.topicId) return
        setLoadingStart(true)
        try {
            const res = await typingApi.start(
                { topicId: Number(config.topicId), cardCount: config.cardCount },
                locale
            )
            setSession(res.data.data)
            setAnswers([])
            setCardIndex(0)
            setTyped('')
            setSubmitState(null)
            setStartTime(Date.now())
            setStep('playing')
        } catch (err) {
            alert(err.response?.data?.message || t('common.error'))
        } finally {
            setLoadingStart(false)
        }
    }

    const playTingSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext
            if (!AudioContext) return
            const ctx = new AudioContext()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            
            osc.connect(gain)
            gain.connect(ctx.destination)
            
            osc.frequency.setValueAtTime(1046.50, ctx.currentTime) // C6
            osc.frequency.exponentialRampToValueAtTime(1567.98, ctx.currentTime + 0.15) // G6
            
            gain.gain.setValueAtTime(0.15, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
            
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + 0.6)
        } catch (e) {
            console.error("Failed to play ting sound:", e)
        }
    }

    const handleCheck = () => {
        if (!currentCard || submitState) return
        const userWord     = typed.trim()
        const correct      = userWord.toLowerCase() === currentCard.word.toLowerCase()
        setSubmitState(correct ? 'correct' : 'wrong')

        setAnswers(prev => [...prev, {
            flashcardId: currentCard.id,
            typedAnswer: userWord,
        }])

        // Bật âm thanh ting khi đúng
        if (correct) {
            playTingSound()
        }
    }

    const handleNext = () => {
        if (cardIndex + 1 >= totalCards) {
            handleFinish()
        } else {
            setCardIndex(i => i + 1)
            setTyped('')
            setSubmitState(null)
        }
    }

    const handleSkip = () => {
        if (submitState) { handleNext(); return }
        // Bỏ qua card hiện tại (ghi là sai/rỗng)
        setAnswers(prev => [...prev, {
            flashcardId: currentCard.id,
            typedAnswer: '',
        }])
        handleNext()
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (!submitState) handleCheck()
            else              handleNext()
        }
    }

    const handleFinish = async () => {
        setSubmitting(true)
        try {
            const duration = startTime ? Math.round((Date.now() - startTime) / 1000) : null
            // Đảm bảo tất cả card đã có câu trả lời (card cuối nếu skip)
            const finalAnswers = [...answers]
            if (submitState && finalAnswers.length === totalCards - 1 && currentCard) {
                // đã handled ở handleCheck, không cần thêm
            }
            const res = await typingApi.submit(
                { sessionId: session.sessionId, durationSeconds: duration, answers: finalAnswers },
                locale
            )
            setResult(res.data.data)
            setStep('result')
        } catch (err) {
            alert(err.response?.data?.message || t('common.error'))
        } finally {
            setSubmitting(false)
        }
    }

    const handlePlayAgain = () => {
        setStep('setup')
        setSession(null)
        setResult(null)
        setAnswers([])
        setCardIndex(0)
        setTyped('')
        setSubmitState(null)
    }

    // ──────────────────────────────────────────────────────────────────────────
    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-8">

                {/* ═══════════════════════ SETUP ════════════════════════════ */}
                {step === 'setup' && (
                    <div className="max-w-xl mx-auto animate-[fadeInUp_0.35s_ease-out]">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-fixed/30 text-on-secondary-fixed text-xs font-bold uppercase tracking-widest mb-4">
                                <span className="material-symbols-outlined text-base">keyboard</span>
                                {t('typing.mode_badge')}
                            </div>
                            <h2 className="font-headline text-4xl md:text-5xl font-black tracking-tighter text-on-surface leading-none mb-3">
                                {t('typing.title')}
                            </h2>
                            <p className="text-on-surface-variant text-base font-medium">
                                {t('typing.subtitle')}
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
                                        className="w-full border border-outline-variant/30 rounded-2xl pl-5 pr-12 py-4 bg-surface-container-low text-on-surface font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">{t('quiz.choose_topic')}</option>
                                        {topics.map(topic => (
                                            <option key={topic.id} value={topic.id}>
                                                {topic.translatedName || topic.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">
                                        <span className="material-symbols-outlined text-2xl">keyboard_arrow_down</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Count */}
                            <div>
                                <label className="block text-[10px] font-bold font-label text-outline mb-3 uppercase tracking-[0.2em]">
                                    {t('typing.card_count_label')}
                                </label>
                                <div className="grid grid-cols-4 gap-3">
                                    {[5, 10, 20, 30].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setConfig({ ...config, cardCount: n })}
                                            className={`py-3.5 rounded-2xl font-black text-sm transition-all active:scale-[0.97] border-2
                                                ${config.cardCount === n
                                                    ? 'bg-primary border-primary text-on-primary shadow-md shadow-primary/15'
                                                    : 'bg-surface-container-low border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Start button */}
                            <div className="flex justify-center pt-2">
                                <button
                                    onClick={handleStart}
                                    disabled={loadingStart || !config.topicId}
                                    className="group flex items-center justify-center gap-2.5 px-12 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none text-base"
                                >
                                    {loadingStart ? (
                                        <>
                                            <span className="animate-spin rounded-full h-5 w-5 border-2 border-on-primary border-t-transparent" />
                                            <span>{t('common.loading')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform duration-300">keyboard</span>
                                            <span>{t('typing.start_btn')}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════ PLAYING ══════════════════════════ */}
                {step === 'playing' && currentCard && (
                    <div className="space-y-6 animate-[fadeInUp_0.35s_ease-out]">

                        {/* Progress bar */}
                        <div className="max-w-3xl mx-auto">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-bold text-primary font-headline tracking-widest uppercase">
                                    {t('typing.card_indicator')
                                        .replace('{current}', cardIndex + 1)
                                        .replace('{total}', totalCards)}
                                </span>
                                <span className="text-xs font-bold text-outline">
                                    {progressPct}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-500"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Main card */}
                        <div className="max-w-3xl mx-auto bg-surface-container rounded-[2.5rem] p-10 md:p-14 shadow-sm border border-outline-variant/20 relative overflow-hidden">
                            {/* Decorative blob */}
                            <div className="absolute top-[-60px] right-[-60px] w-[180px] h-[180px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

                            <div className="relative z-10 flex flex-col items-center text-center gap-4">
                                {/* Badge */}
                                <span className="px-4 py-1.5 rounded-full bg-tertiary-fixed/30 text-on-tertiary-fixed text-[10px] font-bold uppercase tracking-widest">
                                    {t('typing.hint_label')}
                                </span>

                                {/* Definition — đây là clue chính */}
                                <p className="text-2xl md:text-3xl font-bold text-on-surface leading-snug max-w-lg">
                                    {displayDef}
                                </p>

                                {/* Example sentence nếu có */}
                                {displayExample && (
                                    <p className="text-sm text-on-surface-variant italic max-w-md">
                                        &ldquo;{displayExample}&rdquo;
                                    </p>
                                )}

                                {/* Word length hint: _ _ _ _ */}
                                <div className="flex items-center gap-1.5 flex-wrap justify-center mt-1">
                                    {currentCard.word.split('').map((ch, i) => (
                                        <span key={i} className={`inline-block w-5 text-center font-mono font-black text-lg border-b-2 transition-all duration-200
                                            ${ch === ' ' ? 'border-transparent' : 'border-outline-variant/50'}
                                            ${submitState === 'correct' ? 'border-green-400 text-green-600' : ''}
                                            ${submitState === 'wrong'   ? 'border-red-400 text-red-500' : ''}
                                        `}>
                                            {submitState ? ch : (ch === ' ' ? ' ' : '_')}
                                        </span>
                                    ))}
                                </div>

                                {/* Input */}
                                <div className={`w-full max-w-sm mt-2 transition-all duration-300 ${
                                    submitState === 'wrong'   ? 'animate-[shake_0.4s_ease]' : ''
                                }`}>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={typed}
                                        onChange={e => !submitState && setTyped(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={!!submitState}
                                        placeholder={t('typing.input_placeholder')}
                                        className={`w-full text-center text-xl font-bold rounded-2xl px-5 py-4 border-2 outline-none transition-all duration-300 bg-surface font-mono tracking-widest
                                            ${submitState === 'correct'
                                                ? 'border-green-400 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                : submitState === 'wrong'
                                                    ? 'border-red-400 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                                    : 'border-outline-variant/40 hover:border-outline focus:border-primary focus:ring-4 focus:ring-primary/10 text-on-surface'
                                            }`}
                                    />
                                </div>

                                {/* Feedback banner */}
                                {submitState && (
                                    <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm animate-[fadeInUp_0.2s_ease-out]
                                        ${submitState === 'correct'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        <span className="material-symbols-outlined text-base">
                                            {submitState === 'correct' ? 'check_circle' : 'cancel'}
                                        </span>
                                        {submitState === 'correct'
                                            ? t('typing.correct_feedback')
                                            : `${t('typing.wrong_feedback')} "${currentCard.word}"`
                                        }
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                            {/* Skip */}
                            <button
                                onClick={handleSkip}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
                            >
                                <span className="material-symbols-outlined text-base">skip_next</span>
                                {t('typing.skip_btn')}
                            </button>

                            {/* Check / Next */}
                            {!submitState ? (
                                <button
                                    onClick={handleCheck}
                                    disabled={!typed.trim()}
                                    className="flex items-center gap-2 px-8 py-3.5 bg-primary text-on-primary rounded-2xl font-bold text-sm hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-primary/20"
                                >
                                    <span className="material-symbols-outlined text-base">check</span>
                                    {t('typing.check_btn')}
                                </button>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-2 px-8 py-3.5 bg-primary text-on-primary rounded-2xl font-bold text-sm hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/20"
                                >
                                    {cardIndex + 1 >= totalCards ? (
                                        <>
                                            <span className="material-symbols-outlined text-base">flag</span>
                                            {submitting ? t('common.loading') : t('typing.finish_btn')}
                                        </>
                                    ) : (
                                        <>
                                            <span>{t('typing.next_btn')}</span>
                                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════ RESULT ═══════════════════════════ */}
                {step === 'result' && result && (
                    <div className="space-y-8 animate-[fadeInUp_0.4s_ease-out]">

                        {/* Score card */}
                        <div className="max-w-2xl mx-auto bg-surface-container-lowest rounded-[2.5rem] p-10 text-center shadow-sm border border-outline-variant/20 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                            <div className="relative z-10">
                                <div className="text-6xl mb-4">
                                    {result.accuracy >= 80 ? '🎉' : result.accuracy >= 50 ? '💪' : '📖'}
                                </div>
                                <h2 className="font-headline text-4xl font-black text-on-surface mb-2">
                                    {result.accuracy}%
                                </h2>
                                <p className="text-on-surface-variant font-medium mb-6">
                                    {t('typing.accuracy_label')}
                                </p>

                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    {[
                                        { label: t('typing.correct_count'), value: result.correctCount, icon: 'check_circle', color: 'text-green-500' },
                                        { label: t('typing.total_count'),   value: result.totalCards,   icon: 'quiz',         color: 'text-primary' },
                                        { label: t('typing.time_label'),    value: result.durationSeconds ? `${result.durationSeconds}s` : '—', icon: 'timer', color: 'text-secondary' },
                                    ].map(stat => (
                                        <div key={stat.label} className="bg-surface-container rounded-2xl p-4">
                                            <span className={`material-symbols-outlined text-2xl mb-1 ${stat.color}`}>{stat.icon}</span>
                                            <div className="font-black text-2xl text-on-surface">{stat.value}</div>
                                            <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Action buttons */}
                                <div className="flex justify-center gap-3 flex-wrap">
                                    <button
                                        onClick={handlePlayAgain}
                                        className="flex items-center gap-2 px-8 py-3.5 bg-primary text-on-primary rounded-2xl font-bold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/20"
                                    >
                                        <span className="material-symbols-outlined text-base">replay</span>
                                        {t('typing.play_again_btn')}
                                    </button>
                                    <button
                                        onClick={() => navigate('/home')}
                                        className="flex items-center gap-2 px-8 py-3.5 bg-surface-container text-on-surface rounded-2xl font-bold hover:bg-surface-container-high hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        <span className="material-symbols-outlined text-base">home</span>
                                        {t('quiz.back_to_homepage')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Detail table */}
                        {result.details && result.details.length > 0 && (
                            <div className="max-w-2xl mx-auto">
                                <h3 className="text-sm font-bold text-outline uppercase tracking-widest mb-4 px-1">
                                    {t('typing.details_title')}
                                </h3>
                                <div className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/20 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-outline-variant/20 bg-surface-container/50">
                                                <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">{t('typing.col_word')}</th>
                                                <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">{t('typing.col_typed')}</th>
                                                <th className="text-center px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">{t('typing.col_result')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.details.map((row, i) => (
                                                <tr key={i} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/40 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-on-surface font-mono">{row.word}</td>
                                                    <td className={`px-6 py-4 font-mono ${row.correct ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                                        {row.typedAnswer || <span className="text-outline italic">({t('typing.skipped')})</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`material-symbols-outlined text-xl ${row.correct ? 'text-green-500' : 'text-red-400'}`}>
                                                            {row.correct ? 'check_circle' : 'cancel'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    )
}
