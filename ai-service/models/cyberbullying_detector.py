from typing import List, Dict, Tuple
import re


# Toxic keyword patterns (simplified; in production use a fine-tuned transformer)
TOXIC_PATTERNS = [
    (r"\b(hate|kill|die|ugly|stupid|dumb|loser|freak|weirdo)\b", "hate_speech", 0.6),
    (r"\b(kys|stfu|gtfo|foff)\b", "severe_toxicity", 0.9),
    (r"\b(bully|threat|hurt|punch|beat)\b", "threat", 0.7),
    (r"\b(fat|skinny|ugly|gross|disgusting)\b", "body_shaming", 0.65),
    (r"\b(nobody likes|no friends|go away|leave)\b", "exclusion", 0.55),
    (r"\b(worthless|pathetic|trash|garbage)\b", "severe_insult", 0.8),
]

# Positive patterns that reduce toxicity score
POSITIVE_PATTERNS = [
    (r"\b(love|kind|friend|amazing|great|awesome|wonderful)\b", -0.2),
    (r"\b(thank|please|sorry|help|care)\b", -0.15),
    (r"\b(happy|excited|glad|proud)\b", -0.1),
]


class CyberbullyingDetector:
    """
    NLP-based cyberbullying and toxicity detector.
    Uses pattern matching as a baseline, with architecture ready
    for transformer model integration.
    """

    def __init__(self):
        self.toxic_patterns = [
            (re.compile(pattern, re.IGNORECASE), category, weight)
            for pattern, category, weight in TOXIC_PATTERNS
        ]
        self.positive_patterns = [
            (re.compile(pattern, re.IGNORECASE), weight)
            for pattern, weight in POSITIVE_PATTERNS
        ]

    def analyze_text(self, text: str) -> Dict:
        """
        Analyze a single text for toxicity and sentiment.

        Returns dict with toxicity_score, categories, sentiment, is_toxic.
        """
        if not text or not text.strip():
            return {
                "toxicity_score": 0.0,
                "categories": [],
                "sentiment": "neutral",
                "is_toxic": False,
                "explanation": "Empty text provided.",
            }

        text_lower = text.lower()
        max_score = 0.0
        detected_categories = []

        # Check toxic patterns
        for pattern, category, weight in self.toxic_patterns:
            matches = pattern.findall(text_lower)
            if matches:
                score = min(1.0, weight * len(matches))
                max_score = max(max_score, score)
                detected_categories.append(
                    {"category": category, "score": round(score, 2), "matches": matches}
                )

        # Apply positive pattern dampening
        positive_modifier = 0.0
        for pattern, weight in self.positive_patterns:
            if pattern.search(text_lower):
                positive_modifier += weight

        final_score = max(0.0, min(1.0, max_score + positive_modifier))

        # Determine sentiment
        if final_score > 0.6:
            sentiment = "very_negative"
        elif final_score > 0.3:
            sentiment = "negative"
        elif positive_modifier < -0.2:
            sentiment = "positive"
        else:
            sentiment = "neutral"

        is_toxic = final_score >= 0.5

        return {
            "toxicity_score": round(final_score, 3),
            "categories": detected_categories,
            "sentiment": sentiment,
            "is_toxic": is_toxic,
            "explanation": self._generate_explanation(
                final_score, detected_categories, sentiment
            ),
        }

    def analyze_batch(self, texts: List[str]) -> Dict:
        """
        Analyze multiple texts and return aggregate results.
        """
        results = [self.analyze_text(text) for text in texts]

        toxic_count = sum(1 for r in results if r["is_toxic"])
        avg_toxicity = (
            sum(r["toxicity_score"] for r in results) / len(results) if results else 0
        )

        all_categories = {}
        for r in results:
            for cat in r["categories"]:
                name = cat["category"]
                if name not in all_categories:
                    all_categories[name] = 0
                all_categories[name] += 1

        overall_risk = min(1.0, avg_toxicity * 1.5 if toxic_count > 1 else avg_toxicity)

        return {
            "overall_risk_score": round(overall_risk, 3),
            "total_texts": len(texts),
            "toxic_texts": toxic_count,
            "average_toxicity": round(avg_toxicity, 3),
            "category_distribution": all_categories,
            "individual_results": results,
            "alert_recommended": overall_risk >= 0.5,
        }

    def _generate_explanation(
        self, score: float, categories: List[Dict], sentiment: str
    ) -> str:
        if score < 0.3:
            return "No significant toxicity detected. Content appears safe."

        cat_names = [c["category"] for c in categories]
        if score >= 0.7:
            return (
                f"HIGH RISK: Severe toxic content detected. "
                f"Categories: {', '.join(cat_names)}. Immediate review recommended."
            )
        elif score >= 0.5:
            return (
                f"MODERATE RISK: Potentially harmful content detected. "
                f"Categories: {', '.join(cat_names)}. Parental review advised."
            )
        else:
            return (
                f"LOW RISK: Mild concerning language detected. "
                f"Categories: {', '.join(cat_names)}. Monitor for patterns."
            )


# Singleton
detector = CyberbullyingDetector()
