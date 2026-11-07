import os
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.config import DATA_DIR
from backend.database import db

router = APIRouter(prefix="/api/cards/similarity", tags=["Commercial Card Catalog & Benchmarks"])

@router.get("/catalog")
def get_commercial_catalog(
    search: Optional[str] = None,
    brand: Optional[str] = None,
    product_type: Optional[str] = None,
    fee_type: Optional[str] = None,
    page: int = 1,
    limit: int = 24
):
    """
    Returns searchable, filterable market catalog of all 354 commercial cards
    with category reward multipliers, annual fees, and sign-up bonuses.
    """
    con = db.get_cursor()
    where_clauses = ["1=1"]

    if search and search.strip():
        q = search.strip().replace("'", "''").lower()
        where_clauses.append(f"(lower(card_name) LIKE '%{q}%' OR lower(issuer_name) LIKE '%{q}%' OR lower(slug) LIKE '%{q}%')")

    if brand and brand.lower() != "all":
        where_clauses.append(f"lower(card_brand) = '{brand.strip().lower()}'")

    if product_type and product_type.lower() != "all":
        where_clauses.append(f"lower(product_type) = '{product_type.strip().lower()}'")

    if fee_type == "no_fee":
        where_clauses.append("annual_fee = 0")
    elif fee_type == "under_100":
        where_clauses.append("annual_fee > 0 AND annual_fee <= 100")
    elif fee_type == "premium":
        where_clauses.append("annual_fee > 100")

    where_sql = " AND ".join(where_clauses)
    offset = (page - 1) * limit

    total_query = f"SELECT count(*) FROM commercial_catalog WHERE {where_sql}"
    total = con.execute(total_query).fetchone()[0]

    cards_query = f"""
        SELECT 
            card_id,
            card_name,
            issuer_name,
            card_brand,
            product_type,
            annual_fee,
            is_no_fee,
            reward_currency,
            base_rate,
            max_multiplier,
            signup_bonus_value,
            signup_min_spend,
            Dining,
            Groceries,
            Travel,
            Transportation,
            Shopping,
            Entertainment
        FROM commercial_catalog
        WHERE {where_sql}
        ORDER BY annual_fee DESC, max_multiplier DESC
        LIMIT {limit} OFFSET {offset}
    """
    rows = con.execute(cards_query).fetchall()

    cards = []
    for r in rows:
        cards.append({
            "card_id": int(r[0]),
            "card_name": r[1],
            "issuer_name": r[2],
            "card_brand": r[3],
            "product_type": r[4],
            "annual_fee": float(r[5]),
            "is_no_fee": bool(r[6]),
            "reward_currency": r[7],
            "base_rate": float(r[8]),
            "max_multiplier": float(r[9]),
            "signup_bonus_value": float(r[10]) if r[10] else 0.0,
            "signup_min_spend": float(r[11]) if r[11] else 0.0,
            "multipliers": {
                "Dining": float(r[12]),
                "Groceries": float(r[13]),
                "Travel": float(r[14]),
                "Transportation": float(r[15]),
                "Shopping": float(r[16]),
                "Entertainment": float(r[17])
            }
        })

    # Portfolio macro counts
    stats = con.execute("""
        SELECT 
            count(*) as total_cards,
            sum(case when annual_fee = 0 then 1 else 0 end) as no_fee_count,
            sum(case when annual_fee > 0 then 1 else 0 end) as premium_count,
            round(avg(annual_fee), 2) as avg_fee,
            round(max(max_multiplier), 1) as top_multiplier
        FROM commercial_catalog
    """).fetchone()

    return {
        "status": "success",
        "pagination": {
            "page": page,
            "limit": limit,
            "total_records": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 1
        },
        "market_stats": {
            "total_cards": stats[0],
            "no_fee_count": stats[1],
            "premium_count": stats[2],
            "avg_annual_fee": float(stats[3]),
            "top_multiplier": float(stats[4])
        },
        "data": cards
    }

@router.get("/substitutes/{card_id}")
def get_card_substitutes(card_id: int, top_n: int = 3):
    """
    Finds the top competitor substitute cards in the market with similar fee,
    rewards profile, and tier, but from alternative issuing banks.
    """
    con = db.get_cursor()
    df = con.execute("SELECT * FROM commercial_catalog").fetchdf()

    matches = df[df["card_id"] == card_id]
    if matches.empty:
        raise HTTPException(status_code=404, detail=f"Card ID {card_id} not found.")

    target = matches.iloc[0]
    cats = ["Dining", "Groceries", "Travel", "Transportation", "Shopping", "Business", "Entertainment"]

    candidates = df[df["card_id"] != card_id].copy()

    # Fee distance normalized
    fee_ref = max(float(target["annual_fee"]), 50.0)
    fee_diff = np.abs(candidates["annual_fee"] - float(target["annual_fee"])) / fee_ref

    # Reward difference
    cat_diff = np.zeros(len(candidates))
    for c in cats:
        cat_diff += np.abs(candidates[c] - float(target[c]))

    # Bonus for different bank issuer (real competitor alternative)
    diff_issuer = (candidates["issuer_name"] != target["issuer_name"]).astype(float)

    # Score: lower is closer substitute
    score = cat_diff + (fee_diff * 1.5) - (diff_issuer * 0.5)
    candidates["sub_score"] = score

    top = candidates.sort_values("sub_score").head(top_n)

    target_dict = {
        "card_id": int(target["card_id"]),
        "card_name": target["card_name"],
        "issuer_name": target["issuer_name"],
        "card_brand": target["card_brand"],
        "annual_fee": float(target["annual_fee"]),
        "max_multiplier": float(target["max_multiplier"]),
        "multipliers": {c: float(target[c]) for c in cats}
    }

    substitutes = []
    for _, r in top.iterrows():
        substitutes.append({
            "card_id": int(r["card_id"]),
            "card_name": r["card_name"],
            "issuer_name": r["issuer_name"],
            "card_brand": r["card_brand"],
            "annual_fee": float(r["annual_fee"]),
            "max_multiplier": float(r["max_multiplier"]),
            "reward_currency": r.get("reward_currency", "Points"),
            "multipliers": {c: float(r[c]) for c in cats},
            "fee_diff": round(float(r["annual_fee"]) - float(target["annual_fee"]), 2)
        })

    return {
        "status": "success",
        "target_card": target_dict,
        "substitutes": substitutes
    }

@router.get("/compare")
def compare_two_cards(card1_id: int, card2_id: int):
    """
    Performs head-to-head comparison of any two commercial cards:
    reward multipliers, fee differences, and value verdict.
    """
    con = db.get_cursor()
    df = con.execute(f"SELECT * FROM commercial_catalog WHERE card_id IN ({card1_id}, {card2_id})").fetchdf()

    if len(df) < 2:
        raise HTTPException(status_code=404, detail="One or both cards not found in catalog.")

    c1 = df[df["card_id"] == card1_id].iloc[0].to_dict()
    c2 = df[df["card_id"] == card2_id].iloc[0].to_dict()

    categories = ["Dining", "Groceries", "Travel", "Transportation", "Shopping", "Entertainment"]
    comparison = []
    c1_wins = 0
    c2_wins = 0

    for cat in categories:
        m1 = float(c1.get(cat, 0.0) or 0.0)
        m2 = float(c2.get(cat, 0.0) or 0.0)
        winner = "Tie"
        if m1 > m2:
            winner = c1["card_name"]
            c1_wins += 1
        elif m2 > m1:
            winner = c2["card_name"]
            c2_wins += 1

        comparison.append({
            "category": cat,
            "card1_multiplier": m1,
            "card2_multiplier": m2,
            "winner": winner
        })

    return {
        "status": "success",
        "card1": {
            "card_id": int(c1["card_id"]),
            "card_name": c1["card_name"],
            "issuer_name": c1["issuer_name"],
            "card_brand": c1["card_brand"],
            "product_type": c1["product_type"],
            "annual_fee": float(c1["annual_fee"]),
            "reward_currency": c1["reward_currency"],
            "max_multiplier": float(c1["max_multiplier"]),
            "signup_bonus": float(c1.get("signup_bonus_value", 0) or 0)
        },
        "card2": {
            "card_id": int(c2["card_id"]),
            "card_name": c2["card_name"],
            "issuer_name": c2["issuer_name"],
            "card_brand": c2["card_brand"],
            "product_type": c2["product_type"],
            "annual_fee": float(c2["annual_fee"]),
            "reward_currency": c2["reward_currency"],
            "max_multiplier": float(c2["max_multiplier"]),
            "signup_bonus": float(c2.get("signup_bonus_value", 0) or 0)
        },
        "fee_difference": float(c1["annual_fee"]) - float(c2["annual_fee"]),
        "category_comparison": comparison,
        "summary": {
            "card1_advantage_count": c1_wins,
            "card2_advantage_count": c2_wins
        }
    }

# -------------------------------------------------------------
# Backwards-compatible endpoints for test suites
# -------------------------------------------------------------
@router.get("/weights")
def get_feature_weights(group: Optional[str] = None):
    path = DATA_DIR / "master_feature_weights_v1.csv"
    df = pd.read_csv(path)
    if group:
        df = df[df["Feature_Group"].str.lower() == group.lower().strip()]
    if "Feature_Weight" in df.columns:
        df = df.sort_values("Feature_Weight", ascending=False)
    records = df.to_dict(orient="records")
    return {
        "status": "success",
        "total_features": len(records),
        "feature_groups": pd.read_csv(path)["Feature_Group"].unique().tolist(),
        "data": records
    }

@router.get("/correlations")
def get_high_correlations():
    path = DATA_DIR / "behavior_high_correlations.csv"
    df = pd.read_csv(path)
    records = df.sort_values("Abs_Correlation", ascending=False).to_dict(orient="records")
    return {
        "status": "success",
        "count": len(records),
        "data": records
    }

@router.get("/consumer-commercial")
def get_consumer_commercial_matches(limit: int = 25):
    path = DATA_DIR / "consumer_to_commercial_card_similarity.csv"
    df = pd.read_csv(path)
    return {
        "status": "success",
        "total_results": len(df),
        "limit": limit,
        "data": df.head(limit).to_dict(orient="records")
    }
