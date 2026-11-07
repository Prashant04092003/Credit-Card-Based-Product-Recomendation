from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.services.customer_360_service import customer_360_service
from backend.database import db

router = APIRouter(prefix="/api/customers", tags=["Customer Intelligence"])

@router.get("/")
def list_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    persona: Optional[str] = None,
    risk_band: Optional[str] = None,
    min_fico: Optional[int] = None,
    max_fico: Optional[int] = None
):
    """
    Returns a filterable, paginated list of all 2,000 customers with key summary statistics,
    including most purchased category, most used card, risk band, and spend volume.
    """
    con = db.con
    where_clauses = ["1=1"]

    if q:
        q_clean = q.lower().strip()
        if q_clean.isdigit():
            where_clauses.append(f"u.user_id = {int(q_clean)}")
        else:
            where_clauses.append(f"(lower(u.person) LIKE '%{q_clean}%' OR lower(u.city) LIKE '%{q_clean}%' OR lower(u.state) LIKE '%{q_clean}%')")

    if persona:
        where_clauses.append(f"lower(r.persona) = '{persona.lower().strip()}'")

    if min_fico is not None:
        where_clauses.append(f"u.fico_score >= {min_fico}")

    if max_fico is not None:
        where_clauses.append(f"u.fico_score <= {max_fico}")

    where_sql = " AND ".join(where_clauses)
    offset = (page - 1) * limit

    # Count total matching
    count_query = f"""
        SELECT count(distinct u.user_id)
        FROM users_master u
        LEFT JOIN recommendations r ON u.user_id = r.user_id AND r.rank = 1
        WHERE {where_sql}
    """
    total_count = con.execute(count_query).fetchone()[0]

    # Fetch paginated rows with segmentation & risk
    query = f"""
        SELECT 
            u.user_id,
            u.person,
            u.current_age,
            u.city,
            u.state,
            u.yearly_income__person as yearly_income,
            u.fico_score,
            u.life_stage,
            COALESCE(r.persona, 'Standard Spender') as persona,
            COALESCE(s.total_spend, 0.0) as total_spend,
            COALESCE(s.txn_count, 0) as total_transactions,
            COALESCE(s.avg_txn_amount, 0.0) as avg_ticket,
            COALESCE(s.pct_high, 0.0) as pct_high,
            COALESCE(s.pct_critical, 0.0) as pct_critical
        FROM users_master u
        LEFT JOIN segmentation s ON u.user_id = s.User
        LEFT JOIN recommendations r ON u.user_id = r.user_id AND r.rank = 1
        WHERE {where_sql}
        ORDER BY u.user_id ASC
        LIMIT {limit} OFFSET {offset}
    """
    rows = con.execute(query).fetchall()

    results = []
    for r in rows:
        uid = int(r[0])
        p_high = float(r[12])
        p_crit = float(r[13])
        
        c_risk = "Low"
        if p_crit > 0.15:
            c_risk = "Critical"
        elif p_high > 0.15:
            c_risk = "High"
        elif p_high > 0.05:
            c_risk = "Medium"

        # Apply risk filter if requested
        if risk_band and risk_band.lower() != "all" and c_risk.lower() != risk_band.lower():
            continue

        results.append({
            "user_id": uid,
            "person": r[1],
            "age": int(r[2]),
            "city": r[3],
            "state": r[4],
            "yearly_income": float(r[5]),
            "fico_score": int(r[6]),
            "life_stage": r[7],
            "persona": r[8],
            "total_spend": float(r[9]),
            "total_transactions": int(r[10]),
            "avg_ticket": float(r[11]),
            "risk_band": c_risk
        })

    return {
        "status": "success",
        "pagination": {
            "page": page,
            "limit": limit,
            "total_records": total_count,
            "total_pages": (total_count + limit - 1) // limit
        },
        "data": results
    }

@router.get("/search")
def search_customers(q: str = Query("", min_length=1), limit: int = 10):
    """
    Fast autocomplete endpoint for customer search by ID, name, city, or state.
    """
    matches = customer_360_service.search_customers(query=q, limit=limit)
    return {
        "status": "success",
        "count": len(matches),
        "data": matches
    }

@router.get("/{user_id}/360")
def get_customer_360(user_id: int):
    """
    Returns the comprehensive 130-signal Customer 360 profile for any user.
    """
    dossier = customer_360_service.get_customer_360(user_id)
    if not dossier:
        raise HTTPException(status_code=404, detail=f"Customer with ID {user_id} not found.")
    return {
        "status": "success",
        "data": dossier
    }

@router.get("/{user_id}/cards")
def get_customer_cards(user_id: int):
    """
    Returns a detailed per-card analytical breakdown for every card owned by the customer,
    including spend volume, transaction counts, mean/median amounts, and fraud incidents.
    """
    con = db.get_cursor()
    
    # 1. Fetch metadata for customer's cards
    cards_meta = con.execute(f"""
        SELECT 
            card_index, card_brand, card_type, credit_limit, card_age_years,
            expires, has_chip, card_on_dark_web
        FROM cards_master
        WHERE "user" = {user_id}
        ORDER BY card_index
    """).fetchall()

    if not cards_meta:
        raise HTTPException(status_code=404, detail=f"No cards found for customer {user_id}")

    # 2. Fetch live aggregations from 24M transactions per card
    tx_by_card = con.execute(f"""
        SELECT 
            card_index,
            count(*) as tx_count,
            round(sum(amount), 2) as total_spend,
            round(avg(amount), 2) as mean_amount,
            round(median(amount), 2) as median_amount,
            round(max(amount), 2) as max_amount,
            sum(case when is_fraud = 1 then 1 else 0 end) as fraud_count,
            sum(case when errors is not null and errors != 'None' and errors != '' then 1 else 0 end) as error_count
        FROM transactions
        WHERE "user" = {user_id}
        GROUP BY card_index
    """).fetchall()

    tx_map = {r[0]: r for r in tx_by_card}
    user_total_spend = sum(float(r[2]) for r in tx_by_card if r[2]) or 1.0

    # Determine most used card index
    sorted_by_spend = sorted(tx_by_card, key=lambda x: float(x[2]) if x[2] else 0.0, reverse=True)
    most_used_card_idx = sorted_by_spend[0][0] if sorted_by_spend else None

    cards_detail = []
    for c in cards_meta:
        c_idx = int(c[0])
        tx_stats = tx_map.get(c_idx)

        total_spend = float(tx_stats[2]) if tx_stats and tx_stats[2] else 0.0
        tx_count = int(tx_stats[1]) if tx_stats and tx_stats[1] else 0
        mean_amt = float(tx_stats[3]) if tx_stats and tx_stats[3] else 0.0
        median_amt = float(tx_stats[4]) if tx_stats and tx_stats[4] else 0.0
        max_amt = float(tx_stats[5]) if tx_stats and tx_stats[5] else 0.0
        fraud_cnt = int(tx_stats[6]) if tx_stats and tx_stats[6] else 0
        err_cnt = int(tx_stats[7]) if tx_stats and tx_stats[7] else 0
        share_wallet = round((total_spend / user_total_spend) * 100, 2)

        # Top category on this specific card
        top_cat_row = con.execute(f"""
            SELECT super_category, round(sum(amount), 2) as spend
            FROM transactions
            WHERE "user" = {user_id} AND card_index = {c_idx}
            GROUP BY super_category
            ORDER BY spend DESC
            LIMIT 1
        """).fetchone()
        top_cat = top_cat_row[0] if top_cat_row else "N/A"

        cards_detail.append({
            "card_index": c_idx,
            "card_brand": c[1],
            "card_type": c[2],
            "credit_limit": float(str(c[3]).replace("$", "").replace(",", "")),
            "card_age_years": float(c[4]) if c[4] else 0.0,
            "expires": str(c[5]),
            "has_chip": str(c[6]),
            "card_on_dark_web": bool(c[7]),
            "is_most_used_card": (c_idx == most_used_card_idx),
            "total_spend": total_spend,
            "transaction_count": tx_count,
            "mean_transaction": mean_amt,
            "median_transaction": median_amt,
            "max_transaction": max_amt,
            "share_of_wallet_pct": share_wallet,
            "top_category_on_card": top_cat,
            "fraud_incidents_count": fraud_cnt,
            "error_transactions_count": err_cnt
        })

    return {
        "status": "success",
        "user_id": user_id,
        "most_used_card_index": most_used_card_idx,
        "total_cards": len(cards_detail),
        "data": cards_detail
    }

@router.get("/{user_id}/transactions")
def get_customer_transactions(
    user_id: int,
    limit: int = Query(50, ge=1, le=200),
    category: Optional[str] = None,
    is_fraud_only: bool = False
):
    """
    Returns live transaction records for the customer from master_transactions.parquet.
    """
    where_parts = [f'"user" = {user_id}']
    if category:
        where_parts.append(f"lower(super_category) = '{category.lower().strip()}'")
    if is_fraud_only:
        where_parts.append("is_fraud = 1")

    where_sql = " AND ".join(where_parts)
    query = f"""
        SELECT 
            date, time, merchant_name, merchant_city, merchant_state,
            super_category, amount, is_fraud, errors, use_chip, card_index
        FROM transactions
        WHERE {where_sql}
        ORDER BY date DESC, time DESC
        LIMIT {limit}
    """
    rows = db.get_cursor().execute(query).fetchall()
    txns = [
        {
            "date": str(r[0])[:10],
            "time": str(r[1]),
            "merchant_name": str(r[2]),
            "merchant_city": str(r[3]),
            "merchant_state": str(r[4]),
            "category": str(r[5]),
            "amount": float(r[6]),
            "is_fraud": bool(r[7]),
            "errors": str(r[8]),
            "use_chip": str(r[9]),
            "card_index": int(r[10])
        }
        for r in rows
    ]
    return {
        "status": "success",
        "user_id": user_id,
        "count": len(txns),
        "data": txns
    }

