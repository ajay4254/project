"""
Seed data for CogniMind platform.
Creates demo users, games, sample results, reminders, and performance records.
Run: python -m app.database.seed
"""
from datetime import datetime, timedelta, date
import random
import sys
import os

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database.connection import engine, SessionLocal, Base
from app.models.models import (
    User, CaregiverPatient, Game, GameSession,
    GameResult, Reminder, PerformanceRecord, Recommendation, Notification
)
from app.auth.auth import get_password_hash


def seed():
    """Populate database with sample data."""
    # Create all tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).first():
            print("Database already seeded. Skipping.")
            return

        print("🌱 Seeding database...")

        # ─── Users ──────────────────────────────────────
        admin = User(
            name="Admin User", email="admin@cognimind.com",
            password_hash=get_password_hash("admin123"),
            role="admin", age=35, gender="Other", phone="9000000000"
        )

        caregiver1 = User(
            name="Dr. Anita Sharma", email="caregiver1@cognimind.com",
            password_hash=get_password_hash("care123"),
            role="caregiver", age=42, gender="Female", phone="9100000001"
        )
        caregiver2 = User(
            name="Rajesh Gogoi", email="caregiver2@cognimind.com",
            password_hash=get_password_hash("care123"),
            role="caregiver", age=38, gender="Male", phone="9100000002"
        )

        patients = []
        patient_data = [
            ("Mohan Das", "patient1@cognimind.com", 68, "Male", "9200000001"),
            ("Kamala Devi", "patient2@cognimind.com", 72, "Female", "9200000002"),
            ("Biren Singh", "patient3@cognimind.com", 65, "Male", "9200000003"),
            ("Lalita Baruah", "patient4@cognimind.com", 70, "Female", "9200000004"),
            ("Hari Prasad", "patient5@cognimind.com", 75, "Male", "9200000005"),
        ]
        for name, email, age, gender, phone in patient_data:
            p = User(
                name=name, email=email,
                password_hash=get_password_hash("patient123"),
                role="patient", age=age, gender=gender, phone=phone,
                preferred_language="en",
                emergency_contact="Family - 9300000000"
            )
            patients.append(p)

        db.add_all([admin, caregiver1, caregiver2] + patients)
        db.flush()

        print(f"  ✅ Created {3 + len(patients)} users")

        # ─── Caregiver-Patient Links ────────────────────
        links = [
            CaregiverPatient(caregiver_id=caregiver1.id, patient_id=patients[0].id),
            CaregiverPatient(caregiver_id=caregiver1.id, patient_id=patients[1].id),
            CaregiverPatient(caregiver_id=caregiver1.id, patient_id=patients[2].id),
            CaregiverPatient(caregiver_id=caregiver2.id, patient_id=patients[3].id),
            CaregiverPatient(caregiver_id=caregiver2.id, patient_id=patients[4].id),
        ]
        db.add_all(links)
        db.flush()
        print("  ✅ Linked caregivers to patients")

        # ─── Games ──────────────────────────────────────
        game1 = Game(
            name="Memory Matching", game_type="memory_match",
            description="Match pairs of cards by flipping them over. Find all matching pairs to complete the game.",
            instructions="Click on cards to flip them. Try to remember where each card is. Match all pairs to win!",
            icon="🃏"
        )
        game2 = Game(
            name="Number Recall", game_type="number_recall",
            description="Remember a sequence of numbers and type them back in the correct order.",
            instructions="A sequence of numbers will appear briefly. After they disappear, type the numbers you remember.",
            icon="🔢"
        )
        game3 = Game(
            name="Image Recall", game_type="image_recall",
            description="Remember displayed images and identify them from a set of choices.",
            instructions="Study the images shown. After they disappear, select the images you saw from the options.",
            icon="🖼️"
        )

        db.add_all([game1, game2, game3])
        db.flush()
        print("  ✅ Created 3 games")

        # ─── Sample Game Results ────────────────────────
        difficulties = ["easy", "medium", "hard"]
        games_list = [game1, game2, game3]

        for patient in patients:
            # Generate 10-20 results per patient over last 14 days
            num_results = random.randint(10, 20)
            for i in range(num_results):
                game = random.choice(games_list)
                diff = random.choice(difficulties)
                days_ago = random.randint(0, 13)
                played_at = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 12))

                # Generate realistic scores based on difficulty
                base_score = random.gauss(72, 15)
                if diff == "easy":
                    base_score += 10
                elif diff == "hard":
                    base_score -= 10
                score = max(20, min(100, base_score))

                total_q = random.randint(6, 12)
                correct = int(total_q * score / 100)
                wrong = total_q - correct
                resp_time = random.uniform(10, 60)

                session = GameSession(
                    user_id=patient.id, game_id=game.id,
                    difficulty=diff, started_at=played_at,
                    completed_at=played_at + timedelta(seconds=resp_time)
                )
                db.add(session)
                db.flush()

                result = GameResult(
                    session_id=session.id, user_id=patient.id,
                    game_id=game.id, score=round(score, 1),
                    correct_answers=correct, wrong_answers=wrong,
                    response_time=round(resp_time, 1), difficulty=diff,
                    played_at=played_at
                )
                db.add(result)

        db.flush()
        print("  ✅ Created sample game results")

        # ─── Sample Reminders ───────────────────────────
        today = date.today()
        reminder_templates = [
            ("Take morning medicine", "medicine", "08:00", "Take prescribed morning medication"),
            ("Morning walk", "daily_activity", "07:00", "15 minute gentle walk"),
            ("Doctor appointment", "doctor", "10:00", "Monthly checkup with Dr. Sharma"),
            ("Take evening medicine", "medicine", "20:00", "Take prescribed evening medication"),
            ("Call family", "personal", "18:00", "Weekly call with children"),
            ("Eye exercise", "daily_activity", "14:00", "5 minutes of eye relaxation"),
        ]

        for patient in patients:
            for i, (title, rtype, rtime, desc) in enumerate(reminder_templates[:random.randint(2, 5)]):
                r = Reminder(
                    user_id=patient.id,
                    created_by=caregiver1.id if patient in patients[:3] else caregiver2.id,
                    title=title, description=desc,
                    reminder_date=today + timedelta(days=random.randint(0, 7)),
                    reminder_time=rtime, repeat_type="daily" if "medicine" in title.lower() else "none",
                    reminder_type=rtype, is_completed=random.choice([True, False, False])
                )
                db.add(r)

        db.flush()
        print("  ✅ Created sample reminders")

        # ─── Performance Records ────────────────────────
        for patient in patients:
            p_results = db.query(GameResult).filter(GameResult.user_id == patient.id).all()
            if p_results:
                avg_score = sum(r.score for r in p_results) / len(p_results)
                total_c = sum(r.correct_answers for r in p_results)
                total_q = total_c + sum(r.wrong_answers for r in p_results)
                accuracy = (total_c / total_q * 100) if total_q > 0 else 0
                avg_time = sum(r.response_time for r in p_results) / len(p_results)

                category = "good" if avg_score >= 80 else "moderate" if avg_score >= 60 else "needs_attention"

                perf = PerformanceRecord(
                    user_id=patient.id,
                    avg_score=round(avg_score, 1), accuracy=round(accuracy, 1),
                    avg_response_time=round(avg_time, 1),
                    games_completed=len(p_results),
                    category=category, trend="stable"
                )
                db.add(perf)

        db.flush()
        print("  ✅ Created performance records")

        db.commit()
        print("\n🎉 Database seeded successfully!")
        print("\n📋 Demo Credentials:")
        print("  Admin:     admin@cognimind.com / admin123")
        print("  Caregiver: caregiver1@cognimind.com / care123")
        print("  Patient:   patient1@cognimind.com / patient123")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
