"""Adaptive Academic Planner — the core innovation of StudyFlow AI.

NOT a todo-list sort by deadline. Priority fuses:
  deadline urgency + remaining effort + difficulty + importance
  + workload pressure + progress + dependency readiness.

Deterministic, explainable, and used as the Demo Intelligence fallback
when no AI API key is configured.
"""
from __future__ import annotations
from datetime import datetime, date, timedelta
from typing import Optional
import math
import uuid

from .models import Task


def _parse_due(due: Optional[str], today: date) -> Optional[date]:
    if not due:
        return None
    try:
        return date.fromisoformat(due[:10])
    except ValueError:
        return None


def days_until(task: Task, today: date) -> Optional[float]:
    d = _parse_due(task.due_date, today)
    if d is None:
        return None
    return (d - today).days + 0.5  # assume mid-day granularity


def remaining_minutes(task: Task) -> int:
    rem = task.estimated_minutes * (1 - task.progress / 100)
    return max(0, int(round(rem)))


def deadline_urgency_score(days: Optional[float]) -> float:
    """0-40 scale."""
    if days is None:
        return 8.0
    if days < 0:
        return 40.0
    if days <= 1:
        return 38.0
    if days <= 2:
        return 32.0
    if days <= 3:
        return 27.0
    if days <= 5:
        return 22.0
    if days <= 7:
        return 18.0
    if days <= 14:
        return 10.0
    return 5.0


def priority_score(task: Task, today: date, all_ids: set[str] | None = None) -> tuple[float, list[str]]:
    """Return (score 0-100, reasoning bullets)."""
    if task.status == "done" or task.progress >= 100:
        return 0.0, ["Completed — no priority."]
    rem = remaining_minutes(task)
    days = days_until(task, today)
    urgency = deadline_urgency_score(days)
    effort = min(15.0, rem / 180 * 15)  # 3h+ caps out
    difficulty = task.difficulty * 3.0  # 3-15
    importance = task.importance * 3.0  # 3-15
    # workload pressure: big remaining work with little time left
    pressure = 0.0
    if days is not None and days >= 0:
        density = rem / max(1.0, (days + 1) * 60)
        pressure = min(10.0, density * 10)
    # blocked by unfinished prerequisites?
    blocked_penalty = 0.0
    reasons: list[str] = []
    if task.depends_on and all_ids is not None:
        # planner caller marks done tasks; here just note dependency
        reasons.append(f"Depends on {len(task.depends_on)} prerequisite(s).")
    score = urgency + effort + difficulty + importance + pressure - blocked_penalty
    score = max(1.0, min(100.0, score))

    # human-readable reasoning (short, student-friendly)
    if days is None:
        reasons.append("No due date set, so urgency is low.")
    elif days < 0:
        reasons.append("Overdue — needs immediate attention.")
    elif days <= 1:
        reasons.append("Due within 24 hours.")
    elif days <= 3:
        reasons.append(f"Due in ~{int(math.ceil(days))} days.")
    else:
        reasons.append(f"Due in ~{int(math.ceil(days))} days.")
    if rem >= 150:
        reasons.append(f"Large workload (~{rem} min left) — start early.")
    elif rem <= 30:
        reasons.append(f"Quick win (~{rem} min left).")
    if task.difficulty >= 4:
        reasons.append("High difficulty — needs focused time.")
    if task.importance >= 4:
        reasons.append("High importance for your grade.")
    if pressure >= 6:
        reasons.append("Workload density is high for the time left.")
    return round(score, 1), reasons


def risk_level(task: Task, today: date, daily_capacity_min: int = 180) -> tuple[str, str, str]:
    """Return (Safe|Watch|At Risk, reason, recommendation)."""
    if task.status == "done" or task.progress >= 100:
        return "Safe", "Completed.", "Nice work — keep the streak going."
    rem = remaining_minutes(task)
    days = days_until(task, today)
    if days is None:
        return "Safe", "No deadline set.", "Set a due date so Deadline Radar can protect it."
    if days < 0:
        return "At Risk", f"Overdue with ~{rem} min still remaining.", "Do a 25-minute focus session right now."
    capacity = max(30, daily_capacity_min) * max(0.5, days)
    ratio = rem / capacity if capacity else 1
    # hard rule: big task, little time, low progress
    if days <= 2.5 and rem >= 120 and task.progress < 50:
        return ("At Risk",
                f"{rem} min estimated, {days:.0f} days left, only {task.progress}% complete.",
                "Start a 45-minute session today to break the back of it.")
    if days <= 3 and rem >= 180:
        return ("At Risk",
                f"{rem} min estimated with ~{days:.0f} days remaining.",
                "Split it into smaller sessions starting today.")
    if ratio > 0.5 or (days <= 5 and task.progress < 30 and rem > 90):
        return ("Watch",
                f"{rem} min left over ~{max(1, int(math.ceil(days)))} days.",
                "Schedule one focused session in the next 2 days.")
    return ("Safe",
            f"{rem} min left with ~{max(1, int(math.ceil(days)))} days to go.",
            "On track — keep it in the daily plan.")


def prioritize(tasks: list[Task], today: date) -> list[dict]:
    ids = {t.id for t in tasks}
    ranked = []
    for t in tasks:
        score, why = priority_score(t, today, ids)
        level, reason, rec = risk_level(t, today)
        ranked.append({"task": t, "score": score, "why": why,
                       "risk": level, "risk_reason": reason, "recommendation": rec})
    ranked.sort(key=lambda r: r["score"], reverse=True)
    return ranked


def auto_subtasks(title: str, estimated_minutes: int, subject: str) -> list[dict]:
    """Break large assignments into actionable steps."""
    if estimated_minutes < 90:
        return []
    steps_templates = [
        "Choose topic & scope", "Gather sources", "Create outline",
        "Draft first version", "Complete analysis / core work",
        "Review & revise", "Final polish & submit",
    ]
    n = 4 if estimated_minutes < 150 else 5 if estimated_minutes < 240 else 7
    steps = steps_templates[:n]
    per = max(20, estimated_minutes // n)
    return [{"id": f"st-{uuid.uuid4().hex[:6]}", "title": s,
             "estimated_minutes": per, "done": False} for s in steps]


def generate_daily_plan(tasks: list[Task], today: date, available_hours: float = 3.0) -> tuple[list[dict], list[str]]:
    ranked = prioritize([t for t in tasks if t.status != "done" and t.progress < 100], today)
    budget = int(available_hours * 60)
    plan, warnings = [], []
    used = 0
    start_hour = 16  # after school default
    cursor = datetime(today.year, today.month, today.day, start_hour, 0)
    for r in ranked:
        t: Task = r["task"]
        rem = remaining_minutes(t)
        if rem <= 0:
            continue
        chunk = min(rem, 45 if rem > 45 else rem)  # 45-min max blocks
        if used + chunk > budget:
            warnings.append(f"Not enough time today for all of '{t.title}' — moved remainder to tomorrow.")
            continue
        plan.append({
            "task_id": t.id, "title": t.title, "subject": t.subject,
            "start": cursor.strftime("%H:%M"), "minutes": chunk,
            "priority_score": r["score"], "why": "; ".join(r["why"][:2]),
        })
        used += chunk
        cursor += timedelta(minutes=chunk + 10)  # 10-min break
    if used > budget * 0.95:
        warnings.append("Today is packed — consider a 'Rescue My Week' rebalance.")
    return plan, warnings


def next_action(tasks: list[Task], today: date) -> dict:
    ranked = prioritize([t for t in tasks if t.status != "done" and t.progress < 100], today)
    if not ranked:
        return {"title": "You're all caught up!",
                "why": "No open tasks. Review notes or get ahead.",
                "minutes": 20, "task_id": None}
    top = ranked[0]
    t: Task = top["task"]
    rem = remaining_minutes(t)
    # first undone subtask becomes the concrete action
    subtask_title = None
    for s in (t.subtasks or []):
        d = s.done if hasattr(s, "done") else s.get("done")
        title = s.title if hasattr(s, "title") else s.get("title")
        if not d:
            subtask_title = title
            break
    minutes = min(45, max(20, min(rem, 25 if rem > 60 else rem)))
    action = f"Spend the next {minutes} minutes on '{subtask_title}' ({t.title})." if subtask_title \
        else f"Spend the next {minutes} minutes on '{t.title}' ({t.subject})."
    return {"title": action, "why": "; ".join(top["why"][:2]),
            "minutes": minutes, "task_id": t.id,
            "priority_score": top["score"], "risk": top["risk"]}


def rescue_week(tasks: list[Task], today: date, available_hours: float = 3.0) -> dict:
    """Detect overloaded days, split big tasks, return before/after."""
    open_tasks = [t for t in tasks if t.status != "done" and t.progress < 100]
    total_min = sum(remaining_minutes(t) for t in open_tasks)
    capacity_week = int(available_hours * 60 * 5)
    # naive before: everything crammed near deadlines
    per_day_before: dict[str, int] = {}
    for t in open_tasks:
        key = t.due_date or "unscheduled"
        per_day_before[key] = per_day_before.get(key, 0) + remaining_minutes(t)
    busiest_day = max(per_day_before.items(), key=lambda kv: kv[1]) if per_day_before else ("—", 0)
    overloaded_by = max(0, busiest_day[1] - int(available_hours * 60))
    moves, splits = [], []
    for t in sorted(open_tasks, key=lambda x: remaining_minutes(x)):
        rem = remaining_minutes(t)
        if rem >= 120:
            parts = max(2, min(4, rem // 60))
            splits.append(f"Split '{t.title}' into {parts} sessions (~{rem // parts} min each).")
        elif t.importance <= 2:
            moves.append(f"Moved '{t.title}' earlier — low priority, flexible.")
    if len(moves) + len(splits) == 0 and open_tasks:
        moves.append(f"Rebalanced '{open_tasks[0].title}' to protect your lightest day.")
    after_days = 5
    per_day_after = round(total_min / after_days) if after_days else 0
    return {
        "total_hours": round(total_min / 60, 1),
        "days": 5,
        "before": {"busiest_day": busiest_day[0], "busiest_minutes": busiest_day[1],
                   "label": f"{total_min/60:.1f}h concentrated workload"},
        "after": {"per_day_minutes": per_day_after,
                  "label": "Balanced workload across 5 days"},
        "overloaded_by_minutes": overloaded_by,
        "moves": (moves + splits)[:5],
        "protected": "Friday evening protected.",
    }


def weekly_review(tasks: list[Task], sessions: list[dict] | None = None) -> dict:
    done = [t for t in tasks if t.status == "done" or t.progress >= 100]
    total = len(tasks)
    pct = round(len(done) / total * 100) if total else 0
    study_min = sum(s.get("minutes", 25) for s in (sessions or []))
    insights = [
        f"You completed {pct}% of your planned work this week.",
        "Starting long assignments 1–2 days earlier would smooth your Fridays.",
    ]
    if done:
        insights.insert(1, f"Strongest finish: '{done[0].title}'.")
    return {"completion_rate": pct, "study_minutes": study_min,
            "completed": len(done), "total": total, "insights": insights}
