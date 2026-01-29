from flask import Blueprint, jsonify
from app.logic.card_portfolio_data import get_card_portfolio_data
from app.llm.explainers import generate_card_portfolio_explanations

cards_bp = Blueprint("cards", __name__, url_prefix="/api/cards")

@cards_bp.route("/", methods=["GET"])
def cards_dashboard():
    data = get_card_portfolio_data()
    explanations = generate_card_portfolio_explanations(data)

    return jsonify({
        "meta": {
            "page": "cards",
            "grain": "card-level aggregates",
            "data_source": ["user_cards", "card_catalog"]
        },
        "data": data,
        "explanations": explanations
    })