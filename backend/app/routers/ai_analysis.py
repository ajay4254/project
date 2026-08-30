from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User, GameResult, Game
from app.auth.auth import get_current_user, require_role
from app.ai.analyzer import analyzer

router = APIRouter(prefix="/ai", tags=["AI Analysis"])


@router.get("/analysis")
def get_ai_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI performance analysis for the current user."""
    return _analyze_user(current_user.id, db)


@router.get("/analysis/{user_id}")
def get_ai_analysis_for_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI performance analysis for a specific user (caregiver/admin only)."""
    if current_user.role not in ("caregiver", "admin") and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return _analyze_user(user_id, db)


def _analyze_user(user_id: int, db: Session):
    """Internal helper to run AI analysis for a user."""
    results = db.query(GameResult).filter(
        GameResult.user_id == user_id
    ).order_by(GameResult.played_at).all()

    # Build input for the analyzer
    game_data = []
    for r in results:
        game = db.query(Game).filter(Game.id == r.game_id).first()
        game_data.append({
            "score": r.score,
            "correct_answers": r.correct_answers,
            "wrong_answers": r.wrong_answers,
            "response_time": r.response_time,
            "game_type": game.game_type if game else "unknown",
            "difficulty": r.difficulty,
            "played_at": r.played_at.isoformat() if r.played_at else None
        })

    analysis = analyzer.analyze_performance(game_data)
    return analysis
