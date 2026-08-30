"""
AI Performance Analyzer Module

This module provides cognitive performance analysis using a simple
rule-based + scikit-learn hybrid approach.

IMPORTANT: This system does NOT diagnose dementia or any medical condition.
It only provides supportive cognitive-performance insights.
"""

import numpy as np
from typing import Dict, List, Optional


class CognitiveAnalyzer:
    """
    Analyzes cognitive game performance and provides:
    - Performance category (Good / Moderate / Needs Attention)
    - Trend analysis (Improving / Stable / Declining)
    - Personalized game recommendations

    This is NOT a medical diagnostic tool.
    """

    GAMES = {
        "memory_match": {"name": "Memory Matching", "cognitive_area": "memory"},
        "number_recall": {"name": "Number Recall", "cognitive_area": "recall"},
        "image_recall": {"name": "Image Recall", "cognitive_area": "attention"},
    }

    @staticmethod
    def categorize_score(score: float) -> str:
        """Categorize performance score (NOT a medical diagnosis)."""
        if score >= 80:
            return "good"
        elif score >= 60:
            return "moderate"
        else:
            return "needs_attention"

    @staticmethod
    def analyze_trend(scores: List[float], window: int = 5) -> str:
        """
        Analyze performance trend using moving average comparison.
        Returns: improving, stable, or declining
        """
        if len(scores) < 4:
            return "stable"

        scores = np.array(scores)

        # Compare recent half vs older half
        mid = len(scores) // 2
        older_avg = np.mean(scores[:mid])
        recent_avg = np.mean(scores[mid:])

        diff = recent_avg - older_avg

        if diff > 3:
            return "improving"
        elif diff < -3:
            return "declining"
        else:
            return "stable"

    def analyze_performance(self, game_results: List[Dict]) -> Dict:
        """
        Perform comprehensive cognitive performance analysis.

        Args:
            game_results: List of dicts with keys:
                - score, correct_answers, wrong_answers, response_time,
                  game_type, difficulty, played_at

        Returns:
            Analysis dict with category, trend, recommendations, insights
        """
        if not game_results:
            return {
                "category": "moderate",
                "trend": "stable",
                "avg_score": 0,
                "accuracy": 0,
                "avg_response_time": 0,
                "insights": ["Start playing cognitive games to see your performance analysis."],
                "recommendations": [
                    {
                        "game_name": "Memory Matching",
                        "game_type": "memory_match",
                        "reason": "Great starting activity for cognitive engagement",
                        "difficulty": "easy"
                    }
                ],
                "disclaimer": "This analysis is for informational purposes only and is NOT a medical diagnosis."
            }

        scores = [r["score"] for r in game_results]
        response_times = [r["response_time"] for r in game_results]
        total_correct = sum(r["correct_answers"] for r in game_results)
        total_wrong = sum(r["wrong_answers"] for r in game_results)

        avg_score = np.mean(scores)
        accuracy = (total_correct / (total_correct + total_wrong) * 100) if (total_correct + total_wrong) > 0 else 0
        avg_response_time = np.mean(response_times)

        category = self.categorize_score(avg_score)
        trend = self.analyze_trend(scores)

        # Game-specific analysis
        game_type_scores = {}
        for r in game_results:
            gt = r.get("game_type", "unknown")
            if gt not in game_type_scores:
                game_type_scores[gt] = []
            game_type_scores[gt].append(r["score"])

        game_avgs = {gt: np.mean(s) for gt, s in game_type_scores.items()}

        # Generate insights
        insights = self._generate_insights(avg_score, accuracy, avg_response_time, trend, game_avgs, len(game_results))

        # Generate recommendations
        recommendations = self._generate_recommendations(game_avgs, avg_score, trend)

        return {
            "category": category,
            "trend": trend,
            "avg_score": round(float(avg_score), 1),
            "accuracy": round(float(accuracy), 1),
            "avg_response_time": round(float(avg_response_time), 1),
            "games_analyzed": len(game_results),
            "game_breakdown": {gt: round(float(avg), 1) for gt, avg in game_avgs.items()},
            "insights": insights,
            "recommendations": recommendations,
            "disclaimer": "This analysis is for informational purposes only and is NOT a medical diagnosis."
        }

    def _generate_insights(self, avg_score, accuracy, avg_time, trend, game_avgs, total_games):
        """Generate human-readable performance insights."""
        insights = []

        # Overall score insight
        if avg_score >= 80:
            insights.append("Your cognitive game performance is consistently strong. Keep up the great work!")
        elif avg_score >= 60:
            insights.append("Your performance is moderate. Regular practice can help improve your scores.")
        else:
            insights.append("Your scores suggest room for improvement. Try easier difficulty levels and practice regularly.")

        # Trend insight
        if trend == "improving":
            insights.append("📈 Your performance is showing an improving trend. Great progress!")
        elif trend == "declining":
            insights.append("📉 Your recent scores are lower than before. Consider trying easier levels or taking short breaks between games.")
        else:
            insights.append("📊 Your performance has been stable recently.")

        # Response time insight
        if avg_time < 15:
            insights.append("⚡ You have excellent response times!")
        elif avg_time > 40:
            insights.append("⏱️ Take your time — accuracy is more important than speed.")

        # Game-specific insights
        for gt, avg in game_avgs.items():
            game_info = self.GAMES.get(gt, {})
            area = game_info.get("cognitive_area", gt)
            if avg < 60:
                insights.append(f"Your {area} skills could benefit from more practice with {game_info.get('name', gt)}.")

        # Activity level
        if total_games < 5:
            insights.append("💡 Play more games to get more accurate performance insights.")

        return insights

    def _generate_recommendations(self, game_avgs, overall_avg, trend):
        """Generate personalized game recommendations based on performance."""
        recommendations = []

        # Find weakest areas
        all_game_types = list(self.GAMES.keys())

        # For unplayed games
        played_types = set(game_avgs.keys())
        unplayed = [gt for gt in all_game_types if gt not in played_types]
        for gt in unplayed:
            info = self.GAMES[gt]
            recommendations.append({
                "game_name": info["name"],
                "game_type": gt,
                "reason": f"Try this activity to engage your {info['cognitive_area']} skills",
                "difficulty": "easy"
            })

        # For played games, recommend the weakest first
        if game_avgs:
            sorted_games = sorted(game_avgs.items(), key=lambda x: x[1])
            for gt, avg in sorted_games:
                info = self.GAMES.get(gt, {"name": gt, "cognitive_area": gt})
                if avg < 60:
                    difficulty = "easy"
                    reason = f"Practice to strengthen your {info['cognitive_area']} skills (current avg: {round(avg)}%)"
                elif avg < 80:
                    difficulty = "medium"
                    reason = f"Challenge yourself to improve your {info['cognitive_area']} score"
                else:
                    difficulty = "hard"
                    reason = f"You're doing well! Try a harder level to keep improving"

                recommendations.append({
                    "game_name": info["name"],
                    "game_type": gt,
                    "reason": reason,
                    "difficulty": difficulty
                })

        # Limit to 3 recommendations
        return recommendations[:3]


# Singleton analyzer instance
analyzer = CognitiveAnalyzer()
