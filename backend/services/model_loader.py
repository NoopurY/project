"""Model loading and inference helpers."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np

MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "lie_model.pkl"

DEFAULT_BUNDLE = {
    "model": None,
    "model_name": "heuristic_fallback",
    "feature_names": [
        "avg_response_time",
        "variance_response_time",
        "response_length_variation",
        "behavioral_consistency",
        "semantic_consistency",
        "contradiction_score",
        "hesitation_score",
    ],
    "feature_summary": {
        "mean": {
            "avg_response_time": 5.4,
            "variance_response_time": 2.6,
            "response_length_variation": 0.42,
            "behavioral_consistency": 0.62,
            "semantic_consistency": 0.58,
            "contradiction_score": 0.24,
            "hesitation_score": 0.36,
        },
        "std": {
            "avg_response_time": 1.6,
            "variance_response_time": 1.3,
            "response_length_variation": 0.19,
            "behavioral_consistency": 0.16,
            "semantic_consistency": 0.17,
            "contradiction_score": 0.22,
            "hesitation_score": 0.18,
        },
    },
    "feature_importance": {
        "avg_response_time": 0.13,
        "variance_response_time": 0.12,
        "response_length_variation": 0.1,
        "behavioral_consistency": 0.15,
        "semantic_consistency": 0.2,
        "contradiction_score": 0.18,
        "hesitation_score": 0.12,
    },
    "risk_directions": {
        "avg_response_time": 1,
        "variance_response_time": 1,
        "response_length_variation": 1,
        "behavioral_consistency": -1,
        "semantic_consistency": -1,
        "contradiction_score": 1,
        "hesitation_score": 1,
    },
    "metrics": {},
    "thresholds": {"high": 0.72, "moderate": 0.45},
}


@lru_cache(maxsize=1)
def load_model_bundle() -> dict:
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    return DEFAULT_BUNDLE


def predict_probability(features: dict[str, float]) -> float:
    bundle = load_model_bundle()
    model = bundle.get("model")
    feature_names = bundle["feature_names"]

    vector = np.array([[features[name] for name in feature_names]], dtype=float)

    if model is None:
        directions = bundle.get("risk_directions", {})
        means = bundle["feature_summary"]["mean"]
        stds = bundle["feature_summary"]["std"]

        score = -1.4
        for name in feature_names:
            z_score = (features[name] - means[name]) / (stds[name] + 1e-9)
            score += directions.get(name, 1) * z_score * 0.6

        probability = 1.0 / (1.0 + np.exp(-score))
        return float(np.clip(probability, 0.0, 1.0))

    probability = model.predict_proba(vector)[0][1]
    return float(np.clip(probability, 0.0, 1.0))


def classify_risk(probability: float, thresholds: dict[str, float]) -> str:
    if probability >= thresholds.get("high", 0.7):
        return "High"
    if probability >= thresholds.get("moderate", 0.4):
        return "Medium"
    return "Low"
