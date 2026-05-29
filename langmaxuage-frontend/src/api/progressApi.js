import api from './axiosInstance'

const progressApi = {
    // Lấy tổng tiến độ — truyền locale để BE map đúng ngôn ngữ hiển thị
    getMyProgress: (locale = 'en') =>
        api.get('/progress/me', { params: { locale } }),

    // Lấy cards đến hạn ôn tập — truyền locale để lấy định nghĩa đã dịch
    getDueCards:   (locale = 'en') =>
        api.get('/progress/due', { params: { locale } }),

    // Gửi kết quả đánh giá (0-5) — BE trả về card đã cập nhật tiến độ
    review:        (data, locale = 'en') =>
        api.post('/progress/review', data, { params: { locale } }),
    // data = { flashcardId, quality (0-5) }
}

export default progressApi