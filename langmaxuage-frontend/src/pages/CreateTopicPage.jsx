import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import topicApi from '../api/topicApi'
import { useLanguage } from '../context/LanguageContext'

const ICON_OPTIONS = [
    { value: 'folder',           label: 'General' },
    { value: 'business_center',  label: 'Business' },
    { value: 'spellcheck',       label: 'Grammar' },
    { value: 'flight_takeoff',   label: 'Travel' },
    { value: 'computer',         label: 'Technology' },
    { value: 'forum',            label: 'Daily Talk' },
    { value: 'edit_note',        label: 'Academic' },
    { value: 'format_quote',     label: 'Phrases' },
    { value: 'workspace_premium',label: 'Certificate' },
    { value: 'restaurant',       label: 'Food' },
    { value: 'sports_soccer',    label: 'Sports' },
    { value: 'music_note',       label: 'Music' },
]

export default function CreateTopicPage() {
    const navigate = useNavigate()
    const { locale } = useLanguage()

    // Tab state
    const [activeTab, setActiveTab] = useState('manual') // 'manual' or 'ai'

    // Manual Form State
    const [name,        setName]        = useState('')
    const [description, setDescription] = useState('')
    const [icon,        setIcon]        = useState('folder')
    const [loading,     setLoading]     = useState(false)
    const [error,       setError]       = useState('')

    // AI Form State
    const [aiPrompt,    setAiPrompt]    = useState('')
    const [aiLoading,   setAiLoading]   = useState(false)
    const [aiError,     setAiError]     = useState('')
    const [loadingStep, setLoadingStep] = useState(0)

    // Localized translations for full i18n support
    const localTranslations = {
        en: {
            backBtn: "Back to Topics",
            title: "Create your topic",
            subtitle: "Build your own vocabulary set manually or auto-generate with Gemini AI.",
            tabManual: "Create Manually",
            tabAi: "Generate with AI (Gemini)",
            labelName: "Topic Name",
            placeholderName: "e.g. Business English, Travel Spanish...",
            labelDesc: "Description",
            labelDescOptional: "optional",
            placeholderDesc: "Short description of the topic's goals...",
            labelIcon: "Select Icon",
            previewTitle: "Card Preview",
            btnCreate: "Create Topic & Add Cards",
            btnCreating: "Creating...",
            aiAlertTitle: "Automated AI Content Generation",
            aiAlertDesc: "Describe your topic and requested card count. The AI will instantly generate a high-quality topic and translated cards.",
            labelPrompt: "Describe your request to AI",
            placeholderPrompt: "e.g. Generate 5 French vocabulary words for Hotel Booking...",
            labelSuggestions: "Quick Suggestions",
            btnAiGenerate: "Generate with AI",
            btnAiGenerating: "AI is generating topic & flashcards...",
            errorEmptyName: "Topic name cannot be empty",
            errorEmptyPrompt: "Please enter a topic description",
            msgPersonal: "Personal",
            suggestions: [
                'Business English for Airport, 5 words',
                'Restaurant Vocabulary, 6 words',
                'Hotel Booking daily dialog, 5 words',
                'Information Technology (IT) key terms, 5 words',
            ],
            steps: [
                "Initializing AI connection...",
                "Gemini is generating structured vocabulary...",
                "Calling Free Dictionary API for phonetic pronunciations...",
                "Saving topic and launching background keyword enrichment..."
            ]
        },
        vi: {
            backBtn: "Quay lại Topics",
            title: "Tạo topic của bạn",
            subtitle: "Tự xây dựng bộ từ vựng riêng bằng tay hoặc tự động tạo đa ngôn ngữ bằng trí tuệ nhân tạo AI.",
            tabManual: "Tạo thủ công",
            tabAi: "Sáng tạo bằng AI (Gemini)",
            labelName: "Tên Topic",
            placeholderName: "Ví dụ: Tiếng Anh Thương mại, Tiếng Nhật du lịch...",
            labelDesc: "Mô tả",
            labelDescOptional: "tùy chọn",
            placeholderDesc: "Mô tả ngắn về nội dung hoặc mục tiêu của topic này...",
            labelIcon: "Chọn biểu tượng",
            previewTitle: "Xem trước bộ thẻ",
            btnCreate: "Tạo Topic & Thêm Flashcard",
            btnCreating: "Đang tạo...",
            aiAlertTitle: "Tạo nội dung tự động bằng AI",
            aiAlertDesc: "Chỉ cần mô tả chủ đề và số từ vựng mong muốn. Hệ thống AI sẽ tự động sinh Topic gốc kèm bộ thẻ Flashcard đã được dịch nghĩa.",
            labelPrompt: "Mô tả yêu cầu cho AI",
            placeholderPrompt: "Ví dụ: Tạo bộ 5 từ vựng tiếng Tây Ban Nha chủ đề Airport...",
            labelSuggestions: "Gợi ý nhanh",
            btnAiGenerate: "Khởi tạo bằng AI",
            btnAiGenerating: "AI đang sinh chủ đề & thẻ flashcard...",
            errorEmptyName: "Tên topic không được để trống",
            errorEmptyPrompt: "Vui lòng nhập nội dung mô tả chủ đề",
            msgPersonal: "Cá nhân",
            suggestions: [
                'Từ vựng tiếng Anh chủ đề Airport, 5 từ',
                'Từ vựng tiếng Hàn chủ đề Restaurant, 6 từ',
                'Giao tiếp khách sạn (Hotel Booking), 5 từ',
                'Từ vựng về Công nghệ thông tin (IT), 5 từ',
            ],
            steps: [
                "Đang kết nối tới mô hình trí tuệ nhân tạo...",
                "Gemini đang phân tích và sinh danh sách từ vựng...",
                "Đang gọi Dictionary API lấy phiên âm và phát âm bản xứ...",
                "Đang lưu thông tin và khởi chạy tìm kiếm từ liên quan chạy nền..."
            ]
        }
    }

    const t = localTranslations[locale] || localTranslations.en

    // Handle stepping through AI loading states to improve UX perception
    useEffect(() => {
        if (!aiLoading) {
            setLoadingStep(0)
            return
        }
        const interval = setInterval(() => {
            setLoadingStep(step => (step < 3 ? step + 1 : step))
        }, 2200)
        return () => clearInterval(interval)
    }, [aiLoading])

    // Manual Submit
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim()) { setError(t.errorEmptyName); return }
        setError(''); setLoading(true)
        try {
            const res = await topicApi.create({ name: name.trim(), description: description.trim(), iconUrl: icon })
            const newTopicId = res.data.data?.id
            navigate(`/topics/${newTopicId}/manage`)
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tạo topic, vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    // AI Submit
    const handleAiSubmit = async (e) => {
        e.preventDefault()
        if (!aiPrompt.trim()) { setAiError(t.errorEmptyPrompt); return }
        setAiError(''); setAiLoading(true)
        try {
            const res = await topicApi.generateWithAi(aiPrompt.trim())
            const newTopicId = res.data.data?.id
            navigate(`/topics/${newTopicId}/manage`)
        } catch (err) {
            const errMsg = err.response?.data?.message || err.response?.data?.data?.prompt || 'Không thể khởi tạo chủ đề bằng AI, vui lòng thử lại.'
            setAiError(errMsg)
        } finally {
            setAiLoading(false)
        }
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto px-4 py-6">

                {/* Back Button */}
                <button onClick={() => navigate('/topics')}
                        className="flex items-center gap-2 text-on-surface-variant hover:text-primary text-sm font-bold mb-8 transition-colors active:scale-95">
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    {t.backBtn}
                </button>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl shadow-md shadow-primary/10">
                            <span className="material-symbols-outlined text-white text-lg">add_circle</span>
                        </div>
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">New Topic</span>
                    </div>
                    <h1 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
                        {t.title}
                    </h1>
                    <p className="text-on-surface-variant mt-2 text-base leading-relaxed">
                        {t.subtitle}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-outline-variant/30 mb-8 p-1 bg-surface-container rounded-2xl">
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`flex-1 py-3 px-4 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'manual'
                                ? 'bg-surface-container-lowest text-primary shadow-sm'
                                : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        <span className="material-symbols-outlined text-lg">edit_note</span>
                        {t.tabManual}
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`flex-1 py-3 px-4 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'ai'
                                ? 'bg-surface-container-lowest text-primary shadow-sm'
                                : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        <span className="material-symbols-outlined text-lg">auto_awesome</span>
                        {t.tabAi}
                    </button>
                </div>

                {/* Form Wrapper */}
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[2rem] p-8 shadow-sm">

                    {activeTab === 'manual' ? (
                        /* Manual Creation Form */
                        <div id="manual-creation-section">
                            {error && (
                                <div className="flex items-center gap-2 text-error text-sm font-semibold mb-6 p-3 bg-error-container/20 border border-error/10 rounded-xl">
                                    <span className="material-symbols-outlined text-base">error</span>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Topic Name */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-on-surface">
                                        {t.labelName} <span className="text-error">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">label</span>
                                        <input
                                            id="topic-name"
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder={t.placeholderName}
                                            maxLength={100}
                                            className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant/30
                                                       rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary
                                                       outline-none transition-all placeholder:text-outline text-on-surface font-semibold"
                                        />
                                    </div>
                                    <p className="text-xs text-on-surface-variant text-right">{name.length}/100</p>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-on-surface">
                                        {t.labelDesc} <span className="text-on-surface-variant font-normal">({t.labelDescOptional})</span>
                                    </label>
                                    <textarea
                                        id="topic-description"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder={t.placeholderDesc}
                                        rows={3}
                                        maxLength={1000}
                                        className="w-full px-4 py-3.5 bg-surface-container-low border border-outline-variant/30
                                                   rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary
                                                   outline-none transition-all placeholder:text-outline text-on-surface font-medium resize-none"
                                    />
                                    <p className="text-xs text-on-surface-variant text-right">{description.length}/1000</p>
                                </div>

                                {/* Icon Picker */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-on-surface">{t.labelIcon}</label>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                        {ICON_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                title={opt.label}
                                                onClick={() => setIcon(opt.value)}
                                                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all
                                                    ${icon === opt.value
                                                        ? 'border-primary bg-primary-fixed text-primary scale-[1.03] shadow-sm'
                                                        : 'border-outline-variant/20 hover:border-primary/20 hover:bg-surface-container-low text-on-surface-variant'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-xl">
                                                    {opt.value}
                                                </span>
                                                <span className="text-[9px] font-bold leading-tight text-center truncate w-full">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Preview Card */}
                                <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/25">
                                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">{t.previewTitle}</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-2xl">{icon}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-headline font-bold text-on-surface text-lg leading-tight truncate">
                                                {name || 'Tên topic của bạn'}
                                            </h3>
                                            <p className="text-on-surface-variant text-sm mt-0.5 truncate">
                                                {description || 'Mô tả topic...'}
                                            </p>
                                        </div>
                                        <span className="text-xs font-bold font-label bg-primary-fixed text-primary px-3 py-1 rounded-full flex-shrink-0">
                                            {t.msgPersonal}
                                        </span>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading || !name.trim()}
                                    className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/10 hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                        </svg>
                                    ) : (
                                        <span className="material-symbols-outlined text-xl">add_circle</span>
                                    )}
                                    {loading ? t.btnCreating : t.btnCreate}
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* AI Creation Form */
                        <div id="ai-creation-section" className="space-y-6">
                            
                            {/* Loading step tracker state visualization */}
                            {aiLoading ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="relative w-16 h-16">
                                        <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-2xl animate-pulse">auto_awesome</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 max-w-[400px]">
                                        <h4 className="font-headline font-bold text-lg text-on-surface">{t.btnAiGenerating}</h4>
                                        <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/30 text-xs font-semibold text-primary transition-all duration-500">
                                            {t.steps[loadingStep]}
                                        </div>
                                    </div>
                                    
                                    {/* Progress dot indicators */}
                                    <div className="flex gap-2">
                                        {t.steps.map((_, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                                    idx <= loadingStep ? 'bg-primary scale-110' : 'bg-outline-variant/40'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-primary-fixed/20 border border-primary/10 rounded-2xl p-5 flex gap-4">
                                        <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-on-surface">{t.aiAlertTitle}</h4>
                                            <p className="text-xs text-on-surface-variant leading-relaxed">
                                                {t.aiAlertDesc}
                                            </p>
                                        </div>
                                    </div>

                                    {aiError && (
                                        <div className="flex items-center gap-2 text-error text-sm font-semibold p-3 bg-error-container/20 border border-error/10 rounded-xl">
                                            <span className="material-symbols-outlined text-base">error</span>
                                            {aiError}
                                        </div>
                                    )}

                                    <form onSubmit={handleAiSubmit} className="space-y-6">
                                        {/* Prompt Input */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-on-surface">
                                                {t.labelPrompt} <span className="text-error">*</span>
                                            </label>
                                            <textarea
                                                id="ai-prompt"
                                                value={aiPrompt}
                                                onChange={e => setAiPrompt(e.target.value)}
                                                placeholder={t.placeholderPrompt}
                                                rows={4}
                                                maxLength={500}
                                                className="w-full px-4 py-3.5 bg-surface-container-low border border-outline-variant/30
                                                           rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary
                                                           outline-none transition-all placeholder:text-outline text-on-surface font-semibold resize-none"
                                                disabled={aiLoading}
                                            />
                                            <p className="text-xs text-on-surface-variant text-right">{aiPrompt.length}/500</p>
                                        </div>

                                        {/* Suggestion Pills */}
                                        <div className="space-y-2">
                                            <span className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t.labelSuggestions}</span>
                                            <div className="flex flex-wrap gap-2">
                                                {t.suggestions.map((sug, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setAiPrompt(sug)}
                                                        disabled={aiLoading}
                                                        className="text-xs font-bold px-4 py-2 rounded-full border border-outline-variant/40
                                                                   hover:border-primary/20 hover:bg-primary-fixed/20 text-on-surface-variant hover:text-primary transition-all active:scale-95"
                                                    >
                                                        {sug}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Submit AI Generation */}
                                        <button
                                            type="submit"
                                            disabled={aiLoading || !aiPrompt.trim()}
                                            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/10 hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="material-symbols-outlined text-xl">auto_awesome</span>
                                            <span>{t.btnAiGenerate}</span>
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}
