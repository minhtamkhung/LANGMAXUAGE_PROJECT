import { useEffect, useRef, useState } from 'react'
import { useNavigate }                 from 'react-router-dom'
import Layout                          from '../components/Layout'
import matchingApi                     from '../api/matchingApi'
import topicApi                        from '../api/topicApi'
import { useLanguage }                 from '../context/LanguageContext'

/* ─────────────────────────────────────────────────────────────────────────── *
 * MatchingPage — Chế độ chơi nối từ (Matching Game)
 * Bước 1 (setup)   → Chọn topic + số lượng cặp từ (4 - 12)
 * Bước 2 (playing) → Chọn Từ bên trái và Định nghĩa bên phải để nối
 * Bước 3 (result)  → Hiển thị accuracy, số cặp đúng, thời gian
 * ─────────────────────────────────────────────────────────────────────────── */
export default function MatchingPage() {
    const navigate          = useNavigate()
    const { locale, t }     = useLanguage()

    // ── Step machine ─────────────────────────────────────────────────────────
    const [step, setStep]   = useState('setup') // setup | playing | result

    // ── Setup ────────────────────────────────────────────────────────────────
    const [topics, setTopics]             = useState([])
    const [config, setConfig]             = useState({ topicId: '', pairCount: 6 })
    const [loadingStart, setLoadingStart] = useState(false)

    // ── Playing ──────────────────────────────────────────────────────────────
    const [session, setSession]           = useState(null)   // MatchingStartResponse
    const [words, setWords]               = useState([])     // [{id, word, pronunciation}]
    const [definitions, setDefinitions]   = useState([])     // [{flashcardId, text}]
    
    const [selectedWordId, setSelectedWordId] = useState(null)
    const [selectedDefId, setSelectedDefId]   = useState(null)
    
    const [matchedWordIds, setMatchedWordIds] = useState(new Set())
    const [matchedDefIds, setMatchedDefIds]   = useState(new Set())
    
    // Lưu các cặp ghép lỗi để nhấp nháy đỏ + shake
    const [wrongWordId, setWrongWordId]       = useState(null)
    const [wrongDefId, setWrongDefId]         = useState(null)
    
    const [submittedPairs, setSubmittedPairs] = useState([])     // [{wordId, definitionId}]
    const [mistakeCount, setMistakeCount]     = useState(0)
    const [startTime, setStartTime]           = useState(null)
    const [elapsedTime, setElapsedTime]       = useState(0)
    const timerRef                            = useRef(null)

    // ── Result ───────────────────────────────────────────────────────────────
    const [result, setResult]             = useState(null)   // MatchingSubmitResponse
    const [submitting, setSubmitting]     = useState(false)

    // ── Tải danh sách topic ──────────────────────────────────────────────────
    useEffect(() => {
        topicApi.getAll(locale).then(r => setTopics(r.data.data || []))
    }, [locale])

    // ── Đồng hồ đếm thời gian ────────────────────────────────────────────────
    useEffect(() => {
        if (step === 'playing') {
            setStartTime(Date.now())
            setElapsedTime(0)
            timerRef.current = setInterval(() => {
                setElapsedTime(t => t + 1)
            }, 1000)
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [step])

    // ── Khởi tạo màn chơi ────────────────────────────────────────────────────
    const handleStart = async () => {
        if (!config.topicId) return
        setLoadingStart(true)
        try {
            const res = await matchingApi.start(
                { topicId: Number(config.topicId), pairCount: Number(config.configPairCount || config.pairCount) },
                locale
            )
            const data = res.data.data
            setSession(data)
            setWords(data.words || [])
            setDefinitions(data.definitions || [])
            
            // Reset các trạng thái chơi
            setSelectedWordId(null)
            setSelectedDefId(null)
            setMatchedWordIds(new Set())
            setMatchedDefIds(new Set())
            setWrongWordId(null)
            setWrongDefId(null)
            setSubmittedPairs([])
            setMistakeCount(0)
            
            setStep('playing')
        } catch (err) {
            alert(err.response?.data?.message || t('common.error'))
        } finally {
            setLoadingStart(false)
        }
    }

    // ── Logic click kết nối cặp từ ───────────────────────────────────────────
    const handleWordClick = (wordId) => {
        if (matchedWordIds.has(wordId) || wrongWordId === wordId) return
        
        if (selectedWordId === wordId) {
            setSelectedWordId(null) // hủy chọn
            return
        }
        
        setSelectedWordId(wordId)
        if (selectedDefId !== null) {
            checkMatch(wordId, selectedDefId)
        }
    }

    const handleDefClick = (defId) => {
        if (matchedDefIds.has(defId) || wrongDefId === defId) return
        
        if (selectedDefId === defId) {
            setSelectedDefId(null) // hủy chọn
            return
        }
        
        setSelectedDefId(defId)
        if (selectedWordId !== null) {
            checkMatch(selectedWordId, defId)
        }
    }

    // ── Kiểm tra kết quả ghép cặp ────────────────────────────────────────────
    const checkMatch = (wordId, defId) => {
        const totalPairs = session?.words?.length || 0
        
        if (wordId === defId) {
            // GHÉP ĐÚNG!
            const newMatchedWords = new Set(matchedWordIds).add(wordId)
            const newMatchedDefs = new Set(matchedDefIds).add(defId)
            
            setMatchedWordIds(newMatchedWords)
            setMatchedDefIds(newMatchedDefs)
            setSubmittedPairs(prev => [...prev, { wordId, definitionId: defId }])
            
            // Đọc từ vựng qua âm thanh (TTS)
            const matchedWordItem = words.find(w => w.id === wordId)
            if (matchedWordItem) {
                if (window.speechSynthesis) {
                    const utt = new SpeechSynthesisUtterance(matchedWordItem.word)
                    utt.lang = 'en-US'
                    window.speechSynthesis.speak(utt)
                }
            }
            
            // Xóa vùng chọn
            setSelectedWordId(null)
            setSelectedDefId(null)
            
            // Nếu đã nối hết các cặp → Tự động hoàn tất và nộp bài
            if (newMatchedWords.size === totalPairs) {
                const finalPairs = [...submittedPairs, { wordId, definitionId: defId }]
                handleFinish(finalPairs)
            }
        } else {
            // GHÉP SAI!
            setWrongWordId(wordId)
            setWrongDefId(defId)
            setMistakeCount(prev => prev + 1)
            
            // Giữ hiệu ứng đỏ lắc lư trong 800ms rồi trả về trạng thái cũ
            setTimeout(() => {
                setWrongWordId(null)
                setWrongDefId(null)
                setSelectedWordId(null)
                setSelectedDefId(null)
            }, 800)
        }
    }

    // ── Nộp bài và lưu kết quả ───────────────────────────────────────────────
    const handleFinish = async (finalPairsList = null) => {
        setSubmitting(true)
        try {
            const duration = startTime ? Math.round((Date.now() - startTime) / 1000) : elapsedTime
            const pairsToSubmit = finalPairsList || [...submittedPairs]
            
            // Trường hợp người dùng click nộp bài sớm hoặc kết thúc sớm:
            // Ghép bừa các thẻ còn lại để đảm bảo tổng số lượng cặp khớp với thiết kế
            if (pairsToSubmit.length < words.length) {
                const unmatchedWords = words.filter(w => !matchedWordIds.has(w.id))
                const unmatchedDefs = definitions.filter(d => !matchedDefIds.has(d.flashcardId))
                
                for (let i = 0; i < unmatchedWords.length; i++) {
                    pairsToSubmit.push({
                        wordId: unmatchedWords[i].id,
                        definitionId: unmatchedDefs[i]?.flashcardId || unmatchedWords[i].id + 999
                    })
                }
            }

            const res = await matchingApi.submit({
                sessionId: session.sessionId,
                durationSeconds: duration,
                pairs: pairsToSubmit
            }, locale)
            
            setResult(res.data.data)
            setStep('result')
        } catch (err) {
            alert(err.response?.data?.message || t('common.error'))
        } finally {
            setSubmitting(false)
        }
    }

    // ── Chơi lại ─────────────────────────────────────────────────────────────
    const handlePlayAgain = () => {
        setStep('setup')
        setSession(null)
        setResult(null)
    }

    const totalPairsCount = session?.words?.length || 0
    const matchedCount    = matchedWordIds.size
    const progressPct     = totalPairsCount > 0 ? Math.round((matchedCount / totalPairsCount) * 100) : 0

    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-4 py-8">
                
                {/* ═══════════════════════ SETUP ══════════════════════════ */}
                {step === 'setup' && (
                    <div className="max-w-md mx-auto bg-surface-container rounded-[2.5rem] p-10 md:p-12 shadow-sm border border-outline-variant/20 relative overflow-hidden animate-[fadeInUp_0.35s_ease-out]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl">shuffle</span>
                            </div>
                            <h2 className="font-headline text-3xl font-black text-on-surface">
                                {t('matching.title') || 'Matching Game'}
                            </h2>
                            <p className="text-sm text-on-surface-variant font-medium mt-2 leading-relaxed">
                                {t('matching.subtitle') || 'Nối từ tiếng Anh ở cột trái với nghĩa dịch tương ứng ở cột phải.'}
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Topic Select */}
                            <div>
                                <label className="block text-xs font-bold text-outline font-headline uppercase tracking-widest mb-2 px-1">
                                    {t('quiz.topic_label') || 'Topic'}
                                </label>
                                <select
                                    value={config.topicId}
                                    onChange={e => setConfig(prev => ({ ...prev, topicId: e.target.value }))}
                                    className="w-full rounded-2xl px-5 py-4 border-2 border-outline-variant/40 outline-none transition-all focus:border-primary bg-surface text-on-surface font-medium"
                                >
                                    <option value="">-- {t('quiz.select_topic_placeholder') || 'Select Topic'} --</option>
                                    {topics.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Pairs Count Select */}
                            <div>
                                <label className="block text-xs font-bold text-outline font-headline uppercase tracking-widest mb-2 px-1">
                                    {t('matching.pair_count_label') || 'Số lượng cặp thẻ'}
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[4, 6, 8, 12].map(count => (
                                        <button
                                            key={count}
                                            type="button"
                                            onClick={() => setConfig(prev => ({ ...prev, pairCount: count }))}
                                            className={`py-3.5 rounded-2xl font-bold text-sm border-2 transition-all active:scale-95
                                                ${config.pairCount === count
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-outline-variant/40 text-on-surface-variant hover:border-outline'
                                                }`}
                                        >
                                            {count}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Start Button */}
                            <button
                                onClick={handleStart}
                                disabled={!config.topicId || loadingStart}
                                className="w-full mt-4 flex items-center justify-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold text-sm hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-primary/20"
                            >
                                <span className="material-symbols-outlined text-base">play_arrow</span>
                                <span>{loadingStart ? t('common.loading') : (t('matching.start_btn') || 'Bắt đầu ghép →')}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════ PLAYING ══════════════════════════ */}
                {step === 'playing' && (
                    <div className="space-y-6 animate-[fadeInUp_0.35s_ease-out]">
                        
                        {/* Status bar */}
                        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 bg-surface-container rounded-2xl px-6 py-4 border border-outline-variant/10 shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">schedule</span>
                                <span className="font-mono font-bold text-on-surface">
                                    {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                            <div className="flex-1 max-w-md mx-6">
                                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-300"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-xs font-bold text-primary font-headline uppercase tracking-widest">
                                {matchedCount} / {totalPairsCount} Cặp
                            </div>
                        </div>

                        {/* Matching board */}
                        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Cột trái: Từ vựng */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-outline font-headline uppercase tracking-widest mb-2 px-1">
                                    {t('matching.col_words') || 'Từ vựng (English)'}
                                </h3>
                                {words.map(w => {
                                    const isMatched = matchedWordIds.has(w.id)
                                    const isSelected = selectedWordId === w.id
                                    const isWrong = wrongWordId === w.id
                                    
                                    return (
                                        <div
                                            key={w.id}
                                            onClick={() => handleWordClick(w.id)}
                                            className={`p-5 rounded-2xl border-2 shadow-sm font-semibold transition-all duration-200 cursor-pointer select-none active:scale-[0.98]
                                                ${isMatched
                                                    ? 'border-green-400 bg-green-50/40 text-green-700 pointer-events-none opacity-40 line-through scale-95'
                                                    : isWrong
                                                        ? 'border-red-400 bg-red-50 text-red-600 animate-[shake_0.4s_ease]'
                                                        : isSelected
                                                            ? 'border-primary bg-primary/5 text-primary ring-4 ring-primary/10'
                                                            : 'border-outline-variant/40 bg-surface hover:border-outline text-on-surface hover:bg-surface-container-low'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-lg font-bold tracking-wide font-mono">{w.word}</span>
                                                {w.pronunciation && !isMatched && (
                                                    <span className="text-xs text-outline font-normal font-sans">[{w.pronunciation}]</span>
                                                )}
                                                {isMatched && (
                                                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Cột phải: Định nghĩa */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-outline font-headline uppercase tracking-widest mb-2 px-1">
                                    {t('matching.col_definitions') || 'Nghĩa (Definitions)'}
                                </h3>
                                {definitions.map(d => {
                                    const isMatched = matchedDefIds.has(d.flashcardId)
                                    const isSelected = selectedDefId === d.flashcardId
                                    const isWrong = wrongDefId === d.flashcardId
                                    
                                    return (
                                        <div
                                            key={d.flashcardId}
                                            onClick={() => handleDefClick(d.flashcardId)}
                                            className={`p-5 rounded-2xl border-2 shadow-sm font-semibold transition-all duration-200 cursor-pointer select-none active:scale-[0.98]
                                                ${isMatched
                                                    ? 'border-green-400 bg-green-50/40 text-green-700 pointer-events-none opacity-40 line-through scale-95'
                                                    : isWrong
                                                        ? 'border-red-400 bg-red-50 text-red-600 animate-[shake_0.4s_ease]'
                                                        : isSelected
                                                            ? 'border-primary bg-primary/5 text-primary ring-4 ring-primary/10'
                                                            : 'border-outline-variant/40 bg-surface hover:border-outline text-on-surface hover:bg-surface-container-low'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-on-surface leading-snug">{d.text}</span>
                                                {isMatched && (
                                                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                        </div>

                        {/* Exit / Skip matching early */}
                        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 mt-6">
                            <button
                                onClick={() => navigate('/home')}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
                            >
                                <span className="material-symbols-outlined text-base">arrow_back</span>
                                {t('matching.quit_btn') || 'Thoát ra ngoài'}
                            </button>

                            <button
                                onClick={() => handleFinish()}
                                disabled={submitting}
                                className="flex items-center gap-2 px-6 py-3 border border-outline-variant hover:border-outline text-on-surface rounded-2xl font-bold text-sm active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-base">flag</span>
                                <span>{submitting ? t('common.loading') : (t('matching.finish_btn') || 'Nộp bài sớm')}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════ RESULT ══════════════════════════ */}
                {step === 'result' && result && (
                    <div className="space-y-8 animate-[fadeInUp_0.4s_ease-out]">
                        
                        <div className="max-w-2xl mx-auto bg-surface-container rounded-[2.5rem] p-10 text-center shadow-sm border border-outline-variant/20 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                            
                            <div className="relative z-10">
                                <div className="text-6xl mb-4">
                                    {result.accuracy >= 80 ? '🎉' : result.accuracy >= 50 ? '💪' : '📖'}
                                </div>
                                <h2 className="font-headline text-4xl font-black text-on-surface mb-2">
                                    {result.accuracy}%
                                </h2>
                                <p className="text-on-surface-variant font-medium mb-6">
                                    {t('matching.accuracy_label') || 'Độ chính xác ghép cặp'}
                                </p>

                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    {[
                                        { label: t('matching.correct_count') || 'Cặp đúng', value: result.correctPairs, icon: 'check_circle', color: 'text-green-500' },
                                        { label: t('matching.total_count') || 'Tổng cặp',   value: result.totalPairs,   icon: 'widgets',      color: 'text-primary' },
                                        { label: t('matching.time_label') || 'Thời gian',    value: result.durationSeconds ? `${result.durationSeconds}s` : '—', icon: 'timer', color: 'text-secondary' },
                                    ].map(stat => (
                                        <div key={stat.label} className="bg-surface-container-high rounded-2xl p-4">
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
                                        {t('matching.play_again_btn') || 'Chơi lại'}
                                    </button>
                                    <button
                                        onClick={() => navigate('/home')}
                                        className="flex items-center gap-2 px-8 py-3.5 bg-surface-container text-on-surface rounded-2xl font-bold hover:bg-surface-container-high hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        <span className="material-symbols-outlined text-base">home</span>
                                        {t('quiz.back_to_homepage') || 'Về trang chủ'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    )
}
