from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date


# ─── Auth / User Schemas ──────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "patient"
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = "en"
    emergency_contact: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = "en"
    emergency_contact: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None
    emergency_contact: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Game Schemas ──────────────────────────────────────

class GameResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    game_type: str
    instructions: Optional[str] = None
    icon: Optional[str] = "🎮"
    is_active: bool = True

    class Config:
        from_attributes = True


class GameSessionCreate(BaseModel):
    game_id: int
    difficulty: str = "easy"


class GameResultCreate(BaseModel):
    game_id: int
    session_id: Optional[int] = None
    score: float
    correct_answers: int
    wrong_answers: int
    response_time: float
    difficulty: str = "easy"


class GameResultResponse(BaseModel):
    id: int
    session_id: Optional[int] = None
    user_id: int
    game_id: int
    score: float
    correct_answers: int
    wrong_answers: int
    response_time: float
    difficulty: str
    played_at: Optional[datetime] = None
    game_name: Optional[str] = None
    game_type: Optional[str] = None

    class Config:
        from_attributes = True


# ─── Reminder Schemas ─────────────────────────────────

class ReminderCreate(BaseModel):
    user_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    reminder_date: date
    reminder_time: str  # "HH:MM"
    repeat_type: str = "none"
    reminder_type: str = "personal"


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    reminder_date: Optional[date] = None
    reminder_time: Optional[str] = None
    repeat_type: Optional[str] = None
    reminder_type: Optional[str] = None
    is_completed: Optional[bool] = None


class ReminderResponse(BaseModel):
    id: int
    user_id: int
    created_by: Optional[int] = None
    title: str
    description: Optional[str] = None
    reminder_date: date
    reminder_time: str
    repeat_type: str = "none"
    reminder_type: str = "personal"
    is_completed: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Performance Schemas ──────────────────────────────

class PerformanceResponse(BaseModel):
    avg_score: float = 0.0
    accuracy: float = 0.0
    avg_response_time: float = 0.0
    games_completed: int = 0
    category: str = "moderate"
    trend: str = "stable"
    daily_scores: Optional[list] = []
    weekly_scores: Optional[list] = []
    monthly_scores: Optional[list] = []
    game_breakdown: Optional[list] = []


# ─── Recommendation Schemas ───────────────────────────

class RecommendationResponse(BaseModel):
    id: Optional[int] = None
    game_name: str
    game_type: Optional[str] = None
    game_id: Optional[int] = None
    reason: str
    difficulty: str = "easy"

    class Config:
        from_attributes = True


# ─── Caregiver Schemas ────────────────────────────────

class CaregiverPatientCreate(BaseModel):
    patient_email: str


class CaregiverPatientResponse(BaseModel):
    id: int
    patient: UserResponse

    class Config:
        from_attributes = True


# ─── Notification Schemas ─────────────────────────────

class NotificationResponse(BaseModel):
    id: int
    message: str
    notification_type: str = "info"
    is_read: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Admin Schemas ────────────────────────────────────

class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None


# ─── Dashboard Schemas ────────────────────────────────

class DashboardResponse(BaseModel):
    welcome_name: str
    todays_progress: float = 0.0
    recent_score: Optional[float] = None
    games_played_today: int = 0
    upcoming_reminders: list = []
    recommended_activity: Optional[dict] = None
    performance_category: str = "moderate"
