from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.models.models import User, GameResult, Game, CaregiverPatient
from app.schemas.schemas import AdminUserUpdate, UserResponse
from app.auth.auth import get_current_user, require_role

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users")
def list_all_users(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """List all users (admin only)."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "age": u.age,
            "phone": u.phone,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    data: AdminUserUpdate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Update user status or role (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        if data.role not in ("patient", "caregiver", "admin"):
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = data.role

    db.commit()
    db.refresh(user)
    return {"message": "User updated", "user_id": user.id}


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Delete a user (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    # Clean up caregiver links
    db.query(CaregiverPatient).filter(
        (CaregiverPatient.caregiver_id == user_id) |
        (CaregiverPatient.patient_id == user_id)
    ).delete()

    db.delete(user)
    db.commit()


@router.get("/stats")
def get_system_stats(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get overall system statistics (admin only)."""
    total_users = db.query(User).count()
    total_patients = db.query(User).filter(User.role == "patient").count()
    total_caregivers = db.query(User).filter(User.role == "caregiver").count()
    total_games = db.query(Game).count()
    total_results = db.query(GameResult).count()
    active_users = db.query(User).filter(User.is_active == True).count()

    # Average score across all results
    all_results = db.query(GameResult).all()
    avg_score = sum(r.score for r in all_results) / len(all_results) if all_results else 0

    return {
        "total_users": total_users,
        "total_patients": total_patients,
        "total_caregivers": total_caregivers,
        "active_users": active_users,
        "total_games": total_games,
        "total_game_sessions": total_results,
        "avg_score": round(avg_score, 1)
    }


@router.get("/games")
def list_all_games(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """List all games with stats (admin only)."""
    games = db.query(Game).all()
    result = []
    for g in games:
        results = db.query(GameResult).filter(GameResult.game_id == g.id).all()
        avg = sum(r.score for r in results) / len(results) if results else 0
        result.append({
            "id": g.id,
            "name": g.name,
            "game_type": g.game_type,
            "icon": g.icon,
            "is_active": g.is_active,
            "total_plays": len(results),
            "avg_score": round(avg, 1)
        })
    return result
