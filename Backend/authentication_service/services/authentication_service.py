import os
from sqlalchemy.orm import Session
from models.models import User
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
from typing import Optional

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration — SECRET_KEY must be set via environment variable in production
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

class AuthenticationService:
    def __init__(self, db: Session):
        self.db = db    

    # function to verify the password given by the user in the frontend with the one in the db as hashed !
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    # function to hash the password given by the user in the frontend
    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)

    def create_user(self, username: str, email: str, password: str, first_name: str, last_name: str, role: str = 'user') -> User:
        # first check there is a user with same email or username
        existing_user = self.db.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            if existing_user.username == username:
                raise ValueError("Username already exists")
            else:
                raise ValueError("Email already exists")

        hashed_password = self.get_password_hash(password)
        db_user = User(
            username=username,
            email=email,
            password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            role=role
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
    
    # this returns the user if exist or return null
    # in the controller, if the user is returned then the controller will return the token of the user -> to be done after login
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        user = self.db.query(User).filter(User.username == username).first()
        if not user:
            return None
        if not self.verify_password(password, user.password):
            return None
        return user

    # token oluşturuyor user için bunu frontend de keep edicek ve işlemleri sırasında backend e yollucakki onu authenticate etsin 
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()
