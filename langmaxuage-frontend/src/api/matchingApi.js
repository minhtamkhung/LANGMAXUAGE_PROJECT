import api from './axiosInstance'

const matchingApi = {
    /**
     * Bắt đầu phiên Matching Game.
     * @param {Object} data - { topicId: Number, pairCount: Number }
     * @param {string} locale
     */
    start:  (data, locale) => api.post('/matching/start',  data, { params: { locale } }),

    /**
     * Nộp kết quả Matching Game.
     * @param {Object} data - { sessionId: Number, durationSeconds: Number, pairs: [{ wordId, definitionId }] }
     * @param {string} locale
     */
    submit: (data, locale) => api.post('/matching/submit', data, { params: { locale } }),
}

export default matchingApi
