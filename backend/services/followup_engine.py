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
    current_question: str | None = None,
) -> str | None:
    extracted = extract_structured_info(new_response)
    current_question = (current_question or "").strip()

    if contradiction.get("count", 0) > 0:
        prev_location = previous_memory.get("location", [])
        new_location = extracted.get("location", [])

        if "location_conflict" in contradiction.get("types", []):
            if prev_location and new_location:
                return (
                    f"You previously referenced {prev_location[0]}, but now you mention {new_location[0]}. "
                    "State one exact location for this moment and explain only that timeline step."
                )
            return "Your location details are inconsistent. Give one precise location and avoid alternatives."

        if "time_conflict" in contradiction.get("types", []):
            return (
                "Your timeline appears inconsistent. Provide one ordered sequence with exact times "
                "from start to finish in a single line."
            )

        if "people_conflict" in contradiction.get("types", []):
            return (
                "You gave conflicting details about who was present. "
                "List exactly who was there, and if alone, explicitly confirm no one else was present."
            )

        if "action_conflict" in contradiction.get("types", []):
            return (
                "Your action details conflict. State clearly what you did, what you did not do, "
                "and the order of those actions."
            )

        if "statement_conflict" in contradiction.get("types", []):
            if any(term in new_response.lower() for term in ["skip", "except", "withhold", "forgot", "omitted"]):
                return (
                    "You admitted to skipping or omitting certain details. Interrogation protocols require "
                    "a full disclosure. Why were those details withheld, and what are those specific details?"
                )
            return (
                "Your latest response contains opposite claims in one statement. "
                "Rewrite your answer as one clear, consistent version."
            )

        return "There appears to be a contradiction with your earlier statement. Can you explain it clearly?"

    if is_vague_response(new_response):
        if current_question:
            return f"Please answer more specifically: {current_question}"
        return "Your response is vague. Provide specific time, location, people, and action details."

    missing_targeted = _targeted_missing_info_question(extracted)
    if missing_targeted:
        return missing_targeted

    if extracted.get("actions"):
        return "What happened immediately after that action?"

    return None
