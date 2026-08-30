from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database.connection import get_db
from app.models.models import Reminder, User, CaregiverPatient
from app.schemas.schemas import ReminderCreate, ReminderUpdate, ReminderResponse
from app.auth.auth import get_current_user

router = APIRouter(prefix="/reminders", tags=["Reminders"])


@router.get("/", response_model=List[ReminderResponse])
def list_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all reminders for the current user (or their patients if caregiver)."""
    if current_user.role == "caregiver":
        # Get all linked patient IDs
        links = db.query(CaregiverPatient).filter(
            CaregiverPatient.caregiver_id == current_user.id
        ).all()
        patient_ids = [l.patient_id for l in links]
        patient_ids.append(current_user.id)
        reminders = db.query(Reminder).filter(
            Reminder.user_id.in_(patient_ids)
        ).order_by(Reminder.reminder_date, Reminder.reminder_time).all()
    else:
        reminders = db.query(Reminder).filter(
            Reminder.user_id == current_user.id
        ).order_by(Reminder.reminder_date, Reminder.reminder_time).all()

    return [ReminderResponse.model_validate(r) for r in reminders]


@router.post("/", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    data: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new reminder."""
    target_user_id = data.user_id if data.user_id else current_user.id

    # If caregiver is creating for a patient, verify link
    if current_user.role == "caregiver" and target_user_id != current_user.id:
        link = db.query(CaregiverPatient).filter(
            CaregiverPatient.caregiver_id == current_user.id,
            CaregiverPatient.patient_id == target_user_id
        ).first()
        if not link:
            raise HTTPException(status_code=403, detail="Not authorized for this patient")

    reminder = Reminder(
        user_id=target_user_id,
        created_by=current_user.id,
        title=data.title,
        description=data.description,
        reminder_date=data.reminder_date,
        reminder_time=data.reminder_time,
        repeat_type=data.repeat_type,
        reminder_type=data.reminder_type,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return ReminderResponse.model_validate(reminder)


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    data: ReminderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing reminder."""
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    # Check ownership
    if reminder.user_id != current_user.id and reminder.created_by != current_user.id:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")

    if data.title is not None:
        reminder.title = data.title
    if data.description is not None:
        reminder.description = data.description
    if data.reminder_date is not None:
        reminder.reminder_date = data.reminder_date
    if data.reminder_time is not None:
        reminder.reminder_time = data.reminder_time
    if data.repeat_type is not None:
        reminder.repeat_type = data.repeat_type
    if data.reminder_type is not None:
        reminder.reminder_type = data.reminder_type
    if data.is_completed is not None:
        reminder.is_completed = data.is_completed

    db.commit()
    db.refresh(reminder)
    return ReminderResponse.model_validate(reminder)


@router.patch("/{reminder_id}/complete", response_model=ReminderResponse)
def complete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a reminder as completed."""
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    reminder.is_completed = True
    db.commit()
    db.refresh(reminder)
    return ReminderResponse.model_validate(reminder)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a reminder."""
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    if reminder.user_id != current_user.id and reminder.created_by != current_user.id:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(reminder)
    db.commit()
