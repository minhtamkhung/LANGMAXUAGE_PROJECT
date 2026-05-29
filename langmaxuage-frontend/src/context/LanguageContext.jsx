import { createContext, useContext, useEffect, useState } from 'react'
import i18nApi from '../api/i18nApi'

// Default supported languages (fallback if API is unavailable or not yet loaded)
const DEFAULT_LOCALES = [
    { code: 'en', name: 'English',    flag: '🇺🇸', labelShort: 'EN' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', labelShort: 'VN' },
    { code: 'ja', name: 'Japanese',   flag: '🇯🇵', labelShort: 'JP' },
    { code: 'ko', name: 'Korean',     flag: '🇰🇷', labelShort: 'KR' },
]

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
    const [locale,  setLocaleState] = useState(
        () => localStorage.getItem('appLocale') || 'en'
    )
    const [locales, setLocales] = useState(DEFAULT_LOCALES)

    // Fetch active locales from backend on mount
    useEffect(() => {
        i18nApi.getLocales()
            .then(res => {
                const data = res.data?.data
                if (Array.isArray(data) && data.length > 0) {
                    setLocales(data)
                }
            })
            .catch(() => { /* keep defaults */ })
    }, [])

    const setLocale = (code) => {
        localStorage.setItem('appLocale', code)
        setLocaleState(code)
    }

    const currentLocaleInfo = locales.find(l => l.code === locale) || DEFAULT_LOCALES[0]

    return (
        <LanguageContext.Provider value={{ locale, setLocale, locales, currentLocaleInfo }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const ctx = useContext(LanguageContext)
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
    return ctx
}
