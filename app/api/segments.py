from flask import Blueprint, jsonify
from app.logic.segments_data import get_segments_personas_data
from app.llm.explainers import generate_segments_explanations

segments_bp = Blueprint("segments", __name__, url_prefix="/api/segments")

@segments_bp.route("/", methods=["GET"])
def segments_dashboard():
    data = get_segments_personas_data()
    explanations = generate_segments_explanations(data)

    return jsonify({
        "meta": {
            "page": "segments",
            "grain": "user-level aggregates",
            "data_source": ["segmentation", "recommendations"]
        },
        "data": data,
        "explanations": explanations
    })