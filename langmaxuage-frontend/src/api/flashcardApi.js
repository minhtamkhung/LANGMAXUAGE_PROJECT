import api from './axiosInstance'

const flashcardApi = {
    getAll:       (locale = 'en', includeAllLocales = false, params = {}) =>
        api.get('/flashcards', { params: { locale, includeAllLocales, ...params } }),

    getByTopic:   (topicId, locale = 'en', includeAllLocales = false, params = {}) =>
        api.get('/flashcards', { params: { topicId, locale, includeAllLocales, ...params } }),

    getById:      (id, locale = 'en', includeAllLocales = false) =>
        api.get(`/flashcards/${id}`, { params: { locale, includeAllLocales } }),

    create:       (data)      => api.post('/flashcards', data),
    update:       (id, data)  => api.put(`/flashcards/${id}`, data),
    delete:       (id)        => api.delete(`/flashcards/${id}`),
    uploadImage:  (id, file)  => {
        const form = new FormData()
        form.append('file', file)
        return api.post(`/flashcards/${id}/image`, form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },
    deleteImage:  (id)        => api.delete(`/flashcards/${id}/image`),
}

export default flashcardApi