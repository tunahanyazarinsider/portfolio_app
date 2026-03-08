# Standard library imports
import os
import logging
import uvicorn

# Third-party imports
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

# Local application imports
from controllers.stock_controller import router as stock_router
from models.models import Base
from utils.db_context import engine, get_db

logger = logging.getLogger(__name__)

# Create database tables (ignore if already exist)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.warning(f"Table creation note: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="Stock Portfolio Service",
    description="API for managing stock portfolios and market data",
    version="1.0.0"
)

# Configure CORS — restrict origins in production
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(stock_router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to Stock Portfolio Service API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }



@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    health = {"status": "healthy"}
    try:
        db.execute(text("SELECT 1"))
        health["database"] = "connected"
    except Exception as e:
        health["status"] = "unhealthy"
        health["database"] = str(e)
    try:
        from utils.cache import cache
        if cache.get_cache("health_check_ping") is not None or cache.set_cache("health_check_ping", "1", ttl=10) is None:
            health["redis"] = "connected"
        else:
            health["redis"] = "connected"
    except Exception as e:
        health["redis"] = str(e)
    status_code = 200 if health["status"] == "healthy" else 503
    return JSONResponse(status_code=status_code, content=health)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
