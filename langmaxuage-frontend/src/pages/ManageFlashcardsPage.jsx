import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import topicApi from '../api/topicApi'
import flashcardApi from '../api/flashcardApi'
import progressApi from '../api/progressApi'
import { useLanguage } from '../context/LanguageContext'

const DIFFICULTY_OPTS = ['EASY', 'MEDIUM', 'HARD']
const DIFFICULTY_STYLE = {
    EASY:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
    MEDIUM: 'bg-amber-50  text-amber-700  border border-amber-200',
    HARD:   'bg-rose-50   text-rose-700   border border-rose-200',
}

const getSrsStatus = (progress) => {
    if (!progress || progress.status === 'NEW') {
        return { label: '⚪ New', color: 'bg-slate-100 text-slate-600 border border-slate-200' }
    }
    const now = new Date()
    const nextReview = new Date(progress.nextReviewAt)
    const diffMs = nextReview - now
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours <= 0) {
        return { label: '🔴 Due', color: 'bg-rose-100 text-rose-700 border border-rose-200' }
    } else if (diffHours <= 48) {
        return { label: '🟡 Soon', color: 'bg-amber-100 text-amber-700 border border-amber-200' }
    } else {
        return { label: '🟢 Learned', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200' }
    }
}

const EMPTY_FORM = {
    word: '', pronunciation: '', definition: '',
    exampleSentence: '', difficulty: 'MEDIUM',
}

// ── Modal backdrop ──────────────────────────────────────────────────────────
function Modal({ open, onClose, children }) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-surface-container-lowest rounded-[2rem] shadow-2xl
                            border border-outline-variant/15 max-h-[90vh] overflow-y-auto animate-[fadeInUp_0.25s_ease]">
                {children}
            </div>
        </div>
    )
}

// ── Flashcard Form (dùng cho cả Add và Edit) ────────────────────────────────
function FlashcardForm({ initial = EMPTY_FORM, topicId, onSaved, onCancel, loading, setLoading, setError }) {
    const [form, setForm] = useState(initial)
    const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.word.trim())       { setError('Từ không được để trống'); return }
        if (!form.definition.trim()) { setError('Định nghĩa không được để trống'); return }
        setError(''); setLoading(true)
        try {
            const payload = {
                topicId: Number(topicId),
                word:            form.word.trim(),
                pronunciation:   form.pronunciation.trim(),
                definition:      form.definition.trim(),
                exampleSentence: form.exampleSentence.trim(),
                difficulty:      form.difficulty || 'MEDIUM',
            }
            let saved
            if (initial.id) {
                const res = await flashcardApi.update(initial.id, payload)
                saved = res.data.data
            } else {
                const res = await flashcardApi.create(payload)
                saved = res.data.data
            }
            onSaved(saved)
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể lưu flashcard.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-8">
            <h2 className="font-headline text-xl font-bold text-on-surface mb-1">
                {initial.id ? '✏️ Chỉnh sửa Flashcard' : '➕ Thêm Flashcard mới'}
            </h2>
            <p className="text-sm text-on-surface-variant mb-5">Điền thông tin từ vựng bên dưới.</p>

            {/* Word */}
            <Field label="Từ / Cụm từ" required>
                <input id="fc-word" value={form.word} onChange={f('word')}
                       placeholder="e.g. negotiate, leverage..." maxLength={200}
                       className={inputCls} />
            </Field>

            {/* Pronunciation */}
            <Field label="Phiên âm">
                <input id="fc-pronunciation" value={form.pronunciation} onChange={f('pronunciation')}
                       placeholder="e.g. /nɪˈɡoʊʃieɪt/" maxLength={200}
                       className={inputCls} />
            </Field>

            {/* Definition */}
            <Field label="Định nghĩa / Nghĩa" required>
                <textarea id="fc-definition" value={form.definition} onChange={f('definition')}
                          placeholder="Viết định nghĩa hoặc nghĩa tiếng Việt..."
                          rows={3} className={`${inputCls} resize-none`} />
            </Field>

            {/* Example */}
            <Field label="Câu ví dụ">
                <textarea id="fc-example" value={form.exampleSentence} onChange={f('exampleSentence')}
                          placeholder="The team decided to negotiate the terms of the contract."
                          rows={2} className={`${inputCls} resize-none`} />
            </Field>

            {/* Difficulty */}
            <Field label="Độ khó">
                <div className="flex gap-2">
                    {DIFFICULTY_OPTS.map(d => (
                        <button key={d} type="button"
                                onClick={() => setForm(prev => ({ ...prev, difficulty: d }))}
                                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border-2 transition-all
                                    ${form.difficulty === d
                                        ? (d === 'EASY'   ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                                         : d === 'MEDIUM' ? 'bg-amber-100   border-amber-400   text-amber-700'
                                                          : 'bg-rose-100    border-rose-400    text-rose-700')
                                        : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50'
                                    }`}>
                            {d}
                        </button>
                    ))}
                </div>
            </Field>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <button type="button" onClick={onCancel}
                        className="flex-1 py-3 rounded-xl border-2 border-outline-variant/30 text-on-surface-variant
                                   font-semibold hover:bg-surface-container transition-all">
                    Huỷ
                </button>
                <button type="submit" disabled={loading}
                        id={initial.id ? 'btn-update-flashcard' : 'btn-add-flashcard'}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container
                                   text-on-primary font-bold shadow-lg shadow-primary/20
                                   hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50">
                    {loading
                        ? <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                            Đang lưu...
                          </span>
                        : initial.id ? 'Lưu thay đổi' : 'Thêm Flashcard'
                    }
                </button>
            </div>
        </form>
    )
}

const inputCls = `w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20
                  rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent
                  outline-none transition-all placeholder:text-outline text-on-surface text-sm`

function Field({ label, required, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-on-surface">
                {label} {required && <span className="text-error">*</span>}
            </label>
            {children}
        </div>
    )
}

// ── Delete confirm modal ────────────────────────────────────────────────────
function DeleteConfirm({ card, onConfirm, onCancel, loading }) {
    return (
        <div className="p-8 text-center">
            <div className="w-14 h-14 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-error text-3xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}>delete</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-on-surface mb-2">Xóa Flashcard?</h2>
            <p className="text-sm text-on-surface-variant mb-6">
                Từ <strong className="text-on-surface">"{card?.word}"</strong> sẽ bị xóa vĩnh viễn.<br />
                Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
                <button onClick={onCancel} disabled={loading}
                        className="flex-1 py-3 rounded-xl border-2 border-outline-variant/30
                                   text-on-surface-variant font-semibold hover:bg-surface-container transition-all">
                    Huỷ
                </button>
                <button onClick={onConfirm} disabled={loading} id="btn-confirm-delete"
                        className="flex-1 py-3 rounded-xl bg-error text-on-error font-bold
                                   hover:bg-error/90 transition-all active:scale-[0.98] disabled:opacity-50">
                    {loading ? 'Đang xóa...' : 'Xóa'}
                </button>
            </div>
        </div>
    )
}

// ── Import CSV Form ─────────────────────────────────────────────────────────
function ImportCsvForm({ topicId, onImported, onCancel }) {
    const [file, setFile] = useState(null)
    const [dragActive, setDragActive] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState(null)

    const fileInputRef = useRef(null)

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0]
            if (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.txt')) {
                setFile(droppedFile)
                setError('')
            } else {
                setError('Chỉ chấp nhận file .csv hoặc .txt')
            }
        }
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setError('')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!file) {
            setError('Vui lòng chọn hoặc kéo thả file CSV')
            return
        }
        setLoading(true)
        setError('')
        setResult(null)
        try {
            const res = await flashcardApi.bulkImport(topicId, file)
            setResult(res.data.data)
            onImported(res.data.data)
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể import file. Vui lòng kiểm tra định dạng.')
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        setFile(null)
        setResult(null)
        setError('')
    }

    return (
        <div className="p-8">
            <h2 className="font-headline text-xl font-bold text-on-surface mb-1">
                📤 Import Flashcard bằng CSV
            </h2>
            <p className="text-sm text-on-surface-variant mb-5">
                Tải lên file danh sách từ vựng để thêm nhanh nhiều thẻ cùng lúc.
            </p>

            {error && (
                <div className="flex items-center gap-2 text-error text-sm font-semibold mb-4 p-3 bg-error-container rounded-xl">
                    <span className="material-symbols-outlined text-base">error</span>
                    {error}
                </div>
            )}

            {!result ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Drag & Drop Area */}
                    <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
                            ${dragActive
                                ? 'border-primary bg-primary/5 scale-[0.99]'
                                : file
                                    ? 'border-emerald-400 bg-emerald-50/30'
                                    : 'border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <span className={`material-symbols-outlined text-4xl block mb-2
                            ${file ? 'text-emerald-500' : 'text-outline'}`}>
                            {file ? 'task' : 'cloud_upload'}
                        </span>
                        
                        {file ? (
                            <div>
                                <p className="font-semibold text-on-surface text-sm break-all">{file.name}</p>
                                <p className="text-xs text-on-surface-variant mt-1">
                                    {(file.size / 1024).toFixed(2)} KB • Click hoặc kéo file khác để thay đổi
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-semibold text-on-surface text-sm">
                                    Kéo & thả file vào đây, hoặc click để chọn
                                </p>
                                <p className="text-xs text-on-surface-variant mt-1">
                                    Hỗ trợ file .csv hoặc .txt (UTF-8)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* CSV Format Guide */}
                    <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 text-xs space-y-2">
                        <p className="font-bold text-on-surface flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">info</span>
                            Định dạng File mẫu (Có Header):
                        </p>
                        <pre className="bg-surface-container-high p-2.5 rounded-xl font-mono text-[10px] text-on-surface overflow-x-auto whitespace-pre">
{`word,pronunciation,definition,example,difficulty
negotiate,/nɪˈɡoʊʃieɪt/,Đàm phán,They negotiated a deal.,MEDIUM
leverage,/ˈlevərɪdʒ/,Tận dụng,We should leverage our strengths.,HARD`}
                        </pre>
                        <ul className="list-disc pl-4 space-y-1 text-on-surface-variant">
                            <li>Cột bắt buộc: <strong>word</strong> (cột 1) và <strong>definition</strong> (cột 3).</li>
                            <li>Độ khó hợp lệ: <code>EASY</code>, <code>MEDIUM</code>, <code>HARD</code> (mặc định là <code>MEDIUM</code>).</li>
                            <li>Các từ đã tồn tại trong topic này sẽ tự động được bỏ qua.</li>
                        </ul>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onCancel} disabled={loading}
                                className="flex-1 py-3 rounded-xl border-2 border-outline-variant/30 text-on-surface-variant
                                           font-semibold hover:bg-surface-container transition-all">
                            Huỷ
                        </button>
                        <button type="submit" disabled={loading || !file}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container
                                           text-on-primary font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30
                                           transition-all active:scale-[0.98] disabled:opacity-50">
                            {loading ? 'Đang tải lên...' : 'Bắt đầu Import'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-5">
                    {/* Import Results Banner */}
                    <div className="flex items-center gap-3 p-4 bg-surface-container rounded-2xl">
                        <div className="flex-1">
                            <h3 className="font-bold text-on-surface text-base">Kết quả Import</h3>
                            <div className="flex gap-4 mt-1 text-sm font-semibold">
                                <span className="text-emerald-600">✅ Thành công: {result.successCount}</span>
                                <span className={result.failCount > 0 ? 'text-rose-600' : 'text-on-surface-variant'}>
                                    ❌ Bỏ qua/Lỗi: {result.failCount}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Errors / Warnings log */}
                    {result.errors && result.errors.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                Chi tiết log lỗi & cảnh báo:
                            </p>
                            <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-4 max-h-[160px] overflow-y-auto font-mono text-[11px] text-on-surface-variant space-y-1">
                                {result.errors.map((err, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <span className="text-rose-500">⚠</span>
                                        <span>{err}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button type="button" onClick={handleReset}
                                className="flex-1 py-3 rounded-xl border-2 border-outline-variant/30 text-on-surface-variant
                                           font-semibold hover:bg-surface-container transition-all">
                            Import tiếp file khác
                        </button>
                        <button type="button" onClick={onCancel}
                                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold transition-all">
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function ManageFlashcardsPage() {
    const { topicId } = useParams()
    const navigate    = useNavigate()
    const { locale }  = useLanguage()

    const [topic,       setTopic]       = useState(null)
    const [cards,       setCards]       = useState([])
    const [pageLoading, setPageLoading] = useState(true)
    const [formLoading, setFormLoading] = useState(false)
    const [error,       setError]       = useState('')

    const [showAdd,    setShowAdd]    = useState(false)
    const [showImport, setShowImport] = useState(false)
    const [editCard,   setEditCard]   = useState(null)   // card đang sửa
    const [deleteCard, setDeleteCard] = useState(null)   // card đang xóa

    const [search,     setSearch]     = useState('')
    const [progressMap, setProgressMap] = useState({})

    // Load topic + cards + progress
    useEffect(() => {
        setPageLoading(true)
        Promise.all([
            topicApi.getById(topicId, locale),
            flashcardApi.getByTopic(topicId, locale, false, { page: 0, size: 200 }),
            progressApi.getMyProgress(locale).catch(() => ({ data: { data: [] } })),
        ]).then(([tRes, fcRes, pRes]) => {
            setTopic(tRes.data.data)
            setCards(fcRes.data.data?.content || [])
            
            const pMap = {}
            if (pRes?.data?.data) {
                pRes.data.data.forEach(p => {
                    if (p.flashcard?.id) {
                        pMap[p.flashcard.id] = p
                    }
                })
            }
            setProgressMap(pMap)
        }).catch(() => setError('Không thể tải dữ liệu. Topic có thể không tồn tại.'))
          .finally(() => setPageLoading(false))
    }, [topicId, locale])

    // Handlers
    const handleAdded = (newCard) => {
        setCards(prev => [newCard, ...prev])
        setShowAdd(false)
        setError('')
    }

    const handleUpdated = (updated) => {
        setCards(prev => prev.map(c => c.id === updated.id ? updated : c))
        setEditCard(null)
        setError('')
    }

    const handleDeleteConfirm = async () => {
        setFormLoading(true)
        try {
            await flashcardApi.delete(deleteCard.id)
            setCards(prev => prev.filter(c => c.id !== deleteCard.id))
            setDeleteCard(null)
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể xóa flashcard.')
            setDeleteCard(null)
        } finally {
            setFormLoading(false)
        }
    }

    const filtered = cards.filter(c =>
        !search || c.word?.toLowerCase().includes(search.toLowerCase()) ||
                   c.definition?.toLowerCase().includes(search.toLowerCase())
    )

    if (pageLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center mt-32">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">

                {/* Back + Breadcrumb */}
                <button onClick={() => navigate('/topics')}
                        className="flex items-center gap-2 text-on-surface-variant hover:text-primary text-sm font-semibold mb-8 transition-colors">
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Quay lại Topics
                </button>

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end gap-5 mb-10">
                    <div className="flex-1">
                        <span className="text-xs font-bold text-secondary uppercase tracking-widest">Quản lý Flashcard</span>
                        <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight mt-1">
                            {topic?.name || 'Topic'}
                        </h1>
                        {topic?.description && (
                            <p className="text-on-surface-variant mt-1.5 max-w-lg">{topic.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-3">
                            <span className="text-sm text-on-surface-variant font-medium">
                                <strong className="text-on-surface">{cards.length}</strong> flashcard
                            </span>
                            {!topic?.isSystem && (
                                <span className="text-xs font-bold bg-tertiary/10 text-tertiary px-2.5 py-1 rounded-full">Personal</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Import CSV */}
                        <button
                            onClick={() => { setError(''); setShowImport(true) }}
                            className="flex items-center gap-2 px-5 py-3 border-2 border-outline-variant/30 text-on-surface-variant
                                       font-semibold rounded-xl hover:bg-surface-container transition-all text-sm"
                        >
                            <span className="material-symbols-outlined text-lg">upload_file</span>
                            Import CSV
                        </button>
                        {/* Học flashcard */}
                        <button
                            onClick={() => navigate(`/flashcards/${topicId}`)}
                            className="flex items-center gap-2 px-5 py-3 border-2 border-primary/30 text-primary
                                       font-semibold rounded-xl hover:bg-primary/5 transition-all text-sm"
                        >
                            <span className="material-symbols-outlined text-lg"
                                  style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                            Học ngay
                        </button>
                        {/* Thêm flashcard */}
                        <button
                            onClick={() => { setError(''); setShowAdd(true) }}
                            id="btn-open-add-flashcard"
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-container
                                       text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25
                                       hover:shadow-primary/35 transition-all active:scale-95 text-sm"
                        >
                            <span className="material-symbols-outlined text-lg"
                                  style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
                            Thêm Flashcard
                        </button>
                    </div>
                </div>

                {/* Global Error */}
                {error && (
                    <div className="flex items-center gap-2 text-error text-sm font-semibold mb-6 p-3 bg-error-container rounded-xl">
                        <span className="material-symbols-outlined text-base">error</span>
                        {error}
                        <button onClick={() => setError('')} className="ml-auto opacity-60 hover:opacity-100">
                            <span className="material-symbols-outlined text-base">close</span>
                        </button>
                    </div>
                )}

                {/* Search bar */}
                {cards.length > 0 && (
                    <div className="relative mb-6">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
                        <input
                            id="search-flashcard"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm kiếm từ hoặc định nghĩa..."
                            className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/20
                                       rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none
                                       transition-all placeholder:text-outline text-sm"
                        />
                    </div>
                )}

                {/* Flashcard list */}
                {cards.length === 0 ? (
                    <EmptyState onAdd={() => setShowAdd(true)} />
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-on-surface-variant">
                        <span className="material-symbols-outlined text-5xl block mb-2 opacity-30">search_off</span>
                        <p>Không tìm thấy từ nào khớp với "<strong>{search}</strong>"</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((card, idx) => (
                            <FlashcardRow
                                key={card.id}
                                card={card}
                                index={idx}
                                progress={progressMap[card.id]}
                                onEdit={() => { setError(''); setEditCard(card) }}
                                onDelete={() => { setError(''); setDeleteCard(card) }}
                            />
                        ))}
                    </div>
                )}

                {/* Bottom add button (khi đã có cards) */}
                {cards.length > 0 && (
                    <button
                        onClick={() => { setError(''); setShowAdd(true) }}
                        className="w-full mt-6 py-4 border-2 border-dashed border-primary/30 rounded-2xl
                                   text-primary font-semibold text-sm hover:border-primary/60 hover:bg-primary/5
                                   transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined"
                              style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                        Thêm flashcard mới
                    </button>
                )}
            </div>

            {/* ── Modal: Add flashcard ── */}
            <Modal open={showAdd} onClose={() => setShowAdd(false)}>
                <FlashcardForm
                    initial={EMPTY_FORM}
                    topicId={topicId}
                    onSaved={handleAdded}
                    onCancel={() => setShowAdd(false)}
                    loading={formLoading}
                    setLoading={setFormLoading}
                    setError={setError}
                />
            </Modal>

            {/* ── Modal: Edit flashcard ── */}
            <Modal open={!!editCard} onClose={() => setEditCard(null)}>
                {editCard && (
                    <FlashcardForm
                        initial={editCard}
                        topicId={topicId}
                        onSaved={handleUpdated}
                        onCancel={() => setEditCard(null)}
                        loading={formLoading}
                        setLoading={setFormLoading}
                        setError={setError}
                    />
                )}
            </Modal>

            {/* ── Modal: Delete confirm ── */}
            <Modal open={!!deleteCard} onClose={() => setDeleteCard(null)}>
                <DeleteConfirm
                    card={deleteCard}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteCard(null)}
                    loading={formLoading}
                />
            </Modal>

            {/* ── Modal: Import CSV ── */}
            <Modal open={showImport} onClose={() => setShowImport(false)}>
                <ImportCsvForm
                    topicId={topicId}
                    onImported={(result) => {
                        flashcardApi.getByTopic(topicId, locale, false, { page: 0, size: 200 })
                            .then(fcRes => setCards(fcRes.data.data?.content || []))
                        progressApi.getMyProgress(locale)
                            .then(pRes => {
                                const pMap = {}
                                if (pRes?.data?.data) {
                                    pRes.data.data.forEach(p => {
                                        if (p.flashcard?.id) {
                                            pMap[p.flashcard.id] = p
                                        }
                                    })
                                }
                                setProgressMap(pMap)
                            }).catch(() => {})
                    }}
                    onCancel={() => setShowImport(false)}
                />
            </Modal>
        </Layout>
    )
}

// ── Flashcard Row ─────────────────────────────────────────────────────────────
function FlashcardRow({ card, index, progress, onEdit, onDelete }) {
    const [expanded, setExpanded] = useState(false)
    const diff = card.difficulty || 'MEDIUM'
    const srs = getSrsStatus(progress)

    return (
        <div className={`bg-surface-container-lowest border border-outline-variant/15 rounded-2xl
                         overflow-hidden transition-all duration-200 hover:shadow-md hover:border-outline-variant/30
                         ${expanded ? 'shadow-md' : ''}`}>
            {/* Header row */}
            <div className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                 onClick={() => setExpanded(v => !v)}>
                {/* Index badge */}
                <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center
                                 rounded-lg bg-surface-container text-on-surface-variant text-xs font-bold">
                    {index + 1}
                </span>

                {/* Word + pronunciation */}
                <div className="flex-1 min-w-0">
                    <span className="font-headline font-bold text-on-surface text-base">{card.word}</span>
                    {card.pronunciation && (
                        <span className="ml-2 text-on-surface-variant text-sm italic">{card.pronunciation}</span>
                    )}
                    {!expanded && (
                        <p className="text-on-surface-variant text-sm truncate mt-0.5">{card.definition}</p>
                    )}
                </div>

                {/* Difficulty & SRS badges */}
                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${DIFFICULTY_STYLE[diff]}`}>
                        {diff}
                    </span>
                    {srs && (
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${srs.color}`}>
                            {srs.label}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={onEdit} title="Chỉnh sửa"
                            className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all">
                        <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button onClick={onDelete} title="Xóa"
                            className="p-2 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/10 transition-all">
                        <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>

                <span className={`material-symbols-outlined text-outline transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </div>

            {/* Expanded detail */}
            {expanded && (
                <div className="px-5 pb-5 border-t border-outline-variant/10">
                    <div className="grid md:grid-cols-2 gap-4 pt-4">
                        <div>
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Định nghĩa</p>
                            <p className="text-on-surface text-sm leading-relaxed">{card.definition}</p>
                        </div>
                        {card.exampleSentence && (
                            <div>
                                <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1">Câu ví dụ</p>
                                <p className="text-on-surface-variant text-sm italic leading-relaxed">"{card.exampleSentence}"</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
    return (
        <div className="text-center py-20">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-primary text-4xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
            </div>
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
                Topic này chưa có flashcard
            </h2>
            <p className="text-on-surface-variant mb-8 max-w-sm mx-auto">
                Hãy thêm từ vựng đầu tiên để bắt đầu học. Mỗi flashcard bao gồm từ, phiên âm, nghĩa và câu ví dụ.
            </p>
            <button onClick={onAdd} id="btn-first-flashcard"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container
                               text-on-primary font-bold px-8 py-4 rounded-xl shadow-xl shadow-primary/25
                               hover:shadow-primary/35 transition-all active:scale-95">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
                Thêm Flashcard đầu tiên
            </button>
        </div>
    )
}
