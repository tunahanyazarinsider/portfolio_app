from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controllers.authentication_controller import router as auth_router
from utils.db_utils import Base, engine

app = FastAPI()

# Create tables on startup (ignore if already exist)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Note: Tables may already exist: {e}")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # accept requests from any port
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
