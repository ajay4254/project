from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.database.connection import get_db
from app.models.models import User, CaregiverPatient, GameResult, Game, Reminder
from app.schemas.schemas import CaregiverPatientCreate, UserResponse
from app.auth.auth import get_current_user, require_role

router = APIRouter(prefix="/caregiver", tags=["Caregiver"])


@router.get("/patients")
def get_linked_patients(
    current_user: User = Depends(require_role("caregiver")),
    db: Session = Depends(get_db)
):
    """Get all patients linked to this caregiver."""
    links = db.query(CaregiverPatient).filter(
        CaregiverPatient.caregiver_id == current_user.id
    ).all()

    patients = []
    for link in links:
        patient = db.query(User).filter(User.id == link.patient_id).first()
        if patient:
            # Get latest score
            latest_result = db.query(GameResult).filter(
                GameResult.user_id == patient.id
            ).order_by(GameResult.played_at.desc()).first()

            # Get all results for avg
            all_results = db.query(GameResult).filter(
                GameResult.user_id == patient.id
            ).all()
            avg_score = sum(r.score for r in all_results) / len(all_results) if all_results else 0

            patients.append({
                "id": patient.id,
                "name": patient.name,
                "email": patient.email,
                "age": patient.age,
                "phone": patient.phone,
                "avg_score": round(avg_score, 1),
                "latest_score": round(latest_result.score, 1) if latest_result else None,
                "games_played": len(all_results),
                "linked_at": link.created_at.isoformat() if link.created_at else None
            })
    return patients


@router.post("/patients", status_code=status.HTTP_201_CREATED)
def link_patient(
    data: CaregiverPatientCreate,
    current_user: User = Depends(require_role("caregiver")),
    db: Session = Depends(get_db)
):
    """Link a patient to this caregiver by patient email."""
    patient = db.query(User).filter(
        User.email == data.patient_email,
        User.role == "patient"
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found with this email")

    # Check if already linked
    existing = db.query(CaregiverPatient).filter(
        CaregiverPatient.caregiver_id == current_user.id,
        CaregiverPatient.patient_id == patient.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Patient already linked")

    link = CaregiverPatient(
        caregiver_id=current_user.id,
        patient_id=patient.id
    )
    db.add(link)
    db.commit()
    return {"message": f"Patient {patient.name} linked successfully", "patient_id": patient.id}


@router.delete("/patients/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def unlink_patient(
    patient_id: int,
    current_user: User = Depends(require_role("caregiver")),
    db: Session = Depends(get_db)
):
    """Unlink a patient from this caregiver."""
    link = db.query(CaregiverPatient).filter(
        CaregiverPatient.caregiver_id == current_user.id,
        CaregiverPatient.patient_id == patient_id
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Patient link not found")
    db.delete(link)
    db.commit()


@router.get("/patients/{patient_id}/performance")
def get_patient_performance(
    patient_id: int,
    current_user: User = Depends(require_role("caregiver")),
    db: Session = Depends(get_db)
):
    """Get detailed performance data for a linked patient."""
    # Verify link
    link = db.query(CaregiverPatient).filter(
        CaregiverPatient.caregiver_id == current_user.id,
        CaregiverPatient.patient_id == patient_id
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Patient not linked to you")

    patient = db.query(User).filter(User.id == patient_id).first()
    results = db.query(GameResult).filter(
        GameResult.user_id == patient_id
    ).order_by(GameResult.played_at.desc()).all()

    if not results:
        return {
            "patient": {"id": patient.id, "name": patient.name},
            "avg_score": 0, "games_completed": 0,
            "game_breakdown": [], "recent_results": [],
            "weekly_data": [], "category": "moderate", "trend": "stable"
        }

    avg_score = sum(r.score for r in results) / len(results)
    avg_time = sum(r.response_time for r in results) / len(results)

    # Game breakdown
    games = db.query(Game).filter(Game.is_active == True).all()
    game_breakdown = []
    for game in games:
        game_results = [r for r in results if r.game_id == game.id]
        if game_results:
            game_avg = sum(r.score for r in game_results) / len(game_results)
            game_breakdown.append({
                "game_name": game.name,
                "game_type": game.game_type,
                "avg_score": round(game_avg, 1),
                "games_played": len(game_results)
            })

    # Weekly data (last 7 days)
    weekly_data = []
    for i in range(6, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        day_results = [r for r in results if day_start <= r.played_at <= day_end]
        day_avg = sum(r.score for r in day_results) / len(day_results) if day_results else 0
        weekly_data.append({
            "date": day.strftime("%a"),
            "score": round(day_avg, 1),
            "games": len(day_results)
        })

    # Recent results (last 10)
    recent = results[:10]
    recent_list = []
    for r in recent:
        game = db.query(Game).filter(Game.id == r.game_id).first()
        recent_list.append({
            "game_name": game.name if game else "Unknown",
            "score": r.score,
            "difficulty": r.difficulty,
            "played_at": r.played_at.isoformat() if r.played_at else None
        })

    # Category
    category = "good" if avg_score >= 80 else "moderate" if avg_score >= 60 else "needs_attention"

    # Trend (compare last 5 vs previous 5)
    if len(results) >= 10:
        recent_avg = sum(r.score for r in results[:5]) / 5
        older_avg = sum(r.score for r in results[5:10]) / 5
        trend = "improving" if recent_avg > older_avg + 2 else "declining" if recent_avg < older_avg - 2 else "stable"
    else:
        trend = "stable"

    return {
        "patient": {"id": patient.id, "name": patient.name, "age": patient.age},
        "avg_score": round(avg_score, 1),
        "avg_response_time": round(avg_time, 1),
        "games_completed": len(results),
        "game_breakdown": game_breakdown,
        "recent_results": recent_list,
        "weekly_data": weekly_data,
        "category": category,
        "trend": trend
    }


@router.get("/dashboard")
def get_caregiver_dashboard(
    current_user: User = Depends(require_role("caregiver")),
    db: Session = Depends(get_db)
):
    """Get caregiver dashboard overview."""
    links = db.query(CaregiverPatient).filter(
        CaregiverPatient.caregiver_id == current_user.id
    ).all()
    patient_ids = [l.patient_id for l in links]

    total_patients = len(patient_ids)
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())

    # Today's activities across all patients
    today_results = db.query(GameResult).filter(
        GameResult.user_id.in_(patient_ids),
        GameResult.played_at >= today_start
    ).all() if patient_ids else []

    # Overall avg
    all_results = db.query(GameResult).filter(
        GameResult.user_id.in_(patient_ids)
    ).all() if patient_ids else []
    overall_avg = sum(r.score for r in all_results) / len(all_results) if all_results else 0

    # Upcoming reminders for all patients
    upcoming = db.query(Reminder).filter(
        Reminder.user_id.in_(patient_ids),
        Reminder.is_completed == False,
        Reminder.reminder_date >= today
    ).order_by(Reminder.reminder_date, Reminder.reminder_time).limit(10).all() if patient_ids else []

    upcoming_list = []
    for r in upcoming:
        patient = db.query(User).filter(User.id == r.user_id).first()
        upcoming_list.append({
            "id": r.id,
            "title": r.title,
            "time": r.reminder_time,
            "date": r.reminder_date.isoformat(),
            "type": r.reminder_type,
            "patient_name": patient.name if patient else "Unknown"
        })

    # Alerts (patients with declining performance)
    alerts = []
    for pid in patient_ids:
        p_results = [r for r in all_results if r.user_id == pid]
        if len(p_results) >= 5:
            recent_avg = sum(r.score for r in sorted(p_results, key=lambda x: x.played_at, reverse=True)[:5]) / 5
            if recent_avg < 60:
                patient = db.query(User).filter(User.id == pid).first()
                alerts.append({
                    "patient_name": patient.name if patient else "Unknown",
                    "patient_id": pid,
                    "avg_score": round(recent_avg, 1),
                    "message": "Recent performance needs attention"
                })

    return {
        "total_patients": total_patients,
        "today_activities": len(today_results),
        "overall_avg_score": round(overall_avg, 1),
        "total_games_completed": len(all_results),
        "upcoming_reminders": upcoming_list,
        "alerts": alerts
    }
