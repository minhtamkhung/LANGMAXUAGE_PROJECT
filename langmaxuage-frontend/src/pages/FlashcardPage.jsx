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

    // Trạng thái audio
    const [isPlaying, setIsPlaying] = useState(false)

    // Reset ngôn ngữ thẻ khi locale hệ thống thay đổi
    useEffect(() => { setCardLang(locale) }, [locale])

    // Reset trạng thái khi chuyển sang thẻ mới
    useEffect(() => {
        setShowExtra(false)
        setFlipped(false)
        setIsPlaying(false)
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

    const playNativeAudio = (e) => {
        if (e) e.stopPropagation();
        if (!card) return;

        setIsPlaying(true);
        if (card.audioUrl) {
            const audio = new Audio(card.audioUrl);
            audio.play()
                .then(() => {
                    audio.onended = () => setIsPlaying(false);
                })
                .catch(() => {
                    playFallbackTts();
                });
        } else {
            playFallbackTts();
        }
    }

    const playFallbackTts = () => {
        const synth = window.speechSynthesis;
        if (synth && card?.word) {
            synth.cancel();
            const utterance = new SpeechSynthesisUtterance(card.word);
            utterance.lang = 'en-US';
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = () => setIsPlaying(false);
            synth.speak(utterance);
        } else {
            setIsPlaying(false);
        }
    }

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

    // Phân loại từ liên quan từ Datamuse
    const synonyms = card?.relatedWords?.filter(w => w.relationType === 'SYNONYM') || []
    const related = card?.relatedWords?.filter(w => w.relationType === 'RELATED') || []

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
                    <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/30 rounded-[2.5rem] p-12 shadow-sm">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-container rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
                            <span className="material-symbols-outlined text-white text-4xl"
                                  style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                        </div>
                        <h2 className="font-headline text-3xl font-black text-on-surface mb-2">All done!</h2>
                        <p className="text-on-surface-variant mb-8 font-medium">You've reviewed all {cards.length} cards.</p>
                        <button onClick={() => { setIndex(0); setCardLang(locale) }}
                                className="bg-primary text-on-primary px-8 py-3.5 rounded-2xl font-bold shadow-md shadow-primary/10 hover:bg-primary-container active:scale-[0.98] transition-all">
                            Start Over
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Progress Header */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        {card?.topicName || 'Study'}
                                    </span>
                                    {card?.partOfSpeech && (
                                        <span className="bg-surface-container text-outline text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                            {card.partOfSpeech}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-outline font-mono">
                                        {index + 1} / {cards.length}
                                    </span>
                                    {feedback && (
                                        <span className="text-xs font-bold text-primary bg-primary-fixed px-3 py-1 rounded-full animate-bounce">
                                            {feedback}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden shadow-inner">
                                <div className="bg-secondary h-full transition-all duration-500 rounded-full"
                                     style={{ width: `${(index / cards.length) * 100}%` }} />
                            </div>
                        </div>

                        {/* Flashcard Canvas */}
                        <div className="w-full relative group cursor-pointer mb-8" onClick={() => !flipped && setFlipped(true)}>
                            <div className={`relative flip-card`} style={{ height: '420px' }}>
                                <div className={`flip-inner w-full h-full border border-outline-variant/30 rounded-[2.5rem] shadow-xl transition-all duration-700 ${flipped ? 'flipped' : ''}`}>

                                    {/* FRONT */}
                                    <div className="absolute inset-0 flip-front bg-surface-container-lowest rounded-[2.5rem] flex flex-col items-center justify-center p-12">
                                        <h2 className="font-headline text-5xl md:text-6xl font-black text-on-surface tracking-tighter text-center leading-none">
                                            {card.word}
                                        </h2>
                                        {card.pronunciation && (
                                            <p className="mt-4 text-on-surface-variant italic font-mono font-semibold text-lg">{card.pronunciation}</p>
                                        )}
                                        {card?.word && (
                                            <button 
                                                onClick={playNativeAudio}
                                                className={`mt-6 w-12 h-12 rounded-full border border-outline-variant/40 flex items-center justify-center transition-all ${isPlaying ? 'bg-primary text-white scale-95 border-primary' : 'bg-surface hover:bg-primary-fixed hover:text-primary active:scale-90'}`}
                                            >
                                                <span className={`material-symbols-outlined text-xl ${isPlaying ? 'animate-pulse' : ''}`}>
                                                    volume_up
                                                </span>
                                            </button>
                                        )}
                                    </div>

                                    {/* BACK */}
                                    <div className="absolute inset-0 flip-back bg-surface-container-lowest rounded-[2.5rem] flex flex-col p-6 sm:p-8 overflow-y-auto" onClick={(e) => e.stopPropagation()}>

                                        {/* Smart Language Toggle */}
                                        <div className="flex bg-surface-container p-1 rounded-2xl mb-6 items-center">
                                            {coreLangs.map(lang => (
                                                <button
                                                    key={lang}
                                                    onClick={() => setCardLang(lang)}
                                                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all
                                                        ${cardLang === lang
                                                        ? 'bg-surface-container-lowest shadow-sm text-primary'
                                                        : 'text-on-surface-variant hover:text-on-surface'
                                                    }`}
                                                >
                                                    {LANG_LABELS[lang] || lang.toUpperCase()}
                                                </button>
                                            ))}

                                            {extraLangs.length > 0 && (
                                                <div className="relative ml-1">
                                                    <button
                                                        onClick={() => setShowExtra(!showExtra)}
                                                        className="p-2 text-on-surface-variant hover:text-on-surface flex items-center"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">more_vert</span>
                                                    </button>

                                                    {showExtra && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setShowExtra(false)} />
                                                            <div className="absolute right-0 top-full mt-2 bg-surface-container-lowest shadow-xl border border-outline-variant/30 rounded-xl p-2 z-50 min-w-[140px]">
                                                                {extraLangs.map(lang => (
                                                                    <button
                                                                        key={lang}
                                                                        onClick={() => { setCardLang(lang); setShowExtra(false) }}
                                                                        className="w-full text-left px-4 py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-surface rounded-lg transition-colors"
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
                                            <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/20">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="font-headline font-bold text-lg text-primary">{card?.word}</h3>
                                                    {card?.word && (
                                                        <button onClick={playNativeAudio} className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all active:scale-90">
                                                            <span className="material-symbols-outlined text-lg">volume_up</span>
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-xl font-bold text-on-surface leading-relaxed">
                                                    {getContent(card).definition}
                                                </p>
                                                {getContent(card).example && (
                                                    <p className="mt-4 italic text-on-surface-variant text-sm border-t border-outline-variant/20 pt-4 font-medium">
                                                        "{getContent(card).example}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Datamuse Related Words Display */}
                                            {card?.relatedWords && card.relatedWords.length > 0 && (
                                                <div className="mt-4 grid grid-cols-2 gap-4">
                                                    {synonyms.length > 0 && (
                                                        <div className="p-3 bg-primary-fixed/20 border border-primary/10 rounded-2xl">
                                                            <span className="text-[10px] font-bold text-primary tracking-wider uppercase block mb-1">Synonyms</span>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {synonyms.slice(0, 3).map((w, idx) => (
                                                                    <span key={idx} className="text-xs font-bold bg-surface-container-lowest px-2 py-0.5 rounded-lg border border-outline-variant/20 text-on-surface">
                                                                        {w.word}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {related.length > 0 && (
                                                        <div className="p-3 bg-tertiary-fixed/30 border border-tertiary/10 rounded-2xl">
                                                            <span className="text-[10px] font-bold text-tertiary tracking-wider uppercase block mb-1">Related</span>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {related.slice(0, 3).map((w, idx) => (
                                                                    <span key={idx} className="text-xs font-bold bg-surface-container-lowest px-2 py-0.5 rounded-lg border border-outline-variant/20 text-on-surface">
                                                                        {w.word}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation + Rating controls */}
                        <div className="flex flex-col items-center gap-6">
                            {!flipped ? (
                                <div className="flex flex-col items-center gap-4">
                                    <p className="text-outline text-xs font-bold animate-pulse tracking-[0.2em]">
                                        TAP CARD TO FLIP
                                    </p>
                                    <button onClick={() => setFlipped(true)}
                                            className="px-8 py-3.5 rounded-2xl bg-surface-container border border-outline-variant/30 text-primary font-bold text-sm hover:bg-primary-fixed transition-all active:scale-95 shadow-sm">
                                        Reveal Meaning
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full">
                                    <p className="text-center text-[10px] font-bold text-outline uppercase tracking-[0.2em] mb-4">
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