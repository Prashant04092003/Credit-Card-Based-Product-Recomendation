# app/llm/explainers.py

from app.llm.schemas import (
    VISUAL_EXPLANATION_SCHEMA,
    PAGE_SUMMARY_SCHEMA
)

def _mock_visual_explanation(title):
    """
    Deterministic mock explanation for a visual.
    """
    return {
        "why_this_exists": f"This view helps stakeholders understand {title.lower()} at a portfolio level.",
        "what_signal_it_captures": f"It highlights patterns related to {title.lower()} across the customer base.",
        "how_to_interpret": f"Higher values indicate greater concentration or intensity in {title.lower()}.",
        "what_to_do_next": "Use this insight to identify areas that may need deeper review or strategic focus."
    }


def _mock_page_summary():
    return {
        "page_summary": (
            "Overall, the portfolio shows strong customer coverage and clear behavioral segmentation. "
            "Risk levels appear stable over time, while recommendation reach suggests meaningful personalization opportunities. "
            "This view provides a balanced snapshot of health, risk, and growth potential."
        )
    }


def generate_home_explanations(home_data):
    """
    Generates mock explanations for the Home dashboard.
    Accepts structured metrics only.
    """

    explanations = {
        "fraud_risk_index": _mock_visual_explanation("Fraud Risk Index"),
        "persona_distribution": _mock_visual_explanation("Persona Distribution"),
        "recommendation_coverage": _mock_visual_explanation("Recommendation Coverage"),
        "page_summary": _mock_page_summary()
    }

    return explanations

def generate_fraud_explanations(fraud_data):
    """
    Generates mock explanations for the Fraud Intelligence dashboard.
    Accepts structured fraud metrics only.
    """

    def _mock(title):
        return {
            "why_this_exists": f"This view helps monitor {title.lower()} across the transaction portfolio.",
            "what_signal_it_captures": f"It highlights patterns related to {title.lower()} based on observed transaction behavior.",
            "how_to_interpret": "Consistent levels indicate stable behavior, while shifts may signal emerging patterns that need attention.",
            "what_to_do_next": "Use this insight to prioritize deeper investigation or monitoring where needed."
        }

    return {
        "fraud_risk_index": _mock("Fraud Risk Index"),
        "fraud_band_distribution": _mock("Fraud Band Distribution"),
        "fraud_trend": _mock("Fraud Trend Over Time"),
        "merchant_behavior_risk": _mock("Merchant Behavior Risk"),
        "page_summary": {
            "page_summary": (
                "Fraud risk appears consistently distributed across transaction activity, with stability over time. "
                "Behavioral signals suggest that new merchant categories contribute more to elevated risk than new merchants alone. "
                "This view supports targeted monitoring based on transaction behavior rather than customer attributes."
            )
        }
    }

def generate_segments_explanations(segments_data):
    """
    Generates mock explanations for the Segments & Personas dashboard.
    """

    def _mock(title):
        return {
            "why_this_exists": f"This view helps understand how customers differ by {title.lower()}.",
            "what_signal_it_captures": f"It highlights behavioral differences in {title.lower()} across personas.",
            "how_to_interpret": "Higher or lower values indicate how strongly a persona exhibits this behavior relative to others.",
            "what_to_do_next": "Use this insight to tailor engagement, product positioning, or monitoring strategies."
        }

    return {
        "persona_distribution": _mock("Persona Distribution"),
        "spend_intensity_by_persona": _mock("Spend Intensity"),
        "spend_volatility_by_persona": _mock("Spend Volatility"),
        "credit_capacity_by_persona": _mock("Credit Capacity"),
        "page_summary": {
            "page_summary": (
                "Personas show clear and consistent differences in spending behavior, volatility, and credit capacity. "
                "High-spend personas tend to hold more cards and higher limits, while budget-focused personas show lower intensity and stability. "
                "This segmentation supports differentiated engagement and product strategies."
            )
        }
    }
def generate_customers_explanations(customers_data):
    def _mock(title):
        return {
            "why_this_exists": f"This view provides context on customer {title.lower()}.",
            "what_signal_it_captures": f"It summarizes how customers are distributed by {title.lower()}.",
            "how_to_interpret": "Higher values indicate a larger share of customers in that group.",
            "what_to_do_next": "Use this context to inform portfolio strategy and downstream analysis."
        }

    return {
        "age_distribution": _mock("Age"),
        "income_distribution": _mock("Income"),
        "geography_city": _mock("Geography"),
        "credit_posture": _mock("Credit Posture"),
        "card_ownership": _mock("Card Ownership"),
        "page_summary": {
            "page_summary": (
                "The customer base spans a broad range of ages and incomes, with strong geographic concentration "
                "in major cities. A significant share of customers exhibit high debt relative to income, highlighting "
                "the importance of careful credit portfolio management."
            )
        }
    }
def generate_card_portfolio_explanations(card_data):
    def _mock(title):
        return {
            "why_this_exists": f"This view summarizes the card portfolio by {title.lower()}.",
            "what_signal_it_captures": f"It shows how the card portfolio is distributed across {title.lower()}.",
            "how_to_interpret": "Larger values indicate higher exposure or concentration.",
            "what_to_do_next": "Use this insight to assess portfolio balance and identify product gaps."
        }

    return {
        "brand_exposure": _mock("Brand"),
        "card_type_mix": _mock("Card Type"),
        "credit_limit_distribution": _mock("Credit Limits"),
        "catalog_overview": _mock("Product Catalog"),
        "page_summary": {
            "page_summary": (
                "The portfolio shows strong exposure to debit and mid-tier credit products, "
                "with clear brand concentration in Mastercard and Visa. "
                "Product catalog coverage is broad, though certain tiers remain underrepresented."
            )
        }
    }
def generate_smart_recommendations_explanations(reco_data):
    def _mock(title):
        return {
            "why_this_exists": f"This view explains {title.lower()} in the recommendation system.",
            "what_signal_it_captures": f"It summarizes patterns in {title.lower()} across users.",
            "how_to_interpret": "Higher values indicate greater concentration or coverage.",
            "what_to_do_next": "Use this insight to improve coverage, balance product mix, or refine targeting."
        }

    return {
        "top_recommended_cards": _mock("Top Recommended Cards"),
        "recommendations_by_persona": _mock("Recommendations by Persona"),
        "coverage_gaps": _mock("Coverage Gaps"),
        "page_summary": {
            "page_summary": (
                "Most users receive multiple personalized card suggestions, with strong alignment to dominant personas. "
                "A subset of users receives limited recommendations, highlighting opportunities to expand product coverage "
                "or refine eligibility rules."
            )
        }
    }