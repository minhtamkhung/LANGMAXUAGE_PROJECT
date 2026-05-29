import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage              from './pages/LoginPage'
import HomePage               from './pages/HomePage'
import TopicsPage             from './pages/TopicsPage'
import FlashcardPage          from './pages/FlashcardPage'
import StudyPage              from './pages/StudyPage'
import QuizPage               from './pages/QuizPage'
import ProfilePage            from './pages/ProfilePage'
import LanguageSelectionPage  from './pages/LanguageSelectionPage'

function RootRedirect() {
    const hasLocale = !!localStorage.getItem('appLocale')
    return <Navigate to={hasLocale ? '/home' : '/language'} replace />
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <LanguageProvider>
                    <Routes>
                        {/* Public */}
                        <Route path="/login"    element={<LoginPage />} />
                        <Route path="/register" element={<LoginPage />} />
                        <Route path="/language" element={<LanguageSelectionPage />} />

                        {/* Protected */}
                        <Route path="/home" element={
                            <ProtectedRoute><HomePage /></ProtectedRoute>
                        } />
                        <Route path="/topics" element={
                            <ProtectedRoute><TopicsPage /></ProtectedRoute>
                        } />
                        <Route path="/flashcards/:topicId" element={
                            <ProtectedRoute><FlashcardPage /></ProtectedRoute>
                        } />
                        <Route path="/study" element={
                            <ProtectedRoute><StudyPage /></ProtectedRoute>
                        } />
                        <Route path="/quiz" element={
                            <ProtectedRoute><QuizPage /></ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                            <ProtectedRoute><ProfilePage /></ProtectedRoute>
                        } />

                        {/* Redirect */}
                        <Route path="/"  element={<RootRedirect />} />
                        <Route path="*"  element={<Navigate to="/home" replace />} />
                    </Routes>
                </LanguageProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}