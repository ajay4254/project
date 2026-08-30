from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database.connection import get_db
from app.models.models import User, GameResult, Game
from app.schemas.schemas import PerformanceResponse
from app.auth.auth import get_current_user

router = APIRouter(prefix="/performance", tags=["Performance"])


def _calculate_performance(results, games, period_label="all"):
    """Helper to calculate performance metrics from a list of game results."""
    if not results:
        return {
            "avg_score": 0, "accuracy": 0, "avg_response_time": 0,
            "games_completed": 0, "category": "moderate", "trend": "stable",
            "game_breakdown": []
        }

    avg_score = sum(r.score for r in results) / len(results)
    total_correct = sum(r.correct_answers for r in results)
    total_questions = total_correct + sum(r.wrong_answers for r in results)
    accuracy = (total_correct / total_questions * 100) if total_questions > 0 else 0
    avg_time = sum(r.response_time for r in results) / len(results)

    category = "good" if avg_score >= 80 else "moderate" if avg_score >= 60 else "needs_attention"

    # Trend: compare first half vs second half
    half = len(results) // 2
    if half > 0:
        sorted_results = sorted(results, key=lambda r: r.played_at)
        first_half_avg = sum(r.score for r in sorted_results[:half]) / half
        second_half_avg = sum(r.score for r in sorted_results[half:]) / (len(sorted_results) - half)
        trend = "improving" if second_half_avg > first_half_avg + 2 else \
                "declining" if second_half_avg < first_half_avg - 2 else "stable"
    else:
        trend = "stable"

    # Game breakdown
    game_breakdown = []
    for game in games:
        game_results = [r for r in results if r.game_id == game.id]
        if game_results:
            g_avg = sum(r.score for r in game_results) / len(game_results)
            game_breakdown.append({
                "game_id": game.id,
                "game_name": game.name,
                "game_type": game.game_type,
                "avg_score": round(g_avg, 1),
                "games_played": len(game_results),
                "icon": game.icon
            })

    return {
        "avg_score": round(avg_score, 1),
        "accuracy": round(accuracy, 1),
        "avg_response_time": round(avg_time, 1),
        "games_completed": len(results),
        "category": category,
        "trend": trend,
        "game_breakdown": game_breakdown
    }


@router.get("/")
def get_performance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get overall performance summary for current user."""
    results = db.query(GameResult).filter(
        GameResult.user_id == current_user.id
    ).order_by(GameResult.played_at).all()
    games = db.query(Game).filter(Game.is_active == True).all()

    perf = _calculate_performance(results, games)

    # Daily scores (last 30 days)
    daily_scores = []
    for i in range(29, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        day_results = [r for r in results if day_start <= r.played_at <= day_end]
        if day_results:
            day_avg = sum(r.score for r in day_results) / len(day_results)
            daily_scores.append({"date": day.strftime("%m/%d"), "score": round(day_avg, 1), "games": len(day_results)})
        else:
            daily_scores.append({"date": day.strftime("%m/%d"), "score": 0, "games": 0})

    perf["daily_scores"] = daily_scores
    return perf


@router.get("/weekly")
def get_weekly_performance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get last 7 days performance data."""
    week_ago = datetime.utcnow() - timedelta(days=7)
    results = db.query(GameResult).filter(
        GameResult.user_id == current_user.id,
        GameResult.played_at >= week_ago
    ).order_by(GameResult.played_at).all()
    games = db.query(Game).filter(Game.is_active == True).all()

    perf = _calculate_performance(results, games, "weekly")

    # Day-by-day
    weekly_scores = []
    for i in range(6, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        day_results = [r for r in results if day_start <= r.played_at <= day_end]
        day_avg = sum(r.score for r in day_results) / len(day_results) if day_results else 0
        weekly_scores.append({
            "date": day.strftime("%a"),
            "full_date": day.isoformat(),
            "score": round(day_avg, 1),
            "games": len(day_results)
        })

    perf["weekly_scores"] = weekly_scores
    return perf


@router.get("/monthly")
def get_monthly_performance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get last 30 days performance data."""
    month_ago = datetime.utcnow() - timedelta(days=30)
    results = db.query(GameResult).filter(
        GameResult.user_id == current_user.id,
        GameResult.played_at >= month_ago
    ).order_by(GameResult.played_at).all()
    games = db.query(Game).filter(Game.is_active == True).all()

    perf = _calculate_performance(results, games, "monthly")

    # Week-by-week
    monthly_scores = []
    for w in range(3, -1, -1):
        week_start = datetime.utcnow().date() - timedelta(days=(w + 1) * 7)
        week_end = datetime.utcnow().date() - timedelta(days=w * 7)
        ws = datetime.combine(week_start, datetime.min.time())
        we = datetime.combine(week_end, datetime.max.time())
        week_results = [r for r in results if ws <= r.played_at <= we]
        week_avg = sum(r.score for r in week_results) / len(week_results) if week_results else 0
        monthly_scores.append({
            "week": f"Week {4 - w}",
            "score": round(week_avg, 1),
            "games": len(week_results)
        })

    perf["monthly_scores"] = monthly_scores
    return perf
