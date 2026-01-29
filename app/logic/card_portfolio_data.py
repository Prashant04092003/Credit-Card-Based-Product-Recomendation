# app/logic/card_portfolio_data.py

import pandas as pd
from data.loaders import load_cards, load_card_master


def get_card_portfolio_data():
    """
    Computes metrics for the Card Portfolio dashboard.
    Focused on current exposure and product landscape.
    """

    cards_df = load_cards()
    catalog_df = load_card_master()

    # -------------------------
    # Cleanup
    # -------------------------
    cards_df["Credit Limit"] = (
        cards_df["Credit Limit"]
        .replace("[\\$,]", "", regex=True)
        .astype(float)
    )

    # -------------------------
    # KPIs
    # -------------------------
    total_cards_issued = int(cards_df["Cards Issued"].sum())
    avg_credit_limit = float(round(cards_df["Credit Limit"].mean(), 2))
    unique_card_products_held = int(cards_df["Card Type"].nunique())

    # -------------------------
    # Chart 1: Card Brand Exposure
    # -------------------------
    brand_exposure = (
        cards_df
        .groupby("Card Brand")["Cards Issued"]
        .sum()
        .reset_index(name="cards_issued")
        .sort_values("cards_issued", ascending=False)
        .to_dict(orient="records")
    )

    # -------------------------
    # Chart 2: Card Type Mix
    # -------------------------
    card_type_mix = (
        cards_df
        .groupby("Card Type")["Cards Issued"]
        .sum()
        .reset_index(name="cards_issued")
        .sort_values("cards_issued", ascending=False)
        .to_dict(orient="records")
    )

    # -------------------------
    # Chart 3: Credit Limit Distribution
    # -------------------------
    cards_df["limit_band"] = pd.cut(
        cards_df["Credit Limit"],
        bins=[0, 5000, 10000, 20000, 50000, 1e9],
        labels=["<5k", "5k–10k", "10k–20k", "20k–50k", "50k+"]
    )

    credit_limit_distribution = (
        cards_df
        .groupby("limit_band")
        .size()
        .reset_index(name="card_count")
        .to_dict(orient="records")
    )

    # -------------------------
    # Chart 4: Product Catalog Overview
    # -------------------------
    catalog_overview = (
        catalog_df
        .groupby("card_tier")
        .size()
        .reset_index(name="product_count")
        .to_dict(orient="records")
    )

    # -------------------------
    # Final Output
    # -------------------------
    return {
        "kpis": {
            "total_cards_issued": total_cards_issued,
            "avg_credit_limit": avg_credit_limit,
            "unique_card_types_held": unique_card_products_held
        },
        "charts": {
            "brand_exposure": brand_exposure,
            "card_type_mix": card_type_mix,
            "credit_limit_distribution": credit_limit_distribution,
            "catalog_overview": catalog_overview
        }
    }