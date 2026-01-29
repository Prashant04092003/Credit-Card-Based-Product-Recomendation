import pandas as pd

from data.loaders import (
    load_users,
    load_fraud,
    load_recommendations
)


def get_home_overview_data():
    """
    Computes all metrics required for the Home / Overview dashboard.
    Returns a pure Python dictionary.
    """

    # =====================
    # Load required datasets
    # =====================
    users_df = load_users()
    fraud_df = load_fraud()
    reco_df = load_recommendations()

    # =====================
    # KPI 1: Total Users
    # =====================
    total_users = users_df.shape[0]

    # =====================
    # KPI 2: Fraud Risk Index
    # (% High + Critical transactions)
    # =====================
    fraud_df["is_high_risk"] = fraud_df["fraud_band"].isin(["High", "Critical"])
    fraud_risk_index_pct = (
        fraud_df["is_high_risk"].mean() * 100
    )

    # =====================
    # KPI 3: Recommendation Coverage
    # =====================
    users_with_reco = reco_df["user_id"].nunique()
    recommendation_coverage_pct = (users_with_reco / total_users) * 100

    # =====================
    # Chart 1: Persona Distribution
    # =====================
    persona_distribution = (
        reco_df[["user_id", "persona"]]
        .drop_duplicates()
        .groupby("persona")
        .size()
        .reset_index(name="user_count")
        .sort_values("user_count", ascending=False)
        .to_dict(orient="records")
    )

    # =====================
    # Chart 2: Fraud Trend (Monthly)
    # =====================
    fraud_df["year_month"] = (
        fraud_df["Year"].astype(str)
        + "-"
        + fraud_df["Month"].astype(str).str.zfill(2)
    )

    fraud_trend = (
        fraud_df
        .groupby("year_month")["is_high_risk"]
        .mean()
        .reset_index(name="high_critical_pct")
    )

    fraud_trend["high_critical_pct"] *= 100
    fraud_trend = fraud_trend.sort_values("year_month")
    fraud_trend = fraud_trend.to_dict(orient="records")

    # =====================
    # Final structured output
    # =====================
    return {
        "kpis": {
            "total_users": int(total_users),
            "fraud_risk_index_pct": round(fraud_risk_index_pct, 2),
            "recommendation_coverage_pct": round(recommendation_coverage_pct, 2)
        },
        "charts": {
            "persona_distribution": persona_distribution,
            "fraud_trend_monthly": fraud_trend
        }
    }