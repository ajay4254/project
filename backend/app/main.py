"""
CogniMind - AI-Based Cognitive Gaming & Memory Assistance Platform
FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import FRONTEND_URL, APP_NAME, DEBUG
from app.database.connection import engine, Base
from app.models.models import (
    User, CaregiverPatient, Game, GameSession,
    GameResult, Reminder, PerformanceRecord,
    Recommendation, Notification
)
from app.routers import (
    auth_router,
    dashboard,
    games,
    reminders,
    caregiver,
    performance,
    admin,
    ai_analysis,
    recommendations
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=APP_NAME,
    description="AI-Based Cognitive Gaming & Memory Assistance Platform for Elderly Users",
    version="1.0.0",
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth_router.router)
app.include_router(dashboard.router)
app.include_router(games.router)
app.include_router(reminders.router)
app.include_router(caregiver.router)
app.include_router(performance.router)
app.include_router(admin.router)
app.include_router(ai_analysis.router)
app.include_router(recommendations.router)


@app.get("/")
def root():
    return {
        "app": APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
