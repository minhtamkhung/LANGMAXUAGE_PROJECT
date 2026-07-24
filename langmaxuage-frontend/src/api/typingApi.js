import api from './axiosInstance'

const typingApi = {
    /**
     * Bắt đầu phiên Typing Practice.
     * @param {Object} data  - { topicId: Number, cardCount: Number }
     * @param {string} locale
     */
    start:  (data, locale) => api.post('/typing/start',  data, { params: { locale } }),

    /**
     * Nộp toàn bộ câu trả lời cuối phiên.
     * @param {Object} data  - { sessionId, durationSeconds, answers: [{flashcardId, typedAnswer}] }
     * @param {string} locale
     */
    submit: (data, locale) => api.post('/typing/submit', data, { params: { locale } }),
}

export default typingApi
