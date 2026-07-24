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
    const { locale, t }             = useLanguage()

    const [progressList, setProgressList] = useState([]) // Chứa mảng ProgressResponse
    const [index, setIndex]               = useState(0)
    const [flipped, setFlipped]           = useState(false)
    const [loading, setLoading]           = useState(true)
    const [feedback, setFeedback]         = useState('')
    const [isPlaying, setIsPlaying]       = useState(false)

    const [cardLang, setCardLang]   = useState(locale)
    const [showExtra, setShowExtra] = useState(false)

    useEffect(() => { setCardLang(locale) }, [locale])

    useEffect(() => {
        setShowExtra(false)
        setFlipped(false)
    }, [index])

    useEffect(() => {
        setLoading(true)
        progressApi.getDueCards(locale)
            .then(r => setProgressList(r.data.data || []))
            .finally(() => setLoading(false))
    }, [locale])

    // Lấy progress record hiện tại
    const currentProgress = progressList[index]
    // Lấy thông tin flashcard từ progress record
    const card = currentProgress?.flashcard

    const handleQuality = async (quality) => {
        if (!card) return
        try {
            await progressApi.review({ flashcardId: card.id, quality }, locale)
            setFeedback(quality >= 3 ? t('study.memorized') : t('study.see_you_soon'))

            setTimeout(() => {
                setFeedback('')
                setCardLang(locale)
                setIndex(i => i + 1)
            }, 700)
        } catch { setFeedback(t('common.error')) }
    }

    const playNativeAudio = (e) => {
        if (e) e.stopPropagation();
        if (!card) return;

        setIsPlaying(true)
        if (card.audioUrl) {
            const audio = new Audio(card.audioUrl)
            audio.play()
                .then(() => {
                    audio.onended = () => setIsPlaying(false)
                })
                .catch(() => {
                    playFallbackTts()
                })
        } else {
            playFallbackTts()
        }
    }

    const playFallbackTts = () => {
        const synth = window.speechSynthesis
        if (synth && card?.word) {
            synth.cancel()
            const utterance = new SpeechSynthesisUtterance(card.word)
            utterance.lang = 'en-US'
            utterance.onend = () => setIsPlaying(false)
            utterance.onerror = () => setIsPlaying(false)
            synth.speak(utterance)
        } else {
            setIsPlaying(false)
        }
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

    // Group related words by type
    const synonyms = card?.relatedWords?.filter(w => w.relationType === 'SYNONYM') || []
    const related = card?.relatedWords?.filter(w => w.relationType === 'RELATED') || []

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-6">
                
                {/* Header */}
                <header className="mb-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black font-headline text-on-surface tracking-tighter leading-none mb-2">
                            {t('study.title')}
                        </h1>
                        <p className="text-on-surface-variant text-sm font-medium">
                            {t('study.flip')}
                        </p>
                    </div>
                </header>

                {loading ? (
                    <div className="py-24 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : progressList.length === 0 ? (
                    <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/30 rounded-[2.5rem] p-12 shadow-sm">
                        <span className="material-symbols-outlined text-6xl text-primary mb-4 block">task_alt</span>
                        <h2 className="text-2xl font-black font-headline text-on-surface mb-2">{t('study.all_caught_up_title')}</h2>
                        <button onClick={() => navigate('/topics')} className="mt-4 bg-primary text-white px-8 py-3.5 rounded-2xl font-bold shadow-md shadow-primary/10 hover:bg-primary-container active:scale-95 transition-all">
                            {t('study.explore_topics')}
                        </button>
                    </div>
                ) : index >= progressList.length ? (
                    <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/30 rounded-[2.5rem] p-12 shadow-sm">
                        <span className="material-symbols-outlined text-6xl text-primary mb-4 block animate-bounce">military_tech</span>
                        <h2 className="font-headline text-3xl font-black text-on-surface mb-4">{t('study.session_complete')}</h2>
                        <button onClick={() => navigate('/home')} className="bg-primary text-white px-10 py-4 rounded-2xl font-bold shadow-md shadow-primary/10 hover:bg-primary-container active:scale-95 transition-all">
                            {t('study.back_to_dashboard')}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Progress Bar & Feedback Info */}
                        <div className="mb-8">
                            <div className="flex justify-between text-xs font-bold text-outline uppercase mb-2">
                                <span className="font-mono">
                                    {t('study.card_indicator')
                                        .replace('{current}', index + 1)
                                        .replace('{total}', progressList.length)
                                    }
                                </span>
                                <span className="text-primary font-bold animate-pulse">{feedback}</span>
                            </div>
                            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden shadow-inner">
                                <div className="bg-primary h-full transition-all duration-500 rounded-full" style={{ width: `${((index + 1) / progressList.length) * 100}%` }} />
                            </div>
                        </div>

                        {/* Interactive Flashcard Component with 3D Flip */}
                        <div className="w-full relative cursor-pointer mb-10" onClick={() => !flipped && setFlipped(true)}>
                            <div className="relative flip-card" style={{ height: '440px' }}>
                                <div className={`flip-inner w-full h-full border border-outline-variant/20 rounded-[2.5rem] shadow-xl transition-all duration-700 ${flipped ? 'flipped' : ''}`}>
                                    
                                    {/* Front Side */}
                                    <div className="absolute inset-0 flip-front bg-surface-container-lowest rounded-[2.5rem] flex flex-col items-center justify-center p-12">
                                        {card?.partOfSpeech && (
                                            <span className="px-3 py-1 rounded-full bg-surface-container text-primary font-bold text-[10px] uppercase tracking-wider mb-6">
                                                {card.partOfSpeech}
                                            </span>
                                        )}
                                        <h2 className="font-headline text-5xl md:text-6xl font-black text-on-surface text-center tracking-tight leading-none">
                                            {card?.word}
                                        </h2>
                                        {card?.pronunciation && (
                                            <p className="mt-4 text-on-surface-variant text-xl italic font-mono font-medium">
                                                {card?.pronunciation}
                                            </p>
                                        )}

                                        {/* Play sound shortcut on the front side */}
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

                                    {/* Back Side (Answers and Details) */}
                                    <div className="absolute inset-0 flip-back bg-surface-container-lowest rounded-[2.5rem] flex flex-col p-6 sm:p-8 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                        {/* Back Navbar / Language Selection */}
                                        <div className="flex bg-surface-container p-1 rounded-2xl mb-6 items-center">
                                            {coreLangs.map(lang => (
                                                <button key={lang} onClick={() => setCardLang(lang)}
                                                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${cardLang === lang ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                                                    {LANG_LABELS[lang] || lang.toUpperCase()}
                                                </button>
                                            ))}
                                            {extraLangs.length > 0 && (
                                                <div className="relative ml-1">
                                                    <button onClick={() => setShowExtra(!showExtra)} className="p-2 text-on-surface-variant hover:text-on-surface flex items-center"><span className="material-symbols-outlined text-lg">more_vert</span></button>
                                                    {showExtra && (
                                                        <div className="absolute right-0 top-full mt-2 bg-surface-container-lowest shadow-xl border border-outline-variant/30 rounded-xl p-2 z-50 min-w-[140px]">
                                                            {extraLangs.map(lang => (
                                                                <button key={lang} onClick={() => { setCardLang(lang); setShowExtra(false) }} className="w-full text-left px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-surface rounded-lg transition-colors">
                                                                    {LANG_LABELS[lang] || lang.toUpperCase()}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Main Definition & Examples */}
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
                                                <p className="text-xl font-bold text-on-surface">{getContent(card).definition}</p>
                                                {getContent(card).example && (
                                                    <p className="mt-4 pt-4 border-t border-outline-variant/20 italic text-sm text-on-surface-variant font-medium">
                                                        "{getContent(card).example}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Datamuse Related Words Display (Synonyms & Related words) */}
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

                        {/* Interactive SRS Response Quality Buttons */}
                        <div className="flex flex-col items-center gap-6">
                            {!flipped ? (
                                <p className="text-outline text-sm font-bold animate-pulse">{t('study.flip_prompt')}</p>
                            ) : (
                                <div className="grid grid-cols-4 gap-3 w-full max-w-lg">
                                    {[
                                        { q: 0, label: t('study.forgot_btn'), icon: 'replay', color: 'border-rose-200 hover:border-rose-400 hover:bg-rose-50/50 text-rose-700' },
                                        { q: 3, label: t('study.hard'), icon: 'sentiment_neutral', color: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50/50 text-orange-700' },
                                        { q: 4, label: t('study.good'), icon: 'sentiment_satisfied', color: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 text-blue-700' },
                                        { q: 5, label: t('study.easy'), icon: 'auto_awesome', color: 'border-primary/20 hover:border-primary hover:bg-primary-fixed/20 text-primary' },
                                    ].map(({ q, label, icon, color }) => (
                                        <button 
                                            key={q} 
                                            onClick={() => handleQuality(q)} 
                                            className={`flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-container-lowest border-2 shadow-sm transition-all duration-300 hover:-translate-y-0.5 active:scale-95 ${color}`}
                                        >
                                            <span className="material-symbols-outlined text-2xl mb-1">{icon}</span>
                                            <span className="text-[11px] font-bold leading-tight text-center">{label}</span>
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