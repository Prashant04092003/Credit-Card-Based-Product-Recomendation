# app/logic/smart_recommendations_data.py

import pandas as pd
from data.loaders import load_recommendations


def get_smart_recommendations_data():
    """
    Aggregates insights for the Smart Recommendations dashboard.
    """

    reco_df = load_recommendations()

    # -------------------------
    # KPIs
    # -------------------------
    users_with_reco = reco_df["user_id"].nunique()

    avg_reco_per_user = float(
        round(
            reco_df.groupby("user_id").size().mean(),
            2
        )
    )

    # -------------------------
    # Chart 1: Top Recommended Cards
    # -------------------------
    top_cards = (
        reco_df
        .groupby("card_name")
        .size()
        .reset_index(name="recommendation_count")
        .sort_values("recommendation_count", ascending=False)
        .head(10)
        .to_dict(orient="records")
    )

    # -------------------------
    # Chart 2: Recommendations by Persona
    # -------------------------
    recommendations_by_persona = (
        reco_df
        .groupby("persona")
        .size()
        .reset_index(name="recommendation_count")
        .sort_values("recommendation_count", ascending=False)
        .to_dict(orient="records")
    )

    # -------------------------
    # Chart 3: Coverage Gaps
    # -------------------------
    coverage_gaps = (
        reco_df
        .groupby("user_id")
        .size()
        .value_counts()
        .reset_index()
        .rename(columns={"index": "recommendation_count", 0: "user_count"})
        .sort_values("recommendation_count")
        .to_dict(orient="records")
    )

    # -------------------------
    # Final Output
    # -------------------------
    return {
        "kpis": {
            "users_with_recommendations": int(users_with_reco),
            "avg_recommendations_per_user": avg_reco_per_user
        },
        "charts": {
            "top_recommended_cards": top_cards,
            "recommendations_by_persona": recommendations_by_persona,
            "coverage_gaps": coverage_gaps
        }
    }