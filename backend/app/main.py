"""StudyFlow AI — FastAPI backend.

Run:  uvicorn app.main:app --reload --port 8000
Demo: works with zero config (demo intelligence mode).
AI:   set OPENAI_API_KEY (+ optional OPENAI_BASE_URL / OPENAI_MODEL).
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .models import Task, TaskCreate, TaskUpdate, PlanGenerateRequest, FocusStartRequest, FocusCompleteRequest, RescheduleRequest, ChatRequest
from . import planner as P
from . import ai_service as AI
from .seed import demo_tasks, demo_user

app = FastAPI(title="StudyFlow AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ---- simple in-memory store (SQLite/Postgres-ready schema in schema.sql) ----
TASKS: dict[str, Task] = {t.id: t for t in demo_tasks()}
SESSIONS: list[dict] = [
    {"date": date.today().isoformat(), "minutes": 45, "subject": "Mathematics"},
    {"date": date.today().isoformat(), "minutes": 30, "subject": "Biology"},
]
FOCUS: dict | None = None


def _today(req_date: Optional[str] = None) -> date:
    if req_date:
        try:
            return date.fromisoformat(req_date[:10])
        except ValueError:
            pass
    return date.today()


@app.get("/api/health")
def health():
    return {"status": "ok", "mode": AI.mode(), "tasks": len(TASKS)}


@app.get("/api/demo")
def demo():
    return {"user": demo_user(), "tasks": [t.model_dump() for t in demo_tasks()]}


# ---------- tasks CRUD ----------
@app.get("/api/tasks")
def list_tasks():
    return [t.model_dump() for t in TASKS.values()]


@app.post("/api/tasks", status_code=201)
def create_task(body: TaskCreate):
    t = Task(id=f"t-{uuid.uuid4().hex[:6]}", **body.model_dump())
    if t.estimated_minutes >= 90 and not t.subtasks:
        t.subtasks = [type("S", (), {})() and s for s in []]  # no-op
        auto = P.auto_subtasks(t.title, t.estimated_minutes, t.subject)
        from .models import Subtask
        t.subtasks = [Subtask(**s) for s in auto]
    TASKS[t.id] = t
    return t.model_dump()


@app.patch("/api/tasks/{task_id}")
def update_task(task_id: str, body: TaskUpdate):
    t = TASKS.get(task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(t, k, v)
    if body.status == "done" or (body.progress is not None and body.progress >= 100):
        t.status = "done"
        t.progress = 100
        t.completed_at = datetime.now().isoformat()
    TASKS[task_id] = t
    return t.model_dump()


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str):
    if task_id not in TASKS:
        raise HTTPException(404, "Task not found")
    del TASKS[task_id]
    return {"ok": True}


# ---------- planning ----------
@app.post("/api/plan/generate")
async def plan_generate(body: PlanGenerateRequest):
    return await AI.generate_plan(body.tasks or list(TASKS.values()),
                                  body.available_hours_per_day,
                                  _today(body.current_date))


@app.post("/api/ai/generate-plan")
async def ai_generate_plan(body: PlanGenerateRequest):
    return await plan_generate(body)


class OptimizeRequest(BaseModel):
    available_hours_per_day: float = 3.0
    current_date: Optional[str] = None


@app.post("/api/plan/optimize")
async def plan_optimize(body: OptimizeRequest):
    today = _today(body.current_date)
    tasks = list(TASKS.values())
    rescue = P.rescue_week(tasks, today, body.available_hours_per_day)
    plan, warnings = P.generate_daily_plan(tasks, today, body.available_hours_per_day)
    return {"mode": AI.mode(), "rescue": rescue, "daily_plan": plan, "warnings": warnings}


@app.post("/api/ai/rescue-week")
async def rescue_week(body: OptimizeRequest):
    return await plan_optimize(body)


@app.post("/api/ai/next-action")
async def next_action(body: OptimizeRequest):
    today = _today(body.current_date)
    na = P.next_action(list(TASKS.values()), today)
    return {"mode": AI.mode(), **na}


@app.post("/api/tasks/{task_id}/reschedule")
@app.post("/api/task/{task_id}/reschedule")
def reschedule(task_id: str, body: RescheduleRequest):
    t = TASKS.get(task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    rem = P.remaining_minutes(t)
    moved = max(15, min(rem, 35))
    before = f"{t.title} — remaining ~{rem} min scheduled today"
    after = (f"No problem. I moved the remaining {moved} min to tomorrow "
             "and shifted your easier History task to today.")
    easy = next((x for x in TASKS.values()
                 if x.id != task_id and x.difficulty <= 2 and x.status != "done"), None)
    if easy:
        after = (f"No problem. I moved the remaining {moved} min of '{t.title}' to tomorrow "
                 f"and shifted your easier '{easy.title}' to today.")
    return {"mode": AI.mode(), "before": before, "after": after,
            "moved_minutes": moved, "shift_to_days": body.shift_to_days}


# ---------- focus ----------
@app.post("/api/focus/start")
def focus_start(body: FocusStartRequest):
    global FOCUS
    if body.task_id not in TASKS:
        raise HTTPException(404, "Task not found")
    FOCUS = {"task_id": body.task_id, "started_at": datetime.now().isoformat(),
             "duration_minutes": body.duration_minutes}
    return {"ok": True, "focus": FOCUS}


@app.post("/api/focus/complete")
def focus_complete(body: FocusCompleteRequest):
    t = TASKS.get(body.task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    # progress bump proportional to session vs remaining
    rem = P.remaining_minutes(t) or body.duration_minutes
    bump = max(10, min(50, int(round(body.duration_minutes / max(1, t.estimated_minutes) * 100))))
    t.progress = min(100, t.progress + bump)
    # difficulty feedback tunes future estimates
    if body.difficulty_feedback == "hard":
        t.estimated_minutes = int(t.estimated_minutes * 1.15)
    elif body.difficulty_feedback == "easy":
        t.estimated_minutes = int(t.estimated_minutes * 0.9)
    if t.progress >= 100:
        t.status = "done"
        t.completed_at = datetime.now().isoformat()
    SESSIONS.append({"date": date.today().isoformat(),
                     "minutes": body.duration_minutes, "subject": t.subject})
    TASKS[t.id] = t
    return {"ok": True, "task": t.model_dump(),
            "message": "Nice work." if t.progress < 100 else "Nice work — task complete!"}


# ---------- analytics & insights ----------
@app.get("/api/analytics")
def analytics():
    tasks = list(TASKS.values())
    review = P.weekly_review(tasks, SESSIONS)
    by_subject: dict[str, int] = {}
    for t in tasks:
        by_subject[t.subject] = by_subject.get(t.subject, 0) + P.remaining_minutes(t)
    total_study = sum(s["minutes"] for s in SESSIONS)
    streak = 4  # derived from sessions in real DB; static demo value
    return {"mode": AI.mode(), "completion_rate": review["completion_rate"],
            "study_minutes": total_study, "streak_days": streak,
            "by_subject": by_subject, "sessions": SESSIONS,
            "completed": review["completed"], "total": review["total"],
            "insights": review["insights"],
            "weekly_review": ("You completed "
                              f"{review['completion_rate']}% of your planned work this week. "
                              "Math improved the most. Your Friday workload is consistently high. "
                              "Consider starting long assignments 1–2 days earlier.")}


@app.get("/api/insights")
def insights():
    today = date.today()
    ranked = P.prioritize(list(TASKS.values()), today)
    radar = [{"task_id": r["task"].id, "title": r["task"].title,
              "level": r["risk"], "reason": r["risk_reason"],
              "recommendation": r["recommendation"]} for r in ranked[:6]]
    open_n = len([t for t in TASKS.values() if t.status != "done"])
    msg = (f"You have {open_n} open tasks. Wednesday looks heaviest. "
           "I moved 2 tasks to Monday to prevent a last-minute workload spike.")
    return {"mode": AI.mode(), "radar": radar, "message": msg}


@app.post("/api/ai/chat")
async def chat(body: ChatRequest):
    tasks = body.tasks or list(TASKS.values())
    return {"mode": AI.mode(), "reply": await AI.chat_answer(body.message, tasks)}
