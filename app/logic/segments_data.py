# app/logic/segments_data.py

import pandas as pd
from data.loaders import load_segmentation, load_recommendations


def get_segments_personas_data():
    """
    Computes all metrics required for the Segments & Personas dashboard.
    Persona labels are sourced ONLY from recommendations.
    """

    seg_df = load_segmentation()
    reco_df = load_recommendations()

    # --------------------------------
    # Build user → persona mapping
    # --------------------------------
    user_persona = (
        reco_df[["user_id", "persona"]]
        .drop_duplicates(subset=["user_id"])
    )

    # --------------------------------
    # Attach persona to segmentation
    # --------------------------------
    seg_df = seg_df.merge(
        user_persona,
        left_on="User",
        right_on="user_id",
        how="left"
    )

    # Safety check
    seg_df = seg_df.dropna(subset=["persona"])

    # --------------------------------
    # KPIs
    # --------------------------------
    total_personas = seg_df["persona"].nunique()

    persona_share = seg_df["persona"].value_counts(normalize=True) * 100
    largest_persona_share_pct = float(round(persona_share.max(), 2))

    avg_txn_per_user = float(round(seg_df["txn_count"].mean(), 2))
    avg_cards_per_user = float(round(seg_df["num_cards"].mean(), 2))

    # --------------------------------
    # Chart 1: Persona Distribution
    # --------------------------------
    persona_distribution = (
        seg_df
        .groupby("persona")
        .size()
        .reset_index(name="user_count")
        .sort_values("user_count", ascending=False)
        .to_dict(orient="records")
    )

    # --------------------------------
    # Chart 2: Spend Intensity
    # --------------------------------
    spend_intensity = (
        seg_df
        .groupby("persona")["total_spend"]
        .mean()
        .reset_index(name="avg_total_spend")
        .sort_values("avg_total_spend", ascending=False)
        .to_dict(orient="records")
    )

    # --------------------------------
    # Chart 3: Spend Volatility
    # --------------------------------
    spend_volatility = (
        seg_df
        .groupby("persona")["spend_cv"]
        .mean()
        .reset_index(name="avg_spend_volatility")
        .sort_values("avg_spend_volatility", ascending=False)
        .to_dict(orient="records")
    )

    # --------------------------------
    # Chart 4: Credit Capacity
    # --------------------------------
    credit_capacity = (
        seg_df
        .groupby("persona")
        .agg(
            avg_num_cards=("num_cards", "mean"),
            avg_credit_limit=("avg_credit_limit", "mean")
        )
        .reset_index()
        .to_dict(orient="records")
    )

    return {
        "kpis": {
            "total_personas": int(total_personas),
            "largest_persona_share_pct": largest_persona_share_pct,
            "avg_txn_per_user": avg_txn_per_user,
            "avg_cards_per_user": avg_cards_per_user
        },
        "charts": {
            "persona_distribution": persona_distribution,
            "spend_intensity_by_persona": spend_intensity,
            "spend_volatility_by_persona": spend_volatility,
            "credit_capacity_by_persona": credit_capacity
        }
    }