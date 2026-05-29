import api from './axiosInstance'

const i18nApi = {
    getLocales:               ()              => api.get('/i18n/locales'),
    getFlashcardTranslations: (flashcardId)   => api.get(`/i18n/flashcards/${flashcardId}/translations`),
    getTopicTranslations:     (topicId)       => api.get(`/i18n/topics/${topicId}/translations`),
}

export default i18nApi
