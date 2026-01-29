from flask import Blueprint, jsonify
from app.logic.fraud_data import get_fraud_intelligence_data
from app.llm.explainers import generate_fraud_explanations

fraud_bp = Blueprint("fraud", __name__, url_prefix="/api/fraud")

@fraud_bp.route("/", methods=["GET"])
def fraud_intelligence():
    data = get_fraud_intelligence_data()
    explanations = generate_fraud_explanations(data)

    return jsonify({
        "meta": {
            "page": "fraud",
            "grain": "monthly",
            "data_source": ["fraud"]
        },
        "data": data,
        "explanations": explanations
    })