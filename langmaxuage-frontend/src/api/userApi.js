import api from './axiosInstance'

const userApi = {
    getMe:          ()           => api.get('/users/me'),
    updateMe:       (data)       => api.patch('/users/me', data),
    changePassword: (old_, new_) => api.patch('/users/me/password', {
        oldPassword: old_,
        newPassword: new_
    }),
}

export default userApi