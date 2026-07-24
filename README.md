<h1 align="center">🌐 LANGMAXUAGE</h1>
<p align="center">AI-Powered Multi-Language Learning Platform</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk&logoColor=white"/>
  <img src="https://img.shields.io/badge/Spring_Boot-3-6DB33F?style=flat-square&logo=springboot&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-316192?style=flat-square&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white"/>
</p>

---

## 📖 Overview

LANGMAXUAGE is a full-stack English vocabulary learning platform with AI-assisted content generation, spaced repetition, and multilingual support. Users can study flashcards, take quizzes, practice typing, and play matching games — all with progress tracked by the **SM-2 algorithm**.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🔐 **Auth** | Email/password, Google OAuth2, OTP verification, forgot password |
| 📚 **Flashcards** | CRUD, image upload (Cloudinary), CSV bulk import, related words |
| 📂 **Topics** | System topics + user-created topics, search & filter |
| 🧠 **Spaced Repetition** | SM-2 algorithm — tracks review intervals per card |
| 📝 **Quiz** | Multiple-choice with randomized distractors, review wrong answers |
| ⌨️ **Typing Practice** | Type the word from its definition |
| 🎯 **Matching Game** | Match words with definitions, scored by accuracy |
| 🤖 **AI Generation** | Gemini AI generates full topics + flashcards in 4 languages |
| 🌍 **i18n** | Content in English, Vietnamese, Japanese, Korean |

---

## 🏗️ Architecture

```
React (Vite)  ──►  Spring Boot 3  ──►  PostgreSQL
                        │
                    Spring AOP
              ┌─────────┴──────────┐
         LoggingAspect        AuditAspect
         PerformanceAspect    RateLimitingAspect
                        │
                       Redis
                (tokens · OTP · rate limit · AI quota)
```

**Key design decisions:**
- **SOLID** — interface-based DI throughout, zero `@Autowired` field injection
- **AOP** — 4 aspects handle logging, auditing, performance monitoring, and rate limiting without touching business logic
- **N+1 free** — all paginated endpoints batch-load translations and related data via `JOIN FETCH`
- **Stateless** — JWT-only, `SessionCreationPolicy.STATELESS`

---

## 🛠️ Tech Stack

**Backend**
- Java 21, Spring Boot 3, Spring Security, Spring AOP
- PostgreSQL + Flyway (10 migrations), Redis
- MapStruct, Lombok, jjwt, Apache Commons CSV
- Cloudinary (image), Spring Mail (SMTP), WebClient (Gemini AI)

**Frontend**
- React 18 + Vite, Axios (auto token refresh interceptor)
- TailwindCSS, i18n via `Accept-Language` header

**Infrastructure**
- Docker Compose — PostgreSQL, Redis, Spring Boot, React (multi-stage build)
- All secrets via environment variables, no hardcoded credentials

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- (Optional) Java 21 + Maven for local dev

### Run with Docker

```bash
# 1. Clone
git clone https://github.com/minhtamduong2005/LANGMAXUAGE_PROJECT.git
cd LANGMAXUAGE_PROJECT

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Start all services
docker compose up -d
```

App will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### Run locally (dev)

```bash
# Backend
cd langmaxuage-backend
# Requires PostgreSQL on port 5433 and Redis on 6379
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Frontend
cd langmaxuage-frontend
npm install
npm run dev   # http://localhost:5173
```

---

## ⚙️ Environment Variables

Create a `.env` file at project root:

```env
# Database
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password

# Redis
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your-secret-key-min-32-chars

# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# CORS
CORS_ORIGINS=http://localhost:3000

# Email (Gmail SMTP)
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your-app-password
```

---

## 📁 Project Structure

```
LANGMAXUAGE_PROJECT/
├── langmaxuage-backend/
│   └── src/main/java/com/dmt/toeicapp/
│       ├── common/          # AOP, Security, Config, Exception, Response
│       ├── user/            # Auth + Profile
│       ├── flashcard/       # Flashcard CRUD
│       ├── topic/           # Topic management
│       ├── quiz/            # Quiz flow
│       ├── progress/        # Spaced repetition (SM-2)
│       ├── typing/          # Typing practice
│       ├── matching/        # Matching game
│       ├── chatbot/         # AI generation + quota
│       └── i18n/            # Translation management
│
└── langmaxuage-frontend/
    └── src/
        ├── api/             # Axios instances per module
        ├── context/         # AuthContext, LanguageContext
        ├── pages/           # 15 pages
        └── components/      # Layout, Sidebar, ProtectedRoute
```

---

## 🔒 Security Highlights

- **JWT** with `access`/`refresh` token type separation
- **OTP brute-force protection** — Redis counter with auto-expiry
- **Rate limiting** via `@RateLimit` custom AOP annotation — Redis-backed, multi-instance safe
- **Trusted proxy** — `X-Forwarded-For` only trusted from configured proxy IPs
- **Sensitive field masking** — passwords, tokens never appear in logs

---

## 📜 License

This project is for personal and educational purposes.
