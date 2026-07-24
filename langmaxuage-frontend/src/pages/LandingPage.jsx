import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function LandingPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { locale } = useLanguage()
    const [isFlipped, setIsFlipped] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)

    // Redirect logged in users
    useEffect(() => {
        if (user) {
            if (user.onboarded) {
                navigate('/home')
            } else {
                navigate('/onboarding')
            }
        }
    }, [user, navigate])

    // Localized dictionary to avoid editing multiple locale files and keep component self-contained
    const localTranslations = {
        en: {
            eyebrow: "AI-POWERED MULTI-LANGUAGE PLATFORM",
            heroTitle: "Master any vocabulary with the speed of AI",
            heroSubtext: "Generate smart, context-aware flashcards instantly. Train your memory with spaced repetition, native audio, and related words.",
            ctaGetStarted: "Get Started Free",
            ctaDashboard: "Go to Dashboard",
            ctaLearnMore: "See How It Works",
            featuresTitle: "Everything you need to learn vocabulary",
            featuresSubtitle: "Built on top-tier engineering, AI reasoning, and cognitive science.",
            bentoAiTitle: "AI Topic Generator",
            bentoAiDesc: "Just type a topic (e.g. 'Coffee Shop' or 'French for Travel'). Gemini instantly generates rich cards in multiple languages.",
            bentoDictTitle: "Smart Pronunciation",
            bentoDictDesc: "Real-time IPA phonetic transcripts, parts of speech, and instant native audio pronunciation for every word.",
            bentoMuseTitle: "Datamuse Related Words",
            bentoMuseDesc: "Enhance your mental map with up to 5 synonyms and target words loaded asynchronously for every card.",
            bentoSm2Title: "Spaced Repetition (SM2)",
            bentoSm2Desc: "Smart algorithm tracks your memory retention and schedules reviews right before you forget.",
            interactiveTitle: "Try it yourself",
            interactiveSubtitle: "Click the card to flip it or play the audio.",
            cardWord: "Vibrant",
            cardPhonetic: "/ˈvaɪbrənt/",
            cardPos: "Adjective",
            cardDefEn: "Full of energy and life; bright and striking.",
            cardExEn: "The streets of Hanoi are vibrant and full of motorcycle sounds.",
            cardDefTarget: "Lively, energetic, bright and striking.",
            cardExTarget: "The streets of Hanoi are lively and full of motorcycle sounds.",
            quoteText: "\"LangMaxuage cut my study time in half. The context-aware AI definitions are incredibly natural compared to standard dictionary apps.\"",
            quoteAuthor: "Alex Nguyen",
            quoteRole: "Language learner",
            ctaFooterTitle: "Ready to expand your vocabulary?",
            ctaFooterBtn: "Start Free Today",
            navFeatures: "Features",
            navTryCard: "Try Card",
            navSignIn: "Sign In",
            tooltipChangeLanguage: "Change Language"
        },
        vi: {
            eyebrow: "NỀN TẢNG HỌC TỪ VỰNG ĐA NGÔN NGỮ AI",
            heroTitle: "Làm chủ mọi từ vựng với tốc độ của AI",
            heroSubtext: "Tự động tạo thẻ từ vựng thông minh theo ngữ cảnh. Ghi nhớ lâu hơn nhờ lặp lại ngắt quãng, phát âm bản xứ và từ liên quan.",
            ctaGetStarted: "Bắt đầu Miễn phí",
            ctaDashboard: "Vào Bảng điều khiển",
            ctaLearnMore: "Tìm hiểu cách hoạt động",
            featuresTitle: "Mọi công cụ để làm chủ từ vựng",
            featuresSubtitle: "Xây dựng trên nền tảng kỹ thuật tối ưu, trí tuệ nhân tạo và khoa học trí nhớ.",
            bentoAiTitle: "Tạo chủ đề bằng AI",
            bentoAiDesc: "Chỉ cần nhập chủ đề (ví dụ: 'Coffee Shop' hoặc 'Du lịch Pháp'). Gemini sẽ lập tức sinh ra bộ thẻ chất lượng cao kèm dịch nghĩa.",
            bentoDictTitle: "Phát âm thông minh",
            bentoDictDesc: "Tự động lấy phiên âm IPA chuẩn, từ loại và file âm thanh phát âm bản xứ trực quan cho từng từ.",
            bentoMuseTitle: "Từ liên quan Datamuse",
            bentoMuseDesc: "Mở rộng bản đồ tư duy với tối đa 5 từ đồng nghĩa và từ liên quan được tải chạy ngầm cho mỗi thẻ.",
            bentoSm2Title: "Lặp lại ngắt quãng (SM2)",
            bentoSm2Desc: "Thuật toán theo dõi độ ghi nhớ của bạn và lên lịch ôn tập thông minh ngay trước khi bạn chuẩn bị quên.",
            interactiveTitle: "Trải nghiệm thực tế",
            interactiveSubtitle: "Bấm vào thẻ để lật mặt sau hoặc phát âm thanh.",
            cardWord: "Vibrant",
            cardPhonetic: "/ˈvaɪbrənt/",
            cardPos: "Tính từ",
            cardDefEn: "Full of energy and life; bright and striking.",
            cardExEn: "The streets of Hanoi are vibrant and full of motorcycle sounds.",
            cardDefTarget: "Sôi nổi, rực rỡ, đầy sức sống.",
            cardExTarget: "Đường phố Hà Nội luôn sôi nổi và tràn ngập âm thanh của xe máy.",
            quoteText: "\"LangMaxuage giúp tôi giảm một nửa thời gian học. Các định nghĩa từ ngữ cảnh bằng AI tự nhiên hơn nhiều so với các app từ điển thông thường.\"",
            quoteAuthor: "Nguyễn Thế Anh",
            quoteRole: "Học viên đa ngôn ngữ",
            ctaFooterTitle: "Sẵn sàng mở rộng vốn từ của bạn?",
            ctaFooterBtn: "Bắt đầu học Miễn phí",
            navFeatures: "Tính năng",
            navTryCard: "Trải nghiệm",
            navSignIn: "Đăng nhập",
            tooltipChangeLanguage: "Thay đổi ngôn ngữ"
        },
        ja: {
            eyebrow: "AI搭載マルチ言語語彙学習プラットフォーム",
            heroTitle: "AIのスピードで、あらゆる語彙をマスターする",
            heroSubtext: "Generate smart, context-aware flashcards instantly. Train your memory with spaced repetition, native audio, and related words.",
            ctaGetStarted: "無料で始める",
            ctaDashboard: "ダッシュボードへ",
            ctaLearnMore: "機能の仕組みを見る",
            featuresTitle: "語彙学習に必要なすべてのツール",
            featuresSubtitle: "高度なエンジニアリング、AI推論、認知科学に基づいて設計されています。",
            bentoAiTitle: "AIトピック生成機能",
            bentoAiDesc: "トピック（例：「カフェ」や「旅行のフランス語」）を入力するだけで、Geminiが多言語の豊富なカードを即座に作成します。",
            bentoDictTitle: "スマート発音",
            bentoDictDesc: "すべての単語に対して、リアルタイムのIPA発音記号、品詞、ネイティブの音声発音を即座に提供します。",
            bentoMuseTitle: "Datamuse関連語",
            bentoMuseDesc: "各カードに非同期で読み込まれる最大5つの類義語や関連語で、語彙ネットワークを広げます。",
            bentoSm2Title: "間隔反復（SM2）",
            bentoSm2Desc: "スマートアルゴリズムがあなたの記憶の定着度を追跡し、忘れる直前に復習をスケジュールします。",
            interactiveTitle: "実際に試してみる",
            interactiveSubtitle: "カードをクリックして裏返したり、音声を再生したりできます。",
            cardWord: "Vibrant",
            cardPhonetic: "/ˈvaɪbrənt/",
            cardPos: "形容詞",
            cardDefEn: "Full of energy and life; bright and striking.",
            cardExEn: "The streets of Hanoi are vibrant and full of motorcycle sounds.",
            cardDefTarget: "活気に満ちた、鮮やかな、力強い。",
            cardExTarget: "ハノイの通りは活気に満ちており、バイクの音で溢れています。",
            quoteText: "「LangMaxuageのおかげで学習時間が半分になりました。AIによる文脈に沿った定義は、一般的な辞書アプリと比べて驚くほど自然です。」",
            quoteAuthor: "アレックス・グエン",
            quoteRole: "マルチ言語学習者",
            ctaFooterTitle: "語彙力を広げる準備はできましたか？",
            ctaFooterBtn: "今すぐ無料で始める",
            navFeatures: "特徴",
            navTryCard: "体験する",
            navSignIn: "ログイン",
            tooltipChangeLanguage: "言語の変更"
        },
        ko: {
            eyebrow: "AI 기반 다국어 어휘 학습 플랫폼",
            heroTitle: "AI의 속도로 모든 어휘를 마스터하세요",
            heroSubtext: "문맥을 인식하는 스마트 플래시카드를 즉시 생성합니다. 망각 곡선 분산 반복, 원어민 발음, 연관 단어로 기억력을 훈련하세요.",
            ctaGetStarted: "무료로 시작하기",
            ctaDashboard: "대시보드로 이동",
            ctaLearnMore: "작동 원리 보기",
            featuresTitle: "어휘 학습에 필요한 모든 것",
            featuresSubtitle: "최상위 엔지니어링, AI 추론 및 인지 과학을 기반으로 구축되었습니다.",
            bentoAiTitle: "AI 주제 생성기",
            bentoAiDesc: "주제(예: '커피숍' 또는 '프랑스 여행')를 입력하기만 하면 Gemini가 여러 언어로 풍부한 카드를 즉시 생성합니다.",
            bentoDictTitle: "스마트 발음",
            bentoDictDesc: "모든 단어에 대한 실시간 IPA 발음 기호, 품사 정보 및 원어민 음성 발음을 즉시 제공합니다.",
            bentoMuseTitle: "Datamuse 연관 단어",
            bentoMuseDesc: "각 카드마다 비동기적으로 로드되는 최대 5개의 동의어 및 연관 단어로 어휘망을 넓히세요.",
            bentoSm2Title: "망각 곡선 분산 반복 (SM2)",
            bentoSm2Desc: "스마트 알고리즘이 기억 보유력을 추적하고 잊어버리기 직전에 복습 일정을 예약합니다.",
            interactiveTitle: "직접 체험해 보세요",
            interactiveSubtitle: "카드를 클릭하여 뒤집거나 발음을 들어보세요.",
            cardWord: "Vibrant",
            cardPhonetic: "/ˈvaɪbrənt/",
            cardPos: "형용사",
            cardDefEn: "Full of energy and life; bright and striking.",
            cardExEn: "The streets of Hanoi are vibrant and full of motorcycle sounds.",
            cardDefTarget: "활기찬, 생기 넘치는, 눈부신.",
            cardExTarget: "하노이의 거리는 활기차고 오토바이 소리로 가득 차 있습니다.",
            quoteText: "\"LangMaxuage 덕분에 학습 시간이 절반으로 줄었습니다. 문맥을 반영한 AI 정의는 일반 사전 앱에 비해 믿을 수 없을 정도로 자연스럽습니다.\"",
            quoteAuthor: "알렉스 응우옌",
            quoteRole: "다국어 학습자",
            ctaFooterTitle: "어휘력을 확장할 준비가 되셨나요?",
            ctaFooterBtn: "오늘 무료로 시작하기",
            navFeatures: "특징",
            navTryCard: "체험하기",
            navSignIn: "로그인",
            tooltipChangeLanguage: "언어 변경"
        }
    }

    const t = localTranslations[locale] || localTranslations.en

    const playMockAudio = () => {
        setIsPlaying(true)
        const synth = window.speechSynthesis
        if (synth) {
            const utterance = new SpeechSynthesisUtterance("Vibrant")
            utterance.lang = "en-US"
            utterance.onend = () => setIsPlaying(false)
            synth.speak(utterance)
        } else {
            setTimeout(() => setIsPlaying(false), 1000)
        }
    }

    return (
        <div className="min-h-[100dvh] bg-surface text-on-surface font-body selection:bg-primary/20 scroll-smooth">
            {/* Header / Navbar */}
            <header className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-md border-b border-outline-variant/15 transition-all">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
                            <span className="material-symbols-outlined font-semibold text-2xl">translate</span>
                        </div>
                        <span className="font-headline font-bold text-xl tracking-tight text-primary">LangMaxuage</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">{t.navFeatures}</a>
                        <a href="#try-it" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">{t.navTryCard}</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/language')}
                                className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all"
                                title={t.tooltipChangeLanguage}>
                            <span className="material-symbols-outlined text-xl">language</span>
                        </button>
                        {user ? (
                            <button onClick={() => navigate('/home')}
                                    className="px-5 py-2.5 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary-container active:scale-95 transition-all shadow-md shadow-primary/10">
                                {t.ctaDashboard}
                            </button>
                        ) : (
                            <>
                                <button onClick={() => navigate('/login')}
                                        className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
                                    {t.navSignIn}
                                </button>
                                <button onClick={() => navigate('/login?tab=register')}
                                        className="px-5 py-2.5 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary-container active:scale-95 transition-all shadow-md shadow-primary/10">
                                    {t.ctaGetStarted}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Content */}
                <div className="lg:col-span-7 flex flex-col items-start text-left">
                    <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-fixed text-primary font-mono text-[11px] font-bold tracking-wider uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        {t.eyebrow}
                    </div>
                    <h1 className="font-headline font-black text-4xl md:text-6xl tracking-tighter leading-[1.05] text-on-surface">
                        {t.heroTitle}
                    </h1>
                    <p className="mt-6 text-lg text-on-surface-variant leading-relaxed max-w-[50ch]">
                        {t.heroSubtext}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-4 items-center">
                        <button onClick={() => navigate(user ? '/home' : '/login')}
                                className="px-8 py-4 bg-primary text-white rounded-full font-bold text-base hover:bg-primary-container active:scale-95 transition-all shadow-lg shadow-primary/15">
                            {user ? t.ctaDashboard : t.ctaGetStarted}
                        </button>
                        <a href="#features"
                                className="px-6 py-4 border border-outline-variant/60 text-on-surface font-bold text-base rounded-full hover:bg-surface-container-low transition-colors">
                            {t.ctaLearnMore}
                        </a>
                    </div>
                </div>

                {/* Right Interactive Card Preview */}
                <div id="try-it" className="lg:col-span-5 flex flex-col items-center scroll-mt-24">
                    <div className="text-center mb-4">
                        <span className="text-xs font-bold text-primary tracking-widest uppercase">{t.interactiveTitle}</span>
                        <p className="text-xs text-on-surface-variant mt-1">{t.interactiveSubtitle}</p>
                    </div>

                    {/* Flipped Card Component */}
                    <div className="w-full max-w-[340px] h-[400px] flip-card cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                        <div className={`w-full h-full flip-inner rounded-3xl border border-outline-variant/40 shadow-xl transition-all duration-700 ${isFlipped ? 'flipped' : ''}`}>
                            {/* Front Side */}
                            <div className="absolute inset-0 flip-front bg-surface-container-lowest rounded-3xl p-8 flex flex-col justify-between">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="px-3 py-1 rounded-full bg-surface-container text-primary font-bold text-[11px] uppercase tracking-wider">
                                            {t.cardPos}
                                        </span>
                                        <h3 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface mt-3">
                                            {t.cardWord}
                                        </h3>
                                        <p className="text-sm font-mono text-outline mt-1 font-medium">{t.cardPhonetic}</p>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); playMockAudio(); }}
                                        className={`w-12 h-12 rounded-full border border-outline-variant/40 flex items-center justify-center transition-all ${isPlaying ? 'bg-primary text-white scale-95 border-primary' : 'bg-surface hover:bg-primary-fixed hover:text-primary'}`}
                                    >
                                        <span className={`material-symbols-outlined text-xl ${isPlaying ? 'animate-bounce' : ''}`}>
                                            {isPlaying ? 'volume_up' : 'volume_mute'}
                                        </span>
                                    </button>
                                </div>
                                <div className="mt-auto border-t border-outline-variant/20 pt-6">
                                    <span className="text-xs font-bold text-outline tracking-wider uppercase block mb-1">Definition</span>
                                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed mb-4">{t.cardDefEn}</p>
                                    <span className="text-xs font-bold text-outline tracking-wider uppercase block mb-1">Example</span>
                                    <p className="text-xs text-on-surface-variant italic leading-relaxed">"{t.cardExEn}"</p>
                                </div>
                            </div>

                            {/* Back Side */}
                            <div className="absolute inset-0 flip-back bg-primary-fixed/30 border border-primary/20 rounded-3xl p-8 flex flex-col justify-between">
                                <div>
                                    <span className="px-3 py-1 rounded-full bg-primary text-white font-bold text-[11px] uppercase tracking-wider">
                                        Translation
                                    </span>
                                    <h4 className="font-headline font-extrabold text-2xl tracking-tight text-primary mt-4">
                                        {t.cardWord}
                                    </h4>
                                </div>
                                <div className="mt-auto pt-6 border-t border-primary/10">
                                    <span className="text-xs font-bold text-primary/80 tracking-wider uppercase block mb-1">Dịch nghĩa</span>
                                    <p className="text-base text-on-primary-fixed font-bold leading-relaxed mb-4">{t.cardDefTarget}</p>
                                    <span className="text-xs font-bold text-primary/80 tracking-wider uppercase block mb-1">Ví dụ dịch</span>
                                    <p className="text-xs text-on-secondary-fixed-variant leading-relaxed font-medium">"{t.cardExTarget}"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section (Bento Grid) */}
            <section id="features" className="bg-surface-container-low border-t border-b border-outline-variant/30 py-20 scroll-mt-24">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="font-headline font-black text-3xl md:text-4xl tracking-tight text-on-surface">
                        {t.featuresTitle}
                    </h2>
                    <p className="text-on-surface-variant text-base mt-3 max-w-[60ch] mx-auto">
                        {t.featuresSubtitle}
                    </p>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
                        {/* 1. AI Generator (2-cols wide) */}
                        <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 flex flex-col justify-between min-h-[300px]">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                                </div>
                                <h3 className="font-headline font-bold text-xl text-on-surface">{t.bentoAiTitle}</h3>
                                <p className="text-on-surface-variant text-sm mt-2 leading-relaxed max-w-[55ch]">{t.bentoAiDesc}</p>
                            </div>
                            <div className="mt-6 p-4 rounded-2xl bg-surface-container border border-outline-variant/20 flex flex-wrap gap-2 items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-bold text-on-surface-variant">Prompt: 'Travel Vocabulary'</span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-primary uppercase">Gemini-1.5-Flash</span>
                            </div>
                        </div>

                        {/* 2. Smart Pronunciation (1-col) */}
                        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 flex flex-col justify-between min-h-[300px]">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-2xl">mic</span>
                                </div>
                                <h3 className="font-headline font-bold text-xl text-on-surface">{t.bentoDictTitle}</h3>
                                <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">{t.bentoDictDesc}</p>
                            </div>
                            <div className="mt-6 flex items-center gap-1.5 h-6">
                                <div className="w-1 h-3 bg-primary rounded-full animate-pulse" />
                                <div className="w-1 h-5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                                <div className="w-1 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                <div className="w-1 h-6 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                                <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                <div className="w-1 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                            </div>
                        </div>

                        {/* 3. Datamuse Related Words (1-col) */}
                        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 flex flex-col justify-between min-h-[300px]">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-2xl">hub</span>
                                </div>
                                <h3 className="font-headline font-bold text-xl text-on-surface">{t.bentoMuseTitle}</h3>
                                <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">{t.bentoMuseDesc}</p>
                            </div>
                            <div className="mt-6 flex flex-wrap gap-2">
                                <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">#Synonym</span>
                                <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">#RelatedTarget</span>
                            </div>
                        </div>

                        {/* 4. Spaced Repetition (2-cols wide) */}
                        <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 flex flex-col justify-between min-h-[300px]">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-2xl">query_stats</span>
                                </div>
                                <h3 className="font-headline font-bold text-xl text-on-surface">{t.bentoSm2Title}</h3>
                                <p className="text-on-surface-variant text-sm mt-2 leading-relaxed max-w-[55ch]">{t.bentoSm2Desc}</p>
                            </div>
                            <div className="mt-6 flex items-center gap-3">
                                <div className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">MASTERED</div>
                                <div className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">REVIEWING</div>
                                <div className="px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 font-bold text-xs">LEARNING</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonial Quote Section */}
            <section className="max-w-4xl mx-auto px-6 py-24 text-center">
                <p className="font-headline font-bold text-xl md:text-2xl text-on-surface italic leading-relaxed">
                    {t.quoteText}
                </p>
                <div className="mt-6 flex flex-col items-center justify-center">
                    <span className="font-bold text-sm text-on-surface">{t.quoteAuthor}</span>
                    <span className="text-xs text-on-surface-variant mt-1">{t.quoteRole}</span>
                </div>
            </section>

            {/* Logo Wall for Tech Stack Credibility */}
            <section className="bg-surface-container-lowest border-t border-outline-variant/20 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-12 opacity-60">
                    <img src="https://cdn.simpleicons.org/react/535bf2" alt="React" className="h-8 grayscale hover:grayscale-0 transition-all duration-300" />
                    <img src="https://cdn.simpleicons.org/vite/646cff" alt="Vite" className="h-8 grayscale hover:grayscale-0 transition-all duration-300" />
                    <img src="https://cdn.simpleicons.org/tailwindcss/38bdf8" alt="Tailwind CSS" className="h-8 grayscale hover:grayscale-0 transition-all duration-300" />
                    <img src="https://cdn.simpleicons.org/postgresql/4169e1" alt="PostgreSQL" className="h-8 grayscale hover:grayscale-0 transition-all duration-300" />
                    <img src="https://cdn.simpleicons.org/redis/dc382d" alt="Redis" className="h-8 grayscale hover:grayscale-0 transition-all duration-300" />
                    <img src="https://cdn.simpleicons.org/google/4285f4" alt="Google Cloud" className="h-8 grayscale hover:grayscale-0 transition-all duration-300" />
                </div>
            </section>

            {/* Footer CTA */}
            <section className="max-w-7xl mx-auto px-6 py-16">
                <div className="p-12 rounded-3xl bg-gradient-to-r from-primary to-primary-container text-white text-center shadow-xl shadow-primary/10">
                    <h3 className="font-headline font-black text-2xl md:text-4xl tracking-tight">
                        {t.ctaFooterTitle}
                    </h3>
                    <button onClick={() => navigate(user ? '/home' : '/login')}
                            className="mt-8 px-8 py-4 bg-white text-primary rounded-full font-bold text-base hover:bg-surface active:scale-95 transition-all shadow-lg">
                        {user ? t.ctaDashboard : t.ctaFooterBtn}
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-on-surface-variant font-medium">
                <span>&copy; {new Date().getFullYear()} LangMaxuage. All rights reserved.</span>
                <div className="flex gap-6">
                    <a href="#features" className="hover:text-primary transition-colors">Privacy</a>
                    <a href="#features" className="hover:text-primary transition-colors">Terms of Service</a>
                </div>
            </footer>
        </div>
    )
}
