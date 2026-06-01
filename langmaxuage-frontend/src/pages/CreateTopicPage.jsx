import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import topicApi from '../api/topicApi'

const ICON_OPTIONS = [
    { value: 'folder',           label: 'General' },
    { value: 'business_center',  label: 'Business' },
    { value: 'spellcheck',       label: 'Grammar' },
    { value: 'flight_takeoff',   label: 'Travel' },
    { value: 'computer',         label: 'Technology' },
    { value: 'forum',            label: 'Daily Talk' },
    { value: 'edit_note',        label: 'Academic' },
    { value: 'format_quote',     label: 'Phrases' },
    { value: 'workspace_premium',label: 'TOEIC' },
    { value: 'restaurant',       label: 'Food' },
    { value: 'sports_soccer',    label: 'Sports' },
    { value: 'music_note',       label: 'Music' },
]

const AI_SUGGESTIONS = [
    'Từ vựng TOEIC chủ đề Airport, 5 từ',
    'Từ vựng TOEIC chủ đề Restaurant, 6 từ',
    'Giao tiếp khách sạn (Hotel Booking), 5 từ',
    'Từ vựng về Công nghệ thông tin (IT), 5 từ',
]

export default function CreateTopicPage() {
    const navigate = useNavigate()

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

    // Manual Submit
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim()) { setError('Tên topic không được để trống'); return }
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
        if (!aiPrompt.trim()) { setAiError('Vui lòng nhập nội dung mô tả chủ đề.'); return }
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
            <div className="max-w-2xl mx-auto">

                {/* Back */}
                <button onClick={() => navigate('/topics')}
                        className="flex items-center gap-2 text-on-surface-variant hover:text-primary text-sm font-semibold mb-8 transition-colors">
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Quay lại Topics
                </button>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-secondary to-tertiary rounded-xl flex items-center justify-center shadow-md shadow-secondary/20">
                            <span className="material-symbols-outlined text-white text-lg"
                                  style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                        </div>
                        <span className="text-xs font-bold text-secondary uppercase tracking-widest">New Topic</span>
                    </div>
                    <h1 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">
                        Tạo topic của bạn
                    </h1>
                    <p className="text-on-surface-variant mt-2 text-lg">
                        Tự xây dựng bộ từ vựng riêng bằng tay hoặc tự động tạo đa ngôn ngữ bằng trí tuệ nhân tạo AI.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-outline-variant/15 mb-8">
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`pb-4 px-6 font-bold text-sm transition-all border-b-2 flex items-center gap-1.5 ${
                            activeTab === 'manual'
                                ? 'border-secondary text-secondary'
                                : 'border-transparent text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        <span className="material-symbols-outlined text-lg">edit_note</span>
                        Tạo thủ công
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`pb-4 px-6 font-bold text-sm transition-all border-b-2 flex items-center gap-1.5 ${
                            activeTab === 'ai'
                                ? 'border-secondary text-secondary'
                                : 'border-transparent text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: activeTab === 'ai' ? "'FILL' 1" : "'FILL' 0" }}>smart_toy</span>
                        Sáng tạo bằng AI (Gemini)
                    </button>
                </div>

                {/* Form Card */}
                <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-[2rem] p-8 shadow-sm">

                    {activeTab === 'manual' ? (
                        /* Manual Creation Form */
                        <div id="manual-creation-section">
                            {error && (
                                <div className="flex items-center gap-2 text-error text-sm font-semibold mb-6 p-3 bg-error-container rounded-xl">
                                    <span className="material-symbols-outlined text-base">error</span>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-7">
                                {/* Topic Name */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-on-surface">
                                        Tên Topic <span className="text-error">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">label</span>
                                        <input
                                            id="topic-name"
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Ví dụ: Business English, TOEIC Part 5..."
                                            maxLength={100}
                                            className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/20
                                                       rounded-2xl focus:ring-2 focus:ring-secondary focus:border-transparent
                                                       outline-none transition-all placeholder:text-outline text-on-surface font-medium"
                                        />
                                    </div>
                                    <p className="text-xs text-on-surface-variant text-right">{name.length}/100</p>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-on-surface">
                                        Mô tả <span className="text-on-surface-variant font-normal">(tùy chọn)</span>
                                    </label>
                                    <textarea
                                        id="topic-description"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Mô tả ngắn về nội dung hoặc mục tiêu của topic này..."
                                        rows={3}
                                        maxLength={1000}
                                        className="w-full px-4 py-4 bg-surface-container-low border border-outline-variant/20
                                                   rounded-2xl focus:ring-2 focus:ring-secondary focus:border-transparent
                                                   outline-none transition-all placeholder:text-outline text-on-surface resize-none"
                                    />
                                    <p className="text-xs text-on-surface-variant text-right">{description.length}/1000</p>
                                </div>

                                {/* Icon Picker */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-on-surface">Chọn biểu tượng</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {ICON_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                title={opt.label}
                                                onClick={() => setIcon(opt.value)}
                                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all
                                                    ${icon === opt.value
                                                        ? 'border-secondary bg-secondary/10 text-secondary scale-105 shadow-sm'
                                                        : 'border-outline-variant/20 hover:border-secondary/30 hover:bg-surface-container text-on-surface-variant'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-xl"
                                                      style={{ fontVariationSettings: icon === opt.value ? "'FILL' 1" : "'FILL' 0" }}>
                                                    {opt.value}
                                                </span>
                                                <span className="text-[9px] font-semibold leading-tight text-center">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10">
                                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Preview</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-tertiary/10 text-tertiary rounded-2xl flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-2xl"
                                                  style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-headline font-bold text-on-surface text-lg leading-tight">
                                                {name || 'Tên topic của bạn'}
                                            </h3>
                                            <p className="text-on-surface-variant text-sm mt-0.5 line-clamp-1">
                                                {description || 'Mô tả topic...'}
                                            </p>
                                        </div>
                                        <span className="ml-auto text-xs font-bold font-label bg-tertiary/10 text-tertiary px-3 py-1 rounded-full">
                                            Personal
                                        </span>
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading || !name.trim()}
                                    id="btn-create-topic"
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-secondary to-tertiary
                                               text-white font-bold py-4 rounded-2xl shadow-xl shadow-secondary/30
                                               hover:shadow-secondary/40 transition-all duration-300 active:scale-[0.98]
                                               disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading
                                        ? <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                          </svg>
                                        : <span className="material-symbols-outlined text-xl"
                                                style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                                    }
                                    {loading ? 'Đang tạo...' : 'Tạo Topic & Thêm Flashcard'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* AI Creation Form */
                        <div id="ai-creation-section" className="space-y-6 animate-fade-in">
                            <div className="bg-secondary/5 border border-secondary/15 rounded-2xl p-5 flex gap-4">
                                <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-on-surface">Tạo nội dung tự động bằng AI</h4>
                                    <p className="text-xs text-on-surface-variant leading-relaxed">
                                        Chỉ cần mô tả chủ đề và số từ vựng mong muốn (bằng tiếng Việt hoặc tiếng Anh). Hệ thống AI sẽ tự động sinh Topic gốc kèm theo bộ thẻ Flashcard đã dịch sang cả 4 ngôn ngữ: <strong>Anh, Việt, Nhật, Hàn</strong> hoàn toàn đồng bộ.
                                    </p>
                                </div>
                            </div>

                            {aiError && (
                                <div className="flex items-center gap-2 text-error text-sm font-semibold p-3 bg-error-container rounded-xl">
                                    <span className="material-symbols-outlined text-base">error</span>
                                    {aiError}
                                </div>
                            )}

                            <form onSubmit={handleAiSubmit} className="space-y-6">
                                {/* Prompt Input */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-on-surface">
                                        Mô tả yêu cầu cho AI <span className="text-error">*</span>
                                    </label>
                                    <textarea
                                        id="ai-prompt"
                                        value={aiPrompt}
                                        onChange={e => setAiPrompt(e.target.value)}
                                        placeholder="Ví dụ: Tạo bộ 5 từ vựng TOEIC chủ đề Airport..."
                                        rows={4}
                                        maxLength={500}
                                        className="w-full px-4 py-4 bg-surface-container-low border border-outline-variant/20
                                                   rounded-2xl focus:ring-2 focus:ring-secondary focus:border-transparent
                                                   outline-none transition-all placeholder:text-outline text-on-surface resize-none font-medium"
                                        disabled={aiLoading}
                                    />
                                    <p className="text-xs text-on-surface-variant text-right">{aiPrompt.length}/500</p>
                                </div>

                                {/* Suggestion Pills */}
                                <div className="space-y-2">
                                    <span className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">Gợi ý nhanh</span>
                                    <div className="flex flex-wrap gap-2">
                                        {AI_SUGGESTIONS.map((sug, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setAiPrompt(sug)}
                                                disabled={aiLoading}
                                                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-outline-variant/20
                                                           hover:border-secondary/30 hover:bg-surface-container text-on-surface-variant transition-all active:scale-95"
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
                                    id="btn-create-topic-ai"
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-secondary to-tertiary
                                               text-white font-bold py-4 rounded-2xl shadow-xl shadow-secondary/30
                                               hover:shadow-secondary/40 transition-all duration-300 active:scale-[0.98]
                                               disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {aiLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                            </svg>
                                            <span>Trí tuệ nhân tạo đang sinh chủ đề & thẻ flashcard...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                            <span>Khởi tạo đa ngôn ngữ bằng AI</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}
