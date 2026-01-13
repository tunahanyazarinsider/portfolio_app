# Standard library imports
import uvicorn

# Third-party imports
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Local application imports
from controllers.stock_controller import router as stock_router
from models.models import Base
from utils.db_context import engine

# Single dot (.) means current directory, double dot (..) means parent directory


# Create database tables (ignore if already exist)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Note: Tables may already exist: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="Stock Portfolio Service",
    description="API for managing stock portfolios and market data",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
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



if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
