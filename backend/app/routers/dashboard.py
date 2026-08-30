from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database.connection import get_db
from app.models.models import User, GameResult, Reminder, Game
from app.schemas.schemas import DashboardResponse
from app.auth.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/patient", response_model=DashboardResponse)
def get_patient_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get patient dashboard data with today's progress, reminders, and recommendations."""
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    # Today's game results
    today_results = db.query(GameResult).filter(
        GameResult.user_id == current_user.id,
        GameResult.played_at >= today_start,
        GameResult.played_at <= today_end
    ).all()

    games_played_today = len(today_results)
    todays_progress = 0.0
    recent_score = None

    if today_results:
        todays_progress = sum(r.score for r in today_results) / len(today_results)
        recent_score = today_results[-1].score

    # All-time average for category
    all_results = db.query(GameResult).filter(
        GameResult.user_id == current_user.id
    ).all()
    avg_all = sum(r.score for r in all_results) / len(all_results) if all_results else 0

    if avg_all >= 80:
        category = "good"
    elif avg_all >= 60:
        category = "moderate"
    else:
        category = "needs_attention"

    # Upcoming reminders
    upcoming = db.query(Reminder).filter(
        Reminder.user_id == current_user.id,
        Reminder.is_completed == False,
        Reminder.reminder_date >= today
    ).order_by(Reminder.reminder_date, Reminder.reminder_time).limit(5).all()

    upcoming_list = [
        {
            "id": r.id,
            "title": r.title,
            "time": r.reminder_time,
            "date": r.reminder_date.isoformat(),
            "type": r.reminder_type
        }
        for r in upcoming
    ]

    # Recommended activity — pick the game type with lowest average score
    recommended = None
    games = db.query(Game).filter(Game.is_active == True).all()
    if games:
        game_scores = {}
        for game in games:
            results = db.query(GameResult).filter(
                GameResult.user_id == current_user.id,
                GameResult.game_id == game.id
            ).all()
            if results:
                game_scores[game.id] = {
                    "avg": sum(r.score for r in results) / len(results),
                    "name": game.name,
                    "type": game.game_type,
                    "icon": game.icon
                }
            else:
                # Unplayed games get priority
                game_scores[game.id] = {
                    "avg": 0,
                    "name": game.name,
                    "type": game.game_type,
                    "icon": game.icon
                }

        if game_scores:
            weakest_id = min(game_scores, key=lambda k: game_scores[k]["avg"])
            info = game_scores[weakest_id]
            recommended = {
                "game_id": weakest_id,
                "game_name": info["name"],
                "game_type": info["type"],
                "difficulty": "easy",
                "icon": info["icon"]
            }

    return DashboardResponse(
        welcome_name=current_user.name,
        todays_progress=round(todays_progress, 1),
        recent_score=round(recent_score, 1) if recent_score is not None else None,
        games_played_today=games_played_today,
        upcoming_reminders=upcoming_list,
        recommended_activity=recommended,
        performance_category=category
    )
