"""Adaptive follow-up question generation."""

from __future__ import annotations

from services.context_analyzer import extract_structured_info, is_vague_response


def _targeted_missing_info_question(extracted: dict) -> str | None:
    if not extracted.get("time"):
        return "Can you be more specific about the time of this event?"
    if not extracted.get("location"):
        return "Where exactly did this happen?"
    if not extracted.get("people"):
        return "Who was with you at that time?"
    return None


def generate_followup_question(
    previous_memory: dict,
    new_response: str,
    contradiction: dict,
) -> str | None:
    extracted = extract_structured_info(new_response)

    if contradiction.get("count", 0) > 0:
        prev_location = previous_memory.get("location", [])
        new_location = extracted.get("location", [])

        if "location_conflict" in contradiction.get("types", []):
            if prev_location and new_location:
                return (
                    f"Earlier you said you were at {prev_location[0]}, now you mention {new_location[0]}. "
                    "Can you clarify this difference?"
                )
            return "Your location details seem inconsistent. Can you clarify exactly where you were?"

        if "time_conflict" in contradiction.get("types", []):
            return "Your timeline appears inconsistent. Please explain the exact sequence of times."

        if "people_conflict" in contradiction.get("types", []):
            return "You gave conflicting details about who was present. Who exactly was there with you?"

        return "There appears to be a contradiction with your earlier statement. Can you explain it clearly?"

    if is_vague_response(new_response):
        return "Your response is a bit vague. Please provide more specific details."

    missing_targeted = _targeted_missing_info_question(extracted)
    if missing_targeted:
        return missing_targeted

    if extracted.get("actions"):
        return "What happened immediately after that action?"

    return None
