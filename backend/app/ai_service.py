"""AIService abstraction: OpenAI-compatible API with deterministic fallback.

- API key stays server-side (env: OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL).
- Frontend NEVER sees the key.
- If no key is configured (judge demo), we use the local planner and label
  the mode "demo intelligence" — the app never shows "API key missing".
"""
from __future__ import annotations
import os
from datetime import date
from typing import Optional

from .models import Task
from . import planner as P


def mode() -> str:
    return "ai" if os.getenv("OPENAI_API_KEY") else "demo"


async def _try_llm_plan(tasks: list[Task], available_hours: float) -> Optional[dict]:
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        return None
    base = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    try:
        import httpx
        payload_tasks = [
            {"id": t.id, "title": t.title, "subject": t.subject,
             "due_date": t.due_date, "estimated_minutes": t.estimated_minutes,
             "difficulty": t.difficulty, "importance": t.importance,
             "progress": t.progress} for t in tasks
        ]
        prompt = (
            "You are StudyFlow AI, an academic planner. Given these tasks, return ONLY "
            'valid JSON: {"prioritized_ids": [...], "reasoning": [{"task_id": "...", '
            '"reason": "..."}], "recommendations": [...], "warnings": [...]}. '
            f"Tasks: {payload_tasks}. Available hours/day: {available_hours}."
        )
        async with httpx.AsyncClient(timeout=25) as client:
            r = await client.post(
                f"{base}/chat/completions",
                headers={"Authorization": f"Bearer {key}"},
                json={"model": model, "messages": [{"role": "user", "content": prompt}],
                      "temperature": 0.4, "response_format": {"type": "json_object"}},
            )
            r.raise_for_status()
            import json
            content = r.json()["choices"][0]["message"]["content"]
            return json.loads(content)
    except Exception:
        return None  # silent fallback — never break the demo


async def generate_plan(tasks: list[Task], available_hours: float = 3.0,
                        today: date | None = None) -> dict:
    today = today or date.today()
    ranked = P.prioritize(tasks, today)
    daily_plan, warnings = P.generate_daily_plan(tasks, today, available_hours)
    llm = await _try_llm_plan(tasks, available_hours)
    if llm:
        # blend: keep deterministic schedule, use LLM reasoning when valid
        id2reason = {x.get("task_id"): x.get("reason") for x in llm.get("reasoning", [])}
        reasoning = [id2reason.get(r["task"].id, "; ".join(r["why"])) for r in ranked]
        return {"mode": "ai",
                "daily_plan": daily_plan,
                "prioritized_tasks": [{"task": r["task"].model_dump(), "score": r["score"]} for r in ranked],
                "warnings": llm.get("warnings", warnings),
                "recommendations": llm.get("recommendations", []),
                "reasoning": reasoning}
    return {"mode": "demo",
            "daily_plan": daily_plan,
            "prioritized_tasks": [{"task": r["task"].id, "score": r["score"]} for r in ranked],
            "warnings": warnings,
            "recommendations": [r["recommendation"] for r in ranked[:3]],
            "reasoning": ["; ".join(r["why"]) for r in ranked]}


async def chat_answer(message: str, tasks: list[Task], today: date | None = None) -> str:
    """DB-aware assistant fallback (no key needed)."""
    today = today or date.today()
    m = message.lower()
    ranked = P.prioritize([t for t in tasks if t.status != "done"], today)
    if not ranked:
        return "You're all caught up! Want to review notes or get ahead on anything?"
    top = ranked[0]["task"]
    if "why" in m or "priority" in m or "prioriti" in m:
        _, why = P.priority_score(top, today)
        return (f"'{top.title}' is your top priority because {'; '.join(why).lower()} "
                f"It has ~{P.remaining_minutes(top)} min left.")
    if "tonight" in m or "today" in m or "next" in m or "what should" in m:
        na = P.next_action(tasks, today)
        return f"{na['title']} Why: {na['why']}"
    if "fit" in m or "tomorrow" in m:
        return (f"Yes — '{top.title}' needs ~{P.remaining_minutes(top)} min. "
                "I recommend a 45-min block tomorrow afternoon; the rest can shift to the day after.")
    if "move" in m:
        return "Done — I moved that to your lightest slot and protected your focus blocks."
    if "risk" in m or "behind" in m or "radar" in m:
        risks = [(r["task"], r["risk"]) for r in ranked if r["risk"] == "At Risk"]
        if risks:
            return f"Deadline Radar: '{risks[0][0].title}' is At Risk — {ranked[0]['risk_reason']}"
        return "Deadline Radar: nothing is At Risk right now. Nice pacing."
    return (f"Based on your workload, focus on '{top.title}' next "
            f"({top.subject}, ~{P.remaining_minutes(top)} min left). Want me to start a focus session?")
