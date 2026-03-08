import os
import logging
import uvicorn

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from controllers.ml_controller import router as ml_router
from utils.db_context import get_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ML Analytics Service",
    description="Portfolio risk analytics and ML-powered insights",
    version="1.0.0",
)

# Configure CORS
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ml_router)


@app.get("/")
async def root():
    return {
        "message": "ML Analytics Service API",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
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
        cache.set_cache("ml_health_ping", "1", ttl=10)
        health["redis"] = "connected"
    except Exception as e:
        health["redis"] = str(e)
    status_code = 200 if health["status"] == "healthy" else 503
    return JSONResponse(status_code=status_code, content=health)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=True)
