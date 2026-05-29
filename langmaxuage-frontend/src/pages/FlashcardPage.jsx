import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import flashcardApi from '../api/flashcardApi'
import progressApi from '../api/progressApi'
import { useLanguage } from '../context/LanguageContext'

// Tên hiển thị cho các ngôn ngữ
const LANG_LABELS = {
    en: 'ENGLISH', vi: 'VIETNAMESE', ja: 'JAPANESE', ko: 'KOREAN',
}

export default function FlashcardPage() {
    const { topicId }               = useParams()
    const navigate                  = useNavigate()
    const { locale }                = useLanguage()

    const [cards, setCards]         = useState([])
    const [index, setIndex]         = useState(0)
    const [flipped, setFlipped]     = useState(false)
    const [loading, setLoading]     = useState(true)
    const [feedback, setFeedback]   = useState('')

    // Ngôn ngữ hiển thị trên thẻ - mặc định theo locale hệ thống
    const [cardLang, setCardLang]   = useState(locale)
    // Trạng thái đóng/mở menu ngôn ngữ phụ
    const [showExtra, setShowExtra] = useState(false)

    // Reset ngôn ngữ thẻ khi locale hệ thống thay đổi
    useEffect(() => { setCardLang(locale) }, [locale])

    // Reset trạng thái khi chuyển sang thẻ mới
    useEffect(() => {
        setShowExtra(false)
        setFlipped(false)
    }, [index])

    useEffect(() => {
        // Tải flashcards và bao gồm tất cả bản dịch để chuyển đổi 0ms
        flashcardApi.getByTopic(topicId, locale, true)
            .then(r => setCards(r.data.data?.content || []))
            .finally(() => setLoading(false))
    }, [topicId, locale])

    const handleQuality = async (flashcardId, quality) => {
        try {
            await progressApi.review({ flashcardId, quality })
            setFeedback(quality > 3 ? '✓ Got it' : '↺ Review again')
            setTimeout(() => {
                setFeedback('')
                setCardLang(locale) // Reset về ngôn ngữ chính cho thẻ tiếp theo
                setIndex(i => i + 1)
            }, 700)
        } catch { setFeedback('Error') }
    }

    const card = cards[index]

    // Lấy nội dung định nghĩa/ví dụ dựa trên cardLang đang chọn
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

    // Logic lọc ngôn ngữ thông minh
    const coreLangs = ['en', locale].filter((v, i, a) => v && a.indexOf(v) === i)
    const extraLangs = card
        ? Object.keys(card.translations || {}).filter(l => !coreLangs.includes(l))
        : []

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/topics')}
                        className="flex items-center gap-2 text-primary font-bold text-sm mb-8 hover:underline">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back to Topics
                </button>

                {loading ? (
                    <div className="flex justify-center mt-20">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : cards.length === 0 ? (
                    <div className="text-center mt-20">
                        <span className="material-symbols-outlined text-5xl text-outline block mb-3">style</span>
                        <p className="text-on-surface-variant">No flashcards in this topic yet.</p>
                    </div>
                ) : index >= cards.length ? (
                    <div className="text-center mt-20">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
                            <span className="material-symbols-outlined text-white text-4xl"
                                  style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                        </div>
                        <h2 className="font-headline text-3xl font-bold mb-2">All done!</h2>
                        <p className="text-on-surface-variant mb-6">You've reviewed all {cards.length} cards.</p>
                        <button onClick={() => { setIndex(0); setCardLang(locale) }}
                                className="bg-primary text-on-primary px-8 py-3 rounded-DEFAULT font-bold shadow-lg hover:scale-105 transition-all">
                            Start Over
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Progress Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-4 mb-2">
                                <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                    {card?.topicName || 'Study'}
                                </span>
                                {feedback && (
                                    <span className="text-sm font-bold text-primary bg-primary-fixed px-3 py-1 rounded-full animate-bounce">
                                        {feedback}
                                    </span>
                                )}
                            </div>
                            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                                <div className="bg-secondary h-full transition-all duration-700 rounded-full"
                                     style={{ width: `${(index / cards.length) * 100}%` }} />
                            </div>
                        </div>

                        {/* Flashcard Canvas */}
                        <div className="w-full relative group cursor-pointer mb-8">
                            <div className={`relative flip-card`} style={{ height: '400px' }}>
                                <div className={`flip-inner w-full h-full ${flipped ? 'flipped' : ''}`}>

                                    {/* FRONT */}
                                    <div className="flip-front bg-surface-container-lowest rounded-[2rem] shadow-xl flex flex-col items-center justify-center p-12 border border-outline-variant/10"
                                         onClick={() => setFlipped(true)}>
                                        <h2 className="font-headline text-6xl font-extrabold text-on-surface tracking-tighter text-center">
                                            {card.word}
                                        </h2>
                                        <p className="mt-4 text-on-surface-variant italic">{card.pronunciation}</p>
                                    </div>

                                    {/* BACK */}
                                    <div className="flip-back bg-surface-container-lowest rounded-[2rem] shadow-xl flex flex-col p-8 border border-outline-variant/10">

                                        {/* Smart Language Toggle */}
                                        <div className="flex bg-surface-container-low p-1.5 rounded-2xl mb-6 items-center">
                                            {coreLangs.map(lang => (
                                                <button
                                                    key={lang}
                                                    onClick={() => setCardLang(lang)}
                                                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all
                                                        ${cardLang === lang
                                                        ? 'bg-surface-container-lowest shadow-sm text-secondary'
                                                        : 'text-on-surface-variant hover:bg-surface-container'
                                                    }`}
                                                >
                                                    {LANG_LABELS[lang] || lang.toUpperCase()}
                                                </button>
                                            ))}

                                            {extraLangs.length > 0 && (
                                                <div className="relative ml-1">
                                                    <button
                                                        onClick={() => setShowExtra(!showExtra)}
                                                        className={`p-3 rounded-xl text-xs font-bold flex items-center border-l border-outline-variant/30
                                                            ${extraLangs.includes(cardLang) || showExtra ? 'text-secondary' : 'text-on-surface-variant'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-sm">more_vert</span>
                                                    </button>

                                                    {showExtra && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setShowExtra(false)} />
                                                            <div className="absolute right-0 bottom-full mb-2 bg-surface-container-lowest shadow-2xl rounded-xl border p-2 z-50 min-w-[140px]">
                                                                {extraLangs.map(lang => (
                                                                    <button
                                                                        key={lang}
                                                                        onClick={() => { setCardLang(lang); setShowExtra(false) }}
                                                                        className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold ${cardLang === lang ? 'bg-surface-container text-secondary' : 'hover:bg-surface-container-low'}`}
                                                                    >
                                                                        {LANG_LABELS[lang] || lang.toUpperCase()}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="bg-surface-container-low rounded-3xl p-6">
                                                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2 block">Meaning</span>
                                                <p className="text-xl font-medium text-on-surface leading-relaxed">
                                                    {getContent(card).definition}
                                                </p>
                                                {getContent(card).example && (
                                                    <p className="mt-4 italic text-on-surface-variant text-sm border-t border-outline-variant/20 pt-4">
                                                        "{getContent(card).example}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Navigation + Rating controls */}
                        <div className="flex flex-col items-center gap-6">
                            {!flipped ? (
                                <div className="flex flex-col items-center gap-4">
                                    <p className="text-outline text-sm font-bold animate-pulse tracking-widest">
                                        TAP CARD TO FLIP
                                    </p>
                                    {/* Nút lật thẻ giả lập cho Desktop hoặc user không muốn nhấn vào card */}
                                    <button onClick={() => setFlipped(true)}
                                            className="px-8 py-3 rounded-full bg-surface-container-high text-primary font-bold text-sm hover:bg-primary-fixed transition-all">
                                        Reveal Meaning
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full">
                                    <p className="text-center text-[10px] font-bold text-outline-variant uppercase tracking-[0.2em] mb-4">
                                        How well do you know this word?
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { q: 0, label: 'Forgot',  icon: 'replay',             color: 'hover:bg-error/10 text-error border-error/20' },
                                            { q: 3, label: 'Hard',    icon: 'sentiment_neutral',  color: 'hover:bg-tertiary/10 text-tertiary border-tertiary/20' },
                                            { q: 4, label: 'Good',    icon: 'sentiment_satisfied',color: 'hover:bg-secondary/10 text-secondary border-secondary/20' },
                                            { q: 5, label: 'Easy',    icon: 'auto_awesome',       color: 'hover:bg-primary/10 text-primary border-primary/20' },
                                        ].map(({ q, label, icon, color }) => (
                                            <button
                                                key={q}
                                                onClick={() => handleQuality(card.id, q)}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-container-lowest border-2 transition-all active:scale-95 shadow-sm group ${color}`}
                                            >
                        <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
                            {icon}
                        </span>
                                                <span className="text-xs font-bold font-headline">{label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Nút quay lại mặt trước nếu lỡ tay lật mà chưa muốn đánh giá */}
                                    <button onClick={() => setFlipped(false)}
                                            className="mt-6 mx-auto flex items-center gap-2 text-outline font-bold text-[10px] uppercase tracking-widest hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                                        Back to word
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    )
}