# app/logic/fraud_data.py

import pandas as pd
from data.loaders import load_fraud


def get_fraud_intelligence_data():
    """
    Computes all metrics required for the Fraud Intelligence dashboard.
    """

    fraud_df = load_fraud()

    # -------------------------
    # Base flags
    # -------------------------
    fraud_df["is_high_risk"] = fraud_df["fraud_band"].isin(["High", "Critical"])

    # -------------------------
    # KPI 1 & 2: Fraud Risk Index
    # -------------------------
    fraud_risk_index_pct = float(
        round(fraud_df["is_high_risk"].mean() * 100, 2)
    )

    # -------------------------
    # Chart 1: Fraud Band Distribution
    # -------------------------
    fraud_band_distribution = (
        fraud_df
        .groupby("fraud_band")
        .size()
        .reset_index(name="txn_count")
        .sort_values("txn_count", ascending=False)
        .to_dict(orient="records")
    )

    # -------------------------
    # Chart 2: Fraud Trend (Monthly)
    # -------------------------
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

   
    

    # -------------------------
    # Chart 4: Merchant Behavior Risk
    # -------------------------
    merchant_behavior_risk = [
        {
            "signal": "New Merchant for User",
            "high_critical_pct": float(
                round(
                    fraud_df.loc[
                        fraud_df["is_new_merchant_for_user"] == 1,
                        "is_high_risk"
                    ].mean() * 100,
                    2
                )
            )
        },
        {
            "signal": "New Merchant Category for User",
            "high_critical_pct": float(
                round(
                    fraud_df.loc[
                        fraud_df["is_new_mcc_for_user"] == 1,
                        "is_high_risk"
                    ].mean() * 100,
                    2
                )
            )
        }
    ]

    # -------------------------
    # Final Output
    # -------------------------
    return {
        "kpis": {
            "fraud_risk_index_pct": fraud_risk_index_pct,
            "high_risk_txn_share_pct": fraud_risk_index_pct
        },
        "charts": {
            "fraud_band_distribution": fraud_band_distribution,
            "fraud_trend_monthly": fraud_trend,
            "merchant_behavior_risk": merchant_behavior_risk
        }
    }