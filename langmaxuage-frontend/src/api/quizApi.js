import api from './axiosInstance'

const quizApi = {
    // Truyền thêm locale vào params
    start: (data, locale) => api.post('/quiz/start', data, { params: { locale } }),
    answer: (attemptId, data, locale) => api.post(`/quiz/${attemptId}/answer`, data, { params: { locale } }),
    finish: (attemptId) => api.post(`/quiz/${attemptId}/finish`),
    history: () => api.get('/quiz/history'),
    review: (attemptId) => api.get(`/quiz/${attemptId}/review`),
}

export default quizApi