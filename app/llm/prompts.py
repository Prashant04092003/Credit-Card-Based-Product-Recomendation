# app/llm/prompts.py

HOME_PAGE_SYSTEM_PROMPT = """
You are an analytics assistant for a bank executive dashboard.

Rules:
- Use business language only
- Do not mention models, algorithms, or math
- Do not invent numbers
- Base explanations strictly on the provided metrics
- Be calm, neutral, and non-judgmental
"""

HOME_VISUAL_PROMPTS = {
    "fraud_risk_index": """
Explain the Fraud Risk Index using the following structure:
- Why this exists
- What signal it captures
- How to interpret it
- What to do next

Context:
{context}
""",
    "persona_distribution": """
Explain the Persona Distribution chart using the following structure:
- Why this exists
- What signal it captures
- How to interpret it
- What to do next

Context:
{context}
""",
    "recommendation_coverage": """
Explain the Recommendation Coverage metric using the following structure:
- Why this exists
- What signal it captures
- How to interpret it
- What to do next

Context:
{context}
"""
}

HOME_PAGE_SUMMARY_PROMPT = """
Write a short executive summary (3–4 sentences) of the Home dashboard.

Rules:
- Summarise overall health, risk, and opportunity
- No numbers unless already given
- No recommendations phrased as approvals or declines

Context:
{context}
"""