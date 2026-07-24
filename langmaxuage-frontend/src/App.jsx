import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage              from './pages/LoginPage'
import RegisterPage           from './pages/RegisterPage'
import HomePage               from './pages/HomePage'
import TopicsPage             from './pages/TopicsPage'
import FlashcardPage          from './pages/FlashcardPage'
import CreateTopicPage        from './pages/CreateTopicPage'
import ManageFlashcardsPage   from './pages/ManageFlashcardsPage'
import StudyPage              from './pages/StudyPage'
import QuizPage               from './pages/QuizPage'
import TypingPage             from './pages/TypingPage'
import MatchingPage           from './pages/MatchingPage'
import ProfilePage            from './pages/ProfilePage'
import OnboardingPage         from './pages/OnboardingPage'
import LanguageSelectionPage  from './pages/LanguageSelectionPage'
import LandingPage            from './pages/LandingPage'


export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <LanguageProvider>
                    <Routes>
                        {/* Public */}
                        <Route path="/login"    element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/language" element={<LanguageSelectionPage />} />

                        {/* Protected */}
                        <Route path="/onboarding" element={
                            <ProtectedRoute><OnboardingPage /></ProtectedRoute>
                        } />
                        <Route path="/home" element={
                            <ProtectedRoute><HomePage /></ProtectedRoute>
                        } />
                        <Route path="/topics" element={
                            <ProtectedRoute><TopicsPage /></ProtectedRoute>
                        } />
                        <Route path="/flashcards/:topicId" element={
                            <ProtectedRoute><FlashcardPage /></ProtectedRoute>
                        } />
                        <Route path="/topics/new" element={
                            <ProtectedRoute><CreateTopicPage /></ProtectedRoute>
                        } />
                        <Route path="/topics/:topicId/manage" element={
                            <ProtectedRoute><ManageFlashcardsPage /></ProtectedRoute>
                        } />
                        <Route path="/study" element={
                            <ProtectedRoute><StudyPage /></ProtectedRoute>
                        } />
                        <Route path="/quiz" element={
                            <ProtectedRoute><QuizPage /></ProtectedRoute>
                        } />
                        <Route path="/typing" element={
                            <ProtectedRoute><TypingPage /></ProtectedRoute>
                        } />
                        <Route path="/matching" element={
                            <ProtectedRoute><MatchingPage /></ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                            <ProtectedRoute><ProfilePage /></ProtectedRoute>
                        } />

                        {/* Redirect */}
                        <Route path="/"  element={<LandingPage />} />
                        <Route path="*"  element={<Navigate to="/home" replace />} />
                    </Routes>
                </LanguageProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}