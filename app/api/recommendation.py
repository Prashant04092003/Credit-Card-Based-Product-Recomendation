from flask import Blueprint, jsonify
from app.logic.smart_recommendations_data import get_smart_recommendations_data
from app.llm.explainers import generate_smart_recommendations_explanations

recommendations_bp = Blueprint("recommendations", __name__, url_prefix="/api/recommendations")

@recommendations_bp.route("/", methods=["GET"])
def recommendations_dashboard():
    data = get_smart_recommendations_data()
    explanations = generate_smart_recommendations_explanations(data)

    return jsonify({
        "meta": {
            "page": "recommendations",
            "grain": "user-card aggregates",
            "data_source": ["recommendations"]
        },
        "data": data,
        "explanations": explanations
    })