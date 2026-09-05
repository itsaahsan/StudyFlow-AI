"""Pydantic models + clean normalized data model for StudyFlow AI.

Tables (see schema.sql for PostgreSQL DDL):
  users, subjects, tasks, subtasks, study_sessions, exams,
  schedule_blocks, ai_insights, weekly_reviews
"""
from __future__ import annotations
from datetime import datetime, date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class TaskType(str, Enum):
    assignment = "assignment"
    quiz = "quiz"
    exam = "exam"
    project = "project"
    reading = "reading"
    extracurricular = "extracurricular"


class TaskStatus(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class Subtask(BaseModel):
    id: str
    title: str
    estimated_minutes: int = 25
    done: bool = False


class Task(BaseModel):
    id: str
    title: str
    subject: str = "General"
    type: TaskType = TaskType.assignment
    due_date: Optional[str] = None  # ISO date YYYY-MM-DD
    due_time: Optional[str] = None
    estimated_minutes: int = 60
    difficulty: int = Field(default=3, ge=1, le=5)
    importance: int = Field(default=3, ge=1, le=5)
    progress: int = Field(default=0, ge=0, le=100)
    status: TaskStatus = TaskStatus.todo
    subtasks: list[Subtask] = Field(default_factory=list)
    depends_on: list[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    completed_at: Optional[str] = None


class TaskCreate(BaseModel):
    title: str
    subject: str = "General"
    type: TaskType = TaskType.assignment
    due_date: Optional[str] = None
    estimated_minutes: int = 60
    difficulty: int = 3
    importance: int = 3
    progress: int = 0
    subtasks: list[Subtask] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    type: Optional[TaskType] = None
    due_date: Optional[str] = None
    estimated_minutes: Optional[int] = Field(default=None, ge=1, le=1440)
    difficulty: Optional[int] = Field(default=None, ge=1, le=5)
    importance: Optional[int] = Field(default=None, ge=1, le=5)
    progress: Optional[int] = Field(default=None, ge=0, le=100)
    status: Optional[TaskStatus] = None
    subtasks: Optional[list[Subtask]] = None


class PlanGenerateRequest(BaseModel):
    tasks: list[Task]
    available_hours_per_day: float = 3.0
    preferred_study_times: list[str] = Field(default_factory=lambda: ["evening"])
    current_date: Optional[str] = None


class FocusStartRequest(BaseModel):
    task_id: str
    duration_minutes: int = 25


class FocusCompleteRequest(BaseModel):
    task_id: str
    duration_minutes: int = 25
    difficulty_feedback: Optional[str] = None  # easy | normal | hard


class RescheduleRequest(BaseModel):
    reason: str = "couldn't finish"
    shift_to_days: int = 1


class ChatRequest(BaseModel):
    message: str
    tasks: list[Task] = Field(default_factory=list)
