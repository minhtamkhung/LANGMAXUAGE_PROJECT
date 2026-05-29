import api from './axiosInstance'

const authApi = {
    register: (data) => api.post('/auth/register', data),
    login:    (data) => api.post('/auth/login', data),
    logout:   (refreshToken) => api.post('/auth/logout', null, {
        headers: { 'X-Refresh-Token': refreshToken }
    }),
    refresh:  (refreshToken) => api.post('/auth/refresh', null, {
        headers: { 'X-Refresh-Token': refreshToken }
    }),
    getMe:    () => api.get('/users/me'),
}

export default authApi