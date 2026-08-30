from datetime import datetime, date, time
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text,
    DateTime, Date, Time, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="patient")  # patient, caregiver, admin
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    phone = Column(String(20), nullable=True)
    preferred_language = Column(String(10), default="en")
    emergency_contact = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    game_results = relationship("GameResult", back_populates="user", cascade="all, delete-orphan")
    game_sessions = relationship("GameSession", back_populates="user", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="user", foreign_keys="Reminder.user_id", cascade="all, delete-orphan")
    performance_records = relationship("PerformanceRecord", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class CaregiverPatient(Base):
    __tablename__ = "caregiver_patients"

    id = Column(Integer, primary_key=True, index=True)
    caregiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    caregiver = relationship("User", foreign_keys=[caregiver_id])
    patient = relationship("User", foreign_keys=[patient_id])


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    game_type = Column(String(50), nullable=False)  # memory_match, number_recall, image_recall
    instructions = Column(Text, nullable=True)
    icon = Column(String(10), default="🎮")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("GameSession", back_populates="game")
    results = relationship("GameResult", back_populates="game")


class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    difficulty = Column(String(20), default="easy")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="game_sessions")
    game = relationship("Game", back_populates="sessions")


class GameResult(Base):
    __tablename__ = "game_results"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    score = Column(Float, nullable=False)
    correct_answers = Column(Integer, default=0)
    wrong_answers = Column(Integer, default=0)
    response_time = Column(Float, default=0.0)  # seconds
    difficulty = Column(String(20), default="easy")
    played_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="game_results")
    game = relationship("Game", back_populates="results")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    reminder_date = Column(Date, nullable=False)
    reminder_time = Column(String(10), nullable=False)  # "HH:MM" format for simplicity
    repeat_type = Column(String(20), default="none")  # none, daily, weekly, monthly
    reminder_type = Column(String(50), default="personal")  # medicine, doctor, daily_activity, event, personal
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="reminders", foreign_keys=[user_id])
    creator = relationship("User", foreign_keys=[created_by])


class PerformanceRecord(Base):
    __tablename__ = "performance_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    avg_score = Column(Float, default=0.0)
    accuracy = Column(Float, default=0.0)
    avg_response_time = Column(Float, default=0.0)
    games_completed = Column(Integer, default=0)
    category = Column(String(30), default="moderate")  # good, moderate, needs_attention
    trend = Column(String(20), default="stable")  # improving, stable, declining
    recorded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="performance_records")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=True)
    game_name = Column(String(100), nullable=True)
    reason = Column(Text, nullable=True)
    difficulty = Column(String(20), default="easy")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recommendations")
    game = relationship("Game", foreign_keys=[game_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="info")  # info, alert, reminder, performance
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
