"""Generate a synthetic behavioral dataset for lie-risk modeling."""

from pathlib import Path

import numpy as np
import pandas as pd

FEATURES = [
    "avg_response_time",
    "variance_response_time",
    "response_length_variation",
    "behavioral_consistency",
    "semantic_consistency",
    "contradiction_score",
    "hesitation_score",
]


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))


def generate_dataset(n_samples: int = 2500, random_state: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(random_state)

    avg_time = rng.normal(loc=5.4, scale=1.6, size=n_samples).clip(1.0, 15.0)
    variance = rng.gamma(shape=2.2, scale=1.2, size=n_samples).clip(0.0, 15.0)
    length_variation = rng.normal(loc=0.42, scale=0.19, size=n_samples).clip(0.0, 1.0)
    behavioral_consistency = rng.normal(loc=0.62, scale=0.16, size=n_samples).clip(0.0, 1.0)
    semantic_consistency = rng.normal(loc=0.58, scale=0.17, size=n_samples).clip(0.0, 1.0)
    contradiction_score = rng.beta(a=2.0, b=5.0, size=n_samples).clip(0.0, 1.0)
    hesitation_score = rng.normal(loc=0.36, scale=0.18, size=n_samples).clip(0.0, 1.0)

    avg_time_risk = np.clip((avg_time - 2.0) / 8.0, 0.0, 1.0)
    variance_risk = np.clip(variance / 8.0, 0.0, 1.0)

    behavioral_component = (
        0.25 * avg_time_risk
        + 0.2 * variance_risk
        + 0.2 * length_variation
        + 0.2 * (1.0 - behavioral_consistency)
        + 0.15 * hesitation_score
    )

    semantic_component = 1.0 - semantic_consistency
    final_score = 0.4 * behavioral_component + 0.4 * semantic_component + 0.2 * contradiction_score
    linear_signal = (final_score - 0.45) * 6.5

    probabilities = _sigmoid(linear_signal)
    labels = rng.binomial(1, probabilities)

    frame = pd.DataFrame(
        {
            "avg_response_time": avg_time,
            "variance_response_time": variance,
            "response_length_variation": length_variation,
            "behavioral_consistency": behavioral_consistency,
            "semantic_consistency": semantic_consistency,
            "contradiction_score": contradiction_score,
            "hesitation_score": hesitation_score,
            "label": labels,
        }
    )

    return frame


def main() -> None:
    output_dir = Path(__file__).resolve().parent / "data"
    output_dir.mkdir(parents=True, exist_ok=True)

    dataset = generate_dataset()
    output_path = output_dir / "synthetic_behavior_data.csv"
    dataset.to_csv(output_path, index=False)

    print(f"Dataset created at: {output_path}")
    print(dataset.head())


if __name__ == "__main__":
    main()
