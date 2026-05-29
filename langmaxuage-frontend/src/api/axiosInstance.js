import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: { 'Content-Type': 'application/json' }
})

// Request interceptor — tự gắn accessToken vào mọi request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Response interceptor — tự refresh token khi nhận 401
api.interceptors.response.use(
    response => response,
    async error => {
        const original = error.config

        if (error.response?.status === 401 && !original._retry) {
            original._retry = true
            try {
                const refreshToken = localStorage.getItem('refreshToken')
                const res = await axios.post(
                    'http://localhost:8080/api/auth/refresh',
                    null,
                    { headers: { 'X-Refresh-Token': refreshToken } }
                )
                const newToken = res.data.data.accessToken
                localStorage.setItem('accessToken', newToken)
                original.headers.Authorization = `Bearer ${newToken}`
                return api(original)
            } catch {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api