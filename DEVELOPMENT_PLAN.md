# NEBULA AI MAIL - DEVELOPMENT PLAN

**Project**: Nebula AI Mail Web Application  
**Author**: Aditya-Ganesamoorthy <Adityaganesamoorthy29122@gmail.com>  
**Version**: 1.0.0  
**Approach**: Incremental, test-driven, atomic-commit methodology  

---

## 1. Development Principles

1. **Pragmatic & Production-Minded**: Clean code, clear separation of concerns, strict typing via Pydantic, responsive UI.
2. **AI Controls the UI**: The AI assistant is a co-pilot that drives the interface (opens compose, populates fields with visible animation, executes searches, updates filters, navigates).
3. **Real Services**: Connects to real Gmail API, Google OAuth 2.0, Groq API, and Google Cloud Pub/Sub. No mock email data in final implementation.
4. **Atomic Git Commits**: Commit progressively after each functional increment (targeting 45–60 meaningful commits with verified tests).
5. **Quality Gates**: Every phase must verify build, tests, and runtime before proceeding to the next.

---

## 2. Phased Development Roadmap

### Phase 1: Project Setup & Baseline Infrastructure (Commits 01–09)
- **Goal**: Initialize clean monorepo structure, tooling, dependencies, and environment configurations.
- **Tasks**:
  1. Initialize workspace root with standard files (`.gitignore`, `.editorconfig`).
  2. Setup `backend/` directory with Python virtualenv, FastAPI, Uvicorn, Pydantic, and SQLite.
  3. Setup `frontend/` directory with Vite, React, Tailwind CSS, React Router, and Axios.
  4. Configure environment variable handlers (`backend/app/core/config.py`) with secure `.env.example`.
  5. Add health check endpoint (`/health`, `/health/ready`).
- **Verification Gate**:
  - `npm run build` succeeds in `frontend/`.
  - FastAPI starts up cleanly in `backend/` and `curl http://localhost:8000/health` returns 200 OK.

---

### Phase 2: Application Shell, Enterprise Theme & Layout (Commits 10–16)
- **Goal**: Build the responsive light enterprise shell with warm tones, navigation, and empty/loading states.
- **Tasks**:
  1. Setup custom Tailwind design tokens (warm off-white, ivory cards, amber/gold accents, deep charcoal text).
  2. Implement responsive `AppLayout` (Desktop 3-column layout, Tablet collapsible sidebar, Mobile responsive drawer).
  3. Build `Sidebar` navigation (Inbox, Sent, Compose trigger, account display).
  4. Build `Header` with search bar and connected account status pill.
  5. Build reusable `Skeleton` components for email list and detail views.
  6. Build reusable `EmptyState` components for empty inbox, sent, and search results.
  7. Setup React Router for `/inbox`, `/sent`, `/email/:id`, `/compose`, and `/auth`.
- **Verification Gate**:
  - Responsive layout verified at 375px, 768px, 1024px, and 1440px without horizontal overflow.
  - Skeletons and empty states render gracefully.

---

### Phase 3: Google OAuth 2.0 & Session Management (Commits 17–20)
- **Goal**: Implement secure server-side Google OAuth 2.0 flow with explicit account selection.
- **Tasks**:
  1. Implement `backend/app/services/oauth_service.py` with Google OAuth authorization URL generator (`prompt=select_account`, `access_type=offline`).
  2. Implement state token generation and CSRF validation in `backend/app/core/security.py`.
  3. Implement `/auth/google/start` and `/auth/google/callback` endpoints.
  4. Implement token exchange and store tokens securely in server-side session/SQLite.
  5. Implement `/auth/me` to return connected Gmail address and profile picture.
  6. Implement `/auth/logout` to clear session and revoke credentials.
  7. Connect frontend `AuthContext` and `Auth.jsx` landing page.
- **Verification Gate**:
  - Automated tests verify OAuth state validation and CSRF rejection.
  - End-to-end OAuth redirects to Google with account chooser, completes callback, and updates UI header with connected email.

---

### Phase 4: Gmail Core Mail Services & UI Integration (Commits 21–27)
- **Goal**: Fetch real inbox and sent emails, parse complex MIME payloads, sanitize HTML, and send emails via Gmail API.
- **Tasks**:
  1. Implement `backend/app/services/gmail_service.py` (list messages, get message, batch get, send message).
  2. Implement `backend/app/services/gmail_parser.py` (extract headers, multipart/alternative handling, plain text fallback, sanitize HTML, extract attachment metadata).
  3. Create `/api/mail/inbox` and `/api/mail/sent` with pagination (`pageToken`).
  4. Create `/api/mail/{message_id}` with full parsed details.
  5. Build frontend `Inbox.jsx` and `Sent.jsx` with real message list, sender, subject, snippet, date, and unread indicator.
  6. Build frontend `EmailDetail.jsx` with sanitized HTML rendering via DOMPurify, reply button, and back navigation.
  7. Implement `backend/app/schemas/mail.py` with RFC 5322 address validation.
  8. Implement MIME message creation and Gmail `messages.send()` in backend.
  9. Build frontend `ComposeModal.jsx` with To, Subject, Body, validation, send button spinner, and duplicate send prevention.
- **Verification Gate**:
  - Real emails display in Inbox and Sent views.
  - HTML emails render safely without scripts.
  - Sending a test email successfully delivers via Gmail API.

---

### Phase 5: Filter System (Manual UI & Backend Query Engine) (Commits 28–30)
- **Goal**: Deliver a flexible email filter system supporting date ranges, sender, keyword, and read/unread status.
- **Tasks**:
  1. Implement `backend/app/services/search_service.py` to translate filter criteria to safe Gmail search queries (`after:`, `before:`, `from:`, `is:unread`, `label:INBOX`).
  2. Build `/api/mail/search` endpoint.
  3. Build frontend `FilterBar.jsx` with preset chips (Today, Yesterday, Last 7d, Last 10d, Last 30d, This week, Custom), sender input, and read/unread toggle.
  4. Implement `ActiveFilterChip` badges with individual clear and "Clear all" buttons.
  5. Connect `MailContext` so filters update the main email list seamlessly.
- **Verification Gate**:
  - Selecting "Last 10 days" or "Unread" instantly queries Gmail and filters the main inbox UI.
  - Clearing filters restores full inbox.

---

### Phase 6: AI UI Controller Architecture & Groq Service (Commits 31–42)
- **Goal**: Implement the core evaluation requirement: an AI assistant that controls the UI via structured tool calls.
- **Tasks**:
  1. Configure `backend/app/services/groq_service.py` using Groq's high-speed inference with structured function/tool calling.
  2. Define strict Pydantic action models in `backend/app/schemas/actions.py`:
     - `compose_email(to, subject, body)`
     - `send_email(to, subject, body, confirmed)`
     - `search_emails(sender, keyword, date_preset, date_from, date_to, unread)`
     - `open_email(email_id, query)`
     - `reply_email(email_id, body)`
     - `filter_emails(unread, date_preset, sender, keyword)`
     - `clear_filters()`
     - `navigate(destination)`
  3. Implement backend prompt injection protection isolating email text as untrusted data.
  4. Implement `backend/app/services/action_service.py` to validate and execute backend effects.
  5. Build frontend `AssistantPanel.jsx` with chat stream, suggested quick commands, and processing indicator.
  6. Implement **Visible Form Autofill**: When `compose_email` is returned, open ComposeModal and visibly type/stream fields sequentially so the user sees it happening.
  7. Implement **Human-in-the-Loop Send Confirmation**: Show in-chat confirmation card (`ActionConfirmationCard.jsx`) with "Ready to send?" before sending.
  8. Implement **Search & Main UI Update**: AI queries ("emails from last 10 days") update the main Inbox view, not just the chat window.
  9. Implement **Navigate & Open**: "Open latest email from David" finds and opens the detail view.
  10. Implement **Context Awareness**: "Reply to this" reads active `open_email_id` from UI context and pre-fills reply composer with thread continuity.
  11. Implement **Rich Assistant UI Cards**: Interactive `RichEmailCard` inside chat with snippet and "Open Email" button.
- **Verification Gate**:
  - All 6 AI test cases from the official specification pass with observable UI transitions.

---

### Phase 7: Real-Time Synchronization via Cloud Pub/Sub & WebSocket (Commits 43–48)
- **Goal**: Real-time push synchronization using Gmail Watch, Google Cloud Pub/Sub, and WebSocket.
- **Tasks**:
  1. Implement `backend/app/services/sync_service.py` with `setup_watch()` to register Pub/Sub topic with Gmail.
  2. Implement Pub/Sub push webhook endpoint `POST /api/webhooks/gmail` in `backend/app/routes/realtime.py`.
  3. Decode base64 Pub/Sub payload to extract `emailAddress` and `historyId`.
  4. Implement `users.history.list()` resolution to discover added messages and label changes.
  5. Store latest `history_id` in SQLite `sync_state`.
  6. Implement WebSocket endpoint `/ws/realtime` and connection manager in FastAPI.
  7. Build frontend `useRealtime` hook in `frontend/src/hooks/useRealtime.js` to listen for new mail events and trigger UI updates without manual refresh.
  8. Implement Watch expiration tracking and renewal logic (24h before 7-day expiration).
  9. Implement reconnection resilience for dropped WebSockets and duplicate Pub/Sub notifications.
- **Verification Gate**:
  - Triggering webhook updates connected frontend via WebSocket and inserts new message into Inbox view in real time.

---

### Phase 8: Quality Assurance, Hardening & Automated Tests (Commits 49–54)
- **Goal**: Comprehensive automated testing, security audit, error handling, and performance optimization.
- **Tasks**:
  1. Implement backend unit tests (`test_auth.py`, `test_parser.py`, `test_search.py`, `test_actions.py`, `test_sync.py`).
  2. Implement frontend unit tests (`Compose.test.jsx`, `FilterBar.test.jsx`, `Assistant.test.jsx`, `EmailRow.test.jsx`).
  3. Execute edge case test matrix (40+ scenarios).
  4. Perform static review: zero secrets in repo, no console spam, clean error boundaries.
  5. Optimize state renders and debounce query inputs.
- **Verification Gate**:
  - `pytest` passes with 100% green tests.
  - Frontend test suite passes.
  - `npm run build` generates clean production bundle.

---

### Phase 9: Documentation, Production Readiness & Remote Push (Commits 55–60)
- **Goal**: Comprehensive professional documentation, README, setup guides, and repository publishing.
- **Tasks**:
  1. Author comprehensive `README.md` including architecture, setup, environment configuration, Google Cloud & Pub/Sub guide, Groq setup, and demo instructions.
  2. Add Mermaid architecture diagrams.
  3. Document trade-offs, architecture decisions, and future roadmap.
  4. Verify all git commits and push full commit history to remote repository.
- **Verification Gate**:
  - All requirements in `PROJECT_REQUIREMENTS.md` verified.
  - Git commit history contains 45–60 structured, meaningful commits.
  - Remote repository at `https://github.com/Aditya-Ganesamoorthy/Nebula-AI-Mail-Web-App.git` updated and synchronized.
