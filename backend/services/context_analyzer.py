"""Context memory, information extraction, and contradiction analysis utilities."""

from __future__ import annotations

import itertools
import re
from copy import deepcopy

import numpy as np

LOCATION_KEYWORDS = {
    "home",
    "house",
    "office",
    "campus",
    "library",
    "outside",
    "store",
    "classroom",
    "lab",
    "parking",
    "canteen",
    "hostel",
    "work",
}

PEOPLE_KEYWORDS = {
    "friend",
    "brother",
    "sister",
    "mother",
    "father",
    "colleague",
    "manager",
    "teacher",
    "professor",
    "classmate",
    "supervisor",
    "coworker",
    "roommate",
    "team",
}

ACTION_KEYWORDS = {
    "went",
    "took",
    "met",
    "submitted",
    "copied",
    "checked",
    "entered",
    "left",
    "called",
    "emailed",
    "reported",
    "stayed",
    "waited",
    "moved",
    "opened",
    "closed",
    "spoke",
    "reviewed",
}

TIME_PATTERNS = [
    r"\b(?:[01]?\d|2[0-3])(?::[0-5]\d)?\s?(?:am|pm)\b",
    r"\b(?:morning|afternoon|evening|night|tonight|midnight|noon)\b",
    r"\b(?:yesterday|today|last\s+night|last\s+evening)\b",
]

VAGUE_TERMS = {
    "maybe",
    "not sure",
    "i think",
    "probably",
    "kind of",
    "sort of",
    "somewhere",
    "around",
}

NEGATION_TERMS = {"didn't", "did not", "never", "no"}

TIME_BUCKET_RANGES = {
    "morning": (5, 11),
    "afternoon": (12, 16),
    "evening": (17, 20),
    "night": (21, 23),
    "midnight": (0, 1),
    "noon": (12, 12),
    "tonight": (20, 23),
    "last night": (20, 23),
}


def initialize_memory() -> dict:
    return {
        "location": [],
        "time": [],
        "people": [],
        "actions": [],
        "claims": {
            "alone": [],
        },
    }


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z']+", text.lower())


def _parse_clock_hour(token: str) -> int | None:
    token = token.strip().lower()
    match = re.match(r"^(\d{1,2})(?::\d{2})?\s?(am|pm)$", token)
    if not match:
        return None

    hour = int(match.group(1))
    suffix = match.group(2)

    if hour == 12:
        hour = 0
    if suffix == "pm":
        hour += 12
    return hour


def _entry_to_hour_candidates(entry: str) -> set[int]:
    cleaned = entry.strip().lower()

    parsed_hour = _parse_clock_hour(cleaned)
    if parsed_hour is not None:
        return {parsed_hour}

    if cleaned in TIME_BUCKET_RANGES:
        start, end = TIME_BUCKET_RANGES[cleaned]
        return set(range(start, end + 1))

    # Day-level markers should not be treated as direct conflict with clock-time references.
    if cleaned in {"today", "yesterday"}:
        return set(range(0, 24))

    return set()


def _times_compatible(previous: set[str], current: set[str]) -> bool:
    if not previous or not current:
        return True

    prev_candidates = [_entry_to_hour_candidates(item) for item in previous]
    curr_candidates = [_entry_to_hour_candidates(item) for item in current]

    for prev in prev_candidates:
        for curr in curr_candidates:
            if not prev or not curr:
                # If either token is not parseable as concrete time, avoid forcing a hard conflict.
                return True
            if prev.intersection(curr):
                return True

    return False


def _has_contradiction_cue(raw_text: str) -> bool:
    cues = [
        "actually",
        "instead",
        "not at",
        "never",
        "whole time",
        "always",
        "but",
        "however",
    ]
    return any(cue in raw_text for cue in cues)


def _has_internal_time_conflict(times: set[str]) -> bool:
    if len(times) < 2:
        return False

    concrete_hours = sorted({hour for entry in times for hour in _entry_to_hour_candidates(entry)})
    if len(concrete_hours) < 2:
        return False

    return (max(concrete_hours) - min(concrete_hours)) >= 4


def extract_structured_info(text: str) -> dict[str, list[str]]:
    lowered = text.lower()
    tokens = _tokenize(text)

    locations = sorted({token for token in tokens if token in LOCATION_KEYWORDS})
    people = sorted({token for token in tokens if token in PEOPLE_KEYWORDS})

    actions = sorted(
        {
            token
            for token in tokens
            if token in ACTION_KEYWORDS or token.endswith("ed") or token.endswith("ing")
        }
    )

    times = []
    for pattern in TIME_PATTERNS:
        times.extend(re.findall(pattern, lowered))

    alone_claim = bool(re.search(r"\b(alone|by myself|nobody|no one)\b", lowered))

    return {
        "location": sorted(set(locations)),
        "time": sorted(set([t.strip() for t in times if t.strip()])),
        "people": sorted(set(people)),
        "actions": sorted(set(actions)),
        "claims": ["alone"] if alone_claim else [],
    }


def _first_or_dash(values: list[str]) -> str:
    return values[0] if values else "-"


def detect_contradictions(memory: dict, extracted: dict) -> dict:
    contradiction_types: list[str] = []
    notes: list[str] = []
    raw_text = extracted.get("raw_text", "")
    contradiction_cue = _has_contradiction_cue(raw_text)

    prev_locations = set(memory.get("location", []))
    new_locations = set(extracted.get("location", []))
    if (
        prev_locations
        and new_locations
        and prev_locations.isdisjoint(new_locations)
        and contradiction_cue
    ):
        contradiction_types.append("location_conflict")
        notes.append(
            f"Earlier location {sorted(prev_locations)} conflicts with new location {sorted(new_locations)}."
        )

    prev_times = set(memory.get("time", []))
    new_times = set(extracted.get("time", []))
    if _has_internal_time_conflict(new_times):
        contradiction_types.append("time_conflict")
        notes.append(f"Current response includes conflicting times {sorted(new_times)}.")
    elif prev_times and new_times and not _times_compatible(prev_times, new_times) and contradiction_cue:
        contradiction_types.append("time_conflict")
        notes.append(f"Time reference changed from {sorted(prev_times)} to {sorted(new_times)}.")

    prev_people = set(memory.get("people", []))
    new_people = set(extracted.get("people", []))
    alone_before = "alone" in memory.get("claims", {}).get("alone", [])
    now_alone = "alone" in extracted.get("claims", [])

    strong_alone = bool(re.search(r"\b(completely alone|all by myself|nobody else|no one else)\b", raw_text))

    if now_alone and prev_people and strong_alone:
        contradiction_types.append("people_conflict")
        notes.append("Current statement claims being alone but earlier people were mentioned.")

    if alone_before and new_people and contradiction_cue:
        contradiction_types.append("people_conflict")
        notes.append("Earlier statement claimed being alone but new response introduces people.")

    prev_actions = set(memory.get("actions", []))
    negated_action = any(term in " ".join(extracted.get("raw_text_tokens", [])) for term in NEGATION_TERMS)
    if negated_action and prev_actions and set(extracted.get("actions", [])).intersection(prev_actions):
        contradiction_types.append("action_conflict")
        notes.append("Current response negates an earlier described action.")

    return {
        "count": len(contradiction_types),
        "types": contradiction_types,
        "notes": notes,
    }


def update_memory(memory: dict, extracted: dict) -> dict:
    updated = deepcopy(memory)

    for key in ["location", "time", "people", "actions"]:
        existing = list(updated.get(key, []))
        merged = sorted(set(existing + extracted.get(key, [])))
        updated[key] = merged

    if "claims" not in updated:
        updated["claims"] = {"alone": []}

    if extracted.get("claims"):
        updated["claims"]["alone"] = sorted(set(updated["claims"].get("alone", []) + extracted["claims"]))

    return updated


def compute_semantic_consistency(responses: list[str]) -> float:
    if len(responses) < 2:
        return 0.7

    token_sets = [set(_tokenize(response)) for response in responses if response.strip()]
    if len(token_sets) < 2:
        return 0.7

    scores = []
    for left, right in itertools.combinations(token_sets, 2):
        union = left.union(right)
        if not union:
            continue
        scores.append(len(left.intersection(right)) / len(union))

    if not scores:
        return 0.7

    # Jaccard values are usually low for natural language; scale to 0-1 useful range.
    normalized = min(1.0, max(0.0, float(np.mean(scores)) * 2.2))
    return normalized


def contradiction_score(contradiction_count: int, num_responses: int) -> float:
    if num_responses <= 1:
        return 0.0
    return float(min(1.0, contradiction_count / max(1, num_responses - 1)))


def analyze_response_sequence(
    responses: list[str],
    seed_memory: dict | None = None,
) -> dict:
    memory = deepcopy(seed_memory) if seed_memory is not None else initialize_memory()
    all_contradictions: list[dict] = []

    for index, response in enumerate(responses):
        extracted = extract_structured_info(response)
        extracted["raw_text_tokens"] = _tokenize(response)
        extracted["raw_text"] = response.lower()

        contradiction = detect_contradictions(memory, extracted)
        if contradiction["count"] > 0:
            all_contradictions.append(
                {
                    "response_index": index,
                    "types": contradiction["types"],
                    "notes": contradiction["notes"],
                    "current_location": extracted.get("location", []),
                    "previous_location": memory.get("location", []),
                }
            )

        memory = update_memory(memory, extracted)

    total_contradictions = sum(item["types"].__len__() for item in all_contradictions)
    semantic_consistency = compute_semantic_consistency(responses)

    return {
        "memory": memory,
        "contradictions": all_contradictions,
        "contradiction_count": int(total_contradictions),
        "contradiction_types": sorted(
            {kind for item in all_contradictions for kind in item.get("types", [])}
        ),
        "semantic_consistency": float(semantic_consistency),
        "contradiction_score": contradiction_score(total_contradictions, len(responses)),
    }


def is_vague_response(text: str) -> bool:
    lowered = text.lower().strip()
    if len(lowered.split()) < 6:
        return True
    return any(term in lowered for term in VAGUE_TERMS)
