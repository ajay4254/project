from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, UserResponse, UserUpdate, Token
from app.auth.auth import (
    get_password_hash, verify_password,
    create_access_token, get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user (patient, caregiver, or admin)."""
    # Check duplicate email
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate role
    if user_data.role not in ("patient", "caregiver", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be patient, caregiver, or admin"
        )

    # Create user
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        age=user_data.age,
        gender=user_data.gender,
        phone=user_data.phone,
        preferred_language=user_data.preferred_language or "en",
        emergency_contact=user_data.emergency_contact,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate token
    token = create_access_token(data={"sub": user.id})
    return Token(
        access_token=token,
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    token = create_access_token(data={"sub": user.id})
    return Token(
        access_token=token,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile."""
    if update_data.name is not None:
        current_user.name = update_data.name
    if update_data.age is not None:
        current_user.age = update_data.age
    if update_data.gender is not None:
        current_user.gender = update_data.gender
    if update_data.phone is not None:
        current_user.phone = update_data.phone
    if update_data.preferred_language is not None:
        current_user.preferred_language = update_data.preferred_language
    if update_data.emergency_contact is not None:
        current_user.emergency_contact = update_data.emergency_contact

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
