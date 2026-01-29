# app/llm/schemas.py

VISUAL_EXPLANATION_SCHEMA = {
    "why_this_exists": str,
    "what_signal_it_captures": str,
    "how_to_interpret": str,
    "what_to_do_next": str
}

PAGE_SUMMARY_SCHEMA = {
    "page_summary": str
}