from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional
from models.addiction_scorer import scorer
from models.cyberbullying_detector import detector

router = APIRouter()


class AddictionScoreRequest(BaseModel):
    screen_time: float = 0
    night_usage: float = 0
    social_media_ratio: float = 0
    app_switching: float = 0
    sentiment_volatility: float = 0
    reward_dependency: float = 0


class CyberbullyingRequest(BaseModel):
    texts: List[str]
    child_id: Optional[str] = None


class SingleTextRequest(BaseModel):
    text: str


@router.post("/addiction-score")
async def calculate_addiction_score(request: AddictionScoreRequest):
    """Calculate addiction risk score from multi-factor inputs."""
    factors = {
        "screen_time": request.screen_time,
        "night_usage": request.night_usage,
        "social_media_ratio": request.social_media_ratio,
        "app_switching": request.app_switching,
        "sentiment_volatility": request.sentiment_volatility,
        "reward_dependency": request.reward_dependency,
    }

    score, risk_level, explanation = scorer.calculate_score(factors)

    return {
        "success": True,
        "data": {
            "score": round(score, 2),
            "risk_level": risk_level,
            "explanation": explanation,
            "factors": {k: round(v, 2) for k, v in factors.items()},
        },
    }


@router.post("/cyberbullying-check")
async def check_cyberbullying(request: CyberbullyingRequest):
    """Analyze texts for cyberbullying and toxicity."""
    result = detector.analyze_batch(request.texts)

    return {
        "success": True,
        "data": {
            **result,
            "child_id": request.child_id,
        },
    }


@router.post("/sentiment-analyze")
async def analyze_sentiment(request: SingleTextRequest):
    """Analyze single text for sentiment and toxicity."""
    result = detector.analyze_text(request.text)

    return {
        "success": True,
        "data": result,
    }
