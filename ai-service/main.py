from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.scoring import router as scoring_router

app = FastAPI(
    title="NeuroNest AI Service",
    description="AI-powered addiction risk scoring and cyberbullying detection",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "name": "NeuroNest AI Service",
        "version": "1.0.0",
        "status": "healthy",
        "models": ["addiction_scorer", "cyberbullying_detector"],
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(scoring_router, prefix="/ai")
