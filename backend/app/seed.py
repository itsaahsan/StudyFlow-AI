"""Realistic seeded demo data — judge understands the product in 30 seconds."""
from __future__ import annotations
from datetime import date, timedelta
import uuid

from .models import Task, Subtask

SUBJECTS = ["Mathematics", "Biology", "History", "Computer Science", "English"]


def _t(title, subject, type_, due_in_days, est, diff, imp, prog, subtask_titles=()):
    due = (date.today() + timedelta(days=due_in_days)).isoformat()
    subs = [Subtask(id=f"st-{uuid.uuid4().hex[:6]}", title=s,
                    estimated_minutes=max(20, est // max(1, len(subtask_titles))),
                    done=(i == 0 and prog > 0))
            for i, s in enumerate(subtask_titles)]
    return Task(id=f"t-{uuid.uuid4().hex[:6]}", title=title, subject=subject,
                type=type_, due_date=due, estimated_minutes=est,
                difficulty=diff, importance=imp, progress=prog, subtasks=subs)


def demo_tasks() -> list[Task]:
    return [
        _t("Mathematics Problem Set", "Mathematics", "assignment", 1, 90, 4, 5, 40,
           ["Review chapter 7", "Solve odd problems", "Check answers"]),
        _t("Biology Research Paper", "Biology", "project", 2, 240, 5, 5, 30,
           ["Choose topic", "Research sources", "Create outline", "Draft introduction",
            "Complete analysis", "Review", "Final submission"]),
        _t("History Reading Ch. 12", "History", "reading", 1, 45, 2, 3, 0),
        _t("Computer Science Project", "Computer Science", "project", 5, 300, 4, 4, 55,
           ["Design schema", "Build API", "Build UI", "Test & polish"]),
        _t("English Essay Draft", "English", "assignment", 4, 120, 3, 4, 10,
           ["Thesis statement", "Outline", "First draft"]),
        _t("Chemistry Lab Report", "Chemistry", "project", 2, 210, 4, 5, 15,
           ["Research methods", "Analyze results", "Write discussion", "Final review"]),
    ]


def demo_user() -> dict:
    return {"name": "Alex Morgan", "grade": "Grade 11",
            "subjects": SUBJECTS, "available_hours": 3.0,
            "preferred_times": ["afternoon", "evening"]}
