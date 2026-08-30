import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

SECRET_KEY = os.getenv("SECRET_KEY", "cognimind-dev-secret-key-change-in-production-2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cognimind.db")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
APP_NAME = os.getenv("APP_NAME", "CogniMind")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"
