"""Route for adaptive follow-up generation and live analysis."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.context_analyzer import analyze_response_sequence, extract_structured_info
from services.followup_engine import generate_followup_question

router = APIRouter()


class HistoryItem(BaseModel):
    question: str
    response: str = Field(..., min_length=1)


class FollowupRequest(BaseModel):
    scenario: str
    history: list[HistoryItem] = Field(..., min_length=1)


@router.post("/followup")
def followup(payload: FollowupRequest):
    responses = [item.response for item in payload.history]
    analysis = analyze_response_sequence(responses)

    current = extract_structured_info(responses[-1])

    previous_memory = analysis["memory"].copy()
    # Rebuild memory up to previous response for targeted contradiction question context.
    if len(responses) > 1:
        previous_analysis = analyze_response_sequence(responses[:-1])
        previous_memory = previous_analysis["memory"]

    contradiction_for_latest = {
        "count": 0,
        "types": [],
        "notes": [],
    }
    latest_index = len(responses) - 1
    for item in analysis.get("contradictions", []):
        if item.get("response_index") == latest_index:
            contradiction_for_latest["count"] += len(item.get("types", []))
            contradiction_for_latest["types"].extend(item.get("types", []))
            contradiction_for_latest["notes"].extend(item.get("notes", []))

    followup_question = generate_followup_question(
        previous_memory=previous_memory,
        new_response=responses[-1],
        contradiction=contradiction_for_latest,
        current_question=payload.history[-1].question,
    )

    return {
        "followup_question": followup_question,
        "analysis": {
            "contradiction_detected": contradiction_for_latest["count"] > 0,
            "contradiction_count": analysis["contradiction_count"],
            "contradiction_types": analysis["contradiction_types"],
            "latest_contradiction_notes": contradiction_for_latest["notes"],
            "semantic_consistency": round(analysis["semantic_consistency"], 4),
            "memory": analysis["memory"],
            "latest_extraction": current,
        },
    }
