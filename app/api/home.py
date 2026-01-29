# app/api/home.py

from flask import Blueprint, jsonify

from app.logic.home_data import get_home_overview_data
from app.llm.explainers import generate_home_explanations

home_bp = Blueprint("home", __name__, url_prefix="/api/home")


@home_bp.route("/", methods=["GET"])
def home_overview():
    """
    Home / Overview dashboard API
    """
    data = get_home_overview_data()
    explanations = generate_home_explanations(data)

    response = {
        "meta": {
            "page": "home",
            "grain": "monthly",
            "data_source": ["users", "fraud", "recommendations"]
        },
        "data": data,
        "explanations": explanations
    }

    return jsonify(response)