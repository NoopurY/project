"""Train and compare lie-risk models, then save the best model bundle."""

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

FEATURES = [
    "avg_response_time",
    "variance_response_time",
    "response_length_variation",
    "behavioral_consistency",
    "semantic_consistency",
    "contradiction_score",
    "hesitation_score",
]
TARGET = "label"


def load_or_generate_dataset(data_path: Path) -> pd.DataFrame:
    if data_path.exists():
        return pd.read_csv(data_path)

    from generate_data import generate_dataset

    dataset = generate_dataset()
    data_path.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(data_path, index=False)
    return dataset


def build_models() -> dict:
    logistic = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            ("classifier", LogisticRegression(max_iter=250, random_state=42)),
        ]
    )

    forest = RandomForestClassifier(
        n_estimators=300,
        max_depth=10,
        min_samples_leaf=4,
        random_state=42,
    )

    return {
        "logistic_regression": logistic,
        "random_forest": forest,
    }


def evaluate_model(model, x_test: pd.DataFrame, y_test: pd.Series) -> dict:
    probabilities = model.predict_proba(x_test)[:, 1]
    predictions = (probabilities >= 0.5).astype(int)

    return {
        "roc_auc": float(roc_auc_score(y_test, probabilities)),
        "f1": float(f1_score(y_test, predictions)),
        "accuracy": float(accuracy_score(y_test, predictions)),
    }


def get_feature_importance(model, feature_names: list[str]) -> dict[str, float]:
    if hasattr(model, "named_steps"):
        classifier = model.named_steps["classifier"]
        raw = np.abs(classifier.coef_[0])
    else:
        raw = model.feature_importances_

    importance = raw / (raw.sum() + 1e-9)
    return {name: float(value) for name, value in zip(feature_names, importance)}


def train() -> None:
    base_dir = Path(__file__).resolve().parent
    data_path = base_dir / "data" / "synthetic_behavior_data.csv"

    dataset = load_or_generate_dataset(data_path)
    x = dataset[FEATURES]
    y = dataset[TARGET]

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    models = build_models()
    evaluations = {}

    best_name = None
    best_model = None
    best_score = -1.0

    for name, model in models.items():
        model.fit(x_train, y_train)
        metrics = evaluate_model(model, x_test, y_test)
        evaluations[name] = metrics

        if metrics["roc_auc"] > best_score:
            best_score = metrics["roc_auc"]
            best_name = name
            best_model = model

    assert best_model is not None
    assert best_name is not None

    feature_summary = {
        "mean": {k: float(v) for k, v in x.mean().to_dict().items()},
        "std": {k: float(v) for k, v in x.std().replace(0, 1e-9).to_dict().items()},
    }

    bundle = {
        "model": best_model,
        "model_name": best_name,
        "feature_names": FEATURES,
        "feature_summary": feature_summary,
        "feature_importance": get_feature_importance(best_model, FEATURES),
        "risk_directions": {
            "avg_response_time": 1,
            "variance_response_time": 1,
            "response_length_variation": 1,
            "behavioral_consistency": -1,
            "semantic_consistency": -1,
            "contradiction_score": 1,
            "hesitation_score": 1,
        },
        "metrics": evaluations,
        "thresholds": {"high": 0.72, "moderate": 0.45},
    }

    backend_model_path = base_dir.parent / "backend" / "models" / "lie_model.pkl"
    backend_model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, backend_model_path)

    local_model_path = base_dir / "data" / "lie_model.pkl"
    joblib.dump(bundle, local_model_path)

    print("Model training completed.")
    print(f"Best model: {best_name}")
    print(f"Saved model to: {backend_model_path}")
    print("Model comparison:")
    for model_name, stats in evaluations.items():
        print(f"  - {model_name}: {stats}")


if __name__ == "__main__":
    train()
