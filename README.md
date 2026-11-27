# AI-Powered Evangadi Forum

A beginner-friendly Q&A forum for Evangadi learners.

You can:

- create an account and sign in
- ask questions
- answer questions
- search by keywords or by meaning (AI)
- get AI tips before posting a question
- check if an answer draft fits the question (AI)

This project has two parts:

| Part | Folder | What it is | Runs on |
| --- | --- | --- | --- |
| Frontend | `frontend/` | The website you see in the browser (React) | http://localhost:5173 |
| Backend | `backend/` | The API server that talks to MySQL and Gemini | http://localhost:3777 |

---

## How frontend and backend connect

Think of it like a restaurant:

1. **Frontend (React)** = the waiter (shows pages, collects what you type)
2. **Backend (Express)** = the kitchen (checks login, saves data, calls AI)
3. **MySQL (MAMP)** = the fridge / storage (keeps users, questions, answers)
4. **Gemini AI** = a smart helper the kitchen can call for tips and similarity search

### Simple flow

```text
Browser (React page)
    |
    |  HTTP request with JSON
    |  + Authorization: Bearer <token>  (after login)
    v
Backend API (Express on port 3777)
    |
    |---> MySQL database (save / read data)
    |---> Gemini API (AI tips, embeddings, fit check)
    |
    v
JSON response back to React
    |
    v
Page updates (list questions, show tips, etc.)
```

### Important connection files

- Frontend API base URL: `frontend/.env` → `VITE_API_BASE_URL=http://localhost:3777`
- Frontend HTTP client: `frontend/src/services/core/api.client.js`
  - attaches the login token to every request
  - if the token is invalid (401), redirects to `/auth`
- Auth calls: `frontend/src/services/auth/auth.service.js`
- Question/answer/AI calls: `frontend/src/services/question/question.service.js`
- Backend entry: `backend/index.js`
- Backend routes: `backend/src/api/routes.js`
  - `/api/auth/...`
  - `/api/questions/...`

After login, the frontend stores:

- `token` in `localStorage` (JWT)
- `user` in `localStorage` (name, email, id)

Every protected API request sends:

```http
Authorization: Bearer <token>
```

The backend checks that token in `backend/src/middleware/authentication.js`.

---

## Project folders (beginner map)

### Frontend (`frontend/src`)

| Path | Role |
| --- | --- |
| `App.jsx` | Route map (which URL shows which page) |
| `contexts/AuthContext.jsx` | Global login state (`user`, `login`, `logout`) |
| `components/ProtectedRoute/` | Blocks pages unless you are logged in |
| `components/ForumShell/` | Top nav (Home, My questions, Ask, Log out) |
| `pages/Landing/` | Public home / marketing page |
| `pages/Auth/` | Login + register form |
| `pages/Dashboard/` | All questions + search |
| `pages/Myquestion/` | Only your questions |
| `pages/PostQuestion/` | Ask a new question + AI draft tips |
| `pages/QuestionDetail/` | One question, answers, similar questions, answer fit |
| `services/` | Functions that call the backend API |

### Backend (`backend`)

| Path | Role |
| --- | --- |
| `index.js` | Starts Express server |
| `db/config.js` | MySQL connection pool |
| `db/schema.sql` | Database tables |
| `src/api/auth/` | Register + login |
| `src/api/question/` | Questions, answers, search, AI helpers |
| `src/middleware/` | Auth check, validation, error handler |
| `src/api/question/services/vector.service.js` | Embeddings + similarity search |
| `src/api/question/services/geminiTextCoach.service.js` | Draft tips + answer fit |

---

## What each page does

### 1) Landing (`/`)

Public page. Explains the product. Buttons go to `/auth` or `/dashboard`.

### 2) Auth (`/auth`)

- **Create account** → `POST /api/auth/register`
- **Sign in** → `POST /api/auth/login`

On successful login:

1. backend returns `{ user, token }`
2. frontend saves them in `localStorage`
3. you are redirected to `/dashboard`

### 3) Dashboard (`/dashboard`) — protected

- loads questions with `GET /api/questions`
- keyword search uses the same endpoint with `?search=...`
- AI semantic search uses `GET /api/questions/search?query=...`
- clicking a question opens `/questions/<questionHash>`

### 4) My Questions (`/my-questions`) — protected

Calls `GET /api/questions?mine=true` and shows only your posts.

### 5) Ask a Question (`/questions/ask`) — protected

- **Get AI Feedback** → `POST /api/questions/draft-coach`
- **Post Question** → `POST /api/questions`
- after posting, you go to the new question page

When a question is created, the backend also tries to create an **embedding** (AI vector) for later similarity search.

### 6) Question Detail (`/questions/:questionHash`) — protected

- loads question + answers: `GET /api/questions/:questionHash`
- loads similar questions: `GET /api/questions/:questionHash/similar`
- **Check fit** → `POST /api/questions/:questionHash/answer-fit`
- **Post answer** → `POST /api/questions/:questionHash/answers`

---

## Feature walkthroughs (step by step)

### A) Register and login

1. Open http://localhost:5173
2. Click **Create account** / go to `/auth`
3. Fill first name, last name, email, password
4. Submit → backend saves a hashed password in MySQL `users` table
5. Switch to Sign in
6. Login → backend checks password and returns a JWT token
7. Frontend stores token and opens `/dashboard`

### B) Ask a question

1. Click **Ask**
2. Write a clear title (min 5 characters)
3. Write details (min 10 characters)
4. Optional: click **Get AI Feedback**
   - frontend sends title + content to backend
   - backend asks Gemini for short tips
   - tips appear on the page
5. Click **Post Question**
6. Backend:
   - saves row in `questions`
   - creates `question_hash` (used in the URL)
   - creates embedding in `question_vectors` (if Gemini key works)
7. You land on the question detail page

### C) Answer a question

1. Open a question from Home
2. Write your answer (min 10 characters)
3. Optional: click **Check fit**
   - Gemini returns `strong` / `partial` / `weak` + a short note
4. Click **Post answer**
5. Backend saves row in `answers`
6. Page reloads answers

### D) Keyword search

1. On Dashboard, keep mode = **Keyword**
2. Type text and click Search
3. Backend does SQL `LIKE` search on title/content

### E) AI semantic search (search by meaning)

1. On Dashboard, choose mode = **AI semantic**
2. Type at least 5 characters
3. Backend:
   - converts your query into an embedding (vector of numbers)
   - compares it with stored question embeddings
   - returns the most similar questions (cosine similarity)

This is useful when people use different words for the same idea.

### F) Similar questions sidebar

On a question page, backend finds other questions with nearby embeddings and shows them on the right.

---

## AI features explained simply

### 1) Embeddings (vectors)

An embedding turns text into a list of numbers that represent meaning.

Example idea:

- “pass props in React”
- “send data from parent to child component”

Different words, similar meaning → similar vectors.

Stored in MySQL table: `question_vectors`.

Used for:

- semantic search
- similar questions

Code: `backend/src/api/question/services/vector.service.js`

### 2) Draft coach

Helps you improve a question before posting.

Input: title + details  
Output: 3–5 short tips

Code: `geminiTextCoach.service.js` → `generateQuestionDraftCoachService`

### 3) Answer fit

Checks if your draft answer is relevant to the question (not whether it is 100% correct).

Output example:

- level: `strong` | `partial` | `weak`
- note: one short sentence

Code: `assessAnswerAgainstQuestionService`

> Without `GEMINI_API_KEY`, normal posting still works. Only AI buttons fail.

---

## Database tables (MySQL)

Main tables from `backend/db/schema.sql`:

| Table | Purpose |
| --- | --- |
| `users` | Accounts (name, email, password hash) |
| `questions` | Forum questions + `question_hash` for URLs |
| `answers` | Replies to questions |
| `question_vectors` | AI embeddings for questions |
| `documents` / `document_chunks` / `document_chunk_vectors` | Prepared for future Course RAG (PDF) features |

---

## API reference (what frontend calls)

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Questions

- `GET /api/questions` — list (optional `search`, `mine`)
- `POST /api/questions` — create
- `GET /api/questions/:questionHash` — one question + answers
- `GET /api/questions/search?query=...` — AI semantic search
- `GET /api/questions/:questionHash/similar` — similar questions
- `POST /api/questions/draft-coach` — AI tips for draft
- `POST /api/questions/:questionHash/answers` — post answer
- `POST /api/questions/:questionHash/answer-fit` — AI fit check

Health check (no login needed):

- `GET /health`

---

## How to run the project

### Prerequisites

- Node.js 20+
- MAMP MySQL running (this project uses MAMP on port **3307**)
- Gemini API key (for AI features)

### 1) Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` (example for MAMP):

```env
PORT=3777
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=root
DB_NAME=evangadi_forum
DB_PORT=3307
JWT_SECRET=any_long_secret_string
GEMINI_API_KEY=your_key_here
GEMINI_TEXT_MODEL=gemini-3.5-flash-lite
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

Then:

```bash
npm install
npm run setup-db
npm run dev
```

Backend URL: http://localhost:3777

### 2) Frontend

```bash
cd frontend
cp .env.example .env
```

`frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3777
```

Then:

```bash
npm install
npm run dev
```

Frontend URL: http://localhost:5173

### 3) Use the app

1. Open http://localhost:5173
2. Create account → Sign in
3. Ask a question
4. Open it and post an answer
5. Try keyword search and AI semantic search
6. Try **Get AI Feedback** and **Check fit**

---

## Common beginner problems

| Problem | Likely cause | Fix |
| --- | --- | --- |
| Cannot login / network error | Backend not running | Start backend on port 3777 |
| DB connection failed | MAMP MySQL stopped or wrong port | Start MAMP; use `DB_PORT=3307` |
| phpMyAdmin “access denied” | phpMyAdmin still on port 3306 | Use MAMP MySQL port 3307 |
| AI buttons show unavailable | Missing/wrong `GEMINI_API_KEY` or old model name | Set key; use `gemini-3.5-flash-lite` |
| Page redirects to `/auth` | Token missing/expired | Sign in again |

---

## Mental model for React beginners

- A **page** (like `Dashboard.jsx`) is a React component.
- It uses **state** (`useState`) to store data shown on screen.
- It uses **effects** (`useEffect`) to load data when the page opens.
- It calls **service functions** (axios) to talk to the backend.
- `AuthContext` shares login info with all pages.
- `ProtectedRoute` means: “if not logged in, go to `/auth`”.

You do not put MySQL or Gemini keys in the frontend.  
The frontend only talks to your backend. The backend talks to MySQL and Gemini.
