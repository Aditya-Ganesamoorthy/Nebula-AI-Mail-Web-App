# NEBULA AI MAIL - GIT COMMIT PROGRESSION PLAN

**Project**: Nebula AI Mail Web Application  
**Author**: Aditya-Ganesamoorthy <adityaganesamoorthy2912@gmail.com>  
**Target Range**: 45–60 Meaningful Commits  
**Convention**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `security:`, `refactor:`)  
**Strict Rule**: No fake commits, no AI co-author tags, verified user identity.  

---

## Commit Sequence Roadmap

| # | Commit Message | Scope & Description | Checkpoint / Verification |
| :--- | :--- | :--- | :--- |
| **01** | `chore: initialize repository workspace and base configuration` | Setup git ignore, editorconfig, project structure | Clean git status |
| **02** | `docs: add comprehensive hiring task requirements and traceability matrix` | `PROJECT_REQUIREMENTS.md` with complete checklist | Document review |
| **03** | `docs: add system architecture, flows, and security model` | `ARCHITECTURE.md` with Mermaid sequence diagrams | Architecture review |
| **04** | `docs: add development roadmap, test plan, and git commit plan` | `DEVELOPMENT_PLAN.md`, `TEST_PLAN.md`, `GIT_COMMIT_PLAN.md` | Planning gate passed |
| **05** | `chore(frontend): initialize React Vite application` | Setup Vite + React base template in `frontend/` | `npm run build` succeeds |
| **06** | `chore(frontend): configure Tailwind CSS and enterprise color tokens` | Setup Tailwind, warm enterprise palette in `tailwind.config.js` | CSS compilation check |
| **07** | `chore(frontend): configure React Router and navigation skeleton` | Setup BrowserRouter with `/inbox`, `/sent`, `/email/:id`, `/compose` | Route navigation check |
| **08** | `chore(backend): initialize FastAPI backend structure` | Setup FastAPI app, uvicorn entrypoint, and CORS middleware | `/health` returns 200 |
| **09** | `chore(backend): configure settings, environment management, and security baseline` | Setup Pydantic settings, `.env.example`, logging | Config unit tests pass |
| **10** | `feat(frontend): implement responsive enterprise application layout shell` | Desktop 3-column, Tablet collapsible, Mobile drawer layout | 320px–1440px visual check |
| **11** | `feat(frontend): implement navigation sidebar and connected account badge` | Folder navigation (Inbox, Sent, Compose), active indicators | Component visual check |
| **12** | `feat(frontend): implement header search bar and user profile dropdown` | Global search input, connected email pill, disconnect trigger | Header component tests |
| **13** | `feat(frontend): add reusable skeleton loaders and empty state components` | Skeletons for email rows and detail, empty inbox illustrations | Visual state checks |
| **14** | `feat(backend): implement Google OAuth 2.0 authorization URL generator` | State token creation with CSRF validation, `prompt=select_account` | `test_auth.py` state check |
| **15** | `feat(backend): implement Google OAuth callback and token exchange` | Code exchange, refresh token storage, session management | OAuth integration tests |
| **16** | `feat(backend): implement user profile and session verification endpoints` | `/auth/me`, `/auth/logout`, token refresh handler | Auth API tests pass |
| **17** | `feat(frontend): integrate OAuth flow and authentication landing page` | `AuthContext`, Google connect button, session restoration | Frontend auth test |
| **18** | `feat(backend): implement Gmail service client abstraction` | Base Google API client wrapper with exponential backoff | Service unit tests |
| **19** | `feat(backend): implement robust Gmail MIME message parser` | Multipart/alternative parser, plain text fallback, attachments | `test_parser.py` passes |
| **20** | `feat(backend): implement HTML email body sanitization and XSS protection` | Strip scripts, event handlers, and unsafe styling | Security sanitization tests |
| **21** | `feat(backend): implement inbox and sent email list endpoints` | `/api/mail/inbox`, `/api/mail/sent` with pagination token support | API mail listing tests |
| **22** | `feat(backend): implement single message detail retrieval endpoint` | `/api/mail/{id}` with full parsed headers and body | API detail test passes |
| **23** | `feat(frontend): implement interactive email list and row components` | Read/unread styling, date formatters, snippet truncation | Email list unit tests |
| **24** | `feat(frontend): implement email detail view with sanitized HTML rendering` | DOMPurify rendering, back navigation, header metadata | Detail view tests |
| **25** | `feat(backend): implement RFC 5322 validation and MIME email sender` | Email schema validation, base64url MIME builder, send endpoint | `test_mail_send.py` passes |
| **26** | `feat(frontend): implement manual compose modal and validation feedback` | To, Subject, Body fields, inline errors, sending spinner | Compose form tests |
| **27** | `feat(frontend): implement duplicate send prevention and draft preservation` | Button disabled state, network retry handling, draft retention | Interaction test passes |
| **28** | `feat(backend): implement Gmail search query builder service` | Translate date ranges, sender, keyword, read/unread to Gmail syntax | `test_search.py` passes |
| **29** | `feat(frontend): implement interactive filter bar and date presets` | Today, Yesterday, Last 7d, Last 10d, Last 30d, This week chips | Filter UI tests pass |
| **30** | `feat(frontend): implement active filter tags and unified filter state` | Removable filter tags, synchronization between UI and query state | Filter state tests |
| **31** | `feat(backend): integrate Groq AI service with structured tool calling` | Groq Llama 3 / Mixtral integration with system prompt guardrails | Groq service unit tests |
| **32** | `feat(backend): implement Pydantic action schema registry` | Strict validation for compose, search, filter, open, reply actions | `test_actions.py` passes |
| **33** | `feat(backend): implement prompt injection barrier for email content` | Quarantine untrusted email text in system prompts | `test_security.py` passes |
| **34** | `feat(frontend): implement AI assistant chat panel and suggestions` | Sidebar chat drawer, suggested quick command chips | Assistant UI tests pass |
| **35** | `feat(frontend): implement visible form autofill animation for AI compose` | Sequential typing / population animation for To, Subject, Body | Visible animation test |
| **36** | `feat(frontend): implement human-in-the-loop email send confirmation card` | Interactive confirmation card with Cancel and Send Email triggers | Confirmation tests pass |
| **37** | `feat(frontend): connect AI search commands to main inbox UI update` | "Show emails from last 10 days" updates main email list | Search integration test |
| **38** | `feat(frontend): connect AI sender and topic search to main UI` | "Find email from Sarah about project" displays matching results | Search action test |
| **39** | `feat(frontend): implement AI navigate and open email action` | "Open latest email from David" transitions to detail view | Navigation action test |
| **40** | `feat(frontend): implement context awareness for relative commands` | Attach current view, open email ID, thread ID to AI requests | Context provider tests |
| **41** | `feat(frontend): implement AI context-aware reply action` | "Reply to this" pre-fills reply modal with sender and thread ref | Reply action test |
| **42** | `feat(frontend): implement rich assistant preview cards for emails` | In-chat card showing sender, subject, snippet, and "Open" button | Rich card render test |
| **43** | `feat(backend): implement Google Cloud Pub/Sub webhook endpoint` | `/api/webhooks/gmail` decoding base64 notification payload | Pub/Sub webhook tests |
| **44** | `feat(backend): implement Gmail history resolution and sync state` | SQLite sync_state table, `history.list()` delta processing | `test_sync.py` passes |
| **45** | `feat(backend): implement automatic Gmail watch registration and renewal` | Track expiration timestamp, renew watch 24h before expiry | Watch scheduler tests |
| **46** | `feat(backend): implement WebSocket real-time notification hub` | Connection manager, room broadcasting, client ping/pong | WebSocket unit tests |
| **47** | `feat(frontend): implement real-time push listener and inbox auto-refresh` | `useRealtime` hook, automatic inbox update without manual refresh | Real-time test passes |
| **48** | `feat(frontend): implement real-time connection resilience and reconnect` | Exponential backoff reconnect, mailbox reconciliation on wake | Resilience tests |
| **49** | `feat(shared): implement thread conversation view for email threads` | Chronological multi-message view for shared thread IDs | Thread UI tests pass |
| **50** | `fix: enhance edge case error handling and network failure fallbacks` | User-friendly alerts, offline warnings, non-blocking toasts | Error boundary tests |
| **51** | `security: audit and harden API routes, CORS, and sanitization` | Dependency check, no secret leaks, secure HTTP headers | Security audit passes |
| **52** | `test(backend): add comprehensive pytest test suite` | Unit and integration test coverage across all backend services | `pytest` 100% pass |
| **53** | `test(frontend): add comprehensive frontend test suite` | Component and hook tests with Vitest / RTL | Frontend tests pass |
| **54** | `test(e2e): execute full acceptance test verification matrix` | All 8 official hiring task acceptance criteria validated | E2E test report |
| **55** | `docs: author comprehensive enterprise README and architecture guide` | Setup guides, Google Cloud & Groq guides, API documentation | Documentation review |
| **56** | `docs: add environment setup, testing, and deployment guide` | Detailed instructions for local and live deployment | Setup review |
| **57** | `polish: refine responsive design, typography, and micro-interactions` | Fluid transitions, focus outlines, contrast compliance | Accessibility audit |
| **58** | `chore: perform static code cleanup and production build verification` | Remove dead code, verify `npm run build`, finalize artifacts | Build & lint check |
