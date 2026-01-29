from flask import Blueprint, jsonify, request
from app.llm.gemini__service import generate_insight

insights_bp = Blueprint("insights", __name__)

@insights_bp.route("/insights/", methods=["POST"])
def get_insight():
    payload = request.json

    context = payload["context"]
    metrics = payload["metrics"]

    prompt = f"""
You are a senior banking analytics expert.

Context:
{context}

Metrics:
{metrics}

Explain:
1. What is happening
2. Why it matters
3. What action should be considered

Keep it concise and business-friendly.
"""

    insight = generate_insight(prompt)

    return jsonify({
        "insight": insight
    })