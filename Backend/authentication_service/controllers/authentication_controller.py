from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from services.authentication_service import AuthenticationService
from utils.db_utils import get_db
from models.pydantic_models import UserCreate, UserResponse, UserLogin, Token
from pydantic import EmailStr

router = APIRouter()
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user in the system.

    Args:
        user (UserCreate): The user registration data containing username, email, password, 
                          first_name, last_name, and optional role
        db (Session): Database session dependency

    Returns:
        UserResponse: Object containing the created user's details
        
    Raises:
        HTTPException: 400 error if username or email already exists
    """
    auth_service = AuthenticationService(db)
    try:
        db_user = auth_service.create_user(
            username=user.username,
            email=user.email,
            password=user.password,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role
        )
        return db_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user and generate an access token.

    Args:
        user_credentials (UserLogin): The login credentials containing username and password
        db (Session): Database session dependency

    Returns:
        Token: Object containing the JWT access token and token type
        
    Raises:
        HTTPException: 401 error if credentials are invalid
    """
    auth_service = AuthenticationService(db)
    user = auth_service.authenticate_user(
        username=user_credentials.username,
        password=user_credentials.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # if user exists, return the token created with username. Username is accessible in the frontend like response.data.sub 
    access_token = auth_service.create_access_token(
        data={"sub": user.username,
              "role": user.role
            }
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/{username}", response_model=UserResponse)
def get_user_by_username(username: str, db: Session = Depends(get_db)): 
    """
    Get user details by username.

    Args:
        username (str): The username to search for
        db (Session): Database session dependency

    Returns:
        UserResponse: User details including user_id, username and email
        
    Raises:
        HTTPException: 404 error if user is not found
    """
    auth_service = AuthenticationService(db)
    user = auth_service.get_user_by_username(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.get("/users/email/{email}", response_model=UserResponse)
def get_user_by_email(email: EmailStr, db: Session = Depends(get_db)):
    """
    Get user details by email address.

    Args:
        email (EmailStr): The email address to search for
        db (Session): Database session dependency

    Returns:
        UserResponse: User details including user_id, username and email
        
    Raises:
        HTTPException: 404 error if user is not found
    """
    auth_service = AuthenticationService(db)
    user = auth_service.get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user
