import api from './axiosInstance'

const topicApi = {
    getAll:    (locale = 'en')         => api.get('/topics', { params: { locale } }),
    getById:   (id, locale = 'en')     => api.get(`/topics/${id}`, { params: { locale } }),
    create:    (data)                  => api.post('/topics', data),
    update:    (id, data)              => api.put(`/topics/${id}`, data),
    delete:    (id)                    => api.delete(`/topics/${id}`),
}

export default topicApi