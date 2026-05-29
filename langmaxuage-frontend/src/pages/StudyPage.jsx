import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import progressApi from '../api/progressApi'
import { useLanguage } from '../context/LanguageContext'

const LANG_LABELS = {
    en: 'ENGLISH', vi: 'VIETNAMESE', ja: 'JAPANESE', ko: 'KOREAN',
}

export default function StudyPage() {
    const navigate                  = useNavigate()
    const { locale }                = useLanguage()

    const [progressList, setProgressList] = useState([]) // Chứa mảng ProgressResponse
    const [index, setIndex]               = useState(0)
    const [flipped, setFlipped]           = useState(false)
    const [loading, setLoading]           = useState(true)
    const [feedback, setFeedback]         = useState('')

    const [cardLang, setCardLang]   = useState(locale)
    const [showExtra, setShowExtra] = useState(false)

    useEffect(() => { setCardLang(locale) }, [locale])

    useEffect(() => {
        setShowExtra(false)
        setFlipped(false)
    }, [index])

    useEffect(() => {
        setLoading(true)
        // Truyền locale để BE map đúng nội dung dịch ngay từ đầu
        progressApi.getDueCards(locale)
            .then(r => setProgressList(r.data.data || []))
            .finally(() => setLoading(false))
    }, [locale])

    // Lấy progress record hiện tại
    const currentProgress = progressList[index]
    // TRUY CẬP ĐÚNG OBJECT: Lấy thông tin flashcard từ progress record
    const card = currentProgress?.flashcard

    const handleQuality = async (quality) => {
        if (!card) return
        try {
            // Sử dụng card.id (id của flashcard) thay vì id của progress record
            await progressApi.review({ flashcardId: card.id, quality }, locale)
            setFeedback(quality >= 3 ? '✓ Memorized' : '↺ See you soon')

            setTimeout(() => {
                setFeedback('')
                setCardLang(locale)
                setIndex(i => i + 1)
            }, 700)
        } catch { setFeedback('Error') }
    }

    const getContent = (c) => {
        if (!c) return { definition: '', example: '' }
        if (cardLang === 'en' || cardLang === c.primaryLocale) {
            const isEn = cardLang === 'en'
            return {
                definition: isEn ? c.definition : (c.primaryDefinition || c.definition),
                example:    isEn ? c.exampleSentence : (c.primaryExample || c.exampleSentence),
            }
        }
        const tr = c.translations?.[cardLang]
        return {
            definition: tr?.definition || c.primaryDefinition || c.definition,
            example:    tr?.exampleSentence || c.primaryExample || c.exampleSentence,
        }
    }

    const coreLangs = ['en', locale].filter((v, i, a) => v && a.indexOf(v) === i)
    const extraLangs = card
        ? Object.keys(card.translations || {}).filter(l => !coreLangs.includes(l))
        : []

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight mb-2">Daily Review</h1>
                    <p className="text-on-surface-variant">Ôn tập dựa trên thuật toán SM-2.</p>
                </header>

                {loading ? (
                    <div className="flex justify-center mt-20">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : progressList.length === 0 ? (
                    <div className="text-center mt-20 bg-surface-container-low p-12 rounded-[2rem] border border-dashed border-outline-variant">
                        <span className="material-symbols-outlined text-6xl text-primary mb-4">task_alt</span>
                        <h2 className="text-2xl font-bold font-headline mb-2">You're all caught up!</h2>
                        <button onClick={() => navigate('/topics')} className="bg-primary text-white px-8 py-3 rounded-full font-bold">Explore Topics</button>
                    </div>
                ) : index >= progressList.length ? (
                    <div className="text-center mt-20">
                        <h2 className="font-headline text-3xl font-bold mb-2">Session Complete!</h2>
                        <button onClick={() => navigate('/home')} className="bg-primary text-white px-10 py-4 rounded-full font-bold">Back to Dashboard</button>
                    </div>
                ) : (
                    <>
                        <div className="mb-8">
                            <div className="flex justify-between text-xs font-bold text-outline uppercase mb-2">
                                <span>Card {index + 1} of {progressList.length}</span>
                                <span>{feedback}</span>
                            </div>
                            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                                <div className="bg-primary h-full transition-all duration-500" style={{ width: `${((index + 1) / progressList.length) * 100}%` }} />
                            </div>
                        </div>

                        <div className="w-full relative cursor-pointer mb-12">
                            <div className="relative flip-card" style={{ height: '420px' }}>
                                <div className={`flip-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
                                    <div className="flip-front bg-surface-container-lowest rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center p-12 border border-outline-variant/10" onClick={() => setFlipped(true)}>
                                        <h2 className="font-headline text-5xl md:text-6xl font-extrabold text-on-surface text-center">{card?.word}</h2>
                                        <p className="mt-4 text-on-surface-variant text-xl italic">{card?.pronunciation}</p>
                                    </div>

                                    <div className="flip-back bg-surface-container-lowest rounded-[2.5rem] shadow-xl flex flex-col p-8 border border-outline-variant/10">
                                        <div className="flex bg-surface-container-low p-1.5 rounded-2xl mb-6 items-center">
                                            {coreLangs.map(lang => (
                                                <button key={lang} onClick={() => setCardLang(lang)}
                                                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all ${cardLang === lang ? 'bg-surface-container-lowest shadow-sm text-secondary' : 'text-on-surface-variant'}`}>
                                                    {LANG_LABELS[lang] || lang.toUpperCase()}
                                                </button>
                                            ))}
                                            {extraLangs.length > 0 && (
                                                <div className="relative ml-1">
                                                    <button onClick={() => setShowExtra(!showExtra)} className="p-3 text-on-surface-variant"><span className="material-symbols-outlined">more_vert</span></button>
                                                    {showExtra && (
                                                        <div className="absolute right-0 bottom-full mb-2 bg-surface-container-lowest shadow-2xl rounded-xl p-2 z-50 min-w-[140px]">
                                                            {extraLangs.map(lang => (
                                                                <button key={lang} onClick={() => { setCardLang(lang); setShowExtra(false) }} className="w-full text-left px-4 py-2 text-xs font-bold">{LANG_LABELS[lang] || lang.toUpperCase()}</button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center px-4">
                                            <div className="bg-surface-container-low rounded-[2rem] p-8">
                                                <p className="text-2xl font-medium text-on-surface">{getContent(card).definition}</p>
                                                {getContent(card).example && <p className="mt-6 pt-6 border-t border-outline-variant/20 italic text-on-surface-variant">"{getContent(card).example}"</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-6">
                            {!flipped ? (
                                <p className="text-outline text-sm font-bold animate-pulse">LẬT THẺ ĐỂ ĐÁNH GIÁ</p>
                            ) : (
                                <div className="grid grid-cols-4 gap-3 w-full">
                                    {[
                                        { q: 0, label: 'Forgot', icon: 'replay', color: 'text-error' },
                                        { q: 3, label: 'Hard', icon: 'sentiment_neutral', color: 'text-tertiary' },
                                        { q: 4, label: 'Good', icon: 'sentiment_satisfied', color: 'text-secondary' },
                                        { q: 5, label: 'Easy', icon: 'auto_awesome', color: 'text-primary' },
                                    ].map(({ q, label, icon, color }) => (
                                        <button key={q} onClick={() => handleQuality(q)} className={`flex flex-col items-center p-4 rounded-2xl bg-surface-container-lowest border-2 shadow-sm ${color}`}>
                                            <span className="material-symbols-outlined text-2xl">{icon}</span>
                                            <span className="text-xs font-bold">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    )
}