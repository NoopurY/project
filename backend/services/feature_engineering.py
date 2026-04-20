"""Feature engineering utilities for advanced behavioral + semantic inference."""

from __future__ import annotations

import itertools
import re
from typing import Iterable

import numpy as np

FEATURE_NAMES = [
    "avg_response_time",
    "variance_response_time",
    "response_length_variation",
    "behavioral_consistency",
    "semantic_consistency",
    "contradiction_score",
    "hesitation_score",
]

_STOP_WORDS = {
    "the",
    "a",
    "an",
    "and",
    "or",
    "to",
    "of",
    "in",
    "on",
    "for",
    "at",
    "is",
    "are",
    "was",
    "were",
    "i",
    "we",
    "you",
    "he",
    "she",
    "they",
    "it",
    "that",
    "this",
    "with",
    "my",
    "our",
    "their",
}

_FILLER_TERMS = {
    "um",
    "uh",
    "maybe",
    "possibly",
    "probably",
    "honestly",
    "actually",
    "i think",
    "not sure",
    "kind of",
    "sort of",
}


def _tokenize(text: str) -> list[str]:
    tokens = re.findall(r"[a-zA-Z']+", text.lower())
    return [token for token in tokens if token not in _STOP_WORDS and len(token) > 1]


def _pairwise_cosine_similarity(vectors: list[np.ndarray]) -> float:
    if len(vectors) < 2:
        return 0.7

    similarities: list[float] = []
    for left, right in itertools.combinations(vectors, 2):
        denominator = (np.linalg.norm(left) * np.linalg.norm(right)) + 1e-9
        similarities.append(float(np.dot(left, right) / denominator))

    return float(np.mean(similarities)) if similarities else 0.7


def _build_term_vectors(tokenized_responses: list[list[str]]) -> list[np.ndarray]:
    vocabulary = sorted({token for response in tokenized_responses for token in response})
    if not vocabulary:
        return [np.zeros(1, dtype=float) for _ in tokenized_responses]

    vectors: list[np.ndarray] = []
    for tokens in tokenized_responses:
        vector = np.array([tokens.count(term) for term in vocabulary], dtype=float)
        vectors.append(vector)
    return vectors


def _safe_variance(values: Iterable[float]) -> float:
    array = np.array(list(values), dtype=float)
    return float(np.var(array)) if len(array) else 0.0


def _normalize(value: float, lower: float = 0.0, upper: float = 1.0) -> float:
    return float(max(lower, min(upper, value)))


def compute_features(
    responses: list[str],
    response_times: list[float],
    typing_durations: list[float] | None,
    semantic_consistency: float,
    contradiction_score: float,
) -> dict[str, float]:
    if not responses or not response_times:
        raise ValueError("Responses and response_times must be non-empty.")

    if len(responses) != len(response_times):
        raise ValueError("responses and response_times lengths must match.")

    if typing_durations is None:
        typing_durations = [max(0.1, t * 0.65) for t in response_times]

    if len(typing_durations) != len(responses):
        raise ValueError("typing_durations length must match responses length.")

    response_times_np = np.array(response_times, dtype=float)
    typing_np = np.array(typing_durations, dtype=float)
    word_lengths = np.array([max(1, len(_tokenize(text))) for text in responses], dtype=float)

    avg_time = float(np.mean(response_times_np))
    variance = _safe_variance(response_times_np)

    length_variation = float(np.std(word_lengths) / (np.mean(word_lengths) + 1e-9))
    length_variation = _normalize(length_variation)

    tokenized = [_tokenize(response) for response in responses]
    vectors = _build_term_vectors(tokenized)
    behavioral_consistency = _normalize((_pairwise_cosine_similarity(vectors) + 1.0) / 2.0)

    total_words = sum(len(tokens) for tokens in tokenized) + 1e-9
    filler_count = sum(text.lower().count(term) for text in responses for term in _FILLER_TERMS)
    filler_density = filler_count / total_words

    latency_gap = np.maximum(response_times_np - typing_np, 0)
    gap_ratio = float(np.mean(latency_gap / (response_times_np + 1e-9)))

    long_pause_ratio = float(
        np.mean(response_times_np > (np.mean(response_times_np) + np.std(response_times_np)))
    )

    punctuation_hesitation = float(
        np.mean([1.0 if re.search(r"\.\.\.|\?\?|!!", text) else 0.0 for text in responses])
    )

    hesitation_score = _normalize(
        0.45 * _normalize(filler_density * 3.0)
        + 0.3 * gap_ratio
        + 0.15 * long_pause_ratio
        + 0.1 * punctuation_hesitation
    )

    return {
        "avg_response_time": avg_time,
        "variance_response_time": variance,
        "response_length_variation": length_variation,
        "behavioral_consistency": behavioral_consistency,
        "semantic_consistency": _normalize(semantic_consistency),
        "contradiction_score": _normalize(contradiction_score),
        "hesitation_score": hesitation_score,
    }


def behavioral_risk_component(features: dict[str, float]) -> float:
    # 0..1 behavioral risk signal.
    avg_time_risk = _normalize((features["avg_response_time"] - 2.0) / 8.0)
    variance_risk = _normalize(features["variance_response_time"] / 8.0)

    return _normalize(
        0.25 * avg_time_risk
        + 0.2 * variance_risk
        + 0.2 * features["response_length_variation"]
        + 0.2 * (1.0 - features["behavioral_consistency"])
        + 0.15 * features["hesitation_score"]
    )


def build_metrics_snapshot(
    responses: list[str],
    response_times: list[float],
    typing_durations: list[float] | None,
    features: dict[str, float],
    contradiction_count: int,
    contradiction_types: list[str],
) -> dict[str, float | int | list[str]]:
    lengths = [len(response.split()) for response in responses]
    mean_length = float(np.mean(lengths)) if lengths else 0.0

    if typing_durations is None:
        typing_durations = [max(0.1, t * 0.65) for t in response_times]

    avg_typing = float(np.mean(typing_durations)) if typing_durations else 0.0

    return {
        "average_response_time": round(features["avg_response_time"], 3),
        "response_time_variance": round(features["variance_response_time"], 3),
        "response_length_variability": round(features["response_length_variation"], 3),
        "behavioral_consistency": round(features["behavioral_consistency"], 3),
        "semantic_consistency": round(features["semantic_consistency"], 3),
        "contradiction_score": round(features["contradiction_score"], 3),
        "hesitation_indicators": round(features["hesitation_score"], 3),
        "contradictions": int(contradiction_count),
        "contradiction_types": contradiction_types,
        "average_response_length_words": round(mean_length, 2),
        "average_typing_duration": round(avg_typing, 3),
    }
