import os
import logging

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from controllers.authentication_controller import router as auth_router
from utils.db_utils import Base, engine, get_db

logger = logging.getLogger(__name__)

app = FastAPI(title="Authentication Service", version="1.0.0")

# Create tables on startup (ignore if already exist)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.warning(f"Table creation note: {e}")

# Configure CORS — restrict origins in production
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the authentication router
app.include_router(
    auth_router,
    prefix="/auth",
    tags=["authentication"]
)

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "unhealthy", "database": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
