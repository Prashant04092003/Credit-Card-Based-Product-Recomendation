from flask import Blueprint, jsonify
from app.logic.customers_data import (get_customers_data, get_single_customer)
from app.llm.explainers import generate_customers_explanations

customers_bp = Blueprint("customers", __name__, url_prefix="/api/customers")

@customers_bp.route("/", methods=["GET"])
def customers_dashboard():
    data = get_customers_data()
    explanations = generate_customers_explanations(data)

    return jsonify({
        "meta": {
            "page": "customers",
            "grain": "user-level",
            "data_source": ["users"]
        },
        "data": data,
        "explanations": explanations
    })

@customers_bp.route("/<int:user_id>/", methods=["GET"])
def single_customer(user_id):
    customer = get_single_customer(user_id)

    if customer is None:
        return jsonify({
            "error": "Customer not found",
            "user_id": user_id
        }), 404

    return jsonify({
        "meta": {
            "page": "customers",
            "view": "single_customer",
            "user_id": user_id
        },
        "data": customer
    })