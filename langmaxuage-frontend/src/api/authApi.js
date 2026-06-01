import api from './axiosInstance'

const authApi = {
    register:        (data)         => api.post('/auth/register', data),
    login:           (data)         => api.post('/auth/login', data),
    googleLogin:     (idToken)      => api.post('/auth/google', { idToken }),
    sendOtp:         (data)         => api.post('/auth/send-otp', data),
    verifyOtp:       (data)         => api.post('/auth/verify-otp', data),
    forgotPassword:  (email)        => api.post('/auth/forgot-password', { email }),
    resetPassword:   (data)         => api.post('/auth/reset-password', data),
    logout:          (refreshToken) => api.post('/auth/logout', null, {
        headers: { 'X-Refresh-Token': refreshToken }
    }),
    refresh:         (refreshToken) => api.post('/auth/refresh', null, {
        headers: { 'X-Refresh-Token': refreshToken }
    }),
    getMe:           () => api.get('/users/me'),
}

export default authApi