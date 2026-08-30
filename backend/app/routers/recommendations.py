from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User, GameResult, Game
from app.auth.auth import get_current_user
from app.ai.analyzer import analyzer

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/")
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized game recommendations based on performance."""
    results = db.query(GameResult).filter(
        GameResult.user_id == current_user.id
    ).order_by(GameResult.played_at).all()

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

    # Enrich recommendations with game IDs
    games = db.query(Game).filter(Game.is_active == True).all()
    game_map = {g.game_type: g for g in games}

    enriched = []
    for rec in analysis.get("recommendations", []):
        game = game_map.get(rec["game_type"])
        enriched.append({
            "game_id": game.id if game else None,
            "game_name": rec["game_name"],
            "game_type": rec["game_type"],
            "reason": rec["reason"],
            "difficulty": rec["difficulty"],
            "icon": game.icon if game else "🎮"
        })

    return {"recommendations": enriched}
