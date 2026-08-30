from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from app.database.connection import get_db
from app.models.models import Game, GameSession, GameResult, User
from app.schemas.schemas import GameResponse, GameSessionCreate, GameResultCreate, GameResultResponse
from app.auth.auth import get_current_user

router = APIRouter(prefix="/games", tags=["Games"])


@router.get("/", response_model=List[GameResponse])
def list_games(db: Session = Depends(get_db)):
    """List all active games."""
    games = db.query(Game).filter(Game.is_active == True).all()
    return [GameResponse.model_validate(g) for g in games]


@router.get("/{game_id}", response_model=GameResponse)
def get_game(game_id: int, db: Session = Depends(get_db)):
    """Get game details by ID."""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return GameResponse.model_validate(game)


@router.post("/{game_id}/start")
def start_game_session(
    game_id: int,
    session_data: GameSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new game session."""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    session = GameSession(
        user_id=current_user.id,
        game_id=game_id,
        difficulty=session_data.difficulty,
        started_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {"session_id": session.id, "game_id": game_id, "difficulty": session_data.difficulty}


@router.post("/{game_id}/submit", response_model=GameResultResponse)
def submit_game_result(
    game_id: int,
    result_data: GameResultCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit game result after completing a game."""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Complete the session if provided
    if result_data.session_id:
        session = db.query(GameSession).filter(
            GameSession.id == result_data.session_id,
            GameSession.user_id == current_user.id
        ).first()
        if session:
            session.completed_at = datetime.utcnow()

    # Save result
    result = GameResult(
        session_id=result_data.session_id,
        user_id=current_user.id,
        game_id=game_id,
        score=result_data.score,
        correct_answers=result_data.correct_answers,
        wrong_answers=result_data.wrong_answers,
        response_time=result_data.response_time,
        difficulty=result_data.difficulty,
        played_at=datetime.utcnow()
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    response = GameResultResponse.model_validate(result)
    response.game_name = game.name
    response.game_type = game.game_type
    return response


# ─── Results Endpoints ─────────────────────────────────

@router.get("/results/all", response_model=List[GameResultResponse])
def get_all_results(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all game results for the current user."""
    results = db.query(GameResult).filter(
        GameResult.user_id == current_user.id
    ).order_by(GameResult.played_at.desc()).limit(50).all()

    response_list = []
    for r in results:
        game = db.query(Game).filter(Game.id == r.game_id).first()
        resp = GameResultResponse.model_validate(r)
        if game:
            resp.game_name = game.name
            resp.game_type = game.game_type
        response_list.append(resp)
    return response_list


@router.get("/results/{result_id}", response_model=GameResultResponse)
def get_result(
    result_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific game result."""
    result = db.query(GameResult).filter(
        GameResult.id == result_id,
        GameResult.user_id == current_user.id
    ).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    game = db.query(Game).filter(Game.id == result.game_id).first()
    resp = GameResultResponse.model_validate(result)
    if game:
        resp.game_name = game.name
        resp.game_type = game.game_type
    return resp
