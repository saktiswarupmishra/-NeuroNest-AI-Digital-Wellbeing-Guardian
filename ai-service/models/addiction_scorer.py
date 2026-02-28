import numpy as np
from typing import Dict, Tuple

# Weighted factors for addiction risk scoring
WEIGHTS = {
    "screen_time": 0.25,
    "night_usage": 0.15,
    "social_media_ratio": 0.20,
    "app_switching": 0.10,
    "sentiment_volatility": 0.15,
    "reward_dependency": 0.15,
}

RISK_LEVELS = {
    (0, 25): "LOW",
    (26, 50): "MODERATE",
    (51, 75): "HIGH",
    (76, 100): "CRITICAL",
}


class AddictionScorer:
    """
    Multi-factor addiction risk scoring model.
    Uses weighted inputs to generate a 0-100 risk score with
    explainable AI output.
    """

    def __init__(self):
        self.weights = np.array(list(WEIGHTS.values()))
        self.factor_names = list(WEIGHTS.keys())

    def classify_risk(self, score: float) -> str:
        for (low, high), level in RISK_LEVELS.items():
            if low <= score <= high:
                return level
        return "CRITICAL"

    def generate_explanation(
        self, factors: Dict[str, float], score: float, risk_level: str
    ) -> str:
        concerns = []

        if factors.get("screen_time", 0) > 60:
            concerns.append(
                f"High daily screen time ({factors['screen_time']:.0f}% above healthy threshold)"
            )
        if factors.get("night_usage", 0) > 40:
            concerns.append("Significant late-night device usage detected")
        if factors.get("social_media_ratio", 0) > 50:
            concerns.append(
                f"Social media dominates {factors['social_media_ratio']:.0f}% of usage"
            )
        if factors.get("app_switching", 0) > 40:
            concerns.append("Frequent app switching suggests digital restlessness")
        if factors.get("sentiment_volatility", 0) > 50:
            concerns.append("Emotional volatility detected in usage patterns")
        if factors.get("reward_dependency", 0) > 50:
            concerns.append("Reward-driven usage behavior identified")

        if not concerns:
            return (
                f"Overall digital wellbeing is healthy with a {risk_level.lower()} "
                f"risk score of {score:.0f}/100. Keep up the good habits!"
            )

        recommendations = {
            "CRITICAL": "Immediate intervention recommended. Consider professional guidance.",
            "HIGH": "Active monitoring needed. Discuss digital habits with your child.",
            "MODERATE": "Monitor trends over the coming week. Set clearer boundaries.",
            "LOW": "Continue current approach. Usage patterns are healthy.",
        }

        return (
            f"Risk level: {risk_level} ({score:.0f}/100). "
            f"Key concerns: {'. '.join(concerns)}. "
            f"Recommendation: {recommendations.get(risk_level, 'Monitor usage.')}"
        )

    def calculate_score(self, factors: Dict[str, float]) -> Tuple[float, str, str]:
        """
        Calculate addiction risk score from factor dictionary.

        Args:
            factors: Dict with keys matching WEIGHTS (values 0-100)

        Returns:
            Tuple of (score, risk_level, explanation)
        """
        factor_values = np.array(
            [min(100, max(0, factors.get(name, 0))) for name in self.factor_names]
        )

        # Weighted sum
        score = float(np.clip(np.dot(factor_values, self.weights), 0, 100))
        risk_level = self.classify_risk(score)
        explanation = self.generate_explanation(factors, score, risk_level)

        return score, risk_level, explanation


# Singleton instance
scorer = AddictionScorer()
