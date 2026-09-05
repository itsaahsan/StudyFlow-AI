# AI Disclosure — StudyFlow AI (CSC Back-to-School Hackathon)

## Honest statement
AI tools were used **during development** as an assistant. All product decisions, architecture choices, final code review, testing and the submission itself were done by the human solo builder.

## AI tools used during development
- **Brainstorming**: problem framing, feature prioritization, judging-criteria mapping (Learning/Design/Creativity/Functionality/Impact).
- **UI iteration**: layout drafts, empty-state copy, color/type feedback toward a Linear/Notion-like calm aesthetic.
- **Code generation assistance**: boilerplate for FastAPI routes, Pydantic models, React components and Tailwind classes — reviewed, edited and tested by the builder.
- **Debugging**: diagnosing build/type errors and API contract mismatches.
- **Documentation**: drafting README structure, setup instructions and this disclosure (verified against the real code).

## What the application itself does with AI
At runtime the app uses an AI layer (`backend/app/ai_service.py`, `AIService`) for:
- study-plan generation (`POST /api/plan/generate`)
- task prioritization with short human-readable reasoning
- workload analysis and week optimization / rescue
- deadline risk detection (Deadline Radar)
- adaptive rescheduling ("I couldn't finish this")
- next-action recommendations ("What should I do now?")
- weekly review summaries and the DB-aware StudyFlow Assistant

## Demo vs AI-powered mode
- **Demo intelligence mode** (no API key): a deterministic, explainable planning engine (`planner.py` + mirrored `frontend/src/lib/planner.ts`) powers every feature so the demo never breaks and never exposes missing credentials.
- **AI-powered mode** (with `OPENAI_API_KEY` set server-side): an OpenAI-compatible model contributes reasoning/recommendations, blended with the deterministic schedule. The API key is never sent to the frontend.

## What AI did NOT do
AI did not: create the accounts/data, record any demo video, write heartfelt user stories, or submit anything. No user data is used to train models. No secrets are committed.
